const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/js/app.js','utf8');
function fn(name){const start=source.indexOf('function '+name+'(');assert(start>=0,name);let next=source.indexOf('\nfunction ',start+1);return source.slice(start,next<0?source.length:next);}
const context=vm.createContext({drivingData:[],drivingArchive:{},normalizePlate:v=>v.replace(/\s/g,''),normalizeDrivingDate:v=>v});
vm.runInContext(['mileageNumber','distanceForItems','drivingRowMonth','mergeDrivingRows'].map(fn).join('\n'),context);
const row=(month,km,date='01')=>({'차량번호':'12가 3456','키로수':String(km),'운행년월일':`${month}-${date}`});
context.incoming=[row('2026-08',1000),row('2026-09',500)];
assert.equal(vm.runInContext('mergeDrivingRows(incoming).added',context),2);
assert.equal(vm.runInContext('distanceForItems([{row:drivingData[0]}])',context),1000);
context.incoming=[row('2026-08',1000,'31')];assert.equal(vm.runInContext('mergeDrivingRows(incoming).duplicate',context),1);
context.incoming=[row('2026-08',1100)];assert.throws(()=>vm.runInContext('mergeDrivingRows(incoming)',context));assert.equal(context.drivingData.length,2);
context.drivingArchive['2026-08']={};assert.equal(vm.runInContext('mergeDrivingRows(incoming).locked',context),1);
assert(source.includes('const averages = months.map(() => average)'));
assert(source.includes("format:'fleet-driving-monthly-v2'"));assert(source.includes("data.format==='fleet-driving-archive-v1'"));
console.log('PASS: monthly mileage, two months, duplicate/conflict, confirmed lock, fixed average, archive format guard');
