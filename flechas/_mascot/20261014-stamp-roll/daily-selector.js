/* Candidate display selection only. Call with an existing game's local YYYY-MM-DD day label. */
(function(root){
 'use strict';
 const POSES=Object.freeze(["pose-painted-thumbs-up"]);
 const MODES=Object.freeze(['palabreo-clasico','palabreo-trenza','palabreo-cuarteto','racimo','sudoku-clasico','sudoku-mini','flechas-clasico','flechas-cascada']);
 function serial(day){
  if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
  const [y,m,d]=day.split('-').map(Number);if(y<1)return null;
  const date=new Date(0);date.setUTCHours(0,0,0,0);date.setUTCFullYear(y,m-1,d);
  if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)return null;
  return date.getTime()/86400000;
 }
 const anchor=serial('2026-10-13');
 function capture(day,mode){
  const value=serial(day);if(value===null||!MODES.includes(mode))return null;
  const index=((value-anchor)%POSES.length+POSES.length)%POSES.length;
  return Object.freeze({day,index,pose:POSES[index]});
 }
 // Preview and clock-test helper only; production adapters must pass their existing local-day helper.
 function localDay(date=new Date()){
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))return null;
  return String(date.getFullYear()).padStart(4,'0')+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 }
 const api=Object.freeze({POSES,MODES,capture,localDay,serial});
 root.DailyMascot=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
