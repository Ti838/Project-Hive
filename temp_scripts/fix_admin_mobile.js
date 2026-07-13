import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('public/pages/admin/dashboard.html', 'utf8');

// 1. Replace rRecent to render cards on mobile
const rRecentStart = content.indexOf('function rRecent(){');
const rRecentEnd = content.indexOf('\n}', rRecentStart) + 2;

const newRRecent = `function rRecent(){
  const el=document.getElementById("recent-wrap");if(!el)return;
  const list=AU.slice(0,6);
  if(!list.length){el.innerHTML='<div class="empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>No users yet</div>';return}
  if(window.innerWidth<=768){
    el.innerHTML='<div style="display:flex;flex-direction:column;gap:10px;padding:10px">'+list.map(u=>{
      const nm=((u.firstName||'')+(u.lastName?' '+u.lastName:'')).trim()||'Unknown';
      const c=avC(nm);const i=((u.firstName?.[0]||'')+(u.lastName?.[0]||'')).toUpperCase()||'?';
      const av=u.avatar?'<img src="'+u.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:9px">':i;
      const bn=u.isBanned;
      return'<div class="mob-item-card"><div class="mob-item-top"><div class="u-av" style="width:40px;height:40px;border-radius:11px;font-size:13px;background:'+c+'">'+av+'</div><div class="mob-item-meta"><div class="mob-item-name">'+nm+'</div><div class="mob-item-sub">'+u.email+'</div><div class="mob-item-sub">'+(u.university||'ProjectHive')+'</div></div></div><div class="mob-item-badges"><span class="badge '+u.role+'">'+u.role+'</span><span class="badge '+(bn?'banned':'active')+'">'+(bn?'Banned':'Active')+'</span><span style="font-size:10px;color:var(--sub);margin-left:auto">'+ago(u.createdAt)+'</span></div></div>';
    }).join('')+'</div>';
    return;
  }
  el.innerHTML='<table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead><tbody>'+list.map(u=>{
    const nm=(u.firstName||"")+" "+(u.lastName||"");const c=avC(nm);const i=((u.firstName?.[0]||"")+(u.lastName?.[0]||"")).toUpperCase()||"?";
    return'<tr><td><div style="display:flex;align-items:center;gap:9px"><div class="u-av" style="background:'+c+'">'+i+'</div><div><div style="font-weight:700">'+nm.trim()+'</div></div></div></td><td style="color:var(--sub)">'+u.email+'</td><td><span class="badge '+u.role+'">'+u.role+'</span></td><td><span class="badge '+(u.isBanned?"banned":"active")+'">'+(u.isBanned?"Banned":"Active")+'</span></td><td style="color:var(--sub);font-size:11px">'+ago(u.createdAt)+'</td></tr>'
  }).join("")+"</tbody></table>";
}`;

content = content.substring(0, rRecentStart) + newRRecent + content.substring(rRecentEnd);
console.log('✅ Fixed rRecent');

// 2. Also remove the .card-title { display:none } on mobile — it was hiding section titles like "User Management"
// That was the culprit for text disappearing. Show it but make it smaller.
content = content.replace(
  '  /* Hide duplicate card title - topbar shows section name */\n  .card-title {\n    display: none !important;\n  }',
  '  /* Card title - visible but compact on mobile */\n  .card-title {\n    font-size: 13px !important;\n    font-weight: 700 !important;\n  }'
);
console.log('✅ Fixed card-title visibility');

// 3. Fix duplicate mobile card list in script (keep only the one after loadAll) 
// The duplicate was at the end from the old appended <style> that was merged back as JS
// The second set starts right after loadAll() line in the big script block
// Let's find if there are two 'const _origRUsers' and remove the later duplicate
const firstOrig = content.indexOf('const _origRUsers = rUsers;');
const secondOrig = content.indexOf('const _origRUsers = rUsers;', firstOrig + 1);
if (secondOrig > 0) {
  // Find end of the duplicate block
  const dupBlockEnd = content.indexOf('});\n</script>', secondOrig);
  if (dupBlockEnd > 0) {
    content = content.substring(0, secondOrig) + '\n' + content.substring(dupBlockEnd);
    console.log('✅ Removed duplicate mobile card JS');
  }
} else {
  console.log('ℹ️ No duplicate JS found (already clean)');
}

writeFileSync('public/pages/admin/dashboard.html', content);
console.log('✅ File saved successfully');
