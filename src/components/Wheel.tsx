export function HamsterMark() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M9 22C2 11 10 4 18 13M30 13C39 4 46 11 39 22" fill="#f4b653" stroke="#f4b653" strokeWidth="3" />
    <path d="M11 22C6 15 11 10 16 16M32 16c5-6 10-1 5 6" fill="#bc743d" />
    <path d="M8 27c0-10 6-16 16-16s16 6 16 16c0 10-8 15-16 15S8 37 8 27Z" fill="#f4b653" />
    <ellipse cx="24" cy="32" rx="12" ry="9" fill="#f9e3b4" />
    <path d="M16 24h.01M32 24h.01" stroke="#30271c" strokeWidth="4" strokeLinecap="round" />
    <path d="m22 30 2 2 2-2m-2 2v3m-4 0c1 2 3 2 4 0 1 2 3 2 4 0" stroke="#30271c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

export default function Wheel({ active }: { active: boolean }) {
  return <svg className={`wheel-art ${active ? 'is-active' : ''}`} viewBox="0 0 400 290" fill="none" aria-hidden="true">
    <defs><pattern id="dots" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#3c382c" /></pattern></defs>
    <path fill="url(#dots)" d="M0 0h400v290H0z" />
    <ellipse cx="204" cy="267" rx="119" ry="8" fill="#11120f" />
    <path d="m197 149-43 115m52-115 43 115m-105 0h116" stroke="#8d6b36" strokeWidth="6" strokeLinecap="round" />
    <circle cx="200" cy="136" r="108" fill="#1b1c16" stroke="#524630" strokeWidth="10" />
    <g className="wheel-rim">
      <circle cx="200" cy="136" r="103" stroke="#d5a354" strokeWidth="2" />
      <circle cx="200" cy="136" r="94" stroke="#75603c" strokeWidth="1.5" />
      {Array.from({ length: 24 }, (_, i) => <path key={i} d="M200 34v11" stroke="#b78d4c" strokeWidth="2" transform={`rotate(${i * 15} 200 136)`} />)}
      {Array.from({ length: 8 }, (_, i) => <path key={i} d="M200 48v76" stroke="#3d3a2c" strokeWidth="2" transform={`rotate(${i * 45} 200 136)`} />)}
      <circle cx="200" cy="136" r="9" fill="#a27a3c" stroke="#e2b465" strokeWidth="2" />
    </g>
    <g transform="translate(121 153)">
      <path d="M26 55C5 52 4 38 14 33" stroke="#d4a068" strokeWidth="6" strokeLinecap="round" />
      <path d="M23 30c7-24 53-28 70-3 16 25-4 46-34 46-29 0-47-19-36-43Z" fill="#dca35e" />
      <path d="M32 50c5-14 39-19 54-6 15 16-2 30-27 29-16-1-31-9-27-23Z" fill="#f4d9a4" />
      <path d="m48 70-6 9h18M80 69l8 8h13" stroke="#dca35e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="83" cy="19" r="13" fill="#dca35e" /><circle cx="84" cy="18" r="7" fill="#b87851" />
      <path d="M79 29c6-15 24-14 30 0l7 14-12 11-25-7V29Z" fill="#e6b976" />
      <ellipse cx="105" cy="43" rx="13" ry="10" fill="#f7dfb1" />
      <circle cx="101" cy="29" r="3.5" fill="#27251e" /><circle cx="102" cy="28" r="1" fill="#fff4df" />
      <path d="m117 38 5 3-5 4Z" fill="#9a6351" />
      <path d="m114 49 7 2m-9-1 2 6M85 50l-7 11" stroke="#8e633f" strokeWidth="2" strokeLinecap="round" />
    </g>
    <path d="M76 72h-9m14-12-5-5m7 31-8 3M321 190h9m-12 12 5 5" stroke="#8e743f" strokeWidth="2" strokeLinecap="round" />
  </svg>
}
