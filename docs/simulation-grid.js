/* Six independent three-view players with clocks in original elapsed seconds. */
(()=>{
 const root=document.querySelector('#experiments .simulation-explorer');if(!root)return;
 root.replaceChildren();root.classList.add('simulation-grid');
 const titles=['Place','Stack','Insert','Wipe','Write','Pivot'],keys=['Pick-and-place','Stacking','Insertion','Wiping','Writing','Pivoting'];
 const players=[],fmt=t=>{t=Math.max(0,Number(t)||0);return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;};
 function pauseAll(){players.forEach(p=>p.video.pause());}
 keys.forEach((key,i)=>{
  const item=window.CONTACT_HARNESS_MEDIA.simulation[key],card=document.createElement('article');card.className='simulation-card';card.id='simulation-'+titles[i].toLowerCase();card.dataset.simIndex=i;card.setAttribute('aria-label',titles[i]+' simulation');
  card.innerHTML=`<h3>${titles[i]}</h3><div class="simulation-stage"><img alt="${titles[i]} simulation preview" src="${item.poster}"/><canvas width="1448" height="780" aria-label="${titles[i]}, main view and two wrist views"></canvas><video muted playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video></div><div class="simulation-controls"><button type="button" data-sim-play aria-label="Play ${titles[i]} simulation">Play</button><time>00:00 / ${fmt(item.duration)}</time><select aria-label="${titles[i]} playback speed">${[1,2,4,8,15,16].map(n=>`<option value="${n}"${n===15?' selected':''}>${n}×</option>`).join('')}</select><button type="button" data-sim-fullscreen aria-label="${titles[i]} full screen">⛶</button><input type="range" min="0" max="1000" step="1" value="0" aria-label="${titles[i]} video position"/></div><p class="simulation-status" role="status"></p>`;
  root.append(card);
  const video=card.querySelector('video'),canvas=card.querySelector('canvas'),ctx=canvas.getContext('2d'),poster=card.querySelector('img'),play=card.querySelector('[data-sim-play]'),seek=card.querySelector('input'),clock=card.querySelector('time'),rate=card.querySelector('select'),status=card.querySelector('.simulation-status');
  const p={video,card,item,encoding:1,version:0};players.push(p);video.muted=true;video.defaultMuted=true;
  function source(){return Number(rate.value)>=8&&item.fastSrc?{url:item.fastSrc,encoding:15}:{url:item.src,encoding:item.encodedSpeed||1};}
  function draw(){if(video.readyState<2)return;poster.hidden=true;ctx.fillStyle='#fff';ctx.fillRect(0,0,1448,780);ctx.drawImage(video,0,0,480,360,4,4,960,720);ctx.drawImage(video,480,0,480,360,980,4,464,348);ctx.drawImage(video,960,0,480,360,980,376,464,348);ctx.drawImage(video,0,360,1440,40,4,736,1440,40);}
  function nextFrame(){draw();video.requestVideoFrameCallback?.(nextFrame);}video.requestVideoFrameCallback?.(nextFrame);
  function update(){const elapsed=video.currentTime*p.encoding,d=Number.isFinite(video.duration)?video.duration*p.encoding:item.duration;clock.textContent=fmt(elapsed)+' / '+fmt(d);seek.value=d?elapsed/d*1000:0;play.textContent=video.paused?'Play':'Pause';play.setAttribute('aria-label',(video.paused?'Play ':'Pause ')+titles[i]+' simulation');if(!video.requestVideoFrameCallback)draw();}
  function setSource(){const next=source();if(p.src===next.url){video.playbackRate=Number(rate.value)/p.encoding;return;}const elapsed=video.currentTime*p.encoding,resume=!video.paused,version=++p.version;video.pause();rate.disabled=true;seek.disabled=true;play.disabled=true;p.src=next.url;p.encoding=next.encoding;status.textContent='';video.src=next.url;video.playbackRate=Number(rate.value)/p.encoding;video.addEventListener('loadedmetadata',()=>{if(version!==p.version)return;video.currentTime=Math.min(elapsed/p.encoding,Math.max(0,video.duration-.001));video.playbackRate=Number(rate.value)/p.encoding;rate.disabled=false;seek.disabled=false;play.disabled=false;update();if(resume)video.play().catch(()=>{status.textContent='Press Play to continue.';});},{once:true});}
  setSource();
  ['timeupdate','loadedmetadata','pause','play','ended','seeked'].forEach(event=>video.addEventListener(event,update));['loadeddata','seeked'].forEach(event=>video.addEventListener(event,draw));
  play.addEventListener('click',()=>{if(video.paused){if(video.ended)video.currentTime=0;video.preload='auto';video.play().catch(()=>{status.textContent='Unable to play. Try again.';});}else video.pause();});
  video.addEventListener('play',()=>{document.querySelector('#trial-video')?.pause();window.ContactHarnessMultiple?.pause();document.querySelector('#demo-video')?.pause();});
  video.addEventListener('waiting',()=>{if(!video.paused)status.textContent='Loading video…';});video.addEventListener('playing',()=>status.textContent='');video.addEventListener('error',()=>{rate.disabled=false;seek.disabled=false;play.disabled=false;status.textContent='Video could not load.';});
  rate.addEventListener('change',setSource);seek.addEventListener('input',()=>{if(Number.isFinite(video.duration))video.currentTime=Number(seek.value)/1000*video.duration;});
  card.querySelector('[data-sim-fullscreen]').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else card.requestFullscreen?.();});
  new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)video.pause();},{threshold:0}).observe(card);
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll();});
 window.ContactHarnessSimulation={pauseAll,select(index){const p=players[index];if(!p)return;p.card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});p.card.querySelector('[data-sim-play]').focus({preventScroll:true});},get players(){return players;}};
})();
