from __future__ import annotations

import asyncio
from datetime import date, datetime, time, timedelta, timezone
import logging
from zoneinfo import ZoneInfo

from .catalog import get_measure
from .config import Settings
from .handlers import main_menu
from .max_client import MaxApiClient
from .store import PostgresStore

logger = logging.getLogger(__name__)

REMINDER_TZ = ZoneInfo("Europe/Moscow")
REMINDER_KIND = "deadline"
CLAIM_STALE_AFTER = timedelta(minutes=15)


def reminder_due_at(deadline: date, *, lead_days: int = 1) -> datetime:
    """Return the fixed 09:00 MSK reminder time before a date-only deadline."""
    due_date = deadline - timedelta(days=max(1, lead_days))
    return datetime.combine(due_date, time(9, 0), tzinfo=REMINDER_TZ)


def _deadline(value: object) -> date | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


async def run_once(
    *,
    settings: Settings,
    store: PostgresStore,
    max_client: MaxApiClient,
    now: datetime | None = None,
) -> int:
    current = now or datetime.now(REMINDER_TZ)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    current = current.astimezone(REMINDER_TZ)
    sent = 0

    for candidate in store.list_reminder_candidates():
        measure_id = str(candidate["measure_id"])
        measure = get_measure(measure_id)
        if not measure:
            continue
        deadline = _deadline(measure.get("deadline"))
        if deadline is None:
            continue

        due_at = reminder_due_at(deadline, lead_days=settings.reminder_lead_days)
        deadline_end = datetime.combine(
            deadline + timedelta(days=1),
            time.min,
            tzinfo=REMINDER_TZ,
        )
        if current < due_at or current >= deadline_end:
            continue

        saved = bool(candidate.get("saved"))
        completed_count = int(candidate.get("completed_count") or 0)
        documents = measure.get("documents")
        checklist_size = len(documents) if isinstance(documents, list) else 0
        incomplete = checklist_size > 0 and completed_count < checklist_size
        if not saved and not incomplete:
            continue

        if not store.claim_reminder(
            str(candidate["user_id"]),
            measure_id,
            REMINDER_KIND,
            deadline.isoformat(),
            stale_before=current - CLAIM_STALE_AFTER,
        ):
            continue

        user_id = str(candidate["user_id"])
        title = str(measure.get("title") or "сохранённой меры")
        if saved and completed_count:
            detail = "Проверьте срок подачи и оставшиеся пункты чеклиста."
        elif saved:
            detail = "Проверьте срок подачи и чеклист документов."
        else:
            detail = "Проверьте незавершённый чеклист документов."
        try:
            await max_client.send_message(
                user_id=user_id,
                text=(
                    f"Напоминание ZVERY: по мере «{title}» приближается срок "
                    f"{deadline.strftime('%d.%m.%Y')}. {detail}"
                ),
                attachments=main_menu(
                    settings,
                    f"measure_{measure_id}",
                ),
            )
        except Exception:
            store.release_reminder(
                user_id,
                measure_id,
                REMINDER_KIND,
                deadline.isoformat(),
            )
            logger.exception("reminder delivery failed for user_id=%s", user_id)
            continue
        store.complete_reminder(
            user_id,
            measure_id,
            REMINDER_KIND,
            deadline.isoformat(),
        )
        sent += 1
    return sent


async def run_forever(settings: Settings) -> None:
    store = PostgresStore(settings.database_url)
    store.ensure_schema()
    client = MaxApiClient(settings)
    while True:
        await run_once(settings=settings, store=store, max_client=client)
        await asyncio.sleep(settings.reminder_poll_seconds)


def main() -> None:
    settings = Settings.from_env()
    asyncio.run(run_forever(settings))


if __name__ == "__main__":
    main()
