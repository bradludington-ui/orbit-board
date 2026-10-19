# waitfor.py <file> <count> <pattern> <max_s> : waits (polling every 5 s) until <file> holds at least <count> lines containing <pattern>, or max_s passes.
import sys, time, os
f, n, pat, mx = sys.argv[1], int(sys.argv[2]), sys.argv[3], float(sys.argv[4]); t0 = time.time()
while time.time() - t0 < mx:
    if os.path.exists(f) and sum(1 for l in open(f, encoding='utf-8', errors='replace') if pat in l) >= n: print('ready after', round(time.time()-t0), 's'); sys.exit(0)
    time.sleep(5)
print('not ready after', mx, 's'); sys.exit(1)
