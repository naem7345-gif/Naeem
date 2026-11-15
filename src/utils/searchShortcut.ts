export interface ShortcutEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  targetTagName?: string;
  isContentEditable?: boolean;
}

export function shouldTriggerSearchShortcut(event: ShortcutEventLike): boolean {
  if (event.key !== '/') return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  const tag = (event.targetTagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
  if (event.isContentEditable) return false;
  return true;
}
