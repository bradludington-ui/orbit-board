# body.py <diff> : the added/removed lines of a unified diff, in order, without file headers or hunk headers.
import sys
for l in open(sys.argv[1], encoding='utf-8'):
    if l.startswith(('+++', '---')): continue
    if l.startswith(('+', '-')): sys.stdout.write(l)
