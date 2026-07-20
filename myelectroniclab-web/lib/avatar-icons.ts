// Version: 2.0
// Title: Avatar Icon Options | Change from v1.0: expanded from 9 to 27 icons
// per request - the picker now renders these as a dense small-icon grid
// ("emoji keyboard" style) instead of 9 large buttons. Requires
// supabase_schema_v1.13_avatar_check.sql to widen the DB check constraint -
// without it, picking any of the 18 new icons fails at signup/save. Important
// Data: keys are stored as-is in profiles.avatar_icon (text column) -
// changing a key here without a DB migration will orphan existing users who
// picked it, so treat these keys as stable IDs, not just display values.

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
  { key: 'memory', icon: 'mdi:memory', label: 'זיכרון' },
  { key: 'lightbulb-on', icon: 'mdi:lightbulb-on', label: 'נורה' },
  { key: 'power-plug', icon: 'mdi:power-plug', label: 'תקע חשמל' },
  { key: 'wifi', icon: 'mdi:wifi', label: 'WiFi' },
  { key: 'bluetooth', icon: 'mdi:bluetooth', label: "בלוטות'" },
  { key: 'server', icon: 'mdi:server', label: 'שרת' },
  { key: 'expansion-card', icon: 'mdi:expansion-card', label: 'כרטיס הרחבה' },
  { key: 'flash', icon: 'mdi:flash', label: 'ברק' },
  { key: 'toggle-switch', icon: 'mdi:toggle-switch', label: 'מתג' },
  { key: 'laptop', icon: 'mdi:laptop', label: 'לפטופ' },
  { key: 'desktop-tower', icon: 'mdi:desktop-tower', label: 'מחשב נייח' },
  { key: 'printer-3d', icon: 'mdi:printer-3d', label: 'מדפסת תלת-מימד' },
  { key: 'calculator-variant', icon: 'mdi:calculator-variant', label: 'מחשבון' },
  { key: 'speedometer', icon: 'mdi:speedometer', label: 'מד מהירות' },
  { key: 'fan', icon: 'mdi:fan', label: 'מאוורר' },
  { key: 'video-input-hdmi', icon: 'mdi:video-input-hdmi', label: 'HDMI' },
  { key: 'satellite-variant', icon: 'mdi:satellite-variant', label: 'לוויין' },
  { key: 'radio-tower', icon: 'mdi:radio-tower', label: 'אנטנת שידור' },
] as const;

export const DEFAULT_AVATAR_KEY = AVATAR_ICONS[0].key;

export function getAvatarIcon(key: string | null | undefined): string {
  return AVATAR_ICONS.find((a) => a.key === key)?.icon ?? AVATAR_ICONS[0].icon;
}
