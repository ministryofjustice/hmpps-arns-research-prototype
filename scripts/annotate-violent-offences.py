#!/usr/bin/env python3
"""Add a Violent offence column to app/assets/doc/Offences MOJ.csv.

Matches MOJ rows to app/assets/doc/Violent offences moj.csv by 5-digit Code
(the subcode column is the MOJ sub-offence reference and aligns with the last
two digits of Code, e.g. Code 00101 / subcode 101.0).
"""

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOJ_PATH = ROOT / "app/assets/doc/Offences MOJ.csv"
VIOLENT_PATH = ROOT / "app/assets/doc/Violent offences moj.csv"
VIOLENT_COLUMN = "Violent offence"


def normalise_full_code(raw: str) -> str:
    code = str(raw or "").strip().upper()
    if not code:
        return ""
    if re.match(r"^[0-9A-Z]+$", code):
        return code.zfill(5)
    return code


def load_violent_codes(path: Path) -> set[str]:
    codes: set[str] = set()
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            code = normalise_full_code(row.get("Code", ""))
            if re.match(r"^[0-9]{5}$", code):
                codes.add(code)
    return codes


def annotate_moj_csv(moj_path: Path, violent_codes: set[str]) -> tuple[int, int]:
    with moj_path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"No header row found in {moj_path}")

        fieldnames = list(reader.fieldnames)
        if VIOLENT_COLUMN in fieldnames:
            fieldnames.remove(VIOLENT_COLUMN)
        fieldnames.append(VIOLENT_COLUMN)

        rows = []
        yes_count = 0
        for row in reader:
            full_code = normalise_full_code(row.get("Code", ""))
            is_violent = full_code in violent_codes
            if is_violent:
                yes_count += 1
            row[VIOLENT_COLUMN] = "Yes" if is_violent else "No"
            rows.append(row)

    with moj_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    return len(rows), yes_count


def main():
    if not MOJ_PATH.is_file():
        raise SystemExit(f"Missing source file: {MOJ_PATH}")
    if not VIOLENT_PATH.is_file():
        raise SystemExit(f"Missing violent offences file: {VIOLENT_PATH}")

    violent_codes = load_violent_codes(VIOLENT_PATH)
    total, yes_count = annotate_moj_csv(MOJ_PATH, violent_codes)

    print(f"Loaded {len(violent_codes)} violent offence codes from {VIOLENT_PATH.name}")
    print(f"Updated {MOJ_PATH.name}: {yes_count} of {total} rows marked {VIOLENT_COLUMN}=Yes")


if __name__ == "__main__":
    main()
