import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sample=JSON.parse(readFileSync(new URL('../examples/input.json',import.meta.url)));

import {OnlineBaseline,replay,analyze} from '../src/core.mjs';
test('Welford sample variance',()=>{
  const b=new OnlineBaseline(); [1,2,3].forEach(v=>b.update(v));assert.equal(b.mean,2);assert.equal(b.stddev,1);
});
test('spike is flagged',()=>assert.equal(analyze(sample).rows.find(r=>r.value===280).status,'anomaly'));
test('late events excluded',()=>{
  const report=analyze(sample);assert.equal(report.rows.find(r=>r.id==='e8').status,'late');
  assert.equal(report.baselines['checkout-latency'].count,8);
});
test('deduplicate identical events',()=>assert.equal(replay([sample.events[0],sample.events[0]]).rows.length,1));
test('changed duplicate fails',()=>assert.throws(()=>replay([sample.events[0],{...sample.events[0],value:2}]),/payload/));
test('zero variance anomaly remains serializable',()=>{
  const events=[1,1,1,1,100].map((value,time)=>({id:'e'+time,key:'k',time,value}));
  const r=replay(events,{lateness:0});assert.equal(r.rows[4].z_score,'unbounded');assert.doesNotThrow(()=>JSON.stringify(r));
});
test('separate key baselines',()=>{
  const r=replay([{id:'a',key:'a',time:0,value:1},{id:'b',key:'b',time:0,value:100}]);
  assert.equal(r.baselines.a.mean,1);assert.equal(r.baselines.b.mean,100);
});
test('nonfinite input rejected',()=>assert.throws(()=>replay([{id:'x',key:'a',time:0,value:NaN}])));
