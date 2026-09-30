from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row


# At-least-once inbound dedup, not exactly-once outbound delivery.
# A claimed row stays `processing` until the handler finishes. A crash leaves
# it claimable again after UPDATE_PROCESSING_STALE. Completed rows are kept
# for UPDATE_RETENTION and then deleted, so a very late redelivery can run once more.
UPDATE_PROCESSING_STALE = timedelta(minutes=2)
UPDATE_RETENTION = timedelta(days=7)

SCHEMA = """
CREATE TABLE IF NOT EXISTS max_users (
    user_id TEXT PRIMARY KEY,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processed_updates (
    payload_hash TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT processed_updates_status_check CHECK (status IN ('processing', 'processed'))
);

CREATE TABLE IF NOT EXISTS saved_measures (
    user_id TEXT NOT NULL REFERENCES max_users(user_id) ON DELETE CASCADE,
    measure_id TEXT NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, measure_id)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id TEXT PRIMARY KEY REFERENCES max_users(user_id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL,
    consented_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_progress (
    user_id TEXT NOT NULL REFERENCES max_users(user_id) ON DELETE CASCADE,
    measure_id TEXT NOT NULL,
    item_key TEXT NOT NULL,
    completed BOOLEAN NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, measure_id, item_key)
);

CREATE TABLE IF NOT EXISTS reminder_deliveries (
    user_id TEXT NOT NULL REFERENCES max_users(user_id) ON DELETE CASCADE,
    measure_id TEXT NOT NULL,
    reminder_kind TEXT NOT NULL,
    deadline DATE NOT NULL,
    status TEXT NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, measure_id, reminder_kind, deadline),
    CONSTRAINT reminder_deliveries_status_check CHECK (status IN ('processing', 'sent'))
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id UUID PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES max_users(user_id) ON DELETE CASCADE,
    quiz_version TEXT NOT NULL,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
    certificate_id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL UNIQUE REFERENCES quiz_attempts(attempt_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES max_users(user_id) ON DELETE CASCADE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


def _ensure_update_columns(connection: psycopg.Connection) -> None:
    connection.execute(
        "ALTER TABLE processed_updates ADD COLUMN IF NOT EXISTS status TEXT"
    )
    connection.execute(
        "ALTER TABLE processed_updates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"
    )
    connection.execute(
        """
        UPDATE processed_updates
        SET status = 'processed',
            updated_at = COALESCE(updated_at, received_at, NOW())
        WHERE status IS NULL OR updated_at IS NULL
        """
    )
    connection.execute(
        "ALTER TABLE processed_updates ALTER COLUMN status SET DEFAULT 'processed'"
    )
    connection.execute(
        "ALTER TABLE processed_updates ALTER COLUMN status SET NOT NULL"
    )
    connection.execute(
        "ALTER TABLE processed_updates ALTER COLUMN updated_at SET DEFAULT NOW()"
    )
    connection.execute(
        "ALTER TABLE processed_updates ALTER COLUMN updated_at SET NOT NULL"
    )
    connection.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'processed_updates_status_check'
            ) THEN
                ALTER TABLE processed_updates
                ADD CONSTRAINT processed_updates_status_check
                CHECK (status IN ('processing', 'processed'));
            END IF;
        END $$
        """
    )
    connection.execute(
        "ALTER TABLE certificates ADD COLUMN IF NOT EXISTS user_id TEXT"
    )


