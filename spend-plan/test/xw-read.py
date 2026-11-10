#!/usr/bin/env python3
# Reads a workbook the tool wrote, with readers that are not the tool's: Python's zipfile, xml.etree and openpyxl.
# Prints one JSON object on stdout. Run with python3 -I.
#
#   xw-read.py full  FILE.xlsx     every part parsed, every sheet's cells, styles, rows, columns, page and outline
#   xw-read.py light FILE.xlsx     every part parsed; per sheet only the row and cell counts (for the 50,000-row sheet)
#   xw-read.py zip   FILE.zip      every member: name, method, size, crc check, sha256
#   xw-read.py csv   DIR           every .csv in DIR, read with the csv module (LibreOffice's conversions)
import sys, json, zipfile, hashlib, csv, os, io, datetime
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def parts(path):
    """every member parsed by a real XML parser: a part that is not well-formed is reported, never skipped"""
    out = []
    with zipfile.ZipFile(path) as z:
        bad = z.testzip()
        for info in z.infolist():
            rec = {'name': info.filename, 'method': info.compress_type, 'size': info.file_size,
                   'flag': info.flag_bits}
            try:
                data = z.read(info.filename)
            except Exception as e:   # a wrong CRC, a damaged stream: reported as a fact, so the test names it
                rec['readError'] = str(e)
                rec['wellFormed'] = False
                out.append(rec)
                continue
            if info.filename.endswith('.xml') or info.filename.endswith('.rels'):
                try:
                    root = ET.fromstring(data)
                    rec['wellFormed'] = True
                    rec['root'] = root.tag
                    rec['children'] = [c.tag.replace(NS, '') for c in root]
                except ET.ParseError as e:
                    rec['wellFormed'] = False
                    rec['error'] = str(e)
            out.append(rec)
    return out, bad


def colour(c):
    if c is None:
        return None
    try:
        return c.rgb if isinstance(c.rgb, str) else None
    except Exception:
        return None


def val(v):
    if isinstance(v, datetime.datetime):
        return {'date': v.date().isoformat(), 'time': v.time().isoformat()}
    if isinstance(v, datetime.date):
        return {'date': v.isoformat()}
    return v


def side(s):
    if s is None or s.style is None:
        return None
    return [s.style, colour(s.color)]


def raw_sheet(z, name):
    """the cells as written: r -> [t, s, v text], and each row's attributes, read from the part itself"""
    root = ET.fromstring(z.read(name))
    cells, rows = {}, {}
    sd = root.find(NS + 'sheetData')
    for row in sd:
        rows[row.get('r')] = {k: row.get(k) for k in ('ht', 'customHeight', 'hidden', 'outlineLevel', 'collapsed') if row.get(k) is not None}
        for c in row:
            v = c.find(NS + 'v')
            cells[c.get('r')] = [c.get('t'), c.get('s'), v.text if v is not None else None]
    fmt = root.find(NS + 'sheetFormatPr')
    pr = root.find(NS + 'sheetPr')
    hf = root.find(NS + 'headerFooter')
    return {
        'cells': cells, 'rows': rows,
        'formatPr': dict(fmt.attrib) if fmt is not None else None,
        'sheetPr': [[c.tag.replace(NS, ''), dict(c.attrib)] for c in pr] if pr is not None else [],
        'headerFooter': {c.tag.replace(NS, ''): c.text for c in hf} if hf is not None else None,
        'pageSetup': dict(root.find(NS + 'pageSetup').attrib) if root.find(NS + 'pageSetup') is not None else None,
        'merges': [m.get('ref') for m in root.iter(NS + 'mergeCell')],
        'cols': [dict(c.attrib) for c in root.iter(NS + 'col')],
        'mergeCount': root.find(NS + 'mergeCells').get('count') if root.find(NS + 'mergeCells') is not None else None,
    }


def styles(z):
    root = ET.fromstring(z.read('xl/styles.xml'))
    out = {'order': [c.tag.replace(NS, '') for c in root]}
    for tag in ('numFmts', 'fonts', 'fills', 'borders', 'cellXfs'):
        el = root.find(NS + tag)
        if el is None:
            out[tag] = {'count': None, 'n': 0, 'distinct': 0}
            continue
        kids = [ET.tostring(c) for c in el]
        out[tag] = {'count': el.get('count'), 'n': len(kids), 'distinct': len(set(kids))}
    out['numFmtCodes'] = [c.get('formatCode') for c in root.iter(NS + 'numFmt')]
    out['xfs'] = [dict(x.attrib, align=dict(x.find(NS + 'alignment').attrib) if x.find(NS + 'alignment') is not None else None)
                  for x in root.find(NS + 'cellXfs')]
    return out


