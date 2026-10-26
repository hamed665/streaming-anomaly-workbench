import {requireValue,record,identifier,boundedArray,finite,canonical} from './validation.mjs';

export class OnlineBaseline {
  constructor() {this.n=0;this.mean=0;this.m2=0;}
  update(value) {
    requireValue(finite(value),'finite observation required');
    const n=this.n+1,delta=value-this.mean,mean=this.mean+delta/n,m2=this.m2+delta*(value-mean);
    requireValue(finite(mean)&&finite(m2),'numeric range exceeded');
    this.n=n;this.mean=mean;this.m2=Math.max(0,m2);
  }
  get stddev() {return this.n>1?Math.sqrt(this.m2/(this.n-1)):0;}
}
export function replay(events,{lateness=2,warmup=4,threshold=3}={}) {
  boundedArray(events,'events');
  requireValue(finite(lateness)&&lateness>=0 && Number.isInteger(warmup)&&warmup>=2 && finite(threshold)&&threshold>0,'invalid detector settings');
  const baselines=new Map(),seen=new Map(),pending=[],rows=[];
  let maximum=-Infinity,watermark=-Infinity;
  function process(event) {
    const baseline=baselines.get(event.key)||new OnlineBaseline();baselines.set(event.key,baseline);
    const before=baseline.n;
    let score=null,status='learning';
    if(before>=warmup) {
      const distance=Math.abs(event.value-baseline.mean),sd=baseline.stddev;
      score=sd===0?(distance===0?0:Infinity):distance/sd;
      status=score>threshold?'anomaly':'normal';
    }
    rows.push({...event,status,baseline_count:before,baseline_mean:before?baseline.mean:null,z_score:score===Infinity?'unbounded':score});
    if(status!=='anomaly') baseline.update(event.value);
  }
  function drain(until) {
    pending.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id,'en'));
    while(pending.length&&pending[0].time<=until) process(pending.shift());
  }
  for(const event of events) {
    requireValue(record(event)&&identifier(event.id)&&identifier(event.key)&&finite(event.time)&&finite(event.value)&&Math.abs(event.value)<=1e100,'invalid stream event');
    const signature=canonical(event);
    if(seen.has(event.id)) {requireValue(seen.get(event.id)===signature,'event id reused with different payload');continue;}
    seen.set(event.id,signature);
    if(event.time<watermark) {rows.push({...event,status:'late',baseline_count:null,baseline_mean:null,z_score:null});continue;}
    maximum=Math.max(maximum,event.time);watermark=maximum-lateness;
    pending.push({...event});drain(watermark);
  }
  drain(Infinity);
  return {rows,watermark:finite(watermark)?watermark:null,baselines:Object.fromEntries([...baselines].map(([key,b])=>[key,{count:b.n,mean:b.mean,stddev:b.stddev}]))};
}
export function analyze(input) {
  requireValue(record(input),'object input required');
  const report=replay(input.events,input.settings);
  return {summary:[{label:'Unique events',value:report.rows.length},{label:'Anomalies',value:report.rows.filter(r=>r.status==='anomaly').length},{label:'Late arrivals',value:report.rows.filter(r=>r.status==='late').length}],
    note:'Event-time order uses a watermark. Anomalies and late arrivals do not update the cumulative baseline. End-of-input flushes buffered events.',
    columns:['id','key','time','value','status','baseline_count','baseline_mean','z_score'],...report};
}
