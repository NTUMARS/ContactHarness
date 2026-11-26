/* Presentation only. Trial selection, media clocks and research data stay in their existing controllers. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const toggle=document.querySelector('.theme-toggle');
 function updateTheme(theme,persist=false){
  root.dataset.theme=theme==='dark'?'dark':'light';
  const dark=root.dataset.theme==='dark';
  if(toggle){const label=dark?'Switch to light appearance':'Switch to dark appearance';toggle.setAttribute('aria-label',label);toggle.title=label;toggle.setAttribute('aria-pressed',String(dark));}
  if(persist)try{localStorage.setItem('contact-harness-theme',root.dataset.theme);}catch{}
 }
 updateTheme(root.dataset.theme);
 toggle?.addEventListener('click',()=>updateTheme(root.dataset.theme==='dark'?'light':'dark',true));
 addEventListener('storage',event=>{if(event.key==='contact-harness-theme')updateTheme(event.newValue);});

 let lastY=scrollY,lastTime=performance.now(),fastUntil=0;
 addEventListener('scroll',()=>{const now=performance.now(),delta=Math.abs(scrollY-lastY);if(delta>Math.max(420,innerHeight*.65))fastUntil=now+220;lastY=scrollY;lastTime=now;},{passive:true});
 const instant=()=>reduced.matches||performance.now()<fastUntil;
 const pending=new Set();
 const counters=new Map();
 const frames=new Set();
 let observer,exitObserver,printing=false;
 const pinned=new WeakSet();
 function finishCounter(element){const state=counters.get(element);if(!state||state.finished)return;state.finished=true;if(state.frame){cancelAnimationFrame(state.frame);frames.delete(state.frame);}state.visual.textContent=String(state.value);}
 function count(element,immediate=false){
  const state=counters.get(element);if(!state||state.started)return;state.started=true;
  if(immediate||reduced.matches){finishCounter(element);return;}
  const start=performance.now(),duration=state.value<10?350:800;
  function frame(now){frames.delete(state.frame);const progress=Math.min(1,(now-start)/duration);state.visual.textContent=String(Math.round(1+(state.value-1)*(1-Math.pow(1-progress,3))));if(progress<1&&!reduced.matches&&!state.finished){state.frame=requestAnimationFrame(frame);frames.add(state.frame);}else finishCounter(element);}
  state.visual.textContent='1';state.frame=requestAnimationFrame(frame);frames.add(state.frame);
 }
 function reveal(element,immediate=false){
  if(!pending.has(element))return;
  pending.delete(element);
  element.classList.toggle('reveal-immediate',immediate);
  element.classList.remove('is-waiting');element.classList.add('is-revealed');
  for(const [counter] of counters)if(counter===element||element.contains(counter))count(counter,immediate);
 }
 function arm(element){
  if(reduced.matches||printing||pinned.has(element)||element.contains(document.activeElement)||pending.has(element))return;
  element.classList.remove('is-revealed','reveal-immediate');element.classList.add('is-waiting');pending.add(element);
 }
 function revealTarget(target){
  if(!target)return;
  for(const item of targets)if(item===target||item.contains(target)||target.contains(item)){const rect=item.getBoundingClientRect();if(rect.bottom < -45||rect.top > innerHeight+45)pinned.add(item);reveal(item,true);}
  for(const [counter] of counters)if(counter===target||target.contains(counter))count(counter,true);
 }
 function registerCounter(element){
  const value=Number(element.textContent.trim());if(!Number.isFinite(value)||value<2)return;
  const visual=document.createElement('span');visual.className='counter-value';visual.setAttribute('aria-hidden','true');visual.textContent=String(value);
  element.setAttribute('aria-label',String(value));element.append(visual);element.firstChild.remove();visual.style.setProperty('--counter-width',visual.getBoundingClientRect().width+'px');
  counters.set(element,{value,visual,started:false,finished:false,frame:0});
 }
 document.querySelectorAll('.real-scope dd').forEach(registerCounter);
 const connectorTitle=document.querySelector('#connector-collection h2');
 if(connectorTitle&&connectorTitle.firstChild?.nodeType===Node.TEXT_NODE){
  const node=connectorTitle.firstChild,match=node.textContent.match(/^(\s*)(15)(\s+connectors\.)/);
  if(match){const number=document.createElement('span');number.textContent=match[2];node.textContent=node.textContent.slice(match[1].length+match[2].length);connectorTitle.insertBefore(number,node);registerCounter(number);}
 }
 // Small sibling sets stagger by at most 120 ms. Never animate media or diagram internals.
 const selectors=['.chapter-heading','.section-heading','.real-scope > div','.benchmark-intro','.benchmark-group-label','.benchmark-task','.benchmark-foot','.method-chapter .wrap','.real-results-group','.simulation-panel','.connectors-panel','.results-chart-card','.paper-ending .wrap'];
 const targets=[...document.querySelectorAll(selectors.join(','))].filter((el,i,all)=>!all.some(parent=>parent!==el&&parent.contains(el)));
 if('IntersectionObserver' in window){
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){pinned.delete(entry.target);reveal(entry.target,instant());}}),{threshold:0,rootMargin:'45px 0px 45px 0px'});
  // Rearm only well outside the viewport so edges do not blink on small scrolls.
  exitObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)arm(entry.target);}),{threshold:0,rootMargin:'160px 0px 160px 0px'});
  const siblingCounts=new Map();
  targets.forEach(element=>{
   const box=element.getBoundingClientRect();
   const index=siblingCounts.get(element.parentElement)||0;siblingCounts.set(element.parentElement,index+1);
   element.style.setProperty('--reveal-delay',Math.min(index,2)*60+'ms');
   element.classList.add('presentation-reveal');
   if(reduced.matches||(box.bottom>0&&box.top<innerHeight)){element.classList.add('is-revealed');for(const [counter]of counters)if(element.contains(counter))count(counter,true);}
   else arm(element);
   observer.observe(element);exitObserver.observe(element);
  });
  // Counters without a reveal wrapper still enter once.
  const countObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){count(entry.target,instant());countObserver.unobserve(entry.target);}}),{threshold:.1});
  for(const [counter]of counters)countObserver.observe(counter);
 }else for(const [counter]of counters)count(counter,true);
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link)return;
  const url=new URL(link.href,location.href);if(url.origin!==location.origin||url.pathname!==location.pathname)return;
  if(url.hash){try{revealTarget(document.getElementById(decodeURIComponent(url.hash.slice(1))));}catch{}}
 });
 addEventListener('hashchange',()=>{try{revealTarget(document.getElementById(decodeURIComponent(location.hash.slice(1))));}catch{}});
 document.addEventListener('focusin',event=>revealTarget(event.target));
 if(location.hash)try{revealTarget(document.getElementById(decodeURIComponent(location.hash.slice(1))));}catch{}
 reduced.addEventListener('change',()=>{if(reduced.matches){for(const element of [...pending])reveal(element,true);for(const [counter]of counters)finishCounter(counter);}});
 addEventListener('beforeprint',()=>{printing=true;for(const element of [...pending])reveal(element,true);for(const [counter]of counters)finishCounter(counter);});
 addEventListener('afterprint',()=>{printing=false;for(const element of targets){const rect=element.getBoundingClientRect();if(rect.bottom < -160||rect.top > innerHeight+160)arm(element);}});
 addEventListener('pageshow',event=>{if(event.persisted)for(const element of [...pending]){const rect=element.getBoundingClientRect();if(rect.top<innerHeight&&rect.bottom>0)reveal(element,true);}});

 // Move the selected background, leaving the buttons and their handlers intact.
 document.querySelectorAll('.platform-tabs').forEach(tabs=>{
  function place(){const selected=tabs.querySelector('button.selected');if(!selected)return;tabs.style.setProperty('--pill-x',selected.offsetLeft+'px');tabs.style.setProperty('--pill-y',selected.offsetTop+'px');tabs.style.setProperty('--pill-width',selected.offsetWidth+'px');tabs.style.setProperty('--pill-height',selected.offsetHeight+'px');if(!tabs.classList.contains('pill-ready'))tabs.classList.add('pill-ready');}
  tabs.style.position='relative';place();
  new ResizeObserver(place).observe(tabs);
  new MutationObserver(place).observe(tabs,{subtree:true,attributes:true,attributeFilter:['class']});
  tabs.addEventListener('click',event=>{if(!event.target.closest('button'))return;requestAnimationFrame(()=>{place();const menu=document.querySelector('#task-menu');if(menu&&!reduced.matches)menu.animate([{opacity:.65},{opacity:1}],{duration:140,easing:'ease-out'});});});
 });
 // Only homepage chapter links gain a scroll position indicator.
 const links=[...document.querySelectorAll('.nav nav a[href^="#"]')];
 if(links.length){
  const groups=new Map([['#real-experiments',['real-experiments','experiments']],['#benchmark',['benchmark']],['#research-overview',['research-overview','method','experimental-overview']],['#results',['results','full-results-section']]]);
  let queued=false;
  function mark(){queued=false;let current=null;for(const link of links){for(const id of groups.get(link.getAttribute('href'))||[]){const element=document.getElementById(id);if(!element)continue;const rect=element.getBoundingClientRect();if(rect.top<innerHeight*.45&&rect.bottom>140)current=link;}}for(const link of links){if(link===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(mark);}},{passive:true});mark();
 }
})();
