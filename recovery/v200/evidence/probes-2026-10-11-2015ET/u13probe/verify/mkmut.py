# mkmut.py <srcBoardHtml> <outHtml> <line> <expectedOldLine> <newLine> : a one-line disposable mutant; refuses if the line differs
import sys
src, out, n, old, new = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5]
b = open(src, 'rb').read().decode('utf-8')
L = b.split('\n')
if L[n-1] != old: sys.exit('line %d is %r, not %r' % (n, L[n-1], old))
L[n-1] = new
open(out, 'wb').write('\n'.join(L).encode('utf-8'))