def full(path):
    import openpyxl
    plist, bad = parts(path)
    res = {'parts': plist, 'crcBad': bad, 'sheets': [], 'raw': []}
    if bad is not None:
        return res   # nothing more can be read from a zip whose members are damaged; the test fails on crcBad by name
    with zipfile.ZipFile(path) as z:
        res['styles'] = styles(z)
        wbroot = ET.fromstring(z.read('xl/workbook.xml'))
        res['sheetNamesXml'] = [s.get('name') for s in wbroot.iter(NS + 'sheet')]
        names = sorted([n for n in z.namelist() if n.startswith('xl/worksheets/sheet')], key=lambda n: int(n[19:-4]))
        res['raw'] = [raw_sheet(z, n) for n in names]
        res['sharedStrings'] = None
        if 'xl/sharedStrings.xml' in z.namelist():
            sroot = ET.fromstring(z.read('xl/sharedStrings.xml'))
            res['sharedStrings'] = {'count': sroot.get('count'), 'uniqueCount': sroot.get('uniqueCount'), 'n': len(list(sroot))}
    wb = openpyxl.load_workbook(path)
    res['sheets'] = []
    for ws in wb.worksheets:
        sh = {
            'title': ws.title,
            'tab': colour(ws.sheet_properties.tabColor),
            'grid': ws.sheet_view.showGridLines,
            'freeze': ws.freeze_panes,
            'summaryBelow': ws.sheet_properties.outlinePr.summaryBelow if ws.sheet_properties.outlinePr is not None else None,
            'fitToPage': ws.sheet_properties.pageSetUpPr.fitToPage if ws.sheet_properties.pageSetUpPr is not None else None,
            'page': {'orientation': ws.page_setup.orientation, 'paperSize': ws.page_setup.paperSize,
                     'fitToWidth': ws.page_setup.fitToWidth, 'fitToHeight': ws.page_setup.fitToHeight},
            'header': {k: getattr(ws.oddHeader, k).text for k in ('left', 'center', 'right')},
            'footer': {k: getattr(ws.oddFooter, k).text for k in ('left', 'center', 'right')},
            'headerFont': {k: getattr(ws.oddHeader, k).font for k in ('left', 'center', 'right')},
            'merges': sorted(str(m) for m in ws.merged_cells.ranges),
            'cols': {k: {'width': d.width, 'hidden': bool(d.hidden), 'customWidth': bool(d.customWidth)}
                     for k, d in ws.column_dimensions.items()},
            'rows': {str(k): {'ht': d.ht, 'outline': d.outline_level, 'hidden': bool(d.hidden)}
                     for k, d in ws.row_dimensions.items()},
            'maxRow': ws.max_row, 'maxCol': ws.max_column,
            'cells': {},
        }
        for row in ws.iter_rows():
            for c in row:
                if c.value is None and c.style_id == 0:
                    continue
                f = c.font
                sh['cells'][c.coordinate] = {
                    'v': val(c.value), 'type': c.data_type, 'fmt': c.number_format,
                    'font': {'b': bool(f.b), 'i': bool(f.i), 'sz': f.sz, 'color': colour(f.color), 'name': f.name},
                    'fill': colour(c.fill.fgColor) if c.fill is not None and c.fill.fill_type == 'solid' else None,
                    'border': {'l': side(c.border.left), 'r': side(c.border.right), 't': side(c.border.top), 'b': side(c.border.bottom)},
                    'align': {'h': c.alignment.horizontal, 'v': c.alignment.vertical, 'wrap': bool(c.alignment.wrap_text),
                              'indent': c.alignment.indent},
                }
        res['sheets'].append(sh)
    return res


def light(path):
    plist, bad = parts(path)
    res = {'parts': plist, 'crcBad': bad, 'sheets': []}
    with zipfile.ZipFile(path) as z:
        names = sorted([n for n in z.namelist() if n.startswith('xl/worksheets/sheet')], key=lambda n: int(n[19:-4]))
        for n in names:
            rows = cells = 0
            last = None
            with z.open(n) as fh:
                for ev, el in ET.iterparse(fh, events=('end',)):
                    if el.tag == NS + 'row':
                        rows += 1
                        el.clear()
                    elif el.tag == NS + 'c':
                        cells += 1
                        last = el.get('r')
            res['sheets'].append({'part': n, 'rows': rows, 'cells': cells, 'last': last})
    return res


def zipinfo(path):
    out = []
    with zipfile.ZipFile(path) as z:
        res = {'crcBad': z.testzip(), 'members': out}
        for info in z.infolist():
            data = z.read(info.filename)
            out.append({'name': info.filename, 'method': info.compress_type, 'size': info.file_size,
                        'flag': info.flag_bits, 'sha256': hashlib.sha256(data).hexdigest()})
    return res


def csvdir(d):
    out = {}
    for n in sorted(os.listdir(d)):
        if n.endswith('.csv'):
            with open(os.path.join(d, n), newline='', encoding='utf-8') as fh:
                out[n] = list(csv.reader(fh))
    return out


if __name__ == '__main__':
    mode, path = sys.argv[1], sys.argv[2]
    fn = {'full': full, 'light': light, 'zip': zipinfo, 'csv': csvdir}[mode]
    json.dump(fn(path), sys.stdout, ensure_ascii=True, default=str)
