import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOUND_PRESETS,
  SOUND_PRESET_ORDER,
  getPresetConfig,
  getNextSoundPreset,
} from './audioEnhancer';

test('getPresetConfig returns Studio HD enhancement values by default', () => {
  const studio = getPresetConfig('studio');
  assert.equal(studio.id, 'studio');
  assert.ok(studio.lowGainDb > 0);
  assert.ok(studio.midGainDb > 0);
  assert.ok(studio.highGainDb > 0);
  assert.equal(studio.compressorEnabled, true);
});

test('flat preset keeps zero EQ gain and disables compression', () => {
  const flat = getPresetConfig('flat');
  assert.equal(flat.lowGainDb, 0);
  assert.equal(flat.midGainDb, 0);
  assert.equal(flat.highGainDb, 0);
  assert.equal(flat.spatialMix, 0);
  assert.equal(flat.compressorEnabled, false);
});

test('getNextSoundPreset cycles through all configured presets cleanly', () => {
  let current = SOUND_PRESET_ORDER[0];
  const visited = [current];
  for (let i = 0; i < SOUND_PRESET_ORDER.length; i++) {
    current = getNextSoundPreset(current);
    visited.push(current);
  }
  assert.equal(visited[0], visited[visited.length - 1]);
  assert.equal(new Set(visited).size, Object.keys(SOUND_PRESETS).length);
});
