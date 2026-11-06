import { useEffect, useRef, useState } from 'react'
import { FeedError, formatInteger, formatSqk, readAccount, validAddress } from '../data'
import type { AccountData } from '../data'
import Icon from './Icon'

export default function WalletLookup() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<AccountData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [retryAt, setRetryAt] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])

  async function lookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!validAddress(address)) {
      setError('Use a nonzero address: 0x followed by 40 hexadecimal characters.')
      setResult(null)
      input.current?.focus()
      return
    }
    if (Date.now() < retryAt) {
      setError(`Account API is busy. Try again after ${new Date(retryAt).toLocaleTimeString('en-GB')}.`)
      return
    }
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setResult(null)
    setMessage('Looking up address.')
    try {
      const data = await readAccount(address, controller.signal)
      if (controller.signal.aborted) return
      setResult(data)
      setMessage(`Lookup complete. ${data.wallet === '0' && data.deposited === '0' ? 'No Squeeks in this address.' : `${formatInteger(data.wallet)} in wallet, ${formatInteger(data.deposited)} deposited.`}`)
    } catch (failure) {
      if (controller.signal.aborted) return
      const wait = failure instanceof FeedError ? failure.retryAfterMs : 0
      setRetryAt(Date.now() + wait)
      setError(wait ? 'Account API is busy. Wait a moment and look up the address again.' : 'Account data is unavailable. Try looking up the address again.')
      setMessage('Lookup failed.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return <section id="wallet" className="wallet-panel panel" aria-labelledby="wallet-heading">
    <div className="panel-heading"><div className="heading-with-icon"><Icon name="search" size={20} /><h2 id="wallet-heading">Peek into an address</h2></div><span className="quiet-tag"><Icon name="shield" size={14} /> Read-only</span></div>
    <p className="muted wallet-intro">Check Squeeks, staked SQK and claimable rewards. No connection needed.</p>
    <form onSubmit={lookup} noValidate>
      <label htmlFor="wallet-address">Sepolia address</label>
      <div className="lookup-fields">
        <input ref={input} id="wallet-address" name="address" autoComplete="off" autoCapitalize="off" spellCheck={false} value={address} placeholder="0x…" aria-invalid={error.startsWith('Use a nonzero address')} aria-describedby={error ? 'wallet-error wallet-privacy' : 'wallet-privacy'} onChange={event => { request.current?.abort(); setLoading(false); setAddress(event.target.value); setError(''); setResult(null); setMessage('') }} />
        <button type="submit" className="button primary" disabled={loading}><Icon name={loading ? 'refresh' : 'search'} />{loading ? 'Looking up…' : 'Look up address'}</button>
      </div>
      {error && <p className="field-error small" id="wallet-error" role="alert">{error}</p>}
    </form>
    <p className="small muted" id="wallet-privacy">The public API receives the address you submit. Nothing is saved here.</p>
    <p className="sr-only" role="status">{message}</p>
    {result ? <div className="lookup-result">
      <div className="result-top"><span className="small muted">Address checked</span><a className="text-link small" href={`https://eth-sepolia.blockscout.com/address/${result.address}`} target="_blank" rel="noreferrer">View on explorer <Icon name="arrow" size={14} /></a></div>
      <code className="result-address">{result.address}</code>
      {result.wallet === '0' && result.deposited === '0' && <p className="empty-wallet">No Squeeks in this address.</p>}
      <dl className="wallet-values">
        <div><dt>In wallet</dt><dd className="number">{formatInteger(result.wallet)}</dd></div>
        <div><dt>Deposited NFTs</dt><dd className="number">{formatInteger(result.deposited)}</dd></div>
        <div><dt>Staked SQK</dt><dd className="number">{formatSqk(result.staked)}</dd></div>
        <div><dt>Claimable SQK</dt><dd className="number">{formatSqk(result.claimable)}</dd></div>
      </dl>
      <p className="muted small">Snapshot at Sepolia block <span className="number">{formatInteger(result.safeBlock)}</span>. Unknown values appear as —. Look up again to refresh.</p>
    </div> : <div className="wallet-hint"><Icon name="nft" size={30} /><div><p>A small window into your Squeeks.</p><p className="small muted">Paste a public address to get started.</p></div></div>}
  </section>
}
