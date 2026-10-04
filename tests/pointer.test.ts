import test from 'node:test';
import assert from 'node:assert/strict';
import { PointerBrush } from '../src/input/PointerBrush.ts';

function fixture() {
  const captures = new Set<number>();
  const canvas = Object.assign(new EventTarget(), {
    width: 600, height: 400,
    getBoundingClientRect: () => ({left: 10, top: 20, width: 300, height: 200}),
    setPointerCapture: (id: number) => captures.add(id),
    hasPointerCapture: (id: number) => captures.has(id),
    releasePointerCapture: (id: number) => captures.delete(id),
  });
  const strokes: any[] = [];
  const renderer = {canvas, dpr: 2, mask: {stroke: (...args: any[]) => strokes.push(args)}, invalidate() {}};
  const cursor = {style: {}, hidden: true};
  const brush = new PointerBrush(renderer as any, cursor as any, () => {});
  const send = (type: string, x: number, y: number, id = 1) => {
    const event = Object.assign(new Event(type, {cancelable: true}), {
      clientX: x, clientY: y, pointerId: id, pointerType: 'touch', button: 0,
    });
    canvas.dispatchEvent(event);
    return event;
  };
  return {brush, strokes, send, captures, cursor};
}

test('finger drag paints in canvas coordinates without showing mouse cursor', () => {
  const f = fixture();
  const down = f.send('pointerdown', 20, 30);
  f.send('pointermove', 50, 60);
  assert.equal(down.defaultPrevented, true);
  assert.deepEqual(f.strokes[1], [{x: 20, y: 20}, {x: 80, y: 80}, 72]);
  assert.equal(f.cursor.hidden, true);
  f.send('pointerup', 50, 60);
  assert.equal(f.captures.size, 0);
  f.brush.destroy();
});

test('lifting finger does not connect a new stroke to the previous one', () => {
  const f = fixture();
  f.send('pointerdown', 20, 30); f.send('pointerup', 20, 30);
  f.send('pointermove', 50, 60);
  assert.equal(f.strokes.length, 1);
  f.send('pointerdown', 100, 110);
  assert.deepEqual(f.strokes[1][0], f.strokes[1][1]);
  f.brush.destroy();
});

test('a second finger cannot hijack or terminate the active stroke', () => {
  const f = fixture();
  f.send('pointerdown', 20, 30, 1);
  f.send('pointerdown', 50, 60, 2); f.send('pointermove', 60, 70, 2); f.send('pointerup', 60, 70, 2);
  assert.equal(f.strokes.length, 1);
  f.send('pointermove', 70, 80, 1);
  assert.equal(f.strokes.length, 2);
  f.brush.destroy();
});

test('touch cancellation prevents a stuck drawing gesture', () => {
  const f = fixture();
  f.send('pointerdown', 20, 30); f.send('pointercancel', 20, 30); f.send('pointermove', 90, 100);
  assert.equal(f.strokes.length, 1);
  assert.equal(f.captures.size, 0);
  f.brush.destroy();
});
