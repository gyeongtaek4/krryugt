const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/js/handover.js','utf8');
const start=source.indexOf('function validateHandoverPhotos('),end=source.indexOf('\nfunction handoverGallery',start);
const context=vm.createContext({});
vm.runInContext(source.slice(start,end),context);
context.photos=[{name:'anonymous.png',size:3,data:'data:image/png;base64,YWJj'}];
vm.runInContext('validateHandoverPhotos(photos)',context);
for(const photos of [[],Array(9).fill(context.photos[0]),[{...context.photos[0],size:6*1024*1024}],[{...context.photos[0],data:'data:image/svg+xml;base64,YWJj'}]]) {
  context.invalid=photos;assert.throws(()=>vm.runInContext('validateHandoverPhotos(invalid)',context));
}
assert(source.includes('Object.fromEntries'));
assert(source.includes('fleet-handover-v1'));
console.log('PASS: photo type/count/size constraints and archive format (mock, no image decode or browser upload).');
