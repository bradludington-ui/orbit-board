# xkeys.py -- keys to the X display, through XTest by ctypes, for tools/import-file.mjs --gtk (v2.14, item 141): the real GTK
# save dialog Chromium opens cannot be driven from page code, so the check sends keys the way a person types them.
# Run with python3 -I (it imports nothing from where it stands). Needs DISPLAY, libX11 and libXtst.
#
#   python3 -I tools/xkeys.py --check              the display opens and XTest is there (exit 1, saying which is missing)
#   python3 -I tools/xkeys.py key Control+a        one chord: keysym names joined by +
#   python3 -I tools/xkeys.py type "/tmp/x/ORBIT Live.html"
#   python3 -I tools/xkeys.py click 640,450        a left click at screen x,y
#   python3 -I tools/xkeys.py sleep 0.5
# Several steps may follow one another on one line: key Control+a type /tmp/a.html key Return
import ctypes, sys, time

def fail(why):
    sys.stderr.write('xkeys: ' + why + '\n'); sys.exit(1)

try:
    X = ctypes.cdll.LoadLibrary('libX11.so.6')
except OSError:
    fail('libX11.so.6 is missing')
try:
    T = ctypes.cdll.LoadLibrary('libXtst.so.6')
except OSError:
    fail('libXtst.so.6 is missing')
X.XOpenDisplay.restype = ctypes.c_void_p
X.XStringToKeysym.restype = ctypes.c_ulong
X.XKeysymToKeycode.argtypes = [ctypes.c_void_p, ctypes.c_ulong]
X.XKeysymToKeycode.restype = ctypes.c_ubyte
X.XFlush.argtypes = [ctypes.c_void_p]
T.XTestFakeKeyEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint, ctypes.c_int, ctypes.c_ulong]
T.XTestFakeMotionEvent.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_ulong]
T.XTestFakeButtonEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint, ctypes.c_int, ctypes.c_ulong]
d = X.XOpenDisplay(None)
if not d:
    fail('the X display could not be opened (is DISPLAY set, and Xvfb running?)')

def code(name):
    c = X.XKeysymToKeycode(d, X.XStringToKeysym(name.encode()))
    if not c:
        fail('no key for ' + repr(name))
    return c

def chord(names):
    codes = [code(n) for n in names]
    for c in codes: T.XTestFakeKeyEvent(d, c, 1, 0)
    for c in reversed(codes): T.XTestFakeKeyEvent(d, c, 0, 0)
    X.XFlush(d); time.sleep(0.05)

# the characters a file path holds, by keysym; capitals and the shifted ones with Shift
NAME = {'/': 'slash', '-': 'minus', '.': 'period', ' ': 'space', ',': 'comma', ':': 'colon', '=': 'equal', '+': 'plus', "'": 'apostrophe'}
SHIFT = {'_': 'minus', '(': '9', ')': '0', ':': 'semicolon', '+': 'equal', '~': 'grave', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '&': '7'}
def typ(s):
    for ch in s:
        if ch in SHIFT: chord(['Shift_L', SHIFT[ch]])
        elif ch.isalpha() and ch.isupper(): chord(['Shift_L', ch.lower()])
        elif ch.isalnum(): chord([ch])
        elif ch in NAME: chord([NAME[ch]])
        else: fail('cannot type ' + repr(ch))

a = sys.argv[1:]
if a == ['--check']:
    print('ok'); sys.exit(0)
i = 0
while i < len(a):
    op = a[i]; arg = a[i + 1] if i + 1 < len(a) else None; i += 2
    if arg is None: fail('missing an argument after ' + op)
    if op == 'key': chord(arg.split('+'))
    elif op == 'type': typ(arg)
    elif op == 'click':
        x, y = map(int, arg.split(','))
        T.XTestFakeMotionEvent(d, -1, x, y, 0); X.XFlush(d); time.sleep(0.2)
        T.XTestFakeButtonEvent(d, 1, 1, 0); T.XTestFakeButtonEvent(d, 1, 0, 0); X.XFlush(d); time.sleep(0.2)
    elif op == 'sleep': time.sleep(float(arg))
    else: fail('unknown step ' + repr(op))
print('sent')
