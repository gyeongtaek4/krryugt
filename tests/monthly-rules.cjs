const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('dist/js/app.js','utf8'),months=fs.readFileSync('dist/js/driving-months.js','utf8');
function fn(source,name){
  const marker=source.indexOf('function '+name+'(');assert(marker>=0);
  const start=source.slice(marker-6,marker)==='async '?marker-6:marker;
  const next=source.slice(marker+1).search(/\n(?:async )?function |\nwindow\./);
  const end=next<0?source.length:marker+1+next;
  return source.slice(start,end);
}
const row=(plate,km,date)=>({'차량번호':plate,'키로수':String(km),'운행년월일':date});
const org={'본부':'익명본부','부':'익명부','팀':'익명팀','차종':'테스트'};
const elements={};
const context=vm.createContext({drivingData:[],drivingArchive:{},drivingPageSize:20,
  normalizePlate:v=>v.replace(/\s/g,''),normalizeDrivingDate:v=>v,
  vehicleForPlate:()=>org,confirm:()=>true,
  document:{getElementById:id=>elements[id]||(elements[id]={})}});
vm.runInContext(['mileageNumber','distanceForItems','drivingRowMonth'].map(name=>fn(app,name)).join('\n'),context);
vm.runInContext(fn(months,'drivingMonthlyTotals')+'\n'+fn(months,'drivingPagination'),context);
vm.runInContext(fn(app,'latestConfirmedDrivingMonth')+'\n'+fn(app,'confirmedDrivingSummary'),context);
assert.equal(vm.runInContext('confirmedDrivingSummary().month',context),'');
const summaryRows = [1,2,3,4,5].map((n)=>({...row(`테스트${n}`,10,'2026-07-01'),_organization:{'본부':'본부A','부':n<4?'부A':'부B','팀':n<3?'팀1':n===3?'팀2':n===4?'팀1':'팀3'}}));
context.drivingArchive['2026-07']={rows:[...summaryRows,{...summaryRows[0],'차량번호':'테스트 1','키로수':'20'}],confirmedAt:'2026-08-01'};
const summary=vm.runInContext('confirmedDrivingSummary()',context);
assert.equal(summary.count,5);assert.equal(summary.headquarters,1);assert.equal(summary.divisions,2);assert.equal(summary.teams,4);assert.equal(summary.distance,70);
context.drivingArchive={};
context.drivingData=[row('12가 3456',20,'2026-08-01'),row('12가3456',30,'2026-08-01'),row('12가3456',40,'2026-08-02'),row('22가2222',10,'2026-08-01'),row('12가3456',80,'2026-09-01')];
const result=vm.runInContext("drivingMonthlyTotals('2026-08')",context);
assert.equal(result.length,2);assert.equal(result[0].distance,90);assert.equal(result[0].days.size,2);
context.drivingArchive['2026-08']={rows:context.drivingData.slice(0,3).map(row=>({...row,_organization:{...org,'팀':'확정 당시 팀'}})),confirmedAt:'2026-09-02'};
assert.equal(vm.runInContext("drivingMonthlyTotals('2026-08')[0].org['팀']",context),'확정 당시 팀');
assert.equal(vm.runInContext("drivingMonthlyTotals('2026-09')[0].distance",context),80);
vm.runInContext("drivingPagination('pager',21,1)",context);
assert(elements.pager.innerHTML.includes('1 / 2'));assert(elements.pager.innerHTML.includes('data-page-step="-1" disabled'));
vm.runInContext("drivingPagination('pager',21,2)",context);assert(elements.pager.innerHTML.includes('data-page-step="1" disabled'));
context.storeDrivingMonth=async(month,rows)=>{context.drivingData=context.drivingData.filter(row=>row['운행년월일'].slice(0,7)!==month).concat(rows);};
vm.runInContext(fn(app,'mergeDrivingRows'),context);
(async()=>{
  context.incoming=[row('12가3456',90,'2026-09-01')];
  await vm.runInContext('mergeDrivingRows(incoming)',context);
  await vm.runInContext('mergeDrivingRows(incoming)',context);
  assert.equal(vm.runInContext("drivingMonthlyTotals('2026-09')[0].distance",context),90);
  context.incoming=[row('12가3456',100,'2026-08-01')];
  await assert.rejects(vm.runInContext('mergeDrivingRows(incoming)',context));
  context.incoming=[row('12가3456',100,'2026-09-01'),row('12가3456',10,'2026-10-01')];
  await assert.rejects(vm.runInContext('mergeDrivingRows(incoming)',context));
  const before=JSON.stringify(context.drivingData);
  context.storeDrivingMonth=async()=>{throw Error('mock storage failure');};
  context.incoming=[row('12가3456',123,'2026-09-01')];
  await assert.rejects(vm.runInContext('mergeDrivingRows(incoming)',context));assert.equal(JSON.stringify(context.drivingData),before);
  assert(app.includes('const averages = months.map(() => average)'));
  console.log('PASS: monthly SUM, unique days, snapshot, pagination, reupload, confirmed lock, mixed month, storage failure (mock).');
})().catch(error=>{console.error(error);process.exitCode=1;});
