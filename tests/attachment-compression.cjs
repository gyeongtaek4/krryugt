const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('dist/index.html', 'utf8');
const compression = fs.readFileSync('dist/js/attachment-compression.js', 'utf8');
const handover = fs.readFileSync('dist/js/handover.js', 'utf8');
const accidents = fs.readFileSync('dist/js/accidents.js', 'utf8');

assert(html.indexOf('./js/attachment-compression.js') < html.indexOf('./js/handover.js'));
assert(html.includes('사진은 1MB 초과 시 자동 압축'));
for (const text of ['IMAGE_MAX_BYTES = 1024 * 1024', "canvas.toBlob", 'compressImage', "type: compressed ? 'image/jpeg'", 'PDF_MAX_BYTES = 5 * 1024 * 1024']) {
  assert(compression.includes(text), `missing compression rule: ${text}`);
}
for (const source of [handover, accidents]) {
  assert(source.includes('window.fleetAttachmentCompression.prepare(file)'));
  assert(source.includes('사진을 확인하고 필요한 경우 압축하는 중입니다.'));
}
assert(accidents.includes("photo.compressed?' · 압축됨':''"));
console.log('PASS: handover/accident image compression wiring and PDF preservation rules (static).');
