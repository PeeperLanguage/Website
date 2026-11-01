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
}

test('mascot restores cursor and cancels effects on unmount, remount and reduced motion', () => {
  const previous = Object.fromEntries(
    ['window', 'document', 'matchMedia', 'innerWidth', 'innerHeight'].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const frames = new Map();
  const timers = new Map();
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
