(()=>{
 const atlas=document.querySelector('#connector-atlas');if(!atlas)return;
 atlas.innerHTML=connectors.map(([name,slug],i)=>`<a class="connector-tile" href="#real-experiments" data-atlas="${i}" aria-label="Explore ${name}"><img loading="lazy" decoding="async" src="assets/${slug}-video.jpg" alt="${name} insertion"><span class="tile-name">${name}</span><span class="tile-arrow" aria-hidden="true">↗</span></a>`).join('');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),demo=document.querySelector('#demo-video');
 document.querySelectorAll('.hero-title-depth').forEach(heroTitle=>{
  let titleVisible=true;
  const pauseTitle=()=>heroTitle.classList.toggle('title-light-paused',!titleVisible||document.hidden);
  new IntersectionObserver(([entry])=>{titleVisible=entry.isIntersecting;pauseTitle();}).observe(heroTitle);
  document.addEventListener('visibilitychange',pauseTitle);
 });
 const demoVersions={overview:{src:'media/videos/video-001.mp4?v=ff96f9b98c48',poster:'assets/overview-demo-cover.jpg?v=overview-labels-v4',label:'Contact Harness 5-min task parade'},original:{src:'media/videos/video-002.mp4?v=3f80be0f973b',poster:'assets/demo-cover-title.png',label:'Contact Harness Teaser'}};
 let selectedDemo='original';
 // Offscreen pauses may resume; a visitor's pause must not be overridden.
 // Keep the authored BGM audible and expose browser-blocked autoplay honestly.
 let demoVisible=false,demoPending=false,demoUserPaused=false,demoAutoPaused=false,demoGeneration=0;
 const demoPlayPrompt=document.createElement('button');
 demoPlayPrompt.type='button';demoPlayPrompt.className='demo-play-prompt';demoPlayPrompt.hidden=true;
 demoPlayPrompt.textContent='▶ Play with sound';
 function pauseDemoAutomatically(){
  if(demo&&!demo.paused){demoAutoPaused=true;demo.pause();}
 }
 function startDemo(explicit=false){
  if(!demo||demoPending||(!explicit&&(!demoVisible||demoUserPaused||demo.ended))||document.hidden)return;
  if(explicit)demoUserPaused=false;
  if(!demo.paused){demoPlayPrompt.hidden=true;return;}
  const generation=demoGeneration;demoPending=true;
  demo.play().then(()=>{if(generation===demoGeneration)demoPlayPrompt.hidden=true;}).catch(error=>{
   if(generation===demoGeneration&&error.name==='NotAllowedError')demoPlayPrompt.hidden=false;
  }).finally(()=>{if(generation===demoGeneration)demoPending=false;});
 }
 if(demo){
  demo.muted=false;demo.volume=1;
  demo.parentElement.append(demoPlayPrompt);
  demoPlayPrompt.addEventListener('click',()=>startDemo(true));
  demo.addEventListener('play',()=>{demoUserPaused=false;demoAutoPaused=false;demoPlayPrompt.hidden=true;});
  demo.addEventListener('pause',()=>{if(!demoAutoPaused&&!demo.ended)demoUserPaused=true;});
  new IntersectionObserver(([entry])=>{demoVisible=entry.isIntersecting&&entry.intersectionRatio>=.15;if(demoVisible)startDemo();else pauseDemoAutomatically();},{threshold:[0,.15]}).observe(demo);
  const retryDemoAfterGesture=event=>{
   if(!event.isTrusted||event.target===demo||event.target.closest?.('.demo-play-prompt,[data-demo-version],a[href="#demo-section"]'))return;
   startDemo();
  };
  document.addEventListener('pointerup',retryDemoAfterGesture,{passive:true});
  document.addEventListener('keydown',retryDemoAfterGesture);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseDemoAutomatically();else startDemo();});
  document.querySelectorAll('a[href="#demo-section"]').forEach(link=>link.addEventListener('click',event=>{
   event.preventDefault();demo.scrollIntoView({block:'center',behavior:reduced.matches?'instant':'smooth'});startDemo(true);
  }));
 }
 document.querySelectorAll('[data-demo-version]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.demoVersion;if(key===selectedDemo){startDemo(true);return;}
  pauseDemoAutomatically();demoGeneration++;demoPending=false;demoUserPaused=false;selectedDemo=key;const item=demoVersions[key];
  demo.src=item.src;demo.poster=item.poster;demo.setAttribute('aria-label',item.label);
  demo.querySelectorAll('track').forEach(track=>track.remove());
  if(key==='overview'){const track=document.createElement('track');track.kind='chapters';track.src='data/overview-chapters.vtt';track.srclang='en';track.label='Tasks';demo.append(track);}
  document.querySelectorAll('[data-demo-version]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const chapters=document.querySelector('.overview-chapters');if(chapters)chapters.hidden=key!=='overview';
  demo.load();startDemo(true);
 }));
 function openExperiment(taskIndex,connectorIndex){
  document.querySelector('[data-platform="all"]')?.click();
  document.querySelector(`#task-menu [data-task="${taskIndex}"]`)?.click();
  if(connectorIndex!==undefined)document.querySelector(`[data-connector="${connectorIndex}"]`)?.click();
  if(location.hash!=='#real-experiments')history.pushState(null,'','#real-experiments');
  document.querySelector('#real-experiments').scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});
 }
 document.querySelectorAll('[data-hero-task]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();openExperiment(Number(link.dataset.heroTask));}));
 atlas.addEventListener('click',e=>{const tile=e.target.closest('[data-atlas]');if(!tile)return;e.preventDefault();openExperiment(0,Number(tile.dataset.atlas));});
 document.querySelectorAll('[data-evidence-connector]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();openExperiment(0,Number(link.dataset.evidenceConnector));window.ContactHarnessMultiple?.setMode('single');window.ContactHarnessTrial.seekWhenReady(Number(link.dataset.trialTime));}));
 demo.addEventListener('play',()=>{demo.controls=true;});
 document.querySelectorAll('[data-overview-time]').forEach(button=>button.addEventListener('click',()=>{demo.currentTime=Number(button.dataset.overviewTime);demo.play().catch(()=>{});}));
 demo.addEventListener('click',()=>{if(!demo.controls)demo.play().catch(()=>{});});
 document.querySelectorAll('[data-demo-time]').forEach(card=>card.addEventListener('click',e=>{e.preventDefault();demo.currentTime=Number(card.dataset.demoTime);demo.play().catch(()=>{});document.querySelector('#demo').scrollIntoView({block:'center',behavior:reduced.matches?'instant':'smooth'});}));
 let atlasTimer,atlasVideo;
 function stopAtlas(){clearTimeout(atlasTimer);if(atlasVideo){atlasVideo.pause();atlasVideo.removeAttribute('src');atlasVideo.load();atlasVideo.remove();atlasVideo=null;}}
 function previewConnector(tile){
  stopAtlas();const item=window.CONTACT_HARNESS_MEDIA.real[connectors[Number(tile.dataset.atlas)][1]];if(!item||reduced.matches)return;
  atlasTimer=setTimeout(()=>{atlasVideo=document.createElement('video');atlasVideo.muted=true;atlasVideo.loop=true;atlasVideo.playsInline=true;atlasVideo.setAttribute('aria-hidden','true');atlasVideo.src=item.fastSrc||item.src;atlasVideo.playbackRate=15/(item.fastSrc?(item.fastEncodedSpeed||15):(item.encodedSpeed||1));tile.append(atlasVideo);atlasVideo.play().catch(()=>{});},350);
 }
 atlas.querySelectorAll('.connector-tile').forEach(tile=>{tile.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')previewConnector(tile);});tile.addEventListener('pointerleave',stopAtlas);tile.addEventListener('focus',()=>previewConnector(tile));tile.addEventListener('blur',stopAtlas);tile.addEventListener('click',stopAtlas);});
 const track=document.querySelector('#task-carousel-track'),chapter=document.querySelector('#task-showcase');
 track.addEventListener('click',e=>{const card=e.target.closest('[data-experiment]');if(!card)return;e.preventDefault();openExperiment(Number(card.dataset.experiment));});
 const cards=[...track.querySelectorAll('.motion-card')],videos=cards.map(c=>c.querySelector('video'));
 cards.forEach((c,i)=>c.dataset.realIndex=i);
 const before=cards.at(-1).cloneNode(true),after=cards[0].cloneNode(true);
 for(const c of [before,after]){c.setAttribute('aria-hidden','true');c.querySelectorAll('a').forEach(a=>a.tabIndex=-1);c.classList.add('clone');}
 track.prepend(before);track.append(after);
 const allCards=[...track.querySelectorAll('.motion-card')];
 const target=c=>track.scrollLeft+c.getBoundingClientRect().left-track.getBoundingClientRect().left-(track.clientWidth-c.getBoundingClientRect().width)/2;
 const dots=document.querySelector('#carousel-dots');
 let index=0,elapsed=0,previous=performance.now(),inView=false,hover=false,focused=false;
 let rotationPaused=reduced.matches,mediaPaused=reduced.matches,scrollTimer;const interval=7000;
 dots.innerHTML=cards.map((c,i)=>`<button class="carousel-dot" data-slide="${i}" aria-label="Show ${c.querySelector('h3').textContent}" aria-pressed="${i===0}"><span></span></button>`).join('');
 function refresh(){
  cards.forEach((c,i)=>c.classList.toggle('active',i===index));
  dots.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===index));b.style.setProperty('--progress',i===index?elapsed/interval:0);});
  chapter.dataset.slide=String(index);
  videos.forEach((v,i)=>{if(!v)return;if(i===index&&inView&&!document.hidden&&!mediaPaused&&!reduced.matches){if(!v.src)v.src=v.dataset.src;v.play().catch(()=>{});}else v.pause();});
 }
 function manualPause(){elapsed=0;refresh();}
 function go(next,manual=true){
  const last=index;index=(next+cards.length)%cards.length;elapsed=0;
  const destination=last===cards.length-1&&next===cards.length?after:last===0&&next===-1?before:cards[index];
  track.scrollTo({left:target(destination),behavior:reduced.matches?'instant':'smooth'});refresh();
 }
 dots.addEventListener('click',e=>{const b=e.target.closest('[data-slide]');if(b)go(Number(b.dataset.slide));});
 document.querySelector('#carousel-prev').addEventListener('click',()=>go(index-1));document.querySelector('#carousel-next').addEventListener('click',()=>go(index+1));
 track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1));}});
 track.addEventListener('pointerdown',manualPause,{passive:true});track.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY))manualPause();},{passive:true});
 chapter.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover=true;});chapter.addEventListener('pointerleave',()=>{hover=false;});
 chapter.addEventListener('focusin',()=>{focused=true;});chapter.addEventListener('focusout',()=>{setTimeout(()=>{focused=chapter.contains(document.activeElement);},0);});
 track.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{const nearest=allCards.reduce((a,c)=>Math.abs(target(c)-track.scrollLeft)<Math.abs(target(a)-track.scrollLeft)?c:a,allCards[0]);const next=Number(nearest.dataset.realIndex);if(next!==index){index=next;elapsed=0;refresh();}if(nearest.classList.contains('clone'))track.scrollTo({left:target(cards[index]),behavior:'instant'});},180);},{passive:true});
 new IntersectionObserver(entries=>{inView=entries[0].intersectionRatio>=.25;refresh();},{threshold:[0,.25]}).observe(track);
 function frame(now){const dt=Math.min(now-previous,100);previous=now;if(inView&&!document.hidden&&!rotationPaused&&!hover&&!focused&&!reduced.matches){elapsed+=dt;dots.children[index].style.setProperty('--progress',Math.min(1,elapsed/interval));if(elapsed>=interval)go(index+1,false);}requestAnimationFrame(frame);}
 requestAnimationFrame(()=>{track.scrollTo({left:target(cards[0]),behavior:'instant'});requestAnimationFrame(frame);});refresh();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAtlas();refresh();});reduced.addEventListener('change',()=>{rotationPaused=reduced.matches;mediaPaused=reduced.matches;stopAtlas();refresh();});
 new ResizeObserver(()=>{clearTimeout(scrollTimer);track.scrollTo({left:target(cards[index]),behavior:'instant'});}).observe(track);
 document.fonts.ready.then(()=>track.scrollTo({left:target(cards[index]),behavior:'instant'}));
 let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>track.scrollTo({left:target(cards[index]),behavior:'instant'}),150);});
})();
