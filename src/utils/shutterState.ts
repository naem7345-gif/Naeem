export interface ShutterLayoutInput {
  isHovered: boolean;
  isPinnedOpen: boolean;
  isSearchOpen: boolean;
}

export interface DesktopShutterLayout {
  isExpanded: boolean;
  reserveWidth: number;
  panelWidth: number;
  isFloatingOverlay: boolean;
}

export function getDesktopShutterLayout(
  input: ShutterLayoutInput
): DesktopShutterLayout {
  const isExpanded = Boolean(
    input.isHovered || input.isPinnedOpen || input.isSearchOpen
  );
  // Keep flex layout width fixed at 82px during hover so main feed cards never jump or reflow.
  // Only expand the reserved layout slot when the user explicitly pins the shutter open.
  const reserveWidth = input.isPinnedOpen ? 312 : 82;
  const panelWidth = isExpanded ? 316 : 82;
  const isFloatingOverlay = isExpanded && !input.isPinnedOpen;

  return {
    isExpanded,
    reserveWidth,
    panelWidth,
    isFloatingOverlay,
  };
}