class PostgresStore:
    def __init__(
        self,
        database_url: str,
        *,
        processing_stale: timedelta = UPDATE_PROCESSING_STALE,
        retention: timedelta = UPDATE_RETENTION,
    ) -> None:
        self.database_url = database_url
        self.processing_stale = processing_stale
        self.retention = retention

    def _connect(self) -> psycopg.Connection:
        return psycopg.connect(self.database_url, row_factory=dict_row)

    def ping(self) -> bool:
        try:
            with self._connect() as connection:
                connection.execute("SELECT 1")
            return True
        except Exception:
            return False

    def ensure_schema(self) -> None:
        with self._connect() as connection:
            connection.execute(SCHEMA)
            _ensure_update_columns(connection)

    def touch_user(self, user_id: str) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO max_users (user_id) VALUES (%s)
                ON CONFLICT (user_id) DO UPDATE SET last_seen_at = NOW()
                """,
                (user_id,),
            )

    def claim_update(self, payload_hash: str) -> bool:
        stale_before = datetime.now(timezone.utc) - self.processing_stale
        retain_after = datetime.now(timezone.utc) - self.retention
        with self._connect() as connection:
            connection.execute(
                """
                DELETE FROM processed_updates
                WHERE status = 'processed' AND updated_at < %s
                """,
                (retain_after,),
            )
            result = connection.execute(
                """
                INSERT INTO processed_updates (payload_hash, status)
                VALUES (%s, 'processing')
                ON CONFLICT (payload_hash) DO UPDATE
                SET status = 'processing',
                    updated_at = NOW()
                WHERE processed_updates.status = 'processing'
                  AND processed_updates.updated_at < %s
                RETURNING payload_hash
                """,
                (payload_hash, stale_before),
            )
            return result.fetchone() is not None

    def complete_update(self, payload_hash: str) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                UPDATE processed_updates
                SET status = 'processed', updated_at = NOW()
                WHERE payload_hash = %s
                """,
                (payload_hash,),
            )

    def release_update(self, payload_hash: str) -> None:
        with self._connect() as connection:
            connection.execute(
                "DELETE FROM processed_updates WHERE payload_hash = %s AND status = 'processing'",
                (payload_hash,),
            )

    def save_measure(self, user_id: str, measure_id: str) -> bool:
        self.touch_user(user_id)
        with self._connect() as connection:
            result = connection.execute(
                """
                INSERT INTO saved_measures (user_id, measure_id) VALUES (%s, %s)
                ON CONFLICT (user_id, measure_id) DO NOTHING
                """,
                (user_id, measure_id),
            )
            return result.rowcount == 1

    def remove_saved_measure(self, user_id: str, measure_id: str) -> bool:
        with self._connect() as connection:
            result = connection.execute(
                "DELETE FROM saved_measures WHERE user_id = %s AND measure_id = %s",
                (user_id, measure_id),
            )
            return result.rowcount == 1

    def list_saved_measures(self, user_id: str) -> list[str]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT measure_id FROM saved_measures
                WHERE user_id = %s
                ORDER BY saved_at DESC
                """,
                (user_id,),
            ).fetchall()
        return [row["measure_id"] for row in rows]

    def get_latest_user_id(self) -> str | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT user_id FROM max_users
                WHERE user_id != '428775011'
                ORDER BY last_seen_at DESC
                LIMIT 1
                """
            ).fetchone()
        return str(row["user_id"]) if row else None

    def set_notifications(self, user_id: str, enabled: bool) -> bool:
        self.touch_user(user_id)
        with self._connect() as connection:
            row = connection.execute(
                """
                INSERT INTO notification_preferences (user_id, enabled, consented_at)
                VALUES (%s, %s, CASE WHEN %s THEN NOW() ELSE NULL END)
                ON CONFLICT (user_id) DO UPDATE
                SET enabled = EXCLUDED.enabled,
                    consented_at = CASE
                        WHEN EXCLUDED.enabled THEN COALESCE(notification_preferences.consented_at, NOW())
                        ELSE NULL
                    END,
                    updated_at = NOW()
                RETURNING enabled
                """,
                (user_id, enabled, enabled),
            ).fetchone()
        return bool(row["enabled"]) if row else enabled

    def get_notifications(self, user_id: str) -> bool:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT enabled FROM notification_preferences WHERE user_id = %s",
                (user_id,),
            ).fetchone()
        if row is None:
            return False
        return bool(row["enabled"])

    def get_checklist(self, user_id: str, measure_id: str) -> dict[str, bool]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT item_key, completed
                FROM checklist_progress
                WHERE user_id = %s AND measure_id = %s
                """,
                (user_id, measure_id),
            ).fetchall()
        return {row["item_key"]: bool(row["completed"]) for row in rows}

    def set_checklist_item(
        self,
        user_id: str,
        measure_id: str,
        item_key: str,
        completed: bool,
    ) -> bool:
        self.touch_user(user_id)
        with self._connect() as connection:
            row = connection.execute(
                """
                INSERT INTO checklist_progress
                    (user_id, measure_id, item_key, completed)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id, measure_id, item_key) DO UPDATE
                SET completed = EXCLUDED.completed, updated_at = NOW()
                RETURNING completed
                """,
                (user_id, measure_id, item_key, completed),
            ).fetchone()
        return bool(row["completed"]) if row else completed

    def list_reminder_candidates(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                WITH candidates AS (
                    SELECT user_id, measure_id FROM saved_measures
                    UNION
                    SELECT user_id, measure_id FROM checklist_progress
                )
                SELECT candidates.user_id, candidates.measure_id,
                       EXISTS (
                           SELECT 1 FROM saved_measures sm
                           WHERE sm.user_id = candidates.user_id
                             AND sm.measure_id = candidates.measure_id
                       ) AS saved,
                       COUNT(cp.item_key) FILTER (WHERE cp.completed) AS completed_count
                FROM candidates
                JOIN notification_preferences np
                  ON np.user_id = candidates.user_id AND np.enabled = TRUE
                LEFT JOIN checklist_progress cp
                  ON cp.user_id = candidates.user_id
                 AND cp.measure_id = candidates.measure_id
                GROUP BY candidates.user_id, candidates.measure_id
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def claim_reminder(
        self,
        user_id: str,
        measure_id: str,
        reminder_kind: str,
        deadline: str,
        *,
        stale_before: datetime,
    ) -> bool:
        with self._connect() as connection:
            row = connection.execute(
                """
                INSERT INTO reminder_deliveries
                    (user_id, measure_id, reminder_kind, deadline, status)
                VALUES (%s, %s, %s, %s, 'processing')
                ON CONFLICT (user_id, measure_id, reminder_kind, deadline) DO UPDATE
                SET status = 'processing', claimed_at = NOW(), sent_at = NULL
                WHERE reminder_deliveries.status = 'processing'
                  AND reminder_deliveries.claimed_at < %s
                RETURNING user_id
                """,
                (user_id, measure_id, reminder_kind, deadline, stale_before),
            ).fetchone()
        return row is not None

    def complete_reminder(
        self, user_id: str, measure_id: str, reminder_kind: str, deadline: str
    ) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                UPDATE reminder_deliveries
                SET status = 'sent', sent_at = NOW()
                WHERE user_id = %s AND measure_id = %s
                  AND reminder_kind = %s AND deadline = %s
                """,
                (user_id, measure_id, reminder_kind, deadline),
            )

    def release_reminder(
        self, user_id: str, measure_id: str, reminder_kind: str, deadline: str
    ) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                DELETE FROM reminder_deliveries
                WHERE user_id = %s AND measure_id = %s
                  AND reminder_kind = %s AND deadline = %s
                  AND status = 'processing'
                """,
                (user_id, measure_id, reminder_kind, deadline),
            )

    def record_quiz_attempt(
        self,
        *,
        user_id: str,
        quiz_version: str,
        score: int,
        passed: bool,
    ) -> dict[str, Any]:
        self.touch_user(user_id)
        attempt_id = uuid4()
        certificate_id = uuid4() if passed else None
        issued_at = datetime.now(timezone.utc)
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO quiz_attempts (attempt_id, user_id, quiz_version, score, passed)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (attempt_id, user_id, quiz_version, score, passed),
            )
            if certificate_id:
                connection.execute(
                    """
                    INSERT INTO certificates (certificate_id, attempt_id, user_id, issued_at)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (certificate_id, attempt_id, user_id, issued_at),
                )
        return {
            "attempt_id": str(attempt_id),
            "certificate_id": str(certificate_id) if certificate_id else None,
            "issued_at": issued_at.isoformat(),
        }


