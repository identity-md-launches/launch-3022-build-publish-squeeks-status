import { useState } from 'react'
import type { Sample } from '../hooks'
import Icon from './Icon'

const shortTime = (time: number) => `${new Date(time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', hour12: false })} UTC`
export default function Chart({ samples, currentRpm, paused, togglePaused, unavailable }: {
  samples: Sample[]; currentRpm: number | null; paused: boolean; togglePaused: () => void; unavailable: boolean
}) {
  const [range, setRange] = useState<'5m' | 'session'>('5m')
  const [hover, setHover] = useState<Sample | null>(null)
  const latest = samples.at(-1)?.time ?? Date.now()
  const visible = range === '5m' ? samples.filter(s => s.time >= latest - 300_000) : samples
  const values = visible.flatMap(s => s.rpm === null ? [] : [s.rpm])
  const max = Math.max(10, Math.ceil(Math.max(0, ...values) / 10) * 10)
  const first = visible[0]?.time ?? latest
  const end = Math.max(first + 20_000, latest)
  const x = (s: Sample) => 10 + (s.time - first) / (end - first) * 780
  const y = (s: Sample) => 175 - (s.rpm ?? 0) / max * 155
  const segments: Sample[][] = []
  visible.forEach((sample, i) => {
    if (sample.rpm === null) return
    if (!i || visible[i - 1].rpm === null || sample.time - visible[i - 1].time > 10_000) segments.push([])
    segments.at(-1)!.push(sample)
  })
  const average = values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null
  const point = hover ?? visible.at(-1)
  const format = (n: number | null) => n === null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: 1 })
  return <section className="chart-panel panel" aria-labelledby="rpm-heading">
    <div className="panel-heading chart-heading">
      <div><h2 id="rpm-heading">Wheel activity</h2><p className="muted small">RPM · this browser session</p></div>
      <div className="chart-controls">
        <div className="segmented" aria-label="Chart time range">
          <button type="button" aria-pressed={range === '5m'} onClick={() => { setRange('5m'); setHover(null) }}>5 min</button>
          <button type="button" aria-pressed={range === 'session'} onClick={() => { setRange('session'); setHover(null) }}>Session</button>
        </div>
        <button type="button" className="icon-button" aria-label={paused ? 'Resume live updates' : 'Pause live updates'} onClick={togglePaused}><Icon name={paused ? 'play' : 'pause'} /></button>
      </div>
    </div>
    <div className="chart-current"><span className="number chart-number">{format(currentRpm)}</span><span className="muted">rpm</span><span className="chart-caption">{paused ? 'Updates paused' : unavailable ? 'Waiting for live readings' : currentRpm === 0 ? 'A little breather' : 'The wheel is turning'}</span></div>
    <div className="plot" onPointerLeave={() => setHover(null)}>
      <div className="y-axis number"><span>{max}</span><span>{max / 2}</span><span>0</span></div>
      <svg className="sparkline" viewBox="0 0 800 190" preserveAspectRatio="none" role="img" aria-label={`RPM history. ${values.length} real readings. ${values.length ? `Average ${format(average)} RPM, peak ${format(Math.max(...values))} RPM.` : 'Waiting for the first fresh measurement.'}`} onPointerMove={event => {
        if (!visible.length) return
        const rect = event.currentTarget.getBoundingClientRect()
        const t = first + Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * (end - first)
        setHover(visible.reduce((a, b) => Math.abs(a.time - t) < Math.abs(b.time - t) ? a : b))
      }}>
        <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f4b653" stopOpacity=".17" /><stop offset="1" stopColor="#f4b653" stopOpacity="0" /></linearGradient></defs>
        {[20, 97.5, 175].map(value => <path key={value} d={`M0 ${value}H800`} stroke="#34352e" strokeDasharray="3 6" />)}
        {segments.map((segment, i) => {
          const line = segment.map((sample, j) => `${j ? 'L' : 'M'}${x(sample)},${y(sample)}`).join(' ')
          return <g key={i}><path d={`${line} L${x(segment.at(-1)!)},175 L${x(segment[0])},175Z`} fill="url(#chart-fill)" /><path d={line} fill="none" stroke="#f4b653" strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></g>
        })}
        {point && point.rpm !== null && <circle cx={x(point)} cy={y(point)} r="4" fill="#f4b653" />}
      </svg>
      {!values.length && <p className="chart-empty muted small">Fresh RPM readings will appear here.</p>}
    </div>
    <div className="chart-times number small"><span>{visible.length ? shortTime(first) : 'Session start'}</span><span>{hover ? `${shortTime(hover.time)} · ${format(hover.rpm)} rpm` : 'Now'}</span></div>
    <dl className="chart-summary">
      <div><dt>Average</dt><dd><span className="number">{format(average)}</span> <span className="muted small">rpm</span></dd></div>
      <div><dt>Peak</dt><dd><span className="number">{values.length ? format(Math.max(...values)) : '—'}</span> <span className="muted small">rpm</span></dd></div>
      <div><dt>Readings</dt><dd className="number">{values.length.toLocaleString('en-US')}</dd></div>
    </dl>
  </section>
}
