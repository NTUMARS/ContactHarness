/* Manuscript tables are the single source for all chart values. */
(()=>{
 const configs=[
  // Shared appendix S2 blue, pale yellow, teal and pink palette.
  {id:'simulation-results-table',title:'Simulation comparison',context:'Six tasks, 10 trials per task. VLM-based baselines use GPT-6 Astra.',tasks:['Place','Stack','Insert','Wipe','Write','Pivot'],metrics:[['Success','%',6]],order:[10,11,12,0,1,2,3,4,9,7,6,5,8],selected:[10,7,3,0],colors:['#e4a6bf','#d58eae','#edc0d2','#94ceca','#73b8b7','#c3dcda','#e9c76b','#eddb88','#f3e6ad','#cea3bf','#82a9dc','#6594cf','#afc7e7']},

 ];
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 configs.forEach(c=>{
  const table=document.getElementById(c.id);if(!table)return;
  const rows=[...table.querySelectorAll('.data-row')].map((r,i)=>({index:i,name:r.querySelector('th').textContent,values:[...r.querySelectorAll('td')].map(x=>x.textContent),trained:r.parentElement.getAttribute('aria-label')==='Training-based policies',ours:r.classList.contains('our-results')||r.parentElement.classList.contains('our-results'),color:c.colors[i]}));
  const source=table.parentElement,note=source.nextElementSibling,section=el('section','results-chart-card');source.before(section);
  section.classList.add(c.id.startsWith('ablation')?'ablation-chart':'comparison-chart');
  section.style.setProperty('--chart-accent','#647fa8');
  const header=el('div','chart-heading'),heading=el('h3','',c.title),mode=el('div','chart-mode');heading.id=c.id+'-heading';section.setAttribute('aria-labelledby',heading.id);header.append(heading,mode);section.append(header,el('p','chart-context',c.context));
  const panel=el('div','chart-panel'),toolbar=el('div','chart-toolbar'),metrics=el('div','chart-metrics'),grouping=el('div','chart-grouping');metrics.setAttribute('role','group');metrics.setAttribute('aria-label','Metric');toolbar.append(metrics,grouping);panel.append(toolbar);
  const legend=el('div','chart-legend'+(rows.length>6?' many-methods':''));legend.setAttribute('role','group');legend.setAttribute('aria-label','Methods to compare');panel.append(legend);
  if(rows.length>6){const toggle=el('button','methods-disclosure','Choose methods');toggle.type='button';toggle.setAttribute('aria-expanded','false');legend.id=c.id+'-legend';toggle.setAttribute('aria-controls',legend.id);legend.before(toggle);toggle.addEventListener('click',()=>{const expanded=legend.classList.toggle('expanded');toggle.setAttribute('aria-expanded',expanded);toggle.textContent=expanded?'Done':'Choose methods';});}
  const scroll=el('div','chart-scroll'),plot=el('div','column-chart'),foot=el('p','chart-footnote');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',c.title+' chart');scroll.append(plot);panel.append(scroll,foot);section.append(panel,source,note);
  const pan=el('div','chart-pan'),panControls=el('div','chart-pan-controls'),left=el('button','','←'),right=el('button','','→');pan.append(el('span','','Swipe to compare'),panControls);panControls.append(left,right);scroll.before(pan);scroll.id=c.id+'-scroll';
  [[left,-1,'Scroll chart left'],[right,1,'Scroll chart right']].forEach(([button,direction,label])=>{button.type='button';button.setAttribute('aria-label',label);button.setAttribute('aria-controls',scroll.id);button.addEventListener('click',()=>scroll.scrollBy({left:direction*Math.max(180,scroll.clientWidth*.8),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));});
  function updatePan(){const limit=scroll.scrollWidth-scroll.clientWidth;pan.hidden=limit<=1;left.disabled=scroll.scrollLeft<=1;right.disabled=scroll.scrollLeft>=limit-1;}
  scroll.addEventListener('scroll',updatePan,{passive:true});const panObserver=new ResizeObserver(updatePan);panObserver.observe(scroll);panObserver.observe(plot);
  const tooltip=el('div','chart-tooltip');tooltip.hidden=true;tooltip.setAttribute('role','tooltip');tooltip.id=c.id+'-tooltip';panel.append(tooltip);
  const tablePanel=el('div','table-panel'),tableToolbar=el('div','chart-toolbar'),tableGrouping=el('div','chart-grouping'),tableTasks=el('div','table-task-buttons'),tableView=el('div','data-table-scroll');
  tableGrouping.setAttribute('role','group');tableGrouping.setAttribute('aria-label','Table grouping');tableTasks.setAttribute('role','group');tableTasks.setAttribute('aria-label','Table task');
  tableToolbar.append(tableGrouping);tablePanel.append(tableToolbar,tableTasks,tableView);section.insertBefore(tablePanel,source);
  let tableMode=0,tableTask=0;
  let selected=new Set(c.selected),metricIndex=0,byTask=true;
  function controls(container,labels,chosen,change){container.replaceChildren();labels.forEach((label,i)=>{const b=el('button','',label);b.type='button';b.setAttribute('aria-pressed',i===chosen);b.addEventListener('click',()=>{change(i);container.children[i]?.focus({preventScroll:true});});container.append(b);});}
  function drawLegend(){
   legend.replaceChildren();
   const grouped=rows.some(r=>r.trained);
   const sets=grouped?[
    ['Training-free',c.order.filter(i=>!rows[i].trained)],
    ['Training-based',c.order.filter(i=>rows[i].trained)]
   ]:[['',c.order]];
   sets.forEach(([name,indices])=>{
    const group=el('div','legend-group'),keys=el('div','legend-keys');
    if(name){group.setAttribute('role','group');group.setAttribute('aria-label',name);group.append(el('span','legend-group-title',name));}
    group.append(keys);legend.append(group);
    indices.forEach(i=>{const row=rows[i],b=el('button','method-key');b.type='button';b.dataset.method=i;b.style.setProperty('--series-color',row.color);b.setAttribute('aria-pressed',selected.has(i));b.setAttribute('aria-label',row.name+(row.trained?', trained policy':''));b.append(el('i','key-swatch'),el('span','',row.name));b.addEventListener('click',()=>{if(selected.has(i)){if(selected.size===1)return;selected.delete(i);}else selected.add(i);render();legend.querySelector('[data-method="'+i+'"]').focus({preventScroll:true});});keys.append(b);});
   });
  }
  function render(){
   tooltip.hidden=true;
   controls(metrics,c.metrics.map(m=>m[0]),metricIndex,i=>{metricIndex=i;render();});
   controls(grouping,['By task','Mean'],byTask?0:1,i=>{byTask=i===0;render();});grouping.hidden=metricIndex!==0;
   drawLegend();
   const active=c.order.filter(i=>selected.has(i)).map(i=>rows[i]),[metricName,unit,column]=c.metrics[metricIndex],grouped=metricIndex===0&&byTask;
   const items=grouped?c.tasks.map((name,t)=>({name,bars:active.map(r=>({...r,raw:r.values[t],value:parseFloat(r.values[t])*10}))})):active.map(r=>({name:r.name,bars:[{...r,raw:r.values[column],value:parseFloat(r.values[column])}]}));
   const max=unit==='%'?100:Math.max(1,...items.flatMap(g=>g.bars.map(r=>Number.isFinite(r.value)?r.value:0))),step=10**Math.floor(Math.log10(max)),ceiling=unit==='%'?100:Math.ceil(max/step)*step;
   plot.replaceChildren();plot.classList.toggle('is-grouped',grouped);plot.style.setProperty('--columns',items.length);plot.style.setProperty('--series',grouped?active.length:1);plot.style.setProperty('--plot-min',grouped?Math.max(580,items.length*(active.length*30+22)+38)+'px':Math.max(400,active.length*110+38)+'px');
   plot.append(el('div','chart-axis-title',metricName+(unit?' (%)'.replace('%',unit):'')));
   const ticks=el('div','chart-ticks');[1,.75,.5,.25,0].forEach(f=>ticks.append(el('span','',Number((ceiling*f).toFixed(2)).toString())));plot.append(ticks);
   const columns=el('div','chart-columns');items.forEach((g,gi)=>{
    const group=el('div','chart-column'),well=el('div','column-well');group.append(well);
    g.bars.forEach((r,ri)=>{
     const slot=el('div','bar-slot'),bar=el('button','column-bar'+(r.ours?' is-ours':'')),value=el('span','column-value');bar.type='button';bar.dataset.method=r.index;bar.dataset.task=grouped?g.name:'Mean';bar.style.setProperty('--series-color',r.color);bar.style.setProperty('--delay',(gi*35+ri*30)+'ms');
     const finite=Number.isFinite(r.value),display=finite?(grouped?r.value.toFixed(0):r.value.toFixed(Number.isInteger(r.value)?0:1)):'N/A';value.textContent=display;bar.dataset.value=finite?r.value:'N/A';bar.style.height=(finite?r.value/ceiling*100:0)+'%';bar.append(value);slot.append(bar);well.append(slot);
     const description=r.name+', '+(grouped?g.name:'Mean')+': '+display+(unit?' '+unit:'')+(r.raw.includes('/')?' ('+r.raw+' trials)':'')+(r.trained?', trained policy':'');bar.setAttribute('aria-label',description);
     function show(){tooltip.replaceChildren(el('strong','',r.name),el('span','',(grouped?g.name+'  ':metricName+'  ')+display+(unit?' '+unit:'')+(r.raw.includes('/')?'  ('+r.raw+' trials)':'')));if(r.trained)tooltip.append(el('small','','Trained policy'));tooltip.style.setProperty('--series-color',r.color);tooltip.hidden=false;bar.setAttribute('aria-describedby',tooltip.id);const base=panel.getBoundingClientRect(),box=bar.getBoundingClientRect();tooltip.style.left=Math.max(0,Math.min(panel.clientWidth-tooltip.offsetWidth,box.left-base.left+box.width/2-tooltip.offsetWidth/2))+'px';tooltip.style.top=Math.max(0,box.top-base.top-tooltip.offsetHeight-12)+'px';}
     function hide(){tooltip.hidden=true;bar.removeAttribute('aria-describedby');}
     bar.addEventListener('pointerenter',show);bar.addEventListener('focus',show);bar.addEventListener('pointerleave',()=>{if(document.activeElement!==bar)hide();});bar.addEventListener('blur',hide);bar.addEventListener('keydown',e=>{if(e.key==='Escape'){hide();bar.blur();}});
    });
    const label=el('div','column-label',g.name);if(!grouped&&g.bars[0].trained)label.append(el('small','trained-label','Trained'));group.append(label);columns.append(group);
   });plot.append(columns);
   foot.textContent=metricIndex===0?(grouped?'':'Success rate averaged over '+c.tasks.length+' tasks.'):
    metricName==='Force'?'Median across runs of peak contact force sustained for 0.2 s, averaged over tasks.':
    metricName==='Thinking time'?'Thinking time (%), averaged over tasks.':
    'Averaged over successful runs'+(c.id.startsWith('simulation')?', excluding Write':'')+', then averaged over tasks.';
   if(c.id.startsWith('ablation'))foot.textContent+=(foot.textContent?' ':'')+'Force-observation ablation hides wrench readings from the agent only. Compliance ablation also removes the soft force limit.';
   foot.hidden=!foot.textContent;
  }
  function renderTable(){
   controls(tableGrouping,['By task','Mean','Full table'],tableMode,i=>{tableMode=i;renderTable();});
   controls(tableTasks,['All tasks',...c.tasks],tableTask,i=>{tableTask=i;renderTable();});tableTasks.hidden=tableMode!==0;
   source.hidden=tablePanel.hidden||tableMode!==2;tableView.hidden=tableMode===2;
   if(tableMode===2){source.scrollLeft=0;return;}
   const t=el('table','research-table compact-results-table');t.id=c.id+'-filtered';t.append(el('caption','',tableMode===1?'Mean over tasks':tableTask===0?'Successes / 10 trials':c.tasks[tableTask-1]+' successes / 10 trials'));
   const head=el('thead'),hr=el('tr'),cols=tableMode===1?c.metrics.map(m=>m[2]):tableTask===0?c.tasks.map((_,i)=>i):[tableTask-1];
   const detailed=tableMode===0&&tableTask>0;
   const labels=detailed?['Successes / 10','Time (s)','Decisions','Force (N)']:tableMode===1?c.metrics.map(m=>m[0]+(m[1]?' ('+m[1]+')':'')):tableTask===0?c.tasks:['Successes / 10'];
   ['Method',...labels].forEach(label=>{const th=el('th','',label);th.scope='col';hr.append(th)});head.append(hr);t.append(head);
   const body=el('tbody');c.order.forEach(i=>{const r=rows[i],tr=el('tr',r.ours?'our-results':''),th=el('th','',r.name);th.scope='row';tr.append(th);(detailed?(window.CONTACT_HARNESS_TASK_METRICS?.[r.name]?.[c.tasks[tableTask-1]]||[r.values[tableTask-1],'—','—','—']):cols.map(col=>r.values[col])).forEach(value=>tr.append(el('td','',value)));body.append(tr)});t.append(body);tableView.replaceChildren(t);if(detailed)tableView.append(el('p','real-results-note','Time and decisions are means over successful runs; — indicates no successful run or an unreported value. Trained policies run Write to the 360-step limit before scoring. Table 4 excludes Write from cross-task time and decision means. Force: median sustained peak force.'));tableView.scrollLeft=0;
  }
  function setMode(index){controls(mode,['Chart','Table'],index,setMode);panel.hidden=index===1;tablePanel.hidden=index===0;source.hidden=true;note.hidden=index===0;if(index===1)renderTable();}
  render();setMode(0);
  const entryObserver=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)return;section.classList.add('chart-entered');entryObserver.disconnect();setTimeout(()=>section.classList.add('chart-settled'),350);},{threshold:0,rootMargin:'0px 0px 35px 0px'});entryObserver.observe(scroll);
  scroll.addEventListener('scroll',()=>tooltip.hidden=true,{passive:true});
 });
})();
