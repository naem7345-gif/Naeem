import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldTriggerSearchShortcut } from './searchShortcut';

test('triggers search focus when pressing slash outside text inputs', () => {
  assert.equal(
    shouldTriggerSearchShortcut({ key: '/', targetTagName: 'BODY' }),
    true
  );
});

test('does not trigger when typing slash inside input or textarea', () => {
  assert.equal(
    shouldTriggerSearchShortcut({ key: '/', targetTagName: 'INPUT' }),
    false
  );
  assert.equal(
    shouldTriggerSearchShortcut({ key: '/', targetTagName: 'TEXTAREA' }),
    false
  );
  assert.equal(
    shouldTriggerSearchShortcut({ key: '/', targetTagName: 'DIV', isContentEditable: true }),
    false
  );
});

test('does not trigger when modifier keys or other keys are pressed', () => {
  assert.equal(
    shouldTriggerSearchShortcut({ key: '/', ctrlKey: true, targetTagName: 'BODY' }),
    false
  );
  assert.equal(
    shouldTriggerSearchShortcut({ key: 'k', targetTagName: 'BODY' }),
    false
  );
});
