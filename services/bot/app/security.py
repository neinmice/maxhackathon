from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import hmac
import json
from urllib.parse import parse_qsl


class LaunchDataError(ValueError):
    """Raised when MAX launch data cannot be trusted."""


@dataclass(frozen=True)
class LaunchIdentity:
    user_id: str
    auth_date: int
    raw_user: dict


def validate_launch_data(
    init_data: str,
    bot_token: str,
    *,
    max_age_seconds: int,
    now: datetime | None = None,
) -> LaunchIdentity:
    if not init_data or not bot_token:
        raise LaunchDataError("launch data or bot token is missing")

    pairs = parse_qsl(init_data, keep_blank_values=True, strict_parsing=True)
    hashes = [value for key, value in pairs if key == "hash"]
    if len(hashes) != 1:
        raise LaunchDataError("launch data must contain exactly one hash")

    values = [(key, value) for key, value in pairs if key != "hash"]
    launch_params = "\n".join(f"{key}={value}" for key, value in sorted(values))
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    calculated_hash = hmac.new(
        secret_key,
        launch_params.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(calculated_hash, hashes[0]):
        raise LaunchDataError("launch data signature is invalid")

    data = dict(values)
    try:
        auth_date = int(data["auth_date"])
        user = json.loads(data["user"])
        user_id = str(user["id"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise LaunchDataError("launch data has invalid user or auth_date") from exc

    current_time = now or datetime.now(timezone.utc)
    age = current_time.timestamp() - auth_date
    if age > max_age_seconds or age < -60:
        raise LaunchDataError("launch data is expired or issued in the future")

    return LaunchIdentity(user_id=user_id, auth_date=auth_date, raw_user=user)
