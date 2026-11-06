import type { CSSProperties } from 'react'

export type IconName = 'arrow' | 'refresh' | 'pause' | 'play' | 'search' | 'copy' | 'check' | 'shield' | 'activity' | 'blocks' | 'nft' | 'merge' | 'pickaxe' | 'stack' | 'info' | 'close'
const paths: Record<IconName, string> = {
  arrow: 'M7 17 17 7M7 7h10v10',
  refresh: 'M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-1L20 9M4 15l2.3 3A7 7 0 0 0 18 17',
  pause: 'M9 5v14M15 5v14',
  play: 'm8 5 11 7-11 7V5Z',
  search: 'm16 16 4 4M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  copy: 'M9 9h11v12H9V9ZM15 5V3H3v13h2',
  check: 'm5 12 4 4L19 6',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  blocks: 'm12 3 8 4-8 4-8-4 8-4Zm-8 9 8 4 8-4M4 17l8 4 8-4',
  nft: 'M5 3h14v18H5V3Zm4 4h6M9 17l6-6m-7 0h.01m8 6h.01',
  merge: 'M6 3v5c0 4 12 4 12 8v5M18 3v5c0 4-12 4-12 8v5M3 18l3 3 3-3m6 0 3 3 3-3',
  pickaxe: 'm4 20 9-9M5 4c6-2 12 4 15 11l-4-2-5-5-6-4Zm8 7-2-2',
  stack: 'm12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 18l9 5 9-5',
  info: 'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  close: 'm6 6 12 12M6 18 18 6',
}

export default function Icon({ name, size = 18, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>
}