class InMemoryStore:
    """Deterministic storage for handler tests. Not a substitute for PostgresStore."""

    def __init__(
        self,
        *,
        processing_stale: timedelta = UPDATE_PROCESSING_STALE,
        retention: timedelta = UPDATE_RETENTION,
        clock: Any | None = None,
    ) -> None:
        self.processing_stale = processing_stale
        self.retention = retention
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        self.users: set[str] = set()
        self.updates: dict[str, dict[str, Any]] = {}
        self.saved: dict[str, set[str]] = {}
        self.notifications: dict[str, bool] = {}
        self.checklists: dict[tuple[str, str], dict[str, bool]] = {}
        self.reminders: dict[tuple[str, str, str, str], dict[str, Any]] = {}
        self.attempts: list[dict[str, Any]] = []
        self.available = True

    def _now(self) -> datetime:
        return self._clock()

    def _require(self) -> None:
        if not self.available:
            raise ConnectionError("store unavailable")

    def ping(self) -> bool:
        return self.available

    def ensure_schema(self) -> None:
        self._require()

    def touch_user(self, user_id: str) -> None:
        self._require()
        self.users.add(user_id)

    def claim_update(self, payload_hash: str) -> bool:
        self._require()
        now = self._now()
        expired = [
            key
            for key, row in self.updates.items()
            if row["status"] == "processed" and row["updated_at"] < now - self.retention
        ]
        for key in expired:
            del self.updates[key]
        current = self.updates.get(payload_hash)
        if current is None:
            self.updates[payload_hash] = {"status": "processing", "updated_at": now}
            return True
        if current["status"] == "processed":
            return False
        if current["updated_at"] < now - self.processing_stale:
            current["status"] = "processing"
            current["updated_at"] = now
            return True
        return False

    def complete_update(self, payload_hash: str) -> None:
        self._require()
        row = self.updates.get(payload_hash)
        if row is None:
            return
        row["status"] = "processed"
        row["updated_at"] = self._now()

    def release_update(self, payload_hash: str) -> None:
        self._require()
        row = self.updates.get(payload_hash)
        if row and row["status"] == "processing":
            del self.updates[payload_hash]

    def save_measure(self, user_id: str, measure_id: str) -> bool:
        self._require()
        self.touch_user(user_id)
        saved = self.saved.setdefault(user_id, set())
        if measure_id in saved:
            return False
        saved.add(measure_id)
        return True

    def remove_saved_measure(self, user_id: str, measure_id: str) -> bool:
        self._require()
        saved = self.saved.get(user_id, set())
        if measure_id not in saved:
            return False
        saved.remove(measure_id)
        return True

    def list_saved_measures(self, user_id: str) -> list[str]:
        self._require()
        return sorted(self.saved.get(user_id, set()))

    def get_latest_user_id(self) -> str | None:
        self._require()
        users = [u for u in self.users if u != "428775011"]
        return users[-1] if users else None

    def set_notifications(self, user_id: str, enabled: bool) -> bool:
        self._require()
        self.touch_user(user_id)
        self.notifications[user_id] = enabled
        return enabled

    def get_notifications(self, user_id: str) -> bool:
        self._require()
        return bool(self.notifications.get(user_id, False))

    def get_checklist(self, user_id: str, measure_id: str) -> dict[str, bool]:
        self._require()
        return dict(self.checklists.get((user_id, measure_id), {}))

    def set_checklist_item(
        self,
        user_id: str,
        measure_id: str,
        item_key: str,
        completed: bool,
    ) -> bool:
        self._require()
        self.touch_user(user_id)
        self.checklists.setdefault((user_id, measure_id), {})[item_key] = completed
        return completed

    def list_reminder_candidates(self) -> list[dict[str, Any]]:
        self._require()
        result: list[dict[str, Any]] = []
        for user_id, enabled in self.notifications.items():
            if not enabled:
                continue
            measure_ids = set(self.saved.get(user_id, set()))
            measure_ids.update(
                measure_id
                for checklist_user, measure_id in self.checklists
                if checklist_user == user_id
            )
            for measure_id in measure_ids:
                items = self.checklists.get((user_id, measure_id), {})
                result.append(
                    {
                        "user_id": user_id,
                        "measure_id": measure_id,
                        "saved": measure_id in self.saved.get(user_id, set()),
                        "completed_count": sum(items.values()),
                    }
                )
        return result

    def claim_reminder(
        self,
        user_id: str,
        measure_id: str,
        reminder_kind: str,
        deadline: str,
        *,
        stale_before: datetime,
    ) -> bool:
        self._require()
        key = (user_id, measure_id, reminder_kind, deadline)
        current = self.reminders.get(key)
        now = self._now()
        if current and current["status"] == "sent":
            return False
        if current and current["claimed_at"] >= stale_before:
            return False
        self.reminders[key] = {"status": "processing", "claimed_at": now}
        return True

    def complete_reminder(
        self, user_id: str, measure_id: str, reminder_kind: str, deadline: str
    ) -> None:
        self._require()
        key = (user_id, measure_id, reminder_kind, deadline)
        if key in self.reminders:
            self.reminders[key]["status"] = "sent"
            self.reminders[key]["sent_at"] = self._now()

    def release_reminder(
        self, user_id: str, measure_id: str, reminder_kind: str, deadline: str
    ) -> None:
        self._require()
        self.reminders.pop((user_id, measure_id, reminder_kind, deadline), None)

    def record_quiz_attempt(
        self,
        *,
        user_id: str,
        quiz_version: str,
        score: int,
        passed: bool,
    ) -> dict[str, Any]:
        self._require()
        self.touch_user(user_id)
        attempt_id = str(uuid4())
        certificate_id = str(uuid4()) if passed else None
        result = {
            "attempt_id": attempt_id,
            "certificate_id": certificate_id,
            "issued_at": self._now().isoformat(),
        }
        self.attempts.append(
            {
                **result,
                "user_id": user_id,
                "quiz_version": quiz_version,
                "score": score,
                "passed": passed,
            }
        )
        return result
