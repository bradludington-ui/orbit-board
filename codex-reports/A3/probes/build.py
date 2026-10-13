from pathlib import Path
p=Path('/workspace/orbit-codex-batches-20261013-1205ET/A3/fix/prioritization-board-grid.html');s=p.read_text()
def sub(a,b):
 global s
 assert s.count(a)==1,(a[:80],s.count(a));s=s.replace(a,b)
sub('var _destReady=false, _destOthers=false, _destBusy=false, _destOpening=false;','var _destReady=false, _destOthers=false, _destBusy=false, _destOpening=false, _destMerges=[];')
sub('function destJoin(hit, e, from){\n  const toks=flowToks(hit.t);','function destJoin(hit, e, from){\n  // v2.00 (U40): every name-based re-pointing is disclosed in this session, never silently.\n  if(hit.k!==String(e.k) && !_destMerges.some(function(m){ return m.k===String(e.k) && m.to===hit.k && m.from===from; }))\n    _destMerges.push({k:String(e.k), n:String(e.n||\'\'), to:hit.k, name:String(hit.n||\'\'), from:from});\n  const toks=flowToks(hit.t);')
sub('      hit=destByName(e.n);\n      if(hit){ if(first){ destJoin(hit, e, from); touched=true; } }', '''      hit=destByName(e.n);
      // v2.00 (U40): keys beside one list keep distinct destinations. A duplicate name, an ambiguous
      // local name, or a different key in this same v1.86 list is not permission to move a requirement.
      if(hit && (list.some(function(x){ return x && x.k!==e.k && destNamed(x.n) && destName(x.n)===destName(e.n); })
        || DESTDB.ents.filter(function(x){ return destName(x.n)===destName(e.n); }).length>1
        || (v186 && list.some(function(x){ return x && x.k===hit.k && x.k!==e.k; })))) hit=null;
      if(hit){ if(first){ destJoin(hit, e, from); touched=true; } }''')
sub('function flowSetEnt(i, field, v){\n  const L=flowEnts(), e=L[i]; if(!e) return;', '''function flowSetEnt(i, field, v){
  const L=flowEnts(), e=L[i]; if(!e) return;
  // v2.00 (U40): refuse the whole typed name before changing or saving anything.
  if(field==='n' && destNamed(v) && L.some(function(x){ return x!==e && destName(x.n)===destName(v); })){
    setStat('⚠ <b>Destination name not changed.</b> Another destination has that name (ignoring case and extra spaces). '
      +'Give this destination a different name; both destinations and their requirements are unchanged.');
    return;
  }''')
sub('function flowEntEditor(){\n  const L=flowEnts();', '''function destNotice(){
  const L=DESTDB.ents||[], D=L.filter(function(e,i){ return destNamed(e.n) && L.some(function(x,j){ return i!==j && destName(x.n)===destName(e.n); }); });
  let h=D.length? '⚠ <b>Destinations with matching names were kept separate.</b> '
    +D.map(function(e){ return esc(e.n)+' ['+esc(e.k)+']'; }).join(' · ')
    +'. Requirements still point at their own keys. Rename these destinations to make the distinction clear.' : '';
  if(_destMerges.length) h+=(h? ' ' : '')+'<b>Destination names matched:</b> '+_destMerges.map(function(m){
    return esc(m.n)+' ['+esc(m.k)+'] → '+esc(m.name)+' ['+esc(m.to)+'] ('+esc(m.from||'an imported list')+')'; }).join(' · ')+'.';
  return h;
}
function flowEntEditor(){
  const L=flowEnts();''')
sub("  h+='</table>'\n    +(cf.length?", "  h+='</table>'\n    +(destNotice()? '<div style=\"font-size:9.5px;color:var(--amber);margin-top:6px\">'+destNotice()+'</div>' : '')\n    +(cf.length?")
sub('function loadShared(cb){\n  // file://', '''// v2.00 (U40): opening discloses preserved duplicates and each name-based merge without hiding an
// import/storage safety warning. The Funds Flow editor also keeps this notice available after later messages.
if(destNotice()){
  const de=document.getElementById('shareStat');
  _statQuiet=false; setStat((de? de.innerHTML+' ' : '')+destNotice());
}
function loadShared(cb){
  // file://''')
p.write_text(s)
