import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runProgram } from './run-program.ts';

class FakeWorker extends EventTarget {
  static all = [];
  sent = [];
  terminated = false;
  constructor() {
    super();
    FakeWorker.all.push(this);
  }
  postMessage(request) {
    this.sent.push(request);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data) {
    this.dispatchEvent(Object.assign(new Event('message'), { data }));
  }
}

test('programs share one worker, each answer finds its asker, and a failure is not kept', async () => {
  globalThis.Worker = FakeWorker;
  const one = { 'src/main.peep': 'one' };
  const two = { 'src/main.peep': 'two' };
  const firstOne = runProgram(one);
  const firstTwo = runProgram(two);
  assert.equal(FakeWorker.all.length, 1, 'one worker for both');
  const [worker] = FakeWorker.all;
  const [askedOne, askedTwo] = worker.sent;
  assert.deepEqual(askedOne.files, one);
  assert.equal(askedOne.run, true);

  worker.reply({ id: askedTwo.id, diagnostics: 'second', run: null });
  worker.reply({ id: askedOne.id, diagnostics: 'first', run: null });
  assert.equal((await firstOne).diagnostics, 'first');
  assert.equal((await firstTwo).diagnostics, 'second');

  assert.equal(runProgram(one), firstOne, 'the same program is not run again');
  assert.equal(worker.sent.length, 2);

  const refused = { 'src/main.peep': 'refused' };
  const firstRefused = runProgram(refused);
  worker.reply({ id: worker.sent.at(-1).id, failure: 'no' });
  await firstRefused;
  await new Promise((done) => setImmediate(done));
  const again = runProgram(refused);
  assert.notEqual(again, firstRefused, 'a failure is tried again');

  // The worker dies with a question open: it is answered, and the next asks a new worker.
  worker.dispatchEvent(new Event('error'));
  assert.ok(worker.terminated);
  assert.match((await again).failure, /could not start/);
  const afterCrash = runProgram({ 'src/main.peep': 'after' });
  assert.equal(FakeWorker.all.length, 2, 'a new worker');
  const next = FakeWorker.all[1];
  next.reply({ id: next.sent[0].id, diagnostics: 'fine', run: null });
  assert.equal((await afterCrash).diagnostics, 'fine');
  delete globalThis.Worker;
});
