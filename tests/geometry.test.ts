import test from 'node:test';
import assert from 'node:assert/strict';
import { coverRect, pointerPoint, segmentPoints } from '../src/utils/geometry.ts';

test('wide source fills portrait viewport without stretching', () => {
  assert.deepEqual(coverRect(1920, 1080, 360, 640), {x: (360-1920*640/1080)/2, y: 0, width: 1920*640/1080, height: 640});
});
test('portrait source fills landscape viewport and remains centered', () => {
  const r = coverRect(900, 1600, 1200, 600);
  assert.equal(r.width, 1200); assert.equal(r.x, 0);
  assert.equal(r.y, (600 - r.height) / 2); assert.ok(Math.abs(r.width/r.height - 900/1600) < 1e-12);
});
test('invalid camera dimensions fail explicitly', () => assert.throws(() => coverRect(0, 0, 400, 300), RangeError));
test('pointer conversion accounts for canvas offset and high DPI', () => {
  assert.deepEqual(pointerPoint(160, 90, {left: 10, top: 20, width: 300, height: 200}, 600, 400), {x: 300, y: 140});
});
test('fast strokes have no gaps beyond requested spacing', () => {
  const points = segmentPoints({x: 10,y: 20}, {x: 400,y: 260}, 7);
  let prev = {x:10,y:20};
  for (const p of points) { assert.ok(Math.hypot(p.x-prev.x,p.y-prev.y) <= 7.001); prev = p; }
  assert.deepEqual(points.at(-1), {x:400,y:260});
});
test('single tap still stamps a brush', () => assert.deepEqual(segmentPoints({x:1,y:2},{x:1,y:2},5), [{x:1,y:2}]));

