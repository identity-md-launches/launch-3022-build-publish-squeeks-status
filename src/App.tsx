import { useEffect, useState } from 'react'
import { CONTRACTS, DOCS_URL, SQUEEKS_URL, STATUS_URL } from './config'
import { formatInteger, formatSqk, readProtocol, readWheel, wheelIsFresh } from './data'
import { useHistory, usePoll } from './hooks'
import Chart from './components/Chart'
import Icon from './components/Icon'
import type { IconName } from './components/Icon'
import WalletLookup from './components/WalletLookup'
import Wheel, { HamsterMark } from './components/Wheel'

const time = (value: number | string) => new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', hour12: false })
function Flag({ on, labels = ['On', 'Off'] }: { on: boolean | null; labels?: [string, string] }) {
  return <span className={`flag ${on === null ? 'unknown' : on ? 'on' : 'off'}`}><span className="status-dot" />{on === null ? 'Unknown' : on ? labels[0] : labels[1]}</span>
}
function Metric({ label, value, detail, icon, accent = false }: { label: string; value: string; detail: string; icon: IconName; accent?: boolean }) {
  return <div className={`metric ${accent ? 'accent-metric' : ''}`}><dt className="metric-label"><span>{label}</span><Icon name={icon} /></dt><dd className="metric-value number">{value}</dd><dd className="metric-detail small">{detail}</dd></div>
}
function CopyContract({ name, address }: { name: string; address: string }) {
  const [copied, setCopied] = useState(false)
  const [failure, setFailure] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2_500)
    return () => clearTimeout(timer)
  }, [copied])
  async function copy() {
    try { await navigator.clipboard.writeText(address); setCopied(true); setFailure(false) }
    catch { setFailure(true) }
  }
  return <div className="contract-item"><span className="small muted">{name}</span><button type="button" className="contract-chip" onClick={copy} aria-label={`${copied ? 'Copied' : 'Copy'} ${name} address ${address}`}><code>{address}</code><Icon name={copied ? 'check' : 'copy'} size={16} /></button><span className={`copy-feedback small ${failure ? 'field-error' : ''}`} role="status">{copied ? 'Address copied' : failure ? 'Select the address to copy it manually.' : ''}</span></div>
}

