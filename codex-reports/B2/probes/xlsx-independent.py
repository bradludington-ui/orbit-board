"""Independent XLSX evidence parser: stdlib only, no ORBIT readers or expected-value helpers.

Reads runtime-only artifacts, resolves workbook relationships, parses every XML part,
and checks the exported money against hand-written fixture literals. It returns
failure when BASE specimens exhibit the defect; those are diagnostics, not passes.
No XLSX/HTML artifact is copied into the report's publication directories.
"""
import argparse
import hashlib
import json
import posixpath
import re
import sys
from collections import Counter
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from zipfile import ZipFile
from zoneinfo import ZoneInfo
from xml.etree import ElementTree as E

S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
P = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"s": S}
# Literal fixture expectation, independently supplied before reading the workbooks.
EXPECT = {"USAF": 900, "ANG": 200, "AFRC": 0, "ALL": 1100}
COMBO = {
    "duplicate-K1": "11111 / AAAAA",
    "single-__none__-assigned": "22222 / BBBBB",
    "single-__none__-unassigned": "— no RCN/EEIC assigned —",
    "ordinary-K1": "11111 / AAAAA",
    "ordinary-no-assignment": "— no RCN/EEIC assigned —",
}
ROUTES = ["direct-open", "direct-saved-reopened", "full-imported-saved-reopened",
          "full-imported-browser-reopened", "one-imported", "one-saved-reopened",
          "several-imported", "several-saved-reopened"]


def identity(name):
    for board in ["base", "snapshot"]:
        for case in COMBO:
            for route in ROUTES:
                if name == f"{board}-{case}-{route}.xlsx":
                    return board, case, route
    raise ValueError("Unmapped fixture filename: " + name)


def number(value):
    if not isinstance(value, Decimal):
        raise ValueError("Expected numeric XML cell, got " + repr(value))
    return int(value) if value == value.to_integral_value() else str(value)


def read_book(path):
    with ZipFile(path) as z:
        parts = z.namelist()
        # Validate all XML, not only the worksheet used for the totals.
        xml_parts = {n: E.fromstring(z.read(n)) for n in parts if n.endswith((".xml", ".rels"))}
        shared = []
        if "xl/sharedStrings.xml" in xml_parts:
            shared = ["".join(t.text or "" for t in si.iter("{" + S + "}t"))
                      for si in xml_parts["xl/sharedStrings.xml"].findall("s:si", NS)]
        rels = {r.attrib["Id"]: r.attrib["Target"]
                for r in xml_parts["xl/_rels/workbook.xml.rels"].findall("{" + P + "}Relationship")}
        sheets = {}
        for sh in xml_parts["xl/workbook.xml"].findall("s:sheets/s:sheet", NS):
            target = rels[sh.attrib["{" + R + "}id"]]
            member = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
            rows = []
            for row in xml_parts[member].findall("s:sheetData/s:row", NS):
                out = {}
                for c in row.findall("s:c", NS):
                    col = re.match(r"[A-Z]+", c.attrib["r"])[0]
                    kind = c.attrib.get("t")
                    if c.find("s:f", NS) is not None:
                        raise ValueError("Formula found: cached value is not independent proof")
                    if kind == "inlineStr":
                        value = "".join(t.text or "" for t in c.findall("s:is//s:t", NS))
                    elif kind == "s":
                        value = shared[int(c.findtext("s:v", namespaces=NS))]
                    elif kind in ("str", "e", "b"):
                        value = c.findtext("s:v", default="", namespaces=NS)
                    else:
                        raw = c.findtext("s:v", namespaces=NS)
                        value = Decimal(raw) if raw is not None else ""
                    out[col] = value
                rows.append(out)
            sheets[sh.attrib["name"]] = rows
        return sheets, len(xml_parts)


