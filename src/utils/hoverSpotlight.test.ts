import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSpotlightCoords, handleSpotlightMove } from './hoverSpotlight';

test('computeSpotlightCoords calculates rounded relative coordinates', () => {
  assert.deepEqual(
    computeSpotlightCoords(225.4, 260.6, { left: 100, top: 200, width: 300, height: 150 }),
    { mx: '125px', my: '61px' }
  );
  assert.equal(
    computeSpotlightCoords(10, 10, { left: 0, top: 0, width: 0, height: 100 }),
    null
  );
});

test('handleSpotlightMove computes element-relative --mx and --my CSS variables', () => {
  const props: Record<string, string> = {};
  const mockEl = {
    getBoundingClientRect: () => ({ left: 100, top: 200, width: 300, height: 150 }),
    style: {
      setProperty: (key: string, val: string) => {
        props[key] = val;
      },
    },
  };

  handleSpotlightMove({
    clientX: 225,
    clientY: 260,
    currentTarget: mockEl,
  } as unknown as React.MouseEvent<HTMLElement>);

  assert.equal(props['--mx'], '125px');
  assert.equal(props['--my'], '60px');
});

test('handleSpotlightMove exits cleanly when element has zero dimensions', () => {
  const props: Record<string, string> = {};
  const mockEl = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
    style: {
      setProperty: (key: string, val: string) => {
        props[key] = val;
      },
    },
  };

  handleSpotlightMove({
    clientX: 50,
    clientY: 50,
    currentTarget: mockEl,
  } as unknown as React.MouseEvent<HTMLElement>);

  assert.deepEqual(props, {});
});