export default function App() {
  const [paused, setPaused] = useState(false)
  const [revision, setRevision] = useState(0)
  const [now, setNow] = useState(Date.now())
  const wheel = usePoll(readWheel, paused, revision)
  const protocol = usePoll(readProtocol, paused, revision)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(timer)
  }, [])
  const data = wheel.data
  const chain = protocol.data
  const measurementFresh = wheelIsFresh(data, now) && !wheel.error && !paused
  const sensorState = data?.measurement?.state
  const state = paused ? 'Paused' : wheel.loading ? 'Connecting' : !measurementFresh ? 'Unknown' : sensorState === 'COUNTER_FAULT' ? 'Counter fault' : sensorState!
  const fresh = measurementFresh && (sensorState === 'ACTIVE' || sensorState === 'IDLE')
  const active = state === 'ACTIVE'
  const rpm = fresh ? data!.measurement!.rpm : null
  const protocolFresh = !protocol.error && !paused && !!chain
  const history = useHistory(data?.measurement?.rpm ?? null, wheel.updatedAt, wheelIsFresh(data, now) && (sensorState === 'ACTIVE' || sensorState === 'IDLE'))
  const rpcDelayed = protocol.error || !!chain?.failedReads.length
  const liveError = wheel.error || (!wheel.loading && !fresh && !paused)
  const progress = data?.progress ? Number(BigInt(data.progress) * 1_000n / 1_000_000_000n) / 10 : null
  const miningOn = protocolFresh && chain.mining ? chain.mining.started && chain.mining.active && !chain.mining.paused : null
  const stakingOn = protocolFresh && chain.stakingPaused !== null ? !chain.stakingPaused : null
  const mergeOn = protocolFresh ? chain.mergesOpen : null
  const pollLabel = paused ? 'Updates paused' : liveError ? 'Feed reconnecting' : wheel.loading ? 'Connecting to wheel' : 'Auto-updating · ~2s'
  return <>
    <a className="skip-link" href="#main">Skip to dashboard</a>
    <header className="site-header">
      <div className="container header-inner">
        <a href="#main" className="brand" aria-label="Squeeks Status Board home"><span className="brand-mark"><HamsterMark /></span><span>squeeks<span className="brand-divider">/</span><span className="brand-description">status board</span></span></a>
        <nav aria-label="Project links"><span className="network-label"><span className="network-dot" /><span>Sepolia<span className="network-testnet"> testnet</span></span></span><a href={DOCS_URL} target="_blank" rel="noreferrer">Docs<Icon name="arrow" size={15} /></a><a href={SQUEEKS_URL} target="_blank" rel="noreferrer" aria-label="Explore Squeeks"><span className="desktop-link-label">Explore Squeeks</span><span className="mobile-link-label">Squeeks</span><Icon name="arrow" size={15} /></a></nav>
      </div>
    </header>
    <main id="main" className="container" tabIndex={-1}>
      <div className="page-heading">
        <div><h1>Squeeks Status Board<span className="title-dot">.</span></h1><p className="hero-copy">Live look at the hamster wheel and Sepolia Squeeks.</p></div>
        <a className="button secondary lookup-jump" href="#wallet" onClick={() => setTimeout(() => document.getElementById('wallet-address')?.focus({ preventScroll: true }), 0)}><Icon name="search" />Look up an address<Icon name="arrow" size={16} style={{ transform: 'rotate(90deg)' }} /></a>
      </div>
      <div className="live-toolbar">
        <div className="feed-meta"><span className={`live-state ${active ? 'active' : ''}`}><span className="status-dot" />{state}</span><span className="muted small">{pollLabel}</span><span className="updated muted small">Updated <time className="number" dateTime={wheel.updatedAt ? new Date(wheel.updatedAt).toISOString() : undefined}>{wheel.updatedAt ? `${time(wheel.updatedAt)} UTC` : '—'}</time></span></div>
        <button type="button" className="refresh-button" aria-label="Refresh now" disabled={paused} onClick={() => setRevision(n => n + 1)}><Icon name="refresh" size={15} /><span>Refresh now</span></button>
      </div>
      <div className="feed-notice" role="status">{paused ? 'Updates paused. Resume to get fresh readings.' : liveError ? 'Live feed paused — retrying.' : ''}{!paused && rpcDelayed && <span> Sepolia reads {protocol.error ? 'unavailable' : 'partially unavailable'}; retrying automatically.{protocol.updatedAt ? ` Last snapshot: ${time(protocol.updatedAt)} UTC.` : ''}</span>}</div>
      <dl className="metrics" aria-label="Live overview">
        <Metric label="Wheel status" value={state} detail={fresh ? active ? 'Tiny paws, hard at work' : 'Taking a wheel-earned break' : paused ? 'Last values held below' : 'Waiting for a fresh reading'} icon="activity" accent />
        <Metric label="Wheel speed" value={rpm === null ? '—' : rpm.toLocaleString('en-US', { maximumFractionDigits: 1 })} detail="Revolutions per minute" icon="refresh" />
        <Metric label="Block height" value={formatInteger(data?.blockHeight)} detail={data?.settledThroughRound ? `Settled through round ${formatInteger(data.settledThroughRound)}` : 'Confirmed Squeek blocks'} icon="blocks" />
        <Metric label="NFT supply" value={formatInteger(chain?.supply)} detail={chain?.issued != null ? `Circulating · ${formatInteger(chain.issued)} issued` : 'Circulating Squeeks'} icon="nft" />
        <Metric label="Merges open" value={!protocolFresh || chain.mergesOpen === null ? 'Unknown' : chain.mergesOpen ? 'Open' : 'Closed'} detail={protocolFresh ? 'Read from SqueekNFT' : 'Waiting for Sepolia'} icon="merge" />
      </dl>
      <div className="activity-grid">
        <Chart samples={history} currentRpm={rpm} paused={paused} togglePaused={() => setPaused(value => !value)} unavailable={!fresh} />
        <section className="wheel-panel panel" aria-labelledby="wheel-heading">
          <div className="panel-heading"><h2 id="wheel-heading">The wheel room</h2><span className="quiet-tag">WHEELY9000</span></div>
          <Wheel active={active} />
          <div className="wheel-caption"><span className={`state-symbol ${active ? 'is-active' : ''}`}><Icon name={active ? 'activity' : 'pause'} size={16} /></span><div><h3>{active ? 'Squeektoshi is on a roll.' : state === 'IDLE' ? 'Even hamsters need a break.' : 'Keeping an eye on the wheel.'}</h3><p className="muted small">{fresh ? data?.measurement?.provenance === 'hardware' ? 'Live readings from the physical wheel.' : `${data?.measurement?.provenance ?? 'Unknown'} measurement source.` : 'Fresh readings bring the wheel to life.'}</p></div></div>
          <div className="wheel-source small muted"><span>Sensor observed</span><time className="number">{data?.measurement?.observedAt ? `${time(data.measurement.observedAt)} UTC` : '—'}</time></div>
        </section>
      </div>
      <section className="protocol-section" aria-labelledby="protocol-heading">
        <div className="section-heading"><h2 id="protocol-heading">Under the hood</h2><span className="muted small">{protocol.updatedAt ? `Sepolia · read ${time(protocol.updatedAt)} UTC` : 'Reading Sepolia contracts'}</span></div>
        <div className="protocol-strip">
          <div className="protocol-item"><div className="protocol-title"><span className="protocol-icon"><Icon name="pickaxe" size={20} /></span><h3>Mining</h3><Flag on={miningOn} /></div><p className="muted small">{chain?.mining ? `${formatInteger(chain.mining.fundedBlocks)} blocks funded` : 'Started / funding status'}</p><dl><dt>Issued to staking</dt><dd className="number">{formatSqk(chain?.mining?.minted)} <span className="small muted">SQK</span></dd></dl></div>
          <div className="protocol-item"><div className="protocol-title"><span className="protocol-icon"><Icon name="stack" size={20} /></span><h3>Staking intake</h3><Flag on={stakingOn} /></div><p className="muted small">{stakingOn === false ? 'Intake paused; claims may remain available' : 'Principal deposited in SqueekStaking'}</p><dl><dt>Total staked</dt><dd className="number">{formatSqk(chain?.totalStaked)} <span className="small muted">SQK</span></dd></dl></div>
          <div className="protocol-item"><div className="protocol-title"><span className="protocol-icon"><Icon name="merge" size={20} /></span><h3>Merging</h3><Flag on={mergeOn} /></div><p className="muted small">Collection-wide flag; eligibility still applies</p><dl><dt>Lifetime issued</dt><dd className="number">{formatInteger(chain?.issued)} <span className="small muted">Squeeks</span></dd></dl></div>
        </div>
      </section>
      <div className="details-grid">
        <WalletLookup />
        <section className="settlement-panel panel" aria-labelledby="settlement-heading">
          <div className="panel-heading"><div className="heading-with-icon"><Icon name="blocks" size={20} /><h2 id="settlement-heading">Work & settlement</h2></div><a className="icon-button" href={`${DOCS_URL}/system/rounds-and-blocks/`} target="_blank" rel="noreferrer" aria-label="Read about rounds and Squeek blocks"><Icon name="arrow" size={16} /></a></div>
          <dl className="settlement-values"><div><dt>Settled through round</dt><dd className="number">{formatInteger(data?.settledThroughRound)}</dd></div><div><dt>Cumulative settled work</dt><dd className="number">{formatInteger(data?.work)}</dd></div><div><dt>Work per 1,000 blocks</dt><dd className="number">{formatInteger(data?.difficulty)}</dd></div><div><dt>Oracle</dt><dd className="value-state">{data?.oracle ?? 'Unknown'}</dd></div><div><dt>Settlement queue</dt><dd className="value-state">{data?.queue ?? 'Unknown'}</dd></div></dl>
          <div className="block-progress"><div className="small"><span className="muted">Settled block progress</span><span className="number">{progress === null ? '—' : `${progress.toFixed(1)}%`}</span></div><div className="progress-track" role="progressbar" aria-label="Progress toward the next settled Squeek block" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? undefined} aria-valuetext={progress === null ? 'Unknown' : undefined}><span style={{ width: `${Math.min(100, progress ?? 0)}%` }} /></div></div>
        </section>
      </div>
      <section className="sources" aria-label="Data sources"><Icon name="info" size={16} /><p className="small muted">Wheel data: <a href={STATUS_URL} target="_blank" rel="noreferrer">Squeekchain API</a>. Protocol: Sepolia contract reads{chain ? <> at Ethereum block <span className="number">{formatInteger(chain.block)}</span></> : ''}. Squeek block height is separate from Ethereum block height. {chain && <a href={chain.source} target="_blank" rel="noreferrer">RPC source <Icon name="arrow" size={12} /></a>}</p></section>
    </main>
    <footer className="site-footer"><div className="container"><div className="footer-heading"><span>Genesis contracts <span className="muted">· Sepolia</span></span><span className="small muted">Select a chip to copy its address</span></div><div className="contract-grid">{Object.values(CONTRACTS).map(contract => <CopyContract key={contract.name} {...contract} />)}</div><div className="footer-bottom"><span className="small muted">One hamster. A whole lot to watch.</span><span className="small muted">Testnet only / not financial advice</span><a href={DOCS_URL} target="_blank" rel="noreferrer" className="small">Built for Genesis reviewers <Icon name="arrow" size={13} /></a></div></div></footer>
  </>
}
