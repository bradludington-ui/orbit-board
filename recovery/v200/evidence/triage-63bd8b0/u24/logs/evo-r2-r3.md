| scenario | check | expected (literal) | observed r2 | observed r3 |
|---|---|---|---|---|
| SHc-fold-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-fold-W | PRED: the action during the held save | ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] |
| SHc-fold-W | PRED: the end state | ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] |
| SHc-fold-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-fold-W | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHc-fold-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-fold-W | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-W | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-W | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-W | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1 | PRED: the action with no save under way | ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] |
| SHc-fold-C1 | PRED: the end state | ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] |
| SHc-fold-C1 | PRED: reopened from the end state | ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] |
| SHc-fold-C1 | PRED: a quiet refresh from the end state | ["SHARED",false,false] | = ["SHARED",false,false] | = ["SHARED",false,false] |
| SHc-fold-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHc-fold-C1 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-C1 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHc-fold-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-fold-C2 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHc-fold-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHc-fold-C2 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-C2 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C2 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-file-W | PRED: the action during the held save | ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",1,false,true,true,"BRAD-2","shared-loaded"] |
| SHc-file-W | PRED: the end state | ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] |
| SHc-file-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-file-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-file-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-file-W | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-W | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-W | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1 | PRED: the action with no save under way | ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] | = ["SHARED",0,false,true,true,"BRAD-2","shared-loaded"] |
| SHc-file-C1 | PRED: the end state | ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] |
| SHc-file-C1 | PRED: reopened from the end state | ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] |
| SHc-file-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHc-file-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-file-C1 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHc-file-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-file-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHc-file-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-file-C2 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C2 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-Wclean | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHc-fold-Wclean | PRED: the action during the held save | ["SHARED",1,false,false,false,null,"shared-loaded"] | = ["SHARED",1,false,false,false,null,"shared-loaded"] | = ["SHARED",1,false,false,false,null,"shared-loaded"] |
| SHc-fold-Wclean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHc-fold-Wclean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| SHc-fold-Wclean | PRED: a quiet refresh from the end state | ["BRAD-1",true,false] | = ["BRAD-1",true,false] | = ["BRAD-1",true,false] |
| SHc-fold-Wclean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-fold-Wclean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-Wclean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-Wclean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-Wclean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-Wclean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1clean | PRED: the action with no save under way | ["SHARED",0,false,false,false,null,"shared-loaded"] | = ["SHARED",0,false,false,false,null,"shared-loaded"] | = ["SHARED",0,false,false,false,null,"shared-loaded"] |
| SHc-fold-C1clean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHc-fold-C1clean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| SHc-fold-C1clean | PRED: a quiet refresh from the end state | ["BRAD-1",true,false] | = ["BRAD-1",true,false] | = ["BRAD-1",true,false] |
| SHc-fold-C1clean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-fold-C1clean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHc-fold-C1clean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-fold-C1clean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1clean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-fold-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1clean | PRED: the action with no save under way | ["SHARED",0,false,false,false,null,"shared-loaded"] | = ["SHARED",0,false,false,false,null,"shared-loaded"] | = ["SHARED",0,false,false,false,null,"shared-loaded"] |
| SHc-file-C1clean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHc-file-C1clean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| SHc-file-C1clean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHc-file-C1clean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHc-file-C1clean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1clean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHc-file-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wclean | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHa-fold-Wclean | PRED: the action during the held save | ["SHARED",1,false,false,false,null,"shared-auto"] | = ["SHARED",1,false,false,false,null,"shared-auto"] | = ["SHARED",1,false,false,false,null,"shared-auto"] |
| SHa-fold-Wclean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHa-fold-Wclean | PRED: reopened from the end state | ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] |
| SHa-fold-Wclean | PRED: a quiet refresh from the end state | ["SHARED",true,true] | = ["SHARED",true,true] | = ["SHARED",true,true] |
| SHa-fold-Wclean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-Wclean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-Wclean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-Wclean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wclean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wclean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1clean | PRED: the action with no save under way | ["SHARED",0,false,false,false,null,"shared-auto"] | = ["SHARED",0,false,false,false,null,"shared-auto"] | = ["SHARED",0,false,false,false,null,"shared-auto"] |
| SHa-fold-C1clean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHa-fold-C1clean | PRED: reopened from the end state | ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] |
| SHa-fold-C1clean | PRED: a quiet refresh from the end state | ["SHARED",true,true] | = ["SHARED",true,true] | = ["SHARED",true,true] |
| SHa-fold-C1clean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-C1clean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-C1clean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-C1clean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1clean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1clean | PRED: the action with no save under way | ["SHARED",0,false,false,false,null,"shared-auto"] | = ["SHARED",0,false,false,false,null,"shared-auto"] | = ["SHARED",0,false,false,false,null,"shared-auto"] |
| SHa-file-C1clean | PRED: the end state | ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] | = ["SHARED",true,"BRAD-1","BRAD-1",true] |
| SHa-file-C1clean | PRED: reopened from the end state | ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] | = ["SHARED",true,"BRAD-1",true] |
| SHa-file-C1clean | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHa-file-C1clean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| SHa-file-C1clean | CONTRACT: REACH (end): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1clean | CONTRACT: REACH (reopened): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHa-fold-W | PRED: the action during the held save | ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] |
| SHa-fold-W | PRED: the end state | ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] |
| SHa-fold-W | PRED: reopened from the end state | ["SHARED",true,"BRAD-2",true] | = ["SHARED",true,"BRAD-2",true] | = ["SHARED",true,"BRAD-2",true] |
| SHa-fold-W | PRED: a quiet refresh from the end state | ["SHARED",true,true] | = ["SHARED",true,true] | = ["SHARED",true,true] |
| SHa-fold-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-W | CONTRACT: K2: after a quiet refresh, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-W | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| SHa-fold-W | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-W | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-W | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wnow | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHa-fold-Wnow | PRED: the action during the held save | ["BRAD-2",1,false,false,true,null,"shared-newer-local"] | = ["BRAD-2",1,false,false,true,null,"shared-newer-local"] | = ["BRAD-2",1,false,false,true,null,"shared-newer-local"] |
| SHa-fold-Wnow | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHa-fold-Wnow | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHa-fold-Wnow | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHa-fold-Wnow | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-fold-Wnow | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHa-fold-Wnow | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-fold-Wnow | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wnow | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-Wnow | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1 | PRED: the action with no save under way | ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] |
| SHa-fold-C1 | PRED: the end state | ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] |
| SHa-fold-C1 | PRED: reopened from the end state | ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] |
| SHa-fold-C1 | PRED: a quiet refresh from the end state | ["SHARED",false,false] | = ["SHARED",false,false] | = ["SHARED",false,false] |
| SHa-fold-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-fold-C1 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHa-fold-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-fold-C1 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C1 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHa-fold-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHa-fold-C2 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHa-fold-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-fold-C2 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| SHa-fold-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-fold-C2 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C2 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-fold-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHa-file-W | PRED: the action during the held save | ["BRAD-2",1,false,true,true,null,"shared-refused"] | = ["BRAD-2",1,false,true,true,null,"shared-refused"] | = ["BRAD-2",1,false,true,true,null,"shared-refused"] |
| SHa-file-W | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHa-file-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHa-file-W | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-file-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-file-W | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-W | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-W | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-Wread | HOLD: the 💾 Save is held at its read of the file | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHa-file-Wread | PRED: the action during the held save | ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",1,false,false,true,"BRAD-2","shared-auto"] |
| SHa-file-Wread | PRED: the end state | ["SHARED",true,"SHARED","SHARED",false] | = ["SHARED",true,"SHARED","SHARED",false] | = ["SHARED",true,"SHARED","SHARED",false] |
| SHa-file-Wread | PRED: reopened from the end state | ["SHARED",true,"SHARED",false] | = ["SHARED",true,"SHARED",false] | = ["SHARED",true,"SHARED",false] |
| SHa-file-Wread | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-file-Wread | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-file-Wread | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-Wread | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-Wread | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1 | PRED: the action with no save under way | ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] | = ["SHARED",0,false,false,true,"BRAD-2","shared-auto"] |
| SHa-file-C1 | PRED: the end state | ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] | = ["SHARED",false,"BRAD-1","BRAD-1",false] |
| SHa-file-C1 | PRED: reopened from the end state | ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] | = ["SHARED",false,"BRAD-1",false] |
| SHa-file-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-file-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-file-C1 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C1 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHa-file-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHa-file-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| SHa-file-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| SHa-file-C2 | CONTRACT: REACH (end): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C2 | CONTRACT: REACH (reopened): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| SHa-file-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, SHARED each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"CAROL-F",true,1] | = [true,1,"CAROL-F",true,1] | = [true,1,"CAROL-F",true,1] |
| BT-file-W | HOLD: the question asked was HOLD ON (answered OK) | true | = true | = true |
| BT-file-W | PRED: the action during the held save | ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] |
| BT-file-W | PRED: the end state | ["CAROL-F",true,"BRAD-2","BRAD-2",true] | = ["CAROL-F",true,"BRAD-2","BRAD-2",true] | = ["CAROL-F",true,"BRAD-2","BRAD-2",true] |
| BT-file-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-file-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| BT-file-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-file-W | CONTRACT: REACH (end): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-W | CONTRACT: REACH (reopened): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-W | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C1 | PRED: the action with no save under way | ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] |
| BT-file-C1 | PRED: the end state | ["CAROL-F",true,"CAROL-F","CAROL-F",false] | = ["CAROL-F",true,"CAROL-F","CAROL-F",false] | = ["CAROL-F",true,"CAROL-F","CAROL-F",false] |
| BT-file-C1 | PRED: reopened from the end state | ["CAROL-F",true,"CAROL-F",false] | = ["CAROL-F",true,"CAROL-F",false] | = ["CAROL-F",true,"CAROL-F",false] |
| BT-file-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-file-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-file-C1 | CONTRACT: REACH (end): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C1 | CONTRACT: REACH (reopened): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C1 | CONTRACT: REACH (reopened + one edit): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| BT-file-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-file-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-file-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-file-C2 | CONTRACT: REACH (end): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C2 | CONTRACT: REACH (reopened): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C3 | PRED: after the save landed, the status line no longer offers 'open the file’s version' | "BUTTONS:0" | = "BUTTONS:0" | = "BUTTONS:0" |
| BT-file-C3 | PRED: the action with no save under way | ["BRAD-2",0,false,false,false,"KEPT-0","saved-file"] | = ["BRAD-2",0,false,false,false,"KEPT-0","saved-file"] | = ["BRAD-2",0,false,false,false,"KEPT-0","saved-file"] |
| BT-file-C3 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| BT-file-C3 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-file-C3 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-file-C3 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-file-C3 | CONTRACT: REACH (end): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C3 | CONTRACT: REACH (reopened): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-file-C3 | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-fold-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| BT-fold-W | PRED: the action during the held save | ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",1,false,false,false,"KEPT-0","file-version"] |
| BT-fold-W | PRED: the end state | ["CAROL-F",true,"BRAD-2","BRAD-2",true] | = ["CAROL-F",true,"BRAD-2","BRAD-2",true] | = ["CAROL-F",true,"BRAD-2","BRAD-2",true] |
| BT-fold-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-fold-W | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| BT-fold-W | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| BT-fold-W | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| BT-fold-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-fold-W | CONTRACT: REACH (end): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-W | CONTRACT: REACH (reopened): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-W | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C1 | PRED: the action with no save under way | ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] | = ["CAROL-F",0,false,false,false,"KEPT-0","file-version"] |
| BT-fold-C1 | PRED: the end state | ["CAROL-F",true,"BRAD-1","BRAD-1",true] | = ["CAROL-F",true,"BRAD-1","BRAD-1",true] | = ["CAROL-F",true,"BRAD-1","BRAD-1",true] |
| BT-fold-C1 | PRED: reopened from the end state | ["CAROL-F",true,"BRAD-1",true] | = ["CAROL-F",true,"BRAD-1",true] | = ["CAROL-F",true,"BRAD-1",true] |
| BT-fold-C1 | PRED: a quiet refresh from the end state | ["CAROL-F",true,true] | = ["CAROL-F",true,true] | = ["CAROL-F",true,true] |
| BT-fold-C1 | CONTRACT: K1: the end state is not falsely clean | false | **≠** true | **≠** true |
| BT-fold-C1 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | **≠** true | **≠** true |
| BT-fold-C1 | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| BT-fold-C1 | CONTRACT: REACH (end): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-fold-C1 | CONTRACT: REACH (reopened): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-fold-C1 | CONTRACT: REACH (reopened + one edit): CAROL-F, KEPT-0 each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| BT-fold-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| BT-fold-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-fold-C2 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| BT-fold-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-fold-C2 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| BT-fold-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-fold-C2 | CONTRACT: REACH (end): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C2 | CONTRACT: REACH (reopened): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C3 | PRED: after the save landed, the status line no longer offers 'open the file’s version' | "BUTTONS:0" | = "BUTTONS:0" | = "BUTTONS:0" |
| BT-fold-C3 | PRED: the action with no save under way | ["BRAD-2",0,false,false,false,"KEPT-0","saved-folder"] | = ["BRAD-2",0,false,false,false,"KEPT-0","saved-folder"] | = ["BRAD-2",0,false,false,false,"KEPT-0","saved-folder"] |
| BT-fold-C3 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| BT-fold-C3 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| BT-fold-C3 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| BT-fold-C3 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| BT-fold-C3 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| BT-fold-C3 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| BT-fold-C3 | CONTRACT: REACH (end): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C3 | CONTRACT: REACH (reopened): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| BT-fold-C3 | CONTRACT: REACH (reopened + one edit): BRAD-2, KEPT-0, CAROL-F each in a copy the board holds or fetches | [true,true,true] | = [true,true,true] | = [true,true,true] |
| IB-fold-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| IB-fold-W | PRED: the action during the held save | ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] |
| IB-fold-W | PRED: the end state | ["IMPORT",false,"BRAD-2","BRAD-2",false] | = ["IMPORT",false,"BRAD-2","BRAD-2",false] | = ["IMPORT",false,"BRAD-2","BRAD-2",false] |
| IB-fold-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| IB-fold-W | PRED: a quiet refresh from the end state | ["IMPORT",false,false] | = ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-W | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-W | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-fold-W | CONTRACT: REACH (end): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-W | CONTRACT: REACH (reopened): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-W | CONTRACT: REACH (reopened + one edit): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-C1 | PRED: the action with no save under way | ["IMPORT",0,true,true,true,null,"imported"] | = ["IMPORT",0,true,true,true,null,"imported"] | = ["IMPORT",0,true,true,true,null,"imported"] |
| IB-fold-C1 | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-fold-C1 | PRED: reopened from the end state | ["IMPORT",false,"BRAD-1",false] | = ["IMPORT",false,"BRAD-1",false] | = ["IMPORT",false,"BRAD-1",false] |
| IB-fold-C1 | PRED: a quiet refresh from the end state | ["IMPORT",false,false] | = ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-C1 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-fold-C1 | CONTRACT: REACH (end): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C1 | CONTRACT: REACH (reopened): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C1 | CONTRACT: REACH (reopened + one edit): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| IB-fold-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| IB-fold-C2 | PRED: a quiet refresh from the end state | ["BRAD-2",true,false] | = ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| IB-fold-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-C2 | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-fold-C2 | CONTRACT: REACH (end): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C2 | CONTRACT: REACH (reopened): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-fold-Wclean | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| IB-fold-Wclean | PRED: the action during the held save | ["IMPORT",1,true,true,false,null,"imported"] | = ["IMPORT",1,true,true,false,null,"imported"] | = ["IMPORT",1,true,true,false,null,"imported"] |
| IB-fold-Wclean | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-fold-Wclean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| IB-fold-Wclean | PRED: a quiet refresh from the end state | ["IMPORT",false,false] | = ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-Wclean | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-Wclean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-Wclean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-fold-Wclean | CONTRACT: REACH (end): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-Wclean | CONTRACT: REACH (reopened): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | **≠** [true,false] | **≠** [true,false] |
| IB-fold-Wclean | CONTRACT: REACH (reopened + one edit): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | **≠** [true,false] | **≠** [true,false] |
| IB-fold-C1clean | PRED: the action with no save under way | ["IMPORT",0,true,true,false,null,"imported"] | = ["IMPORT",0,true,true,false,null,"imported"] | = ["IMPORT",0,true,true,false,null,"imported"] |
| IB-fold-C1clean | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-fold-C1clean | PRED: reopened from the end state | ["IMPORT",true,"BRAD-1",true] | = ["IMPORT",true,"BRAD-1",true] | = ["IMPORT",true,"BRAD-1",true] |
| IB-fold-C1clean | PRED: a quiet refresh from the end state | ["IMPORT",false,false] | = ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-C1clean | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-fold-C1clean | CONTRACT: K2: after a quiet refresh, not falsely clean | false | = false | = false |
| IB-fold-C1clean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| IB-fold-C1clean | CONTRACT: REACH (end): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-C1clean | CONTRACT: REACH (reopened): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-fold-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-W | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| IB-file-W | PRED: the action during the held save | ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] |
| IB-file-W | PRED: the end state | ["IMPORT",false,"BRAD-2","BRAD-2",false] | = ["IMPORT",false,"BRAD-2","BRAD-2",false] | = ["IMPORT",false,"BRAD-2","BRAD-2",false] |
| IB-file-W | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| IB-file-W | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-W | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-file-W | CONTRACT: REACH (end): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-W | CONTRACT: REACH (reopened): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-W | CONTRACT: REACH (reopened + one edit): BRAD-2, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-C1 | PRED: the action with no save under way | ["IMPORT",0,true,true,true,null,"imported"] | = ["IMPORT",0,true,true,true,null,"imported"] | = ["IMPORT",0,true,true,true,null,"imported"] |
| IB-file-C1 | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-file-C1 | PRED: reopened from the end state | ["IMPORT",false,"BRAD-1",false] | = ["IMPORT",false,"BRAD-1",false] | = ["IMPORT",false,"BRAD-1",false] |
| IB-file-C1 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-C1 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-file-C1 | CONTRACT: REACH (end): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C1 | CONTRACT: REACH (reopened): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C1 | CONTRACT: REACH (reopened + one edit): IMPORT each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C2 | PRED: the end state | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| IB-file-C2 | PRED: reopened from the end state | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| IB-file-C2 | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-C2 | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-file-C2 | CONTRACT: REACH (end): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C2 | CONTRACT: REACH (reopened): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-C2 | CONTRACT: REACH (reopened + one edit): BRAD-2 each in a copy the board holds or fetches | [true] | = [true] | = [true] |
| IB-file-Wclean | HOLD: the 💾 Save is held at the close of its main write | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| IB-file-Wclean | PRED: the action during the held save | ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] | = ["IMPORT",1,true,true,true,null,"imported"] |
| IB-file-Wclean | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-file-Wclean | PRED: reopened from the end state | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| IB-file-Wclean | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-Wclean | CONTRACT: K3: reopened, not falsely clean | false | = false | = false |
| IB-file-Wclean | CONTRACT: REACH (end): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-Wclean | CONTRACT: REACH (reopened): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-Wclean | CONTRACT: REACH (reopened + one edit): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-C1clean | PRED: the action with no save under way | ["IMPORT",0,true,true,false,null,"imported"] | = ["IMPORT",0,true,true,false,null,"imported"] | = ["IMPORT",0,true,true,false,null,"imported"] |
| IB-file-C1clean | PRED: the end state | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-file-C1clean | PRED: reopened from the end state | ["IMPORT",true,"BRAD-1",true] | = ["IMPORT",true,"BRAD-1",true] | = ["IMPORT",true,"BRAD-1",true] |
| IB-file-C1clean | CONTRACT: K1: the end state is not falsely clean | false | = false | = false |
| IB-file-C1clean | CONTRACT: K3: reopened, not falsely clean | false | **≠** true | **≠** true |
| IB-file-C1clean | CONTRACT: REACH (end): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-C1clean | CONTRACT: REACH (reopened): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |
| IB-file-C1clean | CONTRACT: REACH (reopened + one edit): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | = [true,true] | = [true,true] |

r2: 560 checks, 25 fail (25 CONTRACT, 0 other); r3: 560 checks, 25 fail (25 CONTRACT, 0 other)
