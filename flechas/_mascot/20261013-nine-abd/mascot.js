/* Decorative result art only: no storage, awards, player identity or reporting. */
(function(){
 'use strict';
 const assetBase=new URL('.',document.currentScript.src);
 const sessions=new WeakMap();
 function render(options){
  const host=document.querySelector(options.host);if(!host)return null;
  host.querySelectorAll(':scope > .cg-daily-mascot').forEach(el=>el.remove());
  if(!options.eligible||!window.DailyMascot)return null;
  const scope=options.scope||host;
  let chosen=options.freeze?sessions.get(scope):null;
  if(!chosen)chosen=DailyMascot.capture(options.day,options.mode);
  if(!chosen)return null;sessions.set(scope,chosen);
  const figure=document.createElement('figure');figure.className='cg-daily-mascot';figure.hidden=true;figure.setAttribute('aria-hidden','true');
  figure.dataset.pose=chosen.pose;figure.dataset.day=chosen.day;figure.dataset.mode=options.mode;
  const image=new Image();image.alt='';image.decoding='async';
  const layout=()=>{try{if(typeof options.onLayout==='function')options.onLayout();}catch{}};
  image.onload=()=>{if(!figure.isConnected)return;figure.hidden=false;layout();};
  image.onerror=()=>{figure.remove();layout();};
  figure.append(image);
  const before=options.before?host.querySelector(options.before):null;
  if(before)before.before(figure);else host.append(figure);
  if(getComputedStyle(figure).getPropertyValue('--cg-mascot-ready').trim()!=='1'){figure.remove();return null;}
  image.src=new URL(chosen.pose+'.svg',assetBase).href;
  return chosen;
 }
 window.CGMascot=Object.freeze({render});
})();
