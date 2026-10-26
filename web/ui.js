const sample=__SAMPLE__;
const editor=document.getElementById('input');
const form=document.getElementById('form');
const feedback=document.getElementById('feedback');
let currentReport=null;
function element(tag,text,className) {
  const node=document.createElement(tag);
  if(text!==undefined) node.textContent=String(text);
  if(className) node.className=className;
  return node;
}
function display(value) {
  if(value===null||value===undefined) return '—';
  if(typeof value==='number'&&!Number.isInteger(value)) return Number(value.toFixed(4));
  if(typeof value==='object') return JSON.stringify(value);
  return value;
}
function render(report) {
  const stats=document.getElementById('stats');stats.replaceChildren();
  for(const metric of report.summary) {
    const box=element('div',undefined,'metric');box.append(element('span',metric.label),element('strong',metric.value));stats.append(box);
  }
  const table=document.getElementById('results');table.replaceChildren();
  if(!report.rows.length) table.append(element('p','No matching result rows. Inspect the complete report below.','empty'));
  else {
    const grid=element('table');const caption=element('caption','Analysis results');
    caption.style.position='absolute';caption.style.clipPath='inset(50%)';grid.append(caption);
    const head=element('thead'),headRow=element('tr');
    for(const name of report.columns) {const cell=element('th',name.replaceAll('_',' '));cell.scope='col';headRow.append(cell);}
    head.append(headRow);grid.append(head);const body=element('tbody');
    for(const row of report.rows.slice(0,500)) {
      const tr=element('tr');
      for(const key of report.columns) {
        const td=element('td');const value=display(row[key]);
        if(['status','state','code'].includes(key)) td.append(element('span',value,'status'));
        else td.textContent=String(value);
        tr.append(td);
      }
      body.append(tr);
    }
    grid.append(body);table.append(grid);
  }
  document.getElementById('note').textContent=report.note+(report.rows.length>500?' Table shows the first 500 rows; export contains all rows.':'');
  document.getElementById('raw').textContent=JSON.stringify(report,null,2);
  document.getElementById('rowcount').textContent=report.rows.length+' RESULT ROWS';
}
async function run() {
  const button=document.getElementById('run');button.disabled=true;form.setAttribute('aria-busy','true');
  feedback.className='';feedback.textContent='Analyzing input…';
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try {
    if(editor.value.length>2000000) throw new Error('Input exceeds the 2 MB demo limit');
    const report=analyze(JSON.parse(editor.value));currentReport=report;render(report);
    document.getElementById('export').disabled=false;feedback.textContent='Analysis complete. All processing stayed in this browser.';
  } catch(error) {
    currentReport=null;document.getElementById('export').disabled=true;
    document.getElementById('stats').replaceChildren();
    document.getElementById('results').replaceChildren(element('p','Input needs attention. Correct the issue and run again.','empty'));
    document.getElementById('raw').textContent='';document.getElementById('rowcount').textContent='NO CURRENT REPORT';document.getElementById('note').textContent='Previous results cleared because this analysis did not complete.';
    feedback.className='error';feedback.textContent=error.message;
  } finally {button.disabled=false;form.setAttribute('aria-busy','false');}
}
form.addEventListener('submit',event=>{event.preventDefault();run();});
document.getElementById('reset').addEventListener('click',()=>{editor.value=JSON.stringify(sample,null,2);run();});
document.getElementById('export').addEventListener('click',()=>{
  if(!currentReport) return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(currentReport,null,2)],{type:'application/json'}));
  const a=element('a');a.href=url;a.download='analysis-report.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
editor.value=JSON.stringify(sample,null,2);run();
