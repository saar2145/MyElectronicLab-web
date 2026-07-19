// Version: 1.0
// Title: Avatar Icon Options | Important Data: the 9 predefined profile icons a
// user can choose from at registration. Keys are stored as-is in
// profiles.avatar_icon (text column) - changing a key here without a DB migration
// will orphan existing users who picked it, so treat these keys as stable IDs,
// not just display values.

export const AVATAR_ICONS = [
  { key: 'chip', icon: 'mdi:chip', label: 'שבב' },
  { key: 'resistor', icon: 'mdi:resistor', label: 'נגד' },
  { key: 'resistor-nodes', icon: 'mdi:resistor-nodes', label: 'מעגל נגדים' },
  { key: 'led-on', icon: 'mdi:led-on', label: 'לד' },
  { key: 'led-strip', icon: 'mdi:led-strip', label: 'רצועת לדים' },
  { key: 'battery', icon: 'mdi:battery', label: 'סוללה' },
  { key: 'antenna', icon: 'mdi:antenna', label: 'אנטנה' },
  { key: 'robot', icon: 'mdi:robot', label: 'רובוט' },
  { key: 'usb', icon: 'mdi:usb', label: 'USB' },
] as const;

export const DEFAULT_AVATAR_KEY = AVATAR_ICONS[0].key;

export function getAvatarIcon(key: string | null | undefined): string {
  return AVATAR_ICONS.find((a) => a.key === key)?.icon ?? AVATAR_ICONS[0].icon;
}
