
## PIDs (from `pids.txt`: the `setsid -w timeout` PID, then its child; "gone" = the child had already exited when it was looked up)
No process was killed or signalled by this check. q.sh's `kill -0` sends no signal: it only asks whether its own child still
exists.

| label | PIDs |
|---|---|
