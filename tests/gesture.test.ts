import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureSequence } from '../src/gesture/GestureSequence.ts';
function arm(s: GestureSequence, start=0) {
  for (let t=start;t<=start+500;t+=125) assert.equal(s.update('Closed_Fist',.95,t),false);
  assert.equal(s.phase,'armed');
}
test('held fist followed by stable open palm triggers once with 3-second cooldown',()=>{
  const s=new GestureSequence(); arm(s);
  assert.equal(s.update('Open_Palm',.95,625),false);
  assert.equal(s.update('Open_Palm',.95,750),false);
  assert.equal(s.update('Open_Palm',.95,875),true);
  for(let t=1000;t<3875;t+=125) assert.equal(s.update('Closed_Fist',.95,t),false);
  assert.equal(s.update('Open_Palm',.95,4000),false);
  arm(s,4125); s.update('Open_Palm',.95,4750);
  assert.equal(s.update('Open_Palm',.95,5000),true);
});
test('open palm alone and short fists cannot trigger',()=>{
  const s=new GestureSequence();
  for(let t=0;t<1500;t+=125) assert.equal(s.update('Open_Palm',.95,t),false);
  s.update('Closed_Fist',.95,1500); s.update('Closed_Fist',.95,1750);
  for(let t=1875;t<2500;t+=125) assert.equal(s.update('Open_Palm',.95,t),false);
});
test('low confidence cannot arm and a missing hand cancels an armed gesture',()=>{
  const s=new GestureSequence();
  for(let t=0;t<1000;t+=125) s.update('Closed_Fist',.4,t);
  assert.equal(s.phase,'waiting'); arm(s,1125);
  s.update('None',0,1750,false);
  for(let t=1875;t<2500;t+=125) assert.equal(s.update('Open_Palm',.95,t),false);
});
test('opening after two seconds is too late',()=>{
  const s=new GestureSequence(); arm(s);
  for(let t=625;t<=2500;t+=125) s.update('Closed_Fist',.95,t);
  for(let t=2625;t<3250;t+=125) assert.equal(s.update('Open_Palm',.95,t),false);
});
test('frame stalls and explicit reset invalidate a partially completed gesture',()=>{
  const s=new GestureSequence(); arm(s);
  assert.equal(s.update('Open_Palm',.95,1100),false);
  assert.equal(s.update('Open_Palm',.95,1350),false);
  arm(s,1500); s.reset();
  assert.equal(s.update('Open_Palm',.95,2125),false);
});
test('brief transition pose with a visible hand is tolerated after arming',()=>{
  const s=new GestureSequence(); arm(s); s.update('None',.5,625,true);
  s.update('Open_Palm',.95,750);
  assert.equal(s.update('Open_Palm',.95,1000),true);
});