def inspect(path):
    board, case, route = identity(path.name)
    sheets, count = read_book(path)
    checks = []

    def check(name, actual, expected):
        checks.append({"check": name, "actual": actual, "expected": expected, "passed": actual == expected})

    month = sheets["RCN-EEIC by Month"]
    check("locked-cycle title", "PB27 LOCKED VIEW" in month[0].get("A", ""), True)
    # Both rollup and requirement-detail totals must agree with literals.
    for svc in ["USAF", "ANG", "AFRC"]:
        totals = [r for r in month if r.get("A") == svc + " TOTAL"]
        check(svc + " total row count", len(totals), 2)
        for i, row in enumerate(totals):
            check(f"{svc} total {i + 1}", number(row["O"]), EXPECT[svc])
            check(f"{svc} December {i + 1}", number(row["D"]), EXPECT[svc])
            non_dec = [number(row.get(c, Decimal(0))) for c in ["B", "C", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"]]
            check(f"{svc} other months {i + 1}", non_dec, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    all_rows = [r for r in month if r.get("A") == "ALL SERVICES — TOTAL BY MONTH"]
    check("all-services row count", len(all_rows), 1)
    for row in all_rows:
        check("all-services total", number(row["O"]), 1100)
        check("all-services December", number(row["D"]), 1100)

    # In the rollup, each funded service must have exactly one combination row;
    # detect repeated labels/bags independently of the service-total checks.
    section = None
    combo_rows = {"USAF": [], "ANG": [], "AFRC": []}
    for row in month:
        a = row.get("A", "")
        if a == "WHICH REQUIREMENTS SIT UNDER EACH COMBINATION":
            break
        if a in combo_rows:
            section = a
        elif section and a == section + " TOTAL":
            section = None
        elif section and "O" in row and a not in ["", section + " TOTAL"]:
            combo_rows[section].append(row)
    for svc in ["USAF", "ANG"]:
        rows = combo_rows[svc]
        check(svc + " combination count", len(rows), 1)
        check(svc + " combination label", [r.get("A") for r in rows], [COMBO[case]])
        check(svc + " combination total", [number(r["O"]) for r in rows], [EXPECT[svc]])
    check("AFRC combination rows", len(combo_rows["AFRC"]), 0)

    fund = sheets["Funding Streams"]
    for svc in ["USAF", "ANG", "AFRC"]:
        rows = [r for r in fund if r.get("A") == svc]
        check(svc + " funding-stream row count", len(rows), 1)
        for row in rows:
            check(svc + " funded stream", number(row["I"]), EXPECT[svc])
    pm = sheets["PMO Matrix"]
    pm_total = [r for r in pm if r.get("A") == "TOTAL"]
    check("PMO total row count", len(pm_total), 1)
    for row in pm_total:
        check("PMO USAF discretionary", number(row["B"]), 900)
        check("PMO ANG discretionary", number(row["D"]), 200)
        check("PMO AFRC discretionary", number(row["F"]), 0)
        check("PMO all discretionary", number(row["H"]), 1100)
        check("PMO mandatory lane", [number(row[c]) for c in ["C", "E", "G", "I"]], [0, 0, 0, 0])
    return {"filename": path.name, "board": board, "case": case, "route": route,
            "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "xml_parts_parsed": count, "sheet_names": list(sheets), "checks": checks,
            "passed": sum(c["passed"] for c in checks), "failed": sum(not c["passed"] for c in checks)}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--runtime", required=True)
    p.add_argument("--output", required=True)
    a = p.parse_args()
    clock = lambda: datetime.now(ZoneInfo("America/New_York")).isoformat()
    started = clock()
    results = [inspect(f) for f in sorted(Path(a.runtime).rglob("*.xlsx"))]
    groups = {}
    for board in ["base", "snapshot"]:
        selected = [r for r in results if r["board"] == board]
        groups[board] = {"workbooks": len(selected), "passed_checks": sum(r["passed"] for r in selected),
                         "failed_checks": sum(r["failed"] for r in selected),
                         "defective_workbooks": sum(r["failed"] > 0 for r in selected)}
    out = {"parser": "Python stdlib zipfile/ElementTree/Decimal; no ORBIT helper",
           "expected_literals": EXPECT, "combination_literals": COMBO,
           "started_ET": started, "finished_ET": clock(), "groups": groups, "results": results,
           "limits": ["Parses actual XLSX bytes produced by the separate runtime probe; does not run a native Excel UI.",
                      "No door-refusal XLSX exists for refused bad-list imports; parser assesses only produced workbooks.",
                      "No ORBIT decoder, arithmetic helper, or previous decoded JSON was read."]}
    Path(a.output).write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"groups": groups, "workbooks": len(results), "output": a.output}))
    for r in results:
        failures = [c["check"] for c in r["checks"] if not c["passed"]]
        print(f"{r['filename']} | {r['passed']} passed | {r['failed']} failed | " + "; ".join(failures))
    return 1 if any(r["failed"] for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
