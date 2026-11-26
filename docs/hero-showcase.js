(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const scene=document.querySelector('.hero-showcase');
 if(scene){
  const videos=[...scene.querySelectorAll('video')],button=document.querySelector('.hero-preview-toggle');
  let visible=false,userPaused=false,optedIn=false;
  const blocked=()=>!optedIn&&(reduced.matches||navigator.connection?.saveData);
  function label(){const paused=userPaused||blocked()||videos.every(v=>v.paused);button.dataset.paused=String(paused);button.setAttribute('aria-label',paused?'Play homepage videos':'Pause homepage videos');button.title=button.getAttribute('aria-label');}
  function update(){
   // Each element loops at its own duration. Never seek or restart its neighbours.
   videos.forEach(v=>{if(visible&&!document.hidden&&!userPaused&&!blocked())v.play().then(label).catch(label);else v.pause();});label();
  }
  button.addEventListener('click',()=>{if(userPaused||blocked()||videos.every(v=>v.paused)){userPaused=false;optedIn=true;}else userPaused=true;update();});
  videos.forEach(v=>{v.addEventListener('play',label);v.addEventListener('pause',label);});
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();},{threshold:.1}).observe(scene.querySelector('.hero-wall-stage'));
  document.addEventListener('visibilitychange',update);reduced.addEventListener('change',()=>{optedIn=false;update();});
  addEventListener('pagehide',()=>videos.forEach(v=>v.pause()));label();
 }
 const atlas=document.querySelector('#connector-atlas');
 if(!atlas||!('IntersectionObserver' in window))return;
 const tiles=[...atlas.querySelectorAll('.connector-tile')];
 let armed=true,animations=[];
 function settle(){animations.forEach(a=>a.cancel());animations=[];armed=false;}
 function unfold(){
  if(!armed)return;armed=false;
  if(reduced.matches)return;
  const rect=atlas.getBoundingClientRect();
  tiles.forEach((tile,i)=>{
   const box=tile.getBoundingClientRect(),dx=(rect.left+rect.width/2-box.left-box.width/2)*.34,dy=(rect.top+rect.height/2-box.top-box.height/2)*.28;
   const tilt=(box.left+box.width/2-rect.left-rect.width/2)/rect.width*7;
   const a=tile.animate([{opacity:.12,transform:`translate(${dx}px,${dy}px) scale(.82) rotate(${tilt}deg)`},{opacity:1,transform:'translate(0,0) scale(1) rotate(0deg)'}],{duration:650,delay:(i%5)*28,easing:'cubic-bezier(.16,.8,.24,1)',fill:'backwards'});
   animations.push(a);a.onfinish=()=>{a.cancel();animations=animations.filter(item=>item!==a);};
  });
 }
 new IntersectionObserver(entries=>{if(entries[0].isIntersecting)unfold();},{threshold:0,rootMargin:'0px 0px -45px 0px'}).observe(atlas);
 new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&!atlas.contains(document.activeElement)){settle();armed=true;}},{threshold:0,rootMargin:'160px 0px 160px 0px'}).observe(atlas);
 atlas.addEventListener('focusin',settle);atlas.addEventListener('pointerdown',settle);
 reduced.addEventListener('change',settle);addEventListener('beforeprint',settle);
})();
