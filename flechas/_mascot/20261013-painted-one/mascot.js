/* Decorative ending portrait only. No storage, scoring, identity or reporting. */
(function(){
 'use strict';
 const assetBase=new URL('.',document.currentScript.src);
 const sessions=new WeakMap(),cleanups=new WeakMap();
 const NS='http://www.w3.org/2000/svg';let sequence=0;
 const passes=[
  [0,270,164,'M310 180 C300 95 390 55 548 35 L540 135 C625 110 700 135 660 210 C610 250 405 232 310 206'],
  [120,210,165,'M165 184 C218 174 205 260 180 310 C205 361 265 338 330 370'],
  [230,285,192,'M350 282 C440 245 565 275 630 278 L590 355 C520 370 425 357 380 373 L415 441 C480 465 545 460 595 412'],
  [360,210,148,'M695 246 C778 213 798 315 696 333 L651 377 C754 375 718 435 636 481'],
  [490,200,124,'M425 462 L417 557 C413 620 363 618 326 628'],
  [590,210,138,'M550 466 L575 562 C560 613 661 605 659 635'],
  [720,200,151,'M292 637 C320 590 427 625 445 635 L340 674'],
  [790,190,151,'M548 635 C595 608 683 607 703 650 L595 680']
 ];
 function svgNode(name,attrs={}){const el=document.createElementNS(NS,name);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,String(value));return el;}
 function remove(figure){const stop=cleanups.get(figure);if(stop)stop();figure.remove();}
 function clear(scope,keepHost){if(!scope)return;const keep=keepHost?document.querySelector(keepHost):null;scope.querySelectorAll(".cg-daily-mascot").forEach(figure=>{if(figure.parentElement!==keep)remove(figure);});}
 function render(options){
  const host=document.querySelector(options.host);if(!host)return null;
  const previous=Array.from(host.querySelectorAll(':scope > .cg-daily-mascot'));
  if(!options.eligible||!window.DailyMascot){previous.forEach(remove);return null;}
  const scope=options.scope||host;
  let chosen=options.freeze?sessions.get(scope):null;
  if(!chosen)chosen=DailyMascot.capture(options.day,options.mode);
  if(!chosen){previous.forEach(remove);return null;}
  if(options.freeze&&previous.length===1&&previous[0].dataset.day===chosen.day&&previous[0].dataset.mode===options.mode)return chosen;
  previous.forEach(remove);sessions.set(scope,chosen);
  const figure=document.createElement('figure');figure.className='cg-daily-mascot';figure.hidden=true;figure.setAttribute('aria-hidden','true');
  figure.dataset.pose=chosen.pose;figure.dataset.day=chosen.day;figure.dataset.mode=options.mode;figure.dataset.motion='waiting';
  const image=new Image();image.className='cg-paint-still';image.alt='';image.decoding='async';
  const url=new URL(chosen.pose+'.png',assetBase).href;
  const uid='cg-painted-'+(++sequence),roughId=uid+'-rough',maskId=uid+'-mask';
  const svg=svgNode('svg',{viewBox:'0 0 1000 716',preserveAspectRatio:'xMidYMid meet','aria-hidden':'true',focusable:'false'});svg.classList.add('cg-paint-svg');
  const defs=svgNode('defs'),rough=svgNode('filter',{id:roughId,x:'-10%',y:'-10%',width:'120%',height:'120%'});
  rough.append(svgNode('feTurbulence',{type:'fractalNoise',baseFrequency:'.028 .10',numOctaves:1,seed:7,result:'noise'}),svgNode('feDisplacementMap',{in:'SourceGraphic',in2:'noise',scale:10,xChannelSelector:'R',yChannelSelector:'G'}));
  const mask=svgNode('mask',{id:maskId,maskUnits:'userSpaceOnUse',x:0,y:0,width:1000,height:716});mask.style.maskType='luminance';
  const strokes=passes.map(([delay,duration,width,d])=>{const path=svgNode('path',{d,pathLength:1,fill:'none',stroke:'white','stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':1,'stroke-dashoffset':1,filter:'url(#'+roughId+')'});mask.append(path);return {path,delay,duration};});
  defs.append(rough,mask);svg.append(defs,svgNode('image',{x:0,y:0,width:1000,height:716,preserveAspectRatio:'xMidYMid meet',href:url,mask:'url(#'+maskId+')'}));
  figure.append(image,svg);
  const before=options.before?host.querySelector(options.before):null;if(before)before.before(figure);else host.append(figure);
  if(getComputedStyle(figure).getPropertyValue('--cg-mascot-ready').trim()!=='1'){figure.remove();return null;}
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame=null,timer=null,observer=null,started=false,disposed=false;
  const layout=()=>{try{if(typeof options.onLayout==='function')options.onLayout();}catch{}};
  function stop(){disposed=true;if(frame!==null)cancelAnimationFrame(frame);frame=null;clearTimeout(timer);timer=null;if(observer)observer.disconnect();observer=null;motion.removeEventListener('change',onMotion);cleanups.delete(figure);}
  function settle(){if(!figure.isConnected){stop();return;}figure.dataset.motion='settled';stop();}
  function onMotion(){if(motion.matches)settle();}
  function start(){if(started||disposed||!figure.isConnected)return;started=true;if(motion.matches){settle();return;}figure.dataset.motion='painting';const began=performance.now();
   function tick(now){if(disposed)return;if(!figure.isConnected||document.hidden){settle();return;}const elapsed=now-began;for(const stroke of strokes){const u=Math.max(0,Math.min(1,(elapsed-stroke.delay)/stroke.duration));stroke.path.setAttribute('stroke-dashoffset',String(1-u*u*(3-2*u)));}if(elapsed<1000)frame=requestAnimationFrame(tick);else settle();}
   frame=requestAnimationFrame(tick);timer=setTimeout(settle,1050);
  }
  cleanups.set(figure,stop);motion.addEventListener('change',onMotion);
  image.onload=()=>{if(!figure.isConnected){stop();return;}figure.hidden=false;layout();if(disposed){figure.dataset.motion='settled';return;}if(motion.matches){settle();return;}
   if(typeof IntersectionObserver==='function'){observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)start();else if(started)settle();}});observer.observe(figure);}
   else {start();}
  };
  image.onerror=()=>{remove(figure);layout();};image.src=url;
  return chosen;
 }
 window.CGMascot=Object.freeze({render,clear});
})();
