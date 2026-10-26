export function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}
export function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function identifier(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_.:-]{1,120}$/.test(value);
}
export function boundedArray(value, name, limit=10000) {
  requireValue(Array.isArray(value) && value.length<=limit, `${name} must be an array of at most ${limit} entries`);
}
export function finite(value) { return typeof value==='number' && Number.isFinite(value); }
export function canonical(value) {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (record(value)) return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  requireValue(value!==undefined && (typeof value!=='number' || Number.isFinite(value)), 'JSON value required');
  return JSON.stringify(value);
}
export function timestamp(value) {
  requireValue(typeof value==='string', 'ISO timestamp required');
  const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  requireValue(m, 'timestamp must include seconds and an explicit UTC offset');
  const [,ys,ms,ds,hs,mins,ss,offset]=m;
  const [y,month,day,h,min,s]=[ys,ms,ds,hs,mins,ss].map(Number);
  const leap=y%4===0 && (y%100!==0 || y%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  requireValue(month>=1 && month<=12 && day>=1 && day<=days[month-1] && h<24 && min<60 && s<60,'invalid calendar timestamp');
  if (offset!=='Z') requireValue(Number(offset.slice(1,3))<=23 && Number(offset.slice(4))<=59,'invalid UTC offset');
  const result=Date.parse(value);
  requireValue(Number.isFinite(result), 'invalid timestamp');
  return result;
}
