const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('dist/index.html', 'utf8');
const compression = fs.readFileSync('dist/js/attachment-compression.js', 'utf8');
const handover = fs.readFileSync('dist/js/handover.js', 'utf8');
const accidents = fs.readFileSync('dist/js/accidents.js', 'utf8');

assert(html.indexOf('./js/attachment-compression.js') < html.indexOf('./js/handover.js'));
assert(html.indexOf('pdf.min.js') < html.indexOf('./js/attachment-compression.js'));
assert(html.indexOf('jspdf.umd.min.js') < html.indexOf('./js/attachment-compression.js'));
assert(html.includes('JPG/PNG/WebP 사진은 1MB 초과 시'));
assert(html.includes('PDF는 3MB 초과 시 자동 압축'));
for (const text of ['IMAGE_MAX_BYTES = 1024 * 1024', "canvas.toBlob", 'compressImage', "type: compressed ? 'image/jpeg'", 'PDF_MAX_BYTES = 3 * 1024 * 1024', 'PDF_SOURCE_MAX_BYTES = 5 * 1024 * 1024', 'compressPdf', 'page.render', 'addImage']) {
  assert(compression.includes(text), `missing compression rule: ${text}`);
}
for (const source of [handover, accidents]) {
  assert(source.includes('window.fleetAttachmentCompression.prepare(file)'));
  assert(source.includes('사진을 확인하고 필요한 경우 압축하는 중입니다.'));
}
assert(accidents.includes("photo.compressed?' · 압축됨':''"));
for (const source of [handover, accidents]) assert(source.includes('PDF는 파일당 3MB 이하'));
console.log('PASS: handover/accident image and PDF compression wiring (static).');
