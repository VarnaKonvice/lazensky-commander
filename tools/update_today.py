#!/usr/bin/env python3
"""Generate today.json for iPhone Shortcuts from alarms.json.

The iPhone shortcut stays simple: it downloads today.json, reads items,
and creates system alarms. Date selection happens here, not on the iPhone.

Operational rule:
- meals and procedures are both generated dynamically,
- generated alarm labels use the LKA: prefix,
- cleanup targets only LKA: alarms, never personal alarms.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
ALARMS_PATH = ROOT / "alarms.json"
TODAY_PATH = ROOT / "today.json"
TZ = ZoneInfo("Europe/Prague")
AUTO_PREFIX = "LKA:"


def item_sort_key(item: dict) -> str:
    return str(item.get("alarmTime") or item.get("start") or "99:99")


def shortcut_item(item: dict) -> dict:
    """Return a shortcut-safe item with an LKA: cleanup prefix."""
    cloned = dict(item)
    title = str(cloned.get("title") or "Událost")
    place = str(cloned.get("place") or "")
    cloned["label"] = f"{AUTO_PREFIX} {title}" + (f" – {place}" if place else "")
    return cloned


def main() -> None:
    now = datetime.now(TZ)
    today = now.date().isoformat()
    current_time = now.strftime("%H:%M")

    source = json.loads(ALARMS_PATH.read_text(encoding="utf-8"))

    if isinstance(source.get("days"), dict):
        items = list(source["days"].get(today, []))
    else:
        items = [item for item in source.get("items", []) if item.get("date") == today]

    # Keep meals and procedures. This supports changing meal shifts without manual alarm edits.
    items = [item for item in items if item.get("type") in {"meal", "procedure"}]

    # If the file is regenerated later during the day, keep only alarms that have not passed yet.
    items = [item for item in items if str(item.get("alarmTime", "99:99")) >= current_time]
    items = [shortcut_item(item) for item in items]
    items.sort(key=item_sort_key)

    output = {
        "schemaVersion": 3,
        "source": "lazensky-commander-today-auto-alarms",
        "generatedAt": now.isoformat(timespec="seconds"),
        "date": today,
        "timezone": "Europe/Prague",
        "prefix": AUTO_PREFIX,
        "items": items,
        "note": "Dynamic Clock alarms for today's meals and procedures. Cleanup should target only LKA: alarms.",
    }

    TODAY_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
