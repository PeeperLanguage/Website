import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountCursorMuncher } from './cursor-muncher.ts';

class Element extends EventTarget {
  attributes = new Map();
  children = [];
  selectors = new Map();
  style = {};
  classList = new Set();
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
  getAttribute(name) {
    return this.attributes.get(name);
  }
  removeAttribute(name) {
    this.attributes.delete(name);
  }
  append(...elements) {
    this.children.push(...elements);
  }
  insertBefore(element, before) {
    this.children.splice(this.children.indexOf(before), 0, element);
  }
  replaceChildren() {
    this.children = [];
  }
  querySelector(selector) {
    if (!this.selectors.has(selector)) this.selectors.set(selector, new Element());
    return this.selectors.get(selector);
  }
  getScreenCTM() {
    return { a: 0.12, b: 0, c: 0, d: 0.12, e: 800, f: 80 };
  }
  remove() {
    this.removed = true;
  }
  getBoundingClientRect() {
    return { width: 100, height: 100 };
  }
}

test('mascot restores cursor and cancels effects on unmount, remount and reduced motion', () => {
  const previous = Object.fromEntries(
    ['window', 'document', 'matchMedia', 'innerWidth', 'innerHeight', 'IntersectionObserver'].map(
      (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)],
    ),
  );
  const frames = new Map();
  const timers = new Map();
  const sights = [];
  const body = new Element();
  const root = new Element();
  root.classList.remove = root.classList.delete;
  let next = 0;
  let reduce = false;
  Object.assign(globalThis, {
    window: Object.assign(new EventTarget(), {
      requestAnimationFrame: (callback) => {
        frames.set(++next, callback);
        return next;
      },
      cancelAnimationFrame: (id) => frames.delete(id),
      setTimeout: (callback) => {
        timers.set(++next, callback);
        return next;
      },
      clearTimeout: (id) => timers.delete(id),
    }),
    document: { body, documentElement: root, createElementNS: () => new Element() },
    matchMedia: () => ({
      get matches() {
        return reduce;
      },
    }),
    innerWidth: 1280,
    innerHeight: 800,
    IntersectionObserver: class {
      constructor(report) {
        sights.push(report);
      }
      observe() {}
      disconnect() {}
    },
  });
  const container = new Element();
  container.id = 'hero';
  const button = container.querySelector('button');
  const shapes = container.querySelector('[data-shapes]');
  const feed = () =>
    button.dispatchEvent(
      Object.assign(new Event('pointerdown'), { clientX: 850, clientY: 150, pointerType: 'mouse' }),
    );
  try {
    const incomplete = new Element();
    incomplete.querySelector = () => null;
    assert.throws(() => mountCursorMuncher(incomplete), /drawing is incomplete or detached/);
    // Long after the settling time, so each frame sees that nothing can move.
    const runFrames = () => {
      for (let count = 0; frames.size > 0 && count < 10; count++) {
        const pending = [...frames];
        frames.clear();
        for (const [, callback] of pending) callback(performance.now() + 60_000);
      }
    };
    // A frame can carry a timestamp older than the wake that asked for it, when the browser is behind.
    const lateFrog = new Element();
    lateFrog.id = 'late';
    const cleanupLate = mountCursorMuncher(lateFrog);
    const [[lateId, lateFrame]] = frames;
    frames.delete(lateId);
    lateFrame(performance.now() - 400);
    // After the body's five shapes and the left eye comes the left pupil, resting near x 226.
    const lateShapes = lateFrog.querySelector('[data-shapes]').children;
    const pupilX = Number(lateShapes[6].getAttribute('d').match(/-?[\d.]+/)[0]);
    assert.ok(
      Math.abs(pupilX - 226) < 1,
      `a late frame leaves the pupil in place, got x ${pupilX}`,
    );
    cleanupLate();
    frames.clear();
    const stillFrog = new Element();
    stillFrog.id = 'still';
    const cleanupStill = mountCursorMuncher(stillFrog);
    runFrames();
    assert.equal(frames.size, 0, 'a frog that cannot move asks for no frames');
    const move = () =>
      window.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: 5, clientY: 5 }));
    move();
    assert.equal(frames.size, 0, 'an off-screen frog ignores the pointer');
    sights.at(-1)([{ isIntersecting: true }]);
    assert.equal(frames.size, 1, 'coming into view draws it');
    runFrames();
    move();
    assert.equal(frames.size, 1, 'an on-screen frog wakes for the pointer');
    runFrames();
    assert.equal(frames.size, 0, 'and sleeps again');
    cleanupStill();
    for (const reduced of [false, false, true]) {
      reduce = reduced;
      const cleanup = mountCursorMuncher(container);
      const count = shapes.children.length;
      assert.ok(count > 10, 'original drawing mounted');
      const second = new Element();
      second.id = 'closing';
      const cleanupSecond = mountCursorMuncher(second);
      assert.match(body.children.at(-1).innerHTML, /id="closing-goo"/);
      assert.match(body.children.at(-2).innerHTML, /id="hero-goo"/);
      feed();
      if (!reduced) {
        second.querySelector('button').dispatchEvent(
          Object.assign(new Event('pointerdown'), {
            clientX: 100,
            clientY: 600,
            pointerType: 'mouse',
          }),
        );
        assert.equal(second.querySelector('button').getAttribute('aria-busy'), undefined);
      }
      cleanupSecond();
      assert.equal(root.classList.has('cursor-munched'), !reduced);
      assert.ok(frames.size > 0);
      assert.ok(timers.size > 0);
      cleanup();
      assert.equal(root.classList.has('cursor-munched'), false);
      assert.equal(button.getAttribute('aria-busy'), undefined);
      assert.equal(frames.size, 0);
      assert.equal(timers.size, 0);
      assert.equal(shapes.children.length, 0);
      assert.ok(body.children.every((effect) => effect.removed));
      feed();
      assert.equal(root.classList.has('cursor-munched'), false, 'listeners removed');
      assert.equal(timers.size, 0, 'unmounted button cannot restart timeline');
    }
  } finally {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
