/* Independent recordings share a playback rate, never a rescaled completion time. */
(()=>{
 const section=document.querySelector('#real-experiments');if(!section)return;
 const panel=document.querySelector('#multiple-trials'),grid=panel.querySelector('.multiple-grid');
 const title=panel.querySelector('h3'),count=panel.querySelector('.multiple-count');
 const play=panel.querySelector('[data-multi-play]'),restart=panel.querySelector('[data-multi-restart]'),rate=panel.querySelector('[data-multi-rate]');
 const status=panel.querySelector('.multiple-status'),modes=section.querySelectorAll('[data-trial-mode]');
 new MutationObserver(()=>{status.dataset.loading=String(/^(Loading|Streaming)/.test(status.textContent));}).observe(status,{childList:true,characterData:true,subtree:true});
 const single=document.querySelector('#trial-video'),dialog=document.querySelector('#trial-focus-dialog');
 const focusVideo=dialog.querySelector('video'),focusTitle=dialog.querySelector('h3');
 const focusSpeedLabel=document.createElement('label');focusSpeedLabel.className='focus-speed';focusSpeedLabel.textContent='Speed ';
 const focusRate=document.createElement('select');focusRate.setAttribute('aria-label','Individual trial playback speed');focusRate.innerHTML=[1,2,4].map(n=>`<option value="${n}">${n}×</option>`).join('');focusSpeedLabel.append(focusRate);dialog.querySelector('.trial-focus-header').insertBefore(focusSpeedLabel,dialog.querySelector('button'));
 focusRate.addEventListener('change',()=>{focusVideo.playbackRate=Number(focusRate.value);});
 let mode='multiple',selection=null,entries=[],generation=0,intent=false,focusItem=null,playAttempt=0,focusVersion=0;
 const fmt=t=>{t=Math.max(0,Number(t)||0);return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;};
 const encoding=item=>Number(rate.value)<8&&item.realtimeSrc?1:(item.encodedSpeed||1);
 const source=item=>Number(rate.value)<8&&item.realtimeSrc?item.realtimeSrc:item.src;
 function setButton(){play.textContent=intent?'Pause all':'Play all';play.setAttribute('aria-label',intent?'Pause all trials':'Play all trials');}
 function pause(){intent=false;playAttempt++;entries.forEach(e=>e.video.pause());setButton();}
 function release(){pause();generation++;rate.disabled=false;entries.forEach(e=>{e.fetchController?.abort();e.video.removeAttribute('src');e.video.load();if(e.bufferUrl)URL.revokeObjectURL(e.bufferUrl);});entries=[];grid.replaceChildren();}
 function speed(item){return Number(rate.value)/encoding(item);}
 function ready(video,event='loadedmetadata'){return new Promise((resolve,reject)=>{if(event==='loadedmetadata'&&video.readyState>=1){resolve();return;}const done=()=>{clearTimeout(timer);video.removeEventListener(event,done);video.removeEventListener('error',fail);resolve();},fail=()=>{clearTimeout(timer);video.removeEventListener(event,done);video.removeEventListener('error',fail);reject(Error('Video unavailable'));};const timer=setTimeout(fail,30000);video.addEventListener(event,done,{once:true});video.addEventListener('error',fail,{once:true});});}
 async function bufferFastRecording(e,token){
  if(e.encoding===1||e.bufferUrl||e.failed)return;
  if(e.bufferPromise)return e.bufferPromise;
  const version=e.sourceVersion;
  // Buffer all six small fast derivatives equally; no special first-tile path.
  e.fetchController=new AbortController();
  e.bufferPromise=(async()=>{
   try{
    const response=await fetch(e.activeSource,{signal:e.fetchController.signal});
    if(!response.ok)throw new Error('Video buffer request failed');
    const blob=await response.blob();if(token!==generation||version!==e.sourceVersion)return;
    const time=e.video.currentTime;e.bufferUrl=URL.createObjectURL(blob);
    e.video.src=e.bufferUrl;e.video.playbackRate=speed(e.item);
    await ready(e.video);if(token===generation&&version===e.sourceVersion)e.video.currentTime=Math.min(time,Math.max(0,e.video.duration-.05));
   }catch(error){if(error.name!=='AbortError'&&token===generation&&version===e.sourceVersion)status.textContent='Streaming video. Loading may take a moment.';}
  })();
  const promise=e.bufferPromise;await promise;if(e.bufferPromise===promise)e.bufferPromise=null;
 }
 async function playAll(){
  if(mode!=='multiple'||document.hidden)return;
  window.ContactHarnessSimulation?.pauseAll();
  if(entries.every(e=>e.video.ended||e.failed)){entries.forEach(e=>{if(!e.failed){e.video.currentTime=0;e.state.textContent='';}});}
  const token=generation,attempt=++playAttempt;intent=true;setButton();status.textContent='';
  const available=entries.filter(e=>!e.failed&&!e.video.ended);
  if(!available.length){intent=false;setButton();return;}
  status.textContent='Loading videos…';
  await Promise.all(available.map(async e=>{
   await bufferFastRecording(e,token);
   return new Promise(resolve=>{
    if(e.video.readyState>=3||e.failed||token!==generation||attempt!==playAttempt){resolve();return;}
    const finish=()=>{clearTimeout(timer);e.video.removeEventListener('canplay',finish);e.video.removeEventListener('error',finish);resolve();};
    const timer=setTimeout(finish,12000);e.video.addEventListener('canplay',finish,{once:true});e.video.addEventListener('error',finish,{once:true});e.video.preload='auto';
   });
  }));
  if(token!==generation||attempt!==playAttempt)return;
  status.textContent='';
  const results=await Promise.allSettled(available.map(e=>{e.video.playbackRate=speed(e.item);return e.video.play();}));
  if(token!==generation||attempt!==playAttempt){if(token!==generation||!intent)available.forEach(e=>e.video.pause());return;}
  if(results.some(r=>r.status==='rejected')){pause();status.textContent='Playback paused. Press Play all to retry.';}
 }
 function build(){
  release();const token=generation;
  const items=window.CONTACT_HARNESS_MULTIPLE_TRIALS[selection.slug]||[];
  title.textContent=document.querySelector('#task-title').textContent;
  count.textContent=items.length===1?'Example trial':items.length+' trials';grid.classList.toggle('one-trial',items.length===1);
  status.textContent='';
  items.forEach(item=>{
   const tile=document.createElement('figure');tile.className='multiple-tile';tile.dataset.playing='false';
   const media=document.createElement('div');media.className='multiple-media';
   const button=document.createElement('button');button.type='button';button.className='multiple-focus';button.setAttribute('aria-label','View '+item.label+' individually');
   const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='metadata';video.poster=item.poster||'';video.setAttribute('aria-hidden','true');video.tabIndex=-1;video.src=source(item);video.dataset.source=video.src;
   const expand=document.createElement('span');expand.className='multiple-expand';expand.setAttribute('aria-hidden','true');expand.textContent='⤢';
   const toggle=document.createElement('button');toggle.type='button';toggle.className='multiple-toggle';
   const playIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3.5v13l10-6.5z"/></svg>';
   const pauseIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h4v14H4zm8 0h4v14h-4z"/></svg>';
   toggle.innerHTML=playIcon;toggle.setAttribute('aria-label','Play '+item.label);toggle.setAttribute('aria-pressed','false');
   const caption=document.createElement('figcaption'),label=document.createElement('span'),state=document.createElement('span');
   label.textContent=item.label;state.className='multiple-state';caption.append(label,state);button.append(expand);media.append(video,toggle,button);tile.append(media,caption);grid.append(tile);
   const entry={item,video,state,failed:false,encoding:encoding(item),activeSource:source(item),sourceVersion:0};entries.push(entry);
   const timeline=document.createElement('div');timeline.className='multiple-timeline';const seek=document.createElement('input');seek.type='range';seek.min='0';seek.max='1000';seek.step='1';seek.value='0';seek.setAttribute('aria-label','Position in '+item.label);const clock=document.createElement('time');timeline.append(seek,clock);tile.append(timeline);
   function updateClock(){const duration=item.sourceDuration||video.duration*entry.encoding||0,elapsed=Math.min(duration,video.currentTime*entry.encoding);clock.textContent=fmt(elapsed)+' / '+fmt(duration);seek.value=duration>0?elapsed/duration*1000:0;}
   ['loadedmetadata','timeupdate','seeked','ended'].forEach(event=>video.addEventListener(event,updateClock));updateClock();
   seek.addEventListener('input',()=>{if(Number.isFinite(video.duration))video.currentTime=Math.min(video.duration,(item.sourceDuration||video.duration*entry.encoding)*Number(seek.value)/1000/entry.encoding);});
   function syncPlayback(){
    if(token!==generation)return;const playing=!video.paused&&!video.ended;
    tile.dataset.playing=String(playing);toggle.innerHTML=playing?pauseIcon:playIcon;toggle.setAttribute('aria-label',(playing?'Pause ':video.ended?'Replay ':'Play ')+item.label);toggle.setAttribute('aria-pressed',String(playing));
    if(playing)state.textContent='';intent=entries.some(e=>!e.video.paused&&!e.video.ended);setButton();
   }
   ['play','pause','ended'].forEach(type=>video.addEventListener(type,syncPlayback));
   toggle.addEventListener('click',async()=>{
    if(entry.failed)return;const attempt=++playAttempt;status.textContent='';
    if(!video.paused){video.pause();return;}
    window.ContactHarnessSimulation?.pauseAll();
    if(video.ended)video.currentTime=0;video.playbackRate=speed(item);
    try{await bufferFastRecording(entry,token);if(token!==generation||attempt!==playAttempt)return;await video.play();if(token!==generation)video.pause();}catch{if(token===generation)status.textContent='Press play to retry this video.';}
   });
   video.addEventListener('loadedmetadata',()=>{if(token===generation)video.playbackRate=speed(item);});
   video.addEventListener('waiting',()=>{if(token===generation&&!video.paused)state.textContent='Loading…';});
   video.addEventListener('playing',()=>{if(token===generation)state.textContent='';});
   video.addEventListener('ended',()=>{if(token!==generation)return;state.textContent='Ended';if(entries.every(e=>e.failed||e.video.ended)){intent=false;setButton();}});
   video.addEventListener('error',()=>{if(token!==generation)return;entry.failed=true;toggle.disabled=true;button.disabled=true;state.textContent='Unavailable';status.textContent='A video could not load. Restart to retry.';if(entries.every(e=>e.failed||e.video.ended))pause();});
   button.addEventListener('click',()=>{
    if(entry.failed)return;const time=video.currentTime*entry.encoding,version=++focusVersion;pause();focusItem=item;focusTitle.textContent=title.textContent+' / '+item.label;
    focusRate.value='1';focusVideo.src=item.realtimeSrc||item.src;focusVideo.poster=item.poster||'';focusVideo.muted=true;focusVideo.playbackRate=1;
    focusVideo.addEventListener('loadedmetadata',()=>{if(focusItem===item&&version===focusVersion)focusVideo.currentTime=Math.min(time/(item.realtimeSrc?1:(item.encodedSpeed||1)),Math.max(0,focusVideo.duration-.05));},{once:true});
    dialog.showModal();
   });
  });
  play.disabled=!entries.length;restart.disabled=!entries.length;
 }
 function setMode(next,{autoplay=false}={}){
  if(!selection)return;
  if(dialog.open)dialog.close();
  mode=next;section.dataset.trialMode=next;
  modes.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trialMode===next)));
  panel.hidden=next!=='multiple';
  if(next==='multiple'){
   window.ContactHarnessTrial.clear();build();if(autoplay)playAll();
  }else{release();window.ContactHarnessTrial.load(selection.item);}
 }
 modes.forEach(b=>b.addEventListener('click',()=>{if(b.dataset.trialMode!==mode)setMode(b.dataset.trialMode,{autoplay:b.dataset.trialMode==='multiple'});}));
 play.addEventListener('click',()=>intent?pause():playAll());
 restart.addEventListener('click',()=>{build();playAll();});
 rate.addEventListener('change',async()=>{
  const resume=intent;pause();const token=generation,attempt=playAttempt;status.textContent='Loading videos…';rate.disabled=true;
  try{await Promise.all(entries.map(async e=>{
   const elapsed=e.video.currentTime*e.encoding,next=source(e.item);e.video.playbackRate=speed(e.item);
   if(next===e.activeSource)return;
   e.sourceVersion++;e.fetchController?.abort();e.bufferPromise=null;if(e.bufferUrl){URL.revokeObjectURL(e.bufferUrl);e.bufferUrl=null;}
   e.encoding=encoding(e.item);e.activeSource=next;e.video.src=next;e.video.dataset.source=e.video.src;e.video.preload='auto';
   await ready(e.video);if(token===generation)e.video.currentTime=Math.min(elapsed/e.encoding,Math.max(0,e.video.duration-.001));
   e.video.playbackRate=speed(e.item);
  }));if(token===generation&&attempt===playAttempt){status.textContent='';if(resume)playAll();}}
  catch{if(token===generation)status.textContent='A video could not load. Press Restart to retry.';}
  finally{if(token===generation)rate.disabled=false;}
 });
 focusVideo.addEventListener('play',()=>window.ContactHarnessSimulation?.pauseAll());
 dialog.querySelector('button').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{focusVersion++;focusVideo.pause();focusVideo.removeAttribute('src');focusVideo.load();focusItem=null;});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();focusVideo.pause();}});
 let wasVisible=false;
 new IntersectionObserver(([e])=>{if(e.isIntersecting)wasVisible=true;else if(wasVisible){wasVisible=false;pause();}},{threshold:0}).observe(panel);
 window.ContactHarnessMultiple={
  select(slug,item){
   selection={slug,item};if(mode==='multiple'){if(dialog.open)dialog.close();section.dataset.trialMode='multiple';panel.hidden=false;modes.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trialMode==='multiple')));build();return true;}return false;
  },setMode,pause,
  get mode(){return mode;},get slug(){return selection?.slug;}
 };
 document.querySelector('#open-multiple-trials')?.addEventListener('click',()=>{
  document.querySelector('#demo-video')?.pause();
  if((window.CONTACT_HARNESS_MULTIPLE_TRIALS[selection?.slug]||[]).length<2){
   section.querySelector('[data-platform="all"]').click();section.querySelector('[data-task="7"]').click();
  }
  setMode('multiple',{autoplay:true});
  section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  history.replaceState(null,'','#real-experiments');
 });
 // Evidence links always return to the curated single trial and its matched process.
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-atlas],[data-hero-task],[data-experiment],[data-evidence-connector],[data-result-connector]')&&mode==='multiple')setMode('single');
 },true);
})();
