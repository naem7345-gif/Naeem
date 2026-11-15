import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceBubbleBurst,
  getWaterPhaseDelayMs,
  WATER_DROPLETS,
} from './bubbleAnimation';

test('advanceBubbleBurst increments burstKey on active click', () => {
  const first = advanceBubbleBurst(0, false);
  assert.deepEqual(first, { burstKey: 1, hasBurst: true });

  const second = advanceBubbleBurst(first.burstKey, false);
  assert.deepEqual(second, { burstKey: 2, hasBurst: true });
});

test('advanceBubbleBurst ignores disabled clicks and recovers invalid keys', () => {
  assert.deepEqual(advanceBubbleBurst(3, true), { burstKey: 3, hasBurst: true });
  assert.deepEqual(advanceBubbleBurst(0, true), { burstKey: 0, hasBurst: false });
  assert.deepEqual(advanceBubbleBurst(-5, false), { burstKey: 1, hasBurst: true });
  assert.deepEqual(advanceBubbleBurst(Number.NaN, false), { burstKey: 1, hasBurst: true });
});

test('WATER_DROPLETS defines four distinct water bubble burst trajectories', () => {
  assert.equal(WATER_DROPLETS.length, 4);
  const animClasses = new Set(WATER_DROPLETS.map((d) => d.animationClass));
  assert.equal(animClasses.size, 4);
});

test('getWaterPhaseDelayMs wraps cleanly across 6 organic phases', () => {
  assert.equal(getWaterPhaseDelayMs(0), 0);
  assert.equal(getWaterPhaseDelayMs(2), 840);
  assert.equal(getWaterPhaseDelayMs(6), 0);
  assert.equal(getWaterPhaseDelayMs(Number.NaN), 0);
});
