#!/usr/bin/env python3
"""Build app/data/offences.json from app/assets/doc/Offences MOJ.xlsx"""

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX_PATH = ROOT / "app/assets/doc/Offences MOJ.xlsx"
OUTPUT_PATH = ROOT / "app/data/offences.json"

PRIMARY_OFFENCE_TABS = [
    {"id": "theft", "label": "Theft", "categories": ["Theft (non-motor)", "Handling stolen goods"]},
    {"id": "burglary", "label": "Burglary", "categories": ["Burglary (domestic)", "Burglary (other)"]},
    {"id": "robbery", "label": "Robbery", "categories": ["Acquisitive violence"]},
    {"id": "violence", "label": "Violence", "categories": ["Violence against the person"]},
    {"id": "drugs", "label": "Drugs", "categories": ["Drug import/export/production", "Drug possession/supply"]},
    {"id": "public-order", "label": "Public order", "categories": ["Public order and harassment", "Drunkenness"]},
    {"id": "motoring", "label": "Motoring", "categories": ["Motoring offences", "Drink driving"]},
    {"id": "other-offences", "label": "Other offences", "categories": ["Other offences"]},
]


def slugify(value: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def clean_label(description: str) -> str:
    return re.sub(r"\s+", " ", description.split(".")[0].split("[")[0]).strip()


def parse_numeric_code(code: str):
    try:
        return int(code, 10)
    except ValueError:
        return None


def infer_tab_id(code: str, label: str) -> str:
    numeric = parse_numeric_code(code)
    lower = label.lower()

    if numeric is not None:
        if 28 <= numeric <= 32:
            return "burglary"
        if numeric == 34:
            return "robbery"
        if (39 <= numeric <= 49) or numeric in {54, 130, 131}:
            return "theft"
        if numeric in {77, 92, 193}:
            return "drugs"
        if 802 <= numeric <= 825:
            return "motoring"
        if 1 <= numeric <= 15:
            return "violence"
        if 103 <= numeric <= 105:
            return "violence"
        if 64 <= numeric <= 66:
            return "public-order"
        if 140 <= numeric <= 142:
            return "public-order"
        if numeric in {125, 145, 162}:
            return "public-order"

    if re.match(r"^8\d{2}$", code):
        return "motoring"
    if "burglary" in lower:
        return "burglary"
    if "robbery" in lower or "blackmail" in lower:
        return "robbery"
    if "steal" in lower or "theft" in lower or "handling stolen" in lower:
        return "theft"
    if "drug" in lower:
        return "drugs"
    if "motor" in lower or "driving" in lower or "vehicle" in lower:
        return "motoring"
    if any(word in lower for word in ("assault", "murder", "manslaughter", "wound")):
        return "violence"
    if "drunk" in lower or "disorder" in lower or "public order" in lower:
        return "public-order"

    return "other-offences"


def infer_category(tab_id: str) -> str:
    for tab in PRIMARY_OFFENCE_TABS:
        if tab["id"] == tab_id:
            return tab["categories"][0]
    return "Other offences"


def build_search_terms(label, code, subcode, full_code, description=""):
    terms = set()
    for value in (label, code, subcode, full_code, description):
        for part in re.split(r"[^a-z0-9]+", str(value or "").lower()):
            if len(part) > 1:
                terms.add(part)
    if code and subcode:
        terms.add(f"{code}{subcode}")
        terms.add(f"{code} {subcode}")
    return sorted(terms)


def read_offences_sheet(path: Path):
    with zipfile.ZipFile(path) as zf:
        strings = []
        for si in ET.fromstring(zf.read("xl/sharedStrings.xml")):
            texts = []
            for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"):
                if t.text:
                    texts.append(t.text)
            strings.append("".join(texts))

        workbook = ET.fromstring(zf.read("xl/workbook.xml"))
        ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
        rel_ns = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
        id_to_target = {
            rel.get("Id"): rel.get("Target")
            for rel in rels.findall("r:Relationship", rel_ns)
        }

        sheet_path = None
        for sheet in workbook.findall(".//m:sheet", ns):
            if sheet.get("name") == "Offences":
                rel_id = sheet.get(
                    "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
                )
                sheet_path = "xl/" + id_to_target[rel_id].lstrip("/")
                break

        root = ET.fromstring(zf.read(sheet_path))
        rows = []
        for row in root.findall(".//m:sheetData/m:row", ns):
            cells = {}
            for cell in row.findall("m:c", ns):
                ref = cell.get("r")
                col = re.match(r"[A-Z]+", ref).group()
                value_el = cell.find("m:v", ns)
                if value_el is None:
                    value = ""
                elif cell.get("t") == "s":
                    value = strings[int(value_el.text)]
                else:
                    value = value_el.text
                cells[col] = value
            rows.append(cells)
        return rows


def main():
    rows = read_offences_sheet(XLSX_PATH)
    records = []

    for row in rows[1:]:
        full_code = str(row.get("A", "")).strip().zfill(5)
        if not re.match(r"^[0-9A-Z]{5}$", full_code):
            continue

        code = full_code[:3]
        subcode = full_code[3:]
        description = str(row.get("C", "")).strip()
        label = clean_label(description)
        if not label:
            continue

        records.append(
            {
                "fullCode": full_code,
                "code": code,
                "subcode": subcode,
                "label": label,
                "description": description,
            }
        )

    by_code = {}
    for record in records:
        by_code.setdefault(record["code"], []).append(record)

    offences = []
    for code, items in sorted(by_code.items()):
        parent_record = next((item for item in items if item["subcode"] == "00"), None)
        sub_records = sorted(
            [item for item in items if item["subcode"] != "00"],
            key=lambda item: item["subcode"],
        )

        parent_label = parent_record["label"] if parent_record else sub_records[0]["label"]
        tab_id = infer_tab_id(code, parent_label)
        category = infer_category(tab_id)

        sub_offences = []
        for item in sub_records:
            sub_offences.append(
                {
                    "id": item["fullCode"].lower(),
                    "label": item["label"],
                    "code": item["code"],
                    "subcode": item["subcode"],
                    "fullCode": item["fullCode"],
                    "description": item["description"],
                    "searchTerms": build_search_terms(
                        item["label"], item["code"], item["subcode"], item["fullCode"], item["description"]
                    ),
                }
            )

        selectable = []
        if parent_record:
            selectable.append(
                {
                    "id": parent_record["fullCode"].lower(),
                    "label": parent_record["label"],
                    "code": parent_record["code"],
                    "subcode": parent_record["subcode"],
                    "fullCode": parent_record["fullCode"],
                    "description": parent_record["description"],
                    "searchTerms": build_search_terms(
                        parent_record["label"],
                        parent_record["code"],
                        parent_record["subcode"],
                        parent_record["fullCode"],
                        parent_record["description"],
                    ),
                }
            )
        selectable.extend(sub_offences)

        if not selectable:
            continue

        offences.append(
            {
                "id": f"category-{slugify(code)}",
                "label": parent_label,
                "code": code,
                "category": category,
                "tabId": tab_id,
                "subOffenceCount": len(selectable),
                "searchTerms": build_search_terms(
                    parent_label,
                    code,
                    "00",
                    f"{code}00",
                    parent_record["description"] if parent_record else parent_label,
                ),
                "subOffences": selectable,
            }
        )

    OUTPUT_PATH.write_text(json.dumps(offences, indent=2) + "\n", encoding="utf-8")

    tab_counts = {}
    for offence in offences:
        tab_counts[offence["tabId"]] = tab_counts.get(offence["tabId"], 0) + 1

    print(f"Wrote {len(offences)} offence groups to {OUTPUT_PATH}")
    print("Tab counts:", tab_counts)


if __name__ == "__main__":
    main()
