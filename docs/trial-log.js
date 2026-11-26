/* Each event.mediaTime is seconds in the edited trial video, after speed/cut mapping.
   Supply actual, time-aligned records via ContactHarnessTrial.load({src, events}).
   No demonstration transcript is included in the public page. */
(()=>{
 const video=document.querySelector('#trial-video');
 const image=document.querySelector('#task-image');
 const badge=document.querySelector('#real-experiments .still-badge');
 const pending=document.querySelector('#real-experiments .task-caption>.pending-label');
 const feed=document.querySelector('#agent-log-feed');
 const clock=document.querySelector('#agent-log-clock');
 let events=[],lastCount=-1,requestId=0,encodedSpeed=1,baseEncoding=1,processTimeScale=1,resultDisplayFrom=null,evidenceTime=null;
 let originalSource='',fastSource='',fastEncoding=15,sourceDuration=0,sourceVersion=0,swapping=false;
 const logPanel=document.querySelector('#real-experiments .agent-log');
 const rate=document.querySelector('#trial-rate');
 const rateBar=document.querySelector('#trial-playback');
 const readToggle=document.querySelector('.log-read-toggle');
 const shell=video.parentElement;video.controls=false;shell.classList.add('single-video-shell');
 const transport=document.createElement('div');transport.className='single-transport';transport.hidden=true;
 transport.innerHTML='<button type="button" data-single-play aria-label="Play video">▶</button><time data-single-time>00:00 / 00:00</time><input type="range" data-single-seek min="0" max="1000" step="1" value="0" aria-label="Video position in original time"><button type="button" data-single-fullscreen aria-label="Fullscreen video">⛶</button>';
 shell.append(transport);
 const playButton=transport.querySelector('[data-single-play]'),timeLabel=transport.querySelector('time'),seekBar=transport.querySelector('input'),fullscreenButton=transport.querySelector('[data-single-fullscreen]');
 const status=document.createElement('span');status.className='single-video-status';status.setAttribute('role','status');status.hidden=true;shell.append(status);
 const originalTime=()=>video.currentTime*encodedSpeed;
 const originalDuration=()=>sourceDuration||(Number.isFinite(video.duration)?video.duration*encodedSpeed:0);
 function setBusy(busy){swapping=busy;rate.disabled=busy;playButton.disabled=busy;seekBar.disabled=busy;status.hidden=!busy;if(busy)status.textContent='Loading video…';}
 function updateTransport(){const current=originalTime(),total=originalDuration();timeLabel.textContent=formatTime(current)+' / '+formatTime(total);seekBar.value=total?String(Math.min(1000,current/total*1000)):'0';playButton.textContent=video.paused?'▶':'Ⅱ';playButton.setAttribute('aria-label',video.paused?'Play video':'Pause video');}
 function switchSource(time=originalTime(),resume=!video.paused,force=false){
   const useFast=Number(rate.value)>=8&&fastSource;const url=useFast?fastSource:originalSource,nextEncoding=useFast?fastEncoding:baseEncoding;
   if(!url)return;
   if(!force&&video.getAttribute('src')===url){video.playbackRate=Number(rate.value)/encodedSpeed;return;}
   const version=++sourceVersion,token=requestId;video.pause();encodedSpeed=nextEncoding;setBusy(true);
   video.addEventListener('loadedmetadata',()=>{if(version!==sourceVersion||token!==requestId)return;video.currentTime=Math.max(0,Math.min(time/encodedSpeed,video.duration));video.playbackRate=Number(rate.value)/encodedSpeed;setBusy(false);render();if(resume)video.play().catch(()=>{});},{once:true});
   video.src=url;video.load();video.playbackRate=Number(rate.value)/encodedSpeed;
 }
 playButton.addEventListener('click',()=>{if(swapping)return;if(video.paused){if(video.ended)video.currentTime=0;video.play().catch(()=>{status.hidden=false;status.textContent='Unable to play video. Try again.';});}else video.pause();});
 video.addEventListener('click',()=>playButton.click());
 seekBar.addEventListener('input',()=>{if(!swapping&&originalDuration())video.currentTime=Number(seekBar.value)/1000*originalDuration()/encodedSpeed;});
 fullscreenButton.addEventListener('click',()=>{if(document.fullscreenElement===shell)document.exitFullscreen?.();else shell.requestFullscreen?.().catch(()=>{});});
 video.addEventListener('error',()=>{if(!video.hasAttribute('src'))return;setBusy(false);status.hidden=false;status.textContent='Video could not load.';});
 ['play','pause','ended','durationchange'].forEach(name=>video.addEventListener(name,updateTransport));

 const selectedNote=document.createElement('p');selectedNote.className='selected-trial-note';selectedNote.hidden=true;rateBar.after(selectedNote);
 const evidenceNote=document.createElement('p');evidenceNote.className='evidence-note';evidenceNote.hidden=true;logPanel.append(evidenceNote);
 const resultNote=document.createElement('p');resultNote.className='result-display-note';resultNote.hidden=true;resultNote.textContent='Post-task result inspection';rateBar.after(resultNote);
 const timingNote=document.createElement('p');timingNote.className='trial-timing-note';timingNote.hidden=true;rateBar.after(timingNote);
 clock.title='Elapsed time within the displayed interval, before playback acceleration. This is not the full trial duration.';
 const formatTime=t=>{const seconds=Math.max(0,Math.floor(t+.001));return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;};
 function empty(text){feed.replaceChildren();const p=document.createElement('p');p.className='agent-log-empty';p.textContent=text;feed.append(p);}
 function render(){
   updateTransport();
   resultNote.hidden=resultDisplayFrom===null||originalTime()<resultDisplayFrom*baseEncoding;
   clock.textContent=video.hidden?'--:--':'Elapsed '+formatTime(originalTime());
   const visible=events.filter(e=>e.mediaTime*baseEncoding<=originalTime());
   if(visible.length===lastCount)return;
   lastCount=visible.length;
   if(!events.length){empty('Loading process…');return;}
   if(!visible.length){empty('First process update at '+formatTime(events[0].mediaTime*baseEncoding));return;}
   const rows=visible.map((e,i)=>{
     const row=document.createElement('div');row.className='agent-log-row';row.dataset.kind=e.kind||e.type.toLowerCase();
     if(i===visible.length-1){row.classList.add('current');row.setAttribute('aria-current','true');}
     const time=document.createElement('time');time.textContent=e.sourceTime<0?'Before':formatTime(e.mediaTime*baseEncoding);
     const type=document.createElement('span');type.className='agent-log-type';type.textContent=e.type||'summary';
     const content=document.createElement('div');content.className='agent-log-content';
     content.textContent=e.text;content.title=e.text;
     row.dataset.mediaTime=e.mediaTime;row.dataset.evidence=e.evidence||'';row.append(time,type,content);return row;
   });
   feed.replaceChildren(...rows);feed.scrollTop=feed.scrollHeight;
   if(evidenceTime!==null){const row=rows.find(r=>Math.abs(Number(r.dataset.mediaTime)-evidenceTime)<.05&&r.dataset.evidence==='soft-limit');if(row){logPanel.classList.add('reading');readToggle?.setAttribute('aria-pressed','true');evidenceNote.textContent='The controller limited the motion in response to the soft force limit.';evidenceNote.hidden=false;requestAnimationFrame(()=>{if(!row.isConnected)return;feed.style.paddingBottom=Math.max(0,feed.clientHeight-row.offsetHeight)+'px';feed.scrollTop+=row.getBoundingClientRect().top-feed.getBoundingClientRect().top;});}}
 }
 function clear(){
   selectedNote.hidden=true;timingNote.hidden=true;
   requestId++;sourceVersion++;originalSource='';fastSource='';sourceDuration=0;setBusy(false);transport.hidden=true;events=[];lastCount=-1;encodedSpeed=1;baseEncoding=1;processTimeScale=1;resultDisplayFrom=null;video.pause();rateBar.hidden=true;logPanel.hidden=true;
   evidenceTime=null;evidenceNote.hidden=true;feed.style.paddingBottom='';
   logPanel.classList.remove('reading');readToggle?.setAttribute('aria-pressed','false');
   if(video.hasAttribute('src')){video.removeAttribute('src');video.load();}
   video.hidden=true;image.hidden=false;badge.hidden=false;pending.hidden=false;pending.textContent='Original video pending';render();
 }
 function load({src,fastSrc,fastEncodedSpeed=15,sourceDuration:duration=0,events:records=[],log,poster,encodedSpeed:sourceSpeed=1,processTimeScale:timelineScale=1,resultDisplayFrom:inspectionTime=null,exampleTrial=false,logPending=false}){
   clear();
   const active=requestId;
   if(exampleTrial){selectedNote.replaceChildren(document.createTextNode('Example video. '));const link=document.createElement('a');link.href=(document.querySelector('#results')?'':'results.html')+'#results';link.textContent='View reported results';selectedNote.append(link);selectedNote.hidden=false;}
   encodedSpeed=sourceSpeed;baseEncoding=sourceSpeed;originalSource=src||'';fastSource=fastSrc||'';fastEncoding=fastEncodedSpeed;sourceDuration=duration;processTimeScale=timelineScale;resultDisplayFrom=inspectionTime;logPanel.hidden=!log&&!records.length;if(logPending){selectedNote.append(document.createTextNode(" Process summary awaiting the matching trial log."));selectedNote.hidden=false;}
   timingNote.hidden=encodedSpeed===1;
   timingNote.textContent=encodedSpeed+'× time-lapse. Process clock shows elapsed time.';
   events=records.filter(e=>e.kind==='summary'&&e.type==='summary'&&e.basis!=='video'&&Number.isFinite(e.mediaTime)&&e.mediaTime>=0&&typeof e.text==='string').map(e=>({...e,mediaTime:e.mediaTime/processTimeScale})).sort((a,b)=>a.mediaTime-b.mediaTime);
   lastCount=-1;
   if(src){video.muted=true;video.controls=false;video.poster=poster||'';video.hidden=false;image.hidden=true;badge.hidden=true;pending.hidden=true;rateBar.hidden=false;transport.hidden=false;switchSource(0,false,true);}
   render();
   if(log)fetch(log,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Log unavailable');return r.json()}).then(data=>{if(active!==requestId)return;if(!Array.isArray(data.summaryEvents))throw Error('Reviewed summaries unavailable');events=data.summaryEvents.filter(e=>e.kind==='summary'&&e.type==='summary'&&e.basis!=='video'&&Number.isFinite(e.mediaTime)&&e.mediaTime>=0&&typeof e.text==='string').map(e=>({...e,mediaTime:e.mediaTime/processTimeScale})).sort((a,b)=>a.mediaTime-b.mediaTime);lastCount=-1;render()}).catch(()=>{if(active===requestId)empty('Process summary unavailable')});
 }
 rate.addEventListener('change',()=>switchSource());
 ['timeupdate','seeking','seeked','loadedmetadata','ended'].forEach(event=>video.addEventListener(event,render));
 function seekWhenReady(time){time/=processTimeScale;const token=requestId;evidenceTime=time;const seek=()=>{if(token!==requestId)return;video.pause();video.currentTime=Math.min(Math.max(0,time*baseEncoding/encodedSpeed),Math.max(0,video.duration-.05));lastCount=-1;render();};if(video.readyState>=1)seek();else video.addEventListener('loadedmetadata',seek,{once:true});}
 video.addEventListener('play',()=>{window.ContactHarnessSimulation?.pauseAll();evidenceTime=null;evidenceNote.hidden=true;feed.style.paddingBottom='';logPanel.classList.remove('reading');readToggle?.setAttribute('aria-pressed','false');});
 readToggle?.addEventListener('click',()=>{const reading=logPanel.classList.toggle('reading');readToggle.setAttribute('aria-pressed',String(reading));if(reading){video.pause();requestAnimationFrame(()=>{const row=feed.querySelector('.current');if(!row)return;feed.style.paddingBottom=Math.max(0,feed.clientHeight-row.offsetHeight)+'px';feed.scrollTop+=row.getBoundingClientRect().top-feed.getBoundingClientRect().top;});}else{feed.style.paddingBottom='';feed.scrollTop=feed.scrollHeight;}});
 window.ContactHarnessTrial={load,clear,seekWhenReady,get originalTime(){return originalTime();},get originalDuration(){return originalDuration();},get encoding(){return encodedSpeed;}};
 clear();
})();
