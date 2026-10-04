import test from 'node:test';
import assert from 'node:assert/strict';
import { CameraController, cameraError } from '../src/camera/CameraController.ts';

function setup(getUserMedia: (...args: any[]) => Promise<any>) {
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const video = {muted:false, playsInline:false, autoplay:false, srcObject:null, pause(){}, async play(){}};
  for (const [key,value] of Object.entries({document:{createElement:()=>video},window:{isSecureContext:true},navigator:{mediaDevices:{getUserMedia}}})) {
    previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
    Object.defineProperty(globalThis,key,{value,configurable:true});
  }
  return {video, restore(){ for (const [key,d] of previous) { if (d) Object.defineProperty(globalThis,key,d); else Reflect.deleteProperty(globalThis,key); } }};
}
function stream() {
  const track = {stopped:false, ended:()=>{},stop(){this.stopped=true;},addEventListener(_name:string,fn:()=>void){this.ended=fn;}};
  return {track,getTracks:()=>[track],getVideoTracks:()=>[track]};
}
test('camera asks only for video and stop releases stream', async () => {
  const s=stream(); let constraints:any;
  const env=setup(async c=>{constraints=c;return s;});
  try { const c=new CameraController(()=>{}); assert.equal(await c.start(),true); assert.equal(constraints.audio,false); assert.equal(env.video.srcObject,s); c.stop(); assert.ok(s.track.stopped); assert.equal(env.video.srcObject,null); } finally {env.restore();}
});
test('cancelled permission request releases late stream', async () => {
  const s=stream(); let resolve!:(v:any)=>void;
  const env=setup(()=>new Promise(r=>{resolve=r;}));
  try { const c=new CameraController(()=>{}); const pending=c.start(); c.stop(); resolve(s); assert.equal(await pending,false); assert.ok(s.track.stopped); assert.equal(env.video.srcObject,null); } finally {env.restore();}
});
test('external camera disconnect releases resources and informs UI', async () => {
  const s=stream(); const env=setup(async()=>s); let ended=0;
  try {const c=new CameraController(()=>ended++); await c.start(); s.track.ended(); assert.equal(ended,1); assert.ok(s.track.stopped); assert.equal(env.video.srcObject,null);} finally {env.restore();}
});
test('permission denial leaves no stream and gives actionable message', async () => {
  const env=setup(async()=>{throw new DOMException('Denied','NotAllowedError');});
  try {const c=new CameraController(()=>{}); await assert.rejects(c.start(),{name:'NotAllowedError'}); assert.equal(env.video.srcObject,null); assert.match(cameraError(new DOMException('Denied','NotAllowedError')),/quyền camera/);} finally {env.restore();}
});

test('switch releases front stream and requests exact rear camera without audio', async () => {
  const front=stream(), rear=stream(); const calls:any[]=[];
  const env=setup(async c=>{ calls.push(c); return calls.length === 1 ? front : rear; });
  try {
    const c=new CameraController(()=>{});
    await c.start(); await c.start('environment', true);
    assert.ok(front.track.stopped); assert.equal(rear.track.stopped,false);
    assert.deepEqual(calls[1].video.facingMode,{exact:'environment'});
    assert.equal(calls[1].audio,false); assert.equal(c.facing,'environment');
    c.stop();
  } finally { env.restore(); }
});

test('unavailable rear camera releases previous stream and leaves no active video', async () => {
  const front=stream(); let calls=0;
  const env=setup(async()=>{if (++calls === 1) return front; throw new DOMException('Missing rear','OverconstrainedError');});
  try {
    const c=new CameraController(()=>{}); await c.start();
    await assert.rejects(c.start('environment',true),{name:'OverconstrainedError'});
    assert.ok(front.track.stopped); assert.equal(env.video.srcObject,null);
  } finally {env.restore();}
});

test('actual facing mode reported by device determines mirror orientation', async () => {
  const s=stream(); Object.assign(s.track,{getSettings:()=>({facingMode:'environment'})});
  const env=setup(async()=>s);
  try {const c=new CameraController(()=>{}); await c.start(); assert.equal(c.facing,'environment'); c.stop();}
  finally {env.restore();}
});
