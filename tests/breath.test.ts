import test from 'node:test';
import assert from 'node:assert/strict';
import { BreathGate, analyseBreath } from '../src/audio/breathSignal.ts';

const background = {rms:.003, flatness:.7, lowRatio:.2, peakRatio:.02};
const blow = {rms:.15, flatness:.65, lowRatio:.4, peakRatio:.04};
function calibrated(rms=.003) {
  const gate = new BreathGate();
  for (let t=0;t<1600;t+=40) assert.equal(gate.update({...background,rms},t).triggered,false);
  return gate;
}
function feed(gate:BreathGate,features:typeof blow,start:number,end:number) {
  let count=0;
  for (let t=start;t<end;t+=40) if (gate.update(features,t).triggered) count++;
  return count;
}
test('calibration never triggers even with loud input',()=>{
  const gate=new BreathGate(); assert.equal(feed(gate,blow,0,1600),0);
});
test('sustained turbulent sound triggers once until quiet',()=>{
  const gate=calibrated(); assert.equal(feed(gate,blow,1600,5600),1);
  feed(gate,background,5600,6000); assert.equal(feed(gate,blow,6000,6600),1);
});
test('short click or clap does not trigger refog',()=>{
  const gate=calibrated(); assert.equal(feed(gate,blow,1600,1720),0);
  assert.equal(feed(gate,background,1720,2500),0);
});
test('tonal voice-like spectrum is rejected even when loud',()=>{
  const gate=calibrated(); assert.equal(feed(gate,{rms:.2,flatness:.03,lowRatio:.4,peakRatio:.65},1600,3000),0);
});
test('steady fan present during calibration stays below relative threshold',()=>{
  const gate=calibrated(.045); assert.equal(feed(gate,{...background,rms:.045},1600,5000),0);
});
test('sensitivity makes soft breath easier to detect',()=>{
  const low=calibrated(),high=calibrated(); low.sensitivity=0;high.sensitivity=1;
  const soft={...blow,rms:.02};assert.equal(feed(low,soft,1600,2300),0);assert.equal(feed(high,soft,1600,2300),1);
});
test('gap in samples cannot count as a full sustained breath',()=>{
  const gate=calibrated(); gate.update(blow,1600); assert.equal(gate.update(blow,10000).triggered,false);
});
test('silence and negative infinity spectrum stay finite and do not trigger',()=>{
  const features=analyseBreath(new Float32Array(2048),new Float32Array(1024).fill(-Infinity),48000);
  for (const value of Object.values(features)) assert.ok(Number.isFinite(value));
  assert.equal(features.rms,0);assert.equal(feed(calibrated(),features,1600,3000),0);
});
test('recalibration resets latch and starts calibration again',()=>{
  const gate=calibrated();feed(gate,blow,1600,2400);gate.reset();assert.equal(gate.update(blow,3000).calibrating,true);
});

test('broadband synthetic spectrum produces a detectable sustained blow',()=>{
  const wave=new Float32Array(2048);for(let i=0;i<wave.length;i++)wave[i]=i%2?.12:-.12;
  const features=analyseBreath(wave,new Float32Array(1024).fill(-30),48000);
  assert.ok(features.flatness>.9);assert.equal(feed(calibrated(),features,1600,2500),1);
});
test('single frequency synthetic spectrum is not classified as breath',()=>{
  const wave=new Float32Array(2048);for(let i=0;i<wave.length;i++)wave[i]=.3*Math.sin(2*Math.PI*i*440/48000);
  const spectrum=new Float32Array(1024).fill(-100);spectrum[19]=-10;
  const features=analyseBreath(wave,spectrum,48000);
  assert.ok(features.flatness<.1);assert.equal(feed(calibrated(),features,1600,2500),0);
});
