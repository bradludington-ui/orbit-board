// cov-control.mjs <cloneRoot> -- POSITIVE CONTROL for the instrumentation: boots the instrumented board (BOARD) through the clone's
// boot.mjs and calls each instrumented function once, so every name must appear in $COV_OUT.
const C = process.argv[2];
const { boot, seed, bootRelease } = await import(C + '/tools/export-audit/boot.mjs');
const X = boot(); const { ev, w } = X;
seed(ev, { services: ['USAF'], items: [{ id:'F1', grp:'PSM', team:'PSM', sect:'', custom:false, title:'T', event:'E', ccar:'', fy26:[0], ask:[100], alloc:null }], disc: [100], mand: [0], order: ['F1'] });
ev(`flowYears(); flowCalc(); flowHasMoney(1); flowIsMixed({execV:1, planV:1}); flowStoredIn(2025, ['om']); flowOpen=true; flowBody(); try{ exportFlow(); }catch(e){} try{ keptPutBack(); }catch(e){} 'ok'`);
await w.eval(`(async function(){ try{ await driveStorePull(true); }catch(e){} })()`);
console.log('errors', JSON.stringify(X.errors).slice(0, 300));
bootRelease(0);
