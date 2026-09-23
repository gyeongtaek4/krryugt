const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const js=fs.readFileSync('dist/js/app.js','utf8');
const css=fs.readFileSync('dist/css/app.css','utf8');
for(const id of ['noticeButton','noticePopover'])assert(html.includes(`id="${id}"`),`missing ${id}`);
for(const text of ['fleet-sidebar-preference-v1','applySidebarPreference','sidebarExpanded','toggleNotice','notice-wrap'])assert(js.includes(text),`missing behavior: ${text}`);
for(const removed of ['sidebarCollapseButton','sidebarPinButton','데이터 기준'])assert(!html.includes(removed),`should be removed: ${removed}`);
for(const text of ['sidebar-unpinned','sidebar-collapsed','.notice-popover'])assert(css.includes(text),`missing style: ${text}`);
console.log('PASS: top menu sidebar persistence and bell-adjacent notice UI are wired (static).');
