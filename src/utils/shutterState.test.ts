import test from 'node:test';
import assert from 'node:assert/strict';
import { getDesktopShutterLayout } from './shutterState';

test('collapsed shutter reserves 82px and panel width is 82px', () => {
  const layout = getDesktopShutterLayout({
    isHovered: false,
    isPinnedOpen: false,
    isSearchOpen: false,
  });

  assert.deepEqual(layout, {
    isExpanded: false,
    reserveWidth: 82,
    panelWidth: 82,
    isFloatingOverlay: false,
  });
});

test('hovered shutter expands panel to 316px as floating overlay without reflowing main feed', () => {
  const layout = getDesktopShutterLayout({
    isHovered: true,
    isPinnedOpen: false,
    isSearchOpen: false,
  });

  assert.deepEqual(layout, {
    isExpanded: true,
    reserveWidth: 82,
    panelWidth: 316,
    isFloatingOverlay: true,
  });
});

test('pinned shutter expands reserved layout width to 312px without floating overlay', () => {
  const layout = getDesktopShutterLayout({
    isHovered: false,
    isPinnedOpen: true,
    isSearchOpen: false,
  });

  assert.deepEqual(layout, {
    isExpanded: true,
    reserveWidth: 312,
    panelWidth: 316,
    isFloatingOverlay: false,
  });
});

test('search open keeps shutter expanded', () => {
  const layout = getDesktopShutterLayout({
    isHovered: false,
    isPinnedOpen: false,
    isSearchOpen: true,
  });

  assert.equal(layout.isExpanded, true);
  assert.equal(layout.panelWidth, 316);
  assert.equal(layout.isFloatingOverlay, true);
});
