import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  calculateProgressPercentage,
  getNextTrackIndex,
  getPreviousTrackIndex,
  generateShuffleIndices,
} from './audioUtils';

test('formatTime formats seconds to mm:ss correctly', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(9), '0:09');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(215), '3:35');
  assert.equal(formatTime(-5), '0:00');
  assert.equal(formatTime(NaN), '0:00');
});

test('calculateProgressPercentage returns clamped 0-100 value', () => {
  assert.equal(calculateProgressPercentage(0, 100), 0);
  assert.equal(calculateProgressPercentage(50, 100), 50);
  assert.equal(calculateProgressPercentage(150, 100), 100);
  assert.equal(calculateProgressPercentage(20, 0), 0);
});

test('getNextTrackIndex handles sequential and loop wrap-around', () => {
  assert.equal(getNextTrackIndex(0, 5, false), 1);
  assert.equal(getNextTrackIndex(4, 5, false), 0);
  assert.equal(getNextTrackIndex(0, 1, false), 0);
});

test('getPreviousTrackIndex handles sequential and reverse wrap-around', () => {
  assert.equal(getPreviousTrackIndex(2, 5, false), 1);
  assert.equal(getPreviousTrackIndex(0, 5, false), 4);
});

test('generateShuffleIndices contains all indices and sets current first', () => {
  const shuffled = generateShuffleIndices(5, 2);
  assert.equal(shuffled.length, 5);
  assert.equal(shuffled[0], 2);
  const sorted = [...shuffled].sort((a, b) => a - b);
  assert.deepEqual(sorted, [0, 1, 2, 3, 4]);
});
