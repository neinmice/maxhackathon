from __future__ import annotations

import argparse
import asyncio
import json

from .config import Settings
from .max_client import MaxApiClient


async def register_webhook() -> None:
    settings = Settings.from_env()
    result = await MaxApiClient(settings).register_webhook()
    print(json.dumps(result, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="ZVERY MAX bot management commands")
    parser.add_argument("command", choices=["register-webhook"])
    args = parser.parse_args()
    if args.command == "register-webhook":
        asyncio.run(register_webhook())


if __name__ == "__main__":
    main()
