from __future__ import annotations

from datetime import datetime, timezone
import json
from typing import Any
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row


SCHEMA = """
CREATE TABLE IF NOT EXISTS max_users (
    user_id TEXT PRIMARY KEY,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processed_updates (
    payload_hash TEXT PRIMARY KEY,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


class PostgresStore:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    def _connect(self) -> psycopg.Connection:
        return psycopg.connect(self.database_url, row_factory=dict_row)

    def ensure_schema(self) -> None:
        with self._connect() as connection:
            connection.execute(SCHEMA)

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
        with self._connect() as connection:
            result = connection.execute(
                """
                INSERT INTO processed_updates (payload_hash) VALUES (%s)
                ON CONFLICT (payload_hash) DO NOTHING
                """,
                (payload_hash,),
            )
            return result.rowcount == 1

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

    def set_notifications(self, user_id: str, enabled: bool) -> None:
        self.touch_user(user_id)
        with self._connect() as connection:
            connection.execute(
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
                """,
                (user_id, enabled, enabled),
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
                    "INSERT INTO certificates (certificate_id, attempt_id) VALUES (%s, %s)",
                    (certificate_id, attempt_id),
                )
        return {
            "attempt_id": str(attempt_id),
            "certificate_id": str(certificate_id) if certificate_id else None,
            "issued_at": datetime.now(timezone.utc).isoformat(),
        }


class InMemoryStore:
    """Deterministic storage for tests and local handler checks."""

    def __init__(self) -> None:
        self.users: set[str] = set()
        self.updates: set[str] = set()
        self.saved: dict[str, set[str]] = {}
        self.notifications: dict[str, bool] = {}
        self.attempts: list[dict[str, Any]] = []

    def ensure_schema(self) -> None:
        return None

    def touch_user(self, user_id: str) -> None:
        self.users.add(user_id)

    def claim_update(self, payload_hash: str) -> bool:
        if payload_hash in self.updates:
            return False
        self.updates.add(payload_hash)
        return True

    def save_measure(self, user_id: str, measure_id: str) -> bool:
        self.touch_user(user_id)
        saved = self.saved.setdefault(user_id, set())
        if measure_id in saved:
            return False
        saved.add(measure_id)
        return True

    def remove_saved_measure(self, user_id: str, measure_id: str) -> bool:
        saved = self.saved.get(user_id, set())
        if measure_id not in saved:
            return False
        saved.remove(measure_id)
        return True

    def list_saved_measures(self, user_id: str) -> list[str]:
        return sorted(self.saved.get(user_id, set()))

    def set_notifications(self, user_id: str, enabled: bool) -> None:
        self.touch_user(user_id)
        self.notifications[user_id] = enabled

    def record_quiz_attempt(
        self,
        *,
        user_id: str,
        quiz_version: str,
        score: int,
        passed: bool,
    ) -> dict[str, Any]:
        self.touch_user(user_id)
        attempt_id = str(uuid4())
        certificate_id = str(uuid4()) if passed else None
        result = {
            "attempt_id": attempt_id,
            "certificate_id": certificate_id,
            "issued_at": datetime.now(timezone.utc).isoformat(),
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
