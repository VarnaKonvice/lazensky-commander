#!/usr/bin/env python3
"""Generate today.json for iPhone Shortcuts from alarms.json.

The iPhone shortcut stays simple: it downloads today.json, reads items,
and creates system alarms. Date selection happens here, not on the iPhone.

Operational rule:
- stable meal alarms are handled as fixed repeating Clock alarms outside this file,
- today.json contains only changing procedure alarms,
- generated procedure alarm labels use the LKP: prefix so cleanup can target only these alarms.
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
PROCEDURE_PREFIX = "LKP:"


def item_sort_key(item: dict) -> str:
    return str(item.get("alarmTime") or item.get("start") or "99:99")


def procedure_item(item: dict) -> dict:
    """Return a shortcut-safe procedure item with an LKP: cleanup prefix."""
    cloned = dict(item)
    title = str(cloned.get("title") or "Procedura")
    place = str(cloned.get("place") or "")
    cloned["label"] = f"{PROCEDURE_PREFIX} {title}" + (f" – {place}" if place else "")
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

    # Meals have stable repeating alarms. Today shortcut creates only changing procedures.
    items = [item for item in items if item.get("type") == "procedure"]

    # If the file is regenerated later during the day, keep only alarms that have not passed yet.
    items = [item for item in items if str(item.get("alarmTime", "99:99")) >= current_time]
    items = [procedure_item(item) for item in items]
    items.sort(key=item_sort_key)

    output = {
        "schemaVersion": 2,
        "source": "lazensky-commander-today-procedures",
        "generatedAt": now.isoformat(timespec="seconds"),
        "date": today,
        "timezone": "Europe/Prague",
        "prefix": PROCEDURE_PREFIX,
        "items": items,
        "note": "Only changing procedure alarms are generated. Stable meal alarms should be fixed repeating alarms.",
    }

    TODAY_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
