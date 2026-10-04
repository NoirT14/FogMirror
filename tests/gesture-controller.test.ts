import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureController } from '../src/gesture/GestureController.ts';

test('cancelling a pending model closes its late result without starting detection',async()=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'window');
  Object.defineProperty(globalThis,'window',{value:{clearTimeout(){}},configurable:true});
  let resolve!:(value:any)=>void,closed=0,triggers=0;
  try {
    const c=new GestureController({onStatus(){},onTrigger(){triggers++;},onError(){}},()=>new Promise(r=>resolve=r));
    const pending=c.start({} as HTMLVideoElement); c.stop();
    resolve({close(){closed++;},recognizeForVideo(){throw new Error('must not infer');}});
    assert.equal(await pending,false); assert.equal(closed,1); assert.equal(triggers,0);
  } finally { if(previous) Object.defineProperty(globalThis,'window',previous); else Reflect.deleteProperty(globalThis,'window'); }
});

test('model load rejection reaches caller and stop remains safe',async()=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'window');
  Object.defineProperty(globalThis,'window',{value:{clearTimeout(){}},configurable:true});
  try {
    const c=new GestureController({onStatus(){},onTrigger(){},onError(){}},async()=>{throw new Error('model missing');});
    await assert.rejects(c.start({} as HTMLVideoElement),/model missing/); c.stop(); c.stop();
  } finally { if(previous) Object.defineProperty(globalThis,'window',previous); else Reflect.deleteProperty(globalThis,'window'); }
});
