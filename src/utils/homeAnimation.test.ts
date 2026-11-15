import test from 'node:test';
import assert from 'node:assert/strict';
import { getHomeButtonVisualState, getNextHomePulseKey } from './homeAnimation';

test('getHomeButtonVisualState marks Home active and ambient ring visible on home view', () => {
  const state = getHomeButtonVisualState('home', 0);
  assert.deepEqual(state, {
    isHomeActive: true,
    isAmbientRingVisible: true,
    isPulseActive: false,
  });
});

test('getHomeButtonVisualState dims ambient ring when outside home view and tracks pulse', () => {
  const state = getHomeButtonVisualState('search', 2);
  assert.deepEqual(state, {
    isHomeActive: false,
    isAmbientRingVisible: false,
    isPulseActive: true,
  });
});

test('getNextHomePulseKey increments cleanly and recovers from invalid counts', () => {
  assert.equal(getNextHomePulseKey(0), 1);
  assert.equal(getNextHomePulseKey(4), 5);
  assert.equal(getNextHomePulseKey(-3), 1);
  assert.equal(getNextHomePulseKey(Number.NaN), 1);
});
