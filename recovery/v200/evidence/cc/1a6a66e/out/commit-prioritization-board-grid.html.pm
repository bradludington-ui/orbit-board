+  // v2.00 (U42): a cut never leaves the first half of a two-part character (an emoji) at the end -- the workbook held U+FFFD
+  // there -- and a name never begins or ends with an apostrophe, which a sheet name may not, whether the name had one or the
+  // cut left one. The same lengths as before; an apostrophe inside a name stays.
+  const half=s=>s.replace(/[\uD800-\uDBFF]$/,'');
-    let t=String(nm||fallback).replace(/[\\\/?*\[\]:]/g,' ').slice(0,28).trim()||fallback;
+    let t=half(String(nm||fallback).replace(/[\\\/?*\[\]:]/g,' ').slice(0,28)).replace(/^[\s']+|[\s']+$/g,'')||fallback;
-    while(used[t.toLowerCase()]) t=(base.slice(0,26)+' '+(i++));
+    while(used[t.toLowerCase()]) t=(half(base.slice(0,26))+' '+(i++));
