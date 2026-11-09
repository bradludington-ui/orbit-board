#!/usr/bin/env python3
# Reads a workbook the export wrote, with openpyxl (never the tool's own reader), and prints one JSON object on stdout.
# Run with python3 -I.
#
#   export-read.py FILE.xlsx            every sheet: page setup, header/footer, outline, merges, and every row's cells
#   export-read.py csv DIR              every .csv in DIR (LibreOffice's conversion), read with the csv module
#
# A cell is [column (0-based), value, style index]; styles is a table of [fill, font colour, bold, italic, number format,
# size, indent, horizontal]. Only cells holding a value or carrying a fill are listed: a status cell with no status is
# then still seen, and its fill can be checked.
import sys, json, csv, os, datetime
import openpyxl


def rgb(c):
    try:
        v = c.rgb if c is not None else None
        return v[-6:].upper() if isinstance(v, str) else None
    except Exception:
        return None


def val(v):
    if isinstance(v, datetime.datetime):
        return {'date': v.date().isoformat()}
    if isinstance(v, datetime.date):
        return {'date': v.isoformat()}
    return v


def part(p):
    return {'text': p.text, 'font': p.font, 'size': p.size, 'color': p.color} if p is not None else None


def book(path):
    wb = openpyxl.load_workbook(path)
    styles, sidx = [], {}
    out = {'sheets': [], 'styles': styles}
    for ws in wb.worksheets:
        ps, pr = ws.page_setup, ws.sheet_properties
        sh = {
            'name': ws.title, 'state': ws.sheet_state,
            'header': {k: part(getattr(ws.oddHeader, k)) for k in ('left', 'center', 'right')},
            'footer': {k: part(getattr(ws.oddFooter, k)) for k in ('left', 'center', 'right')},
            'orientation': ps.orientation, 'paperSize': ps.paperSize,
            'fitToWidth': ps.fitToWidth, 'fitToHeight': ps.fitToHeight,
            'fitToPage': bool(pr.pageSetUpPr.fitToPage) if pr.pageSetUpPr is not None else False,
            'grid': ws.sheet_view.showGridLines, 'freeze': ws.freeze_panes,
            'summaryBelow': pr.outlinePr.summaryBelow if pr.outlinePr is not None else None,
            'merges': sorted(str(m) for m in ws.merged_cells.ranges),
            'maxRow': ws.max_row, 'maxCol': ws.max_column, 'rows': [],
        }
        dims = ws.row_dimensions
        formulas = 0
        for r, row in enumerate(ws.iter_rows(), start=1):
            cells = []
            for ci, c in enumerate(row):
                if c.data_type == 'f':
                    formulas += 1
                fill = None
                if c.fill is not None and c.fill.fill_type == 'solid':
                    fill = rgb(c.fill.fgColor)
                if c.value is None and fill is None:
                    continue
                f = c.font
                key = (fill, rgb(f.color) if f is not None else None, bool(f.b) if f is not None else False,
                       bool(f.i) if f is not None else False, c.number_format, f.sz if f is not None else None,
                       c.alignment.indent if c.alignment is not None else 0,
                       c.alignment.horizontal if c.alignment is not None else None)
                k = sidx.get(key)
                if k is None:
                    k = sidx[key] = len(styles)
                    styles.append(list(key))
                cells.append([ci, val(c.value), k])
            d = dims[r] if r in dims else None
            sh['rows'].append({'r': r, 'level': (d.outlineLevel or 0) if d is not None else 0,
                               'hidden': bool(d.hidden) if d is not None else False,
                               'ht': d.height if d is not None else None, 'cells': cells})
        sh['formulas'] = formulas
        out['sheets'].append(sh)
    return out


def csvs(d):
    out = {}
    for name in sorted(os.listdir(d)):
        if name.endswith('.csv'):
            with open(os.path.join(d, name), newline='', encoding='utf-8') as fh:
                out[name] = list(csv.reader(fh))
    return out


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == 'csv':
        print(json.dumps(csvs(sys.argv[2])))
    else:
        print(json.dumps(book(sys.argv[1])))
