# hunks.py <diff> : every hunk's lines (context, added, removed) without file headers and with the @@ line numbers replaced by "@@".
import sys, re
for l in open(sys.argv[1], encoding='utf-8'):
    if l.startswith(('diff --git', 'index ', '+++', '---')): continue
    if l.startswith('@@'): sys.stdout.write('@@' + re.sub(r'^@@ [^@]* @@', '', l)); continue
    sys.stdout.write(l)
