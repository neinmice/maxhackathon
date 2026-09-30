from __future__ import annotations

import argparse
import asyncio
import json

from .config import Settings
from .max_client import MaxApiClient
from .reminders import run_once, run_forever
from .store import PostgresStore


async def register_webhook() -> None:
    settings = Settings.from_env()
    result = await MaxApiClient(settings).register_webhook()
    print(json.dumps(result, ensure_ascii=False, indent=2))


async def dispatch_reminders_once() -> None:
    settings = Settings.from_env()
    store = PostgresStore(settings.database_url)
    store.ensure_schema()
    sent = await run_once(
        settings=settings,
        store=store,
        max_client=MaxApiClient(settings),
    )
    print(json.dumps({"sent": sent}, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(description="ZVERY MAX bot management commands")
    parser.add_argument(
        "command",
        choices=["register-webhook", "dispatch-reminders", "run-reminders"],
    )
    args = parser.parse_args()
    if args.command == "register-webhook":
        asyncio.run(register_webhook())
    elif args.command == "dispatch-reminders":
        asyncio.run(dispatch_reminders_once())
    elif args.command == "run-reminders":
        asyncio.run(run_forever(Settings.from_env()))


if __name__ == "__main__":
    main()
