import ctypes, sys, time
X=ctypes.cdll.LoadLibrary('libX11.so.6'); T=ctypes.cdll.LoadLibrary('libXtst.so.6')
X.XOpenDisplay.restype=ctypes.c_void_p; X.XStringToKeysym.restype=ctypes.c_ulong
X.XKeysymToKeycode.argtypes=[ctypes.c_void_p, ctypes.c_ulong]; X.XKeysymToKeycode.restype=ctypes.c_ubyte
T.XTestFakeKeyEvent.argtypes=[ctypes.c_void_p, ctypes.c_uint, ctypes.c_int, ctypes.c_ulong]
X.XFlush.argtypes=[ctypes.c_void_p]
T.XTestFakeMotionEvent.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_ulong]
T.XTestFakeButtonEvent.argtypes=[ctypes.c_void_p,ctypes.c_uint,ctypes.c_int,ctypes.c_ulong]
d=X.XOpenDisplay(None)
if not d: print('no display'); sys.exit(1)
def kc(name): return X.XKeysymToKeycode(d, X.XStringToKeysym(name.encode()))
def press(names):
    codes=[kc(n) for n in names]
    for c in codes: T.XTestFakeKeyEvent(d,c,1,0)
    for c in reversed(codes): T.XTestFakeKeyEvent(d,c,0,0)
    X.XFlush(d); time.sleep(0.05)
M={'/':'slash','-':'minus','.':'period','_':'underscore',' ':'space'}
def typ(s):
    for ch in s:
        if ch=='_': press(['Shift_L','minus'])
        elif ch.isupper(): press(['Shift_L',ch.lower()])
        else: press([M.get(ch,ch)])
for a in sys.argv[1:]:
    if a.startswith('type:'): typ(a[5:])
    elif a.startswith('click:'):
        x,y=map(int,a[6:].split(','))
        T.XTestFakeMotionEvent(d,-1,x,y,0); X.XFlush(d); time.sleep(0.2)
        T.XTestFakeButtonEvent(d,1,1,0); T.XTestFakeButtonEvent(d,1,0,0); X.XFlush(d); time.sleep(0.2)
    elif a.startswith('sleep:'): time.sleep(float(a[6:]))
    else: press(a.split('+'))
print('sent')
