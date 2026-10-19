# The first audit-import sensitivity run, at 8f22668: the environment was flawed, and the run was superseded (11 Oct 2026, 5:50–5:59 PM ET)

**What ran:** one run, `v200-r3-cycblock-gone`, in a `git archive` copy of `8f22668`.

**What it showed:**
- The mutation was caught by R3's own checks: (a) the save wrote the history copy, main copy and lock, returned true,
  and said saved; (b) Publish now wrote as well.
- The same run also reported a failure in the v1.86 import block: "the block threw: … git show 68b02e9:… not a git
  repository". That block needs a git repository, and an archive copy is not one. The failure says nothing about the
  mutation.

**What replaced it:** the copy is not a valid place to run audit-import. The sequence was stopped, by its recorded PID,
before a second run. It was restarted at 6:03 PM ET in a **git clone** of `af892cb`, with an unmutated baseline first.
That sequence is the evidence of record. This run is kept only so the history is complete.
