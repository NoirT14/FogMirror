import test from 'node:test';
import assert from 'node:assert/strict';
import { BreathController } from '../src/audio/BreathController.ts';
function mock(getUserMedia: (...args:any[])=>Promise<any>) {
  const contexts:any[]=[];
  class Context {
    state='running'; sampleRate=48000;
    constructor(){contexts.push(this);}
    async resume(){}
    async close(){this.state='closed';}
    createMediaStreamSource(){return {connect(){},disconnect(){}};}
    createAnalyser(){return {fftSize:2048,frequencyBinCount:1024,smoothingTimeConstant:0,disconnect(){}};}
  }
  const previous=new Map<string,PropertyDescriptor|undefined>();
  for(const [key,value] of Object.entries({window:{isSecureContext:true,AudioContext:Context},AudioContext:Context,navigator:{mediaDevices:{getUserMedia}},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}})){
    previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true});
  }
  return {contexts,restore(){for(const [key,d]of previous){if(d)Object.defineProperty(globalThis,key,d);else Reflect.deleteProperty(globalThis,key);}}};
}
function stream(){const track={stopped:false,onEnded:()=>{},stop(){this.stopped=true;},addEventListener(_n:string,f:()=>void){this.onEnded=f;}};return {track,getTracks:()=>[track],getAudioTracks:()=>[track]};}
const callbacks=()=>({onReading:()=>{},onBlow:()=>{},onEnded:()=>{}});
test('microphone requests audio only and stop closes all resources',async()=>{
  const s=stream();let constraints:any;const env=mock(async c=>{constraints=c;return s;});
  try{const controller=new BreathController(callbacks());assert.equal(await controller.start(),true);assert.equal(constraints.video,false);assert.equal(constraints.audio.noiseSuppression,false);controller.stop();assert.equal(s.track.stopped,true);assert.equal(env.contexts[0].state,'closed');}finally{env.restore();}
});
test('late microphone permission result is released after cancellation',async()=>{
  const s=stream();let resolve!:(value:any)=>void;const env=mock(()=>new Promise(r=>{resolve=r;}));
  try{const c=new BreathController(callbacks());const pending=c.start();await Promise.resolve();c.stop();resolve(s);assert.equal(await pending,false);assert.equal(s.track.stopped,true);assert.equal(env.contexts[0].state,'closed');}finally{env.restore();}
});
test('denied microphone permission closes audio context',async()=>{
  const env=mock(async()=>{throw new DOMException('denied','NotAllowedError');});
  try{const c=new BreathController(callbacks());await assert.rejects(c.start(),{name:'NotAllowedError'});assert.equal(env.contexts[0].state,'closed');}finally{env.restore();}
});
test('unplugging microphone stops resources and updates UI',async()=>{
  const s=stream();const env=mock(async()=>s);let ended=0;
  try{const c=new BreathController({...callbacks(),onEnded:()=>ended++});await c.start();s.track.onEnded();assert.equal(ended,1);assert.equal(s.track.stopped,true);assert.equal(env.contexts[0].state,'closed');}finally{env.restore();}
});
