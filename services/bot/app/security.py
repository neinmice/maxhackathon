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


def _parse_launch_pairs(init_data: str) -> list[tuple[str, str]]:
    if any(separator in init_data for separator in ("\x00", "\r", "\n")):
        raise LaunchDataError("launch data query is malformed")
    raw_fields = init_data.split("&")
    malformed = not raw_fields or any(
        not field or "=" not in field for field in raw_fields
    )
    if malformed:
        raise LaunchDataError("launch data query is malformed")
    try:
        pairs = parse_qsl(
            init_data,
            keep_blank_values=True,
            strict_parsing=True,
        )
    except ValueError as exc:
        raise LaunchDataError("launch data query is malformed") from exc
    if len(pairs) != len(raw_fields) or any(not key for key, _value in pairs):
        raise LaunchDataError("launch data query is malformed")
    return pairs


def _reject_duplicate_keys(pairs: list[tuple[str, str]]) -> None:
    seen: set[str] = set()
    for key, _value in pairs:
        if key in seen:
            raise LaunchDataError("launch data contains duplicate parameters")
        seen.add(key)


def validate_launch_data(
    init_data: str,
    bot_token: str,
    *,
    max_age_seconds: int,
    now: datetime | None = None,
) -> LaunchIdentity:
    if not init_data or not bot_token:
        raise LaunchDataError("launch data or bot token is missing")

    pairs = _parse_launch_pairs(init_data)
    _reject_duplicate_keys(pairs)
    hashes = [value for key, value in pairs if key == "hash"]
    if len(hashes) != 1 or not hashes[0]:
        raise LaunchDataError("launch data must contain exactly one hash")

    values = [(key, value) for key, value in pairs if key != "hash"]
    launch_params = "\n".join(
        f"{key}={value}" for key, value in sorted(values)
    )
    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    calculated_hash = hmac.new(
        secret_key,
        launch_params.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    try:
        signature_ok = hmac.compare_digest(calculated_hash, hashes[0])
    except (TypeError, ValueError):
        signature_ok = False
    if not signature_ok:
        raise LaunchDataError("launch data signature is invalid")

    data = dict(values)
    if "auth_date" not in data or "user" not in data:
        raise LaunchDataError("launch data has invalid user or auth_date")
    try:
        auth_date = int(data["auth_date"])
        user = json.loads(data["user"])
        user_ok = (
            isinstance(user, dict)
            and "id" in user
            and user["id"] is not None
            and not isinstance(user["id"], bool)
        )
        if not user_ok:
            raise LaunchDataError("launch data has invalid user or auth_date")
        user_id = str(user["id"])
        if not user_id:
            raise LaunchDataError("launch data has invalid user or auth_date")
    except LaunchDataError:
        raise
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise LaunchDataError(
            "launch data has invalid user or auth_date"
        ) from exc

    current_time = now or datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
    age = current_time.timestamp() - auth_date
    if age > max_age_seconds:
        raise LaunchDataError("launch data is expired")
    if age < -60:
        raise LaunchDataError("launch data is issued in the future")

    return LaunchIdentity(user_id=user_id, auth_date=auth_date, raw_user=user)
