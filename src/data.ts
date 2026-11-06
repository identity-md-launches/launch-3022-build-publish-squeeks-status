import { ACCOUNT_API, CHAIN_ID, CONTRACTS, RPC_URLS, STATUS_URL } from './config'

type Json = Record<string, unknown>
const object = (v: unknown): Json => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Json : {}
const uint = (v: unknown): string | null => typeof v === 'string' && /^\d+$/.test(v) ? v : null
const date = (v: unknown): string | null => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null

export class FeedError extends Error {
  constructor(message: string, public retryAfterMs = 0) { super(message) }
}

async function jsonRequest(url: string, signal: AbortSignal, body?: unknown): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(9_000)]),
    credentials: 'omit',
    headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    const retry = response.headers.get('Retry-After')
    const seconds = retry && /^\d+(\.\d+)?$/.test(retry) ? Number(retry) : 0
    const until = retry ? Date.parse(retry) - Date.now() : 0
    throw new FeedError(`Request returned ${response.status}`, Math.max(0, seconds * 1_000, until || 0))
  }
  return response.json()
}

export interface WheelData {
  generatedAt: string
  measurement: {
    state: 'ACTIVE' | 'IDLE' | 'COUNTER_FAULT' | 'UNKNOWN'
    rpm: number | null
    fresh: boolean
    observedAt: string | null
    receivedAt: string | null
    staleAfterSeconds: number
    provenance: string | null
  } | null
  blockHeight: string | null
  settledThroughRound: string | null
  difficulty: string | null
  work: string | null
  progress: string | null
  queue: string | null
  oracle: string | null
}

export function parseWheel(input: unknown): WheelData {
  const raw = object(input)
  if (raw.schemaVersion !== 1 || !date(raw.generatedAt)) throw new FeedError('Unsupported status response')
  const measurement = object(raw.measurement)
  const builder = object(raw.builder)
  const anchor = builder.status === 'available' ? object(builder.anchor) : {}
  const queue = object(raw.settlementQueue)
  const state = measurement.coreStatus
  const rpm = typeof measurement.rpmMilli === 'number' && Number.isFinite(measurement.rpmMilli) && measurement.rpmMilli >= 0
    ? measurement.rpmMilli / 1_000 : null
  return {
    generatedAt: date(raw.generatedAt)!,
    measurement: raw.measurement === null || !Object.keys(measurement).length ? null : {
      state: state === 'ACTIVE' || state === 'IDLE' || state === 'COUNTER_FAULT' ? state : 'UNKNOWN',
      rpm,
      fresh: measurement.freshness === 'online',
      observedAt: date(measurement.observedAt),
      receivedAt: date(measurement.receivedAt),
      staleAfterSeconds: typeof measurement.staleAfterSeconds === 'number' ? measurement.staleAfterSeconds : 120,
      provenance: typeof measurement.provenance === 'string' ? measurement.provenance : null,
    },
    blockHeight: uint(anchor.blockHeight),
    settledThroughRound: uint(anchor.settledThroughRound),
    difficulty: uint(anchor.workPerThousandBlocks),
    work: uint(anchor.cumulativeWork),
    progress: uint(anchor.blockProgress),
    queue: queue.status === 'available' && typeof queue.state === 'string' ? queue.state : null,
    oracle: typeof object(raw.oracle).state === 'string' ? object(raw.oracle).state as string : null,
  }
}

export const readWheel = async (signal: AbortSignal) => parseWheel(await jsonRequest(STATUS_URL, signal))

export interface ProtocolData {
  supply: string | null
  issued: string | null
  mergesOpen: boolean | null
  mining: { active: boolean; paused: boolean; started: boolean; fundedBlocks: string; minted: string } | null
  stakingPaused: boolean | null
  totalStaked: string | null
  funded: string | null
  block: string
  source: string
  failedReads: string[]
}

// Function selectors and fixed-width output layouts verified against the published ABIs.
// All methods are views; no provider injection, wallet SDK, signing or transaction method exists.
const reads = [
  { key: 'supply', to: CONTRACTS.nft.address, data: '0x18160ddd', words: 1 },
  { key: 'issued', to: CONTRACTS.nft.address, data: '0xf5be3193', words: 1 },
  { key: 'mergesOpen', to: CONTRACTS.nft.address, data: '0x219067a0', words: 1 },
  { key: 'mining', to: CONTRACTS.mining.address, data: '0xc19d93fb', words: 10 },
  { key: 'stakingPaused', to: CONTRACTS.staking.address, data: '0x5c975abb', words: 1 },
  { key: 'totalStaked', to: CONTRACTS.staking.address, data: '0x817b1cd2', words: 1 },
  { key: 'funded', to: CONTRACTS.staking.address, data: '0x582c7928', words: 10 },
] as const

const rpcCall = (id: number, method: string, params: unknown[]) => ({ jsonrpc: '2.0', id, method, params })
function rpcResult(batch: unknown, id: number): string {
  if (!Array.isArray(batch)) throw new FeedError('Invalid RPC batch')
  const item = batch.map(object).find(entry => entry.id === id)
  if (!item || item.error || typeof item.result !== 'string') throw new FeedError('RPC read unavailable')
  return item.result
}
function decodeWords(value: string, length: number): bigint[] {
  if (!/^0x[0-9a-f]+$/i.test(value) || value.length !== 2 + length * 64) throw new FeedError('Invalid contract response')
  return Array.from({ length }, (_, i) => BigInt(`0x${value.slice(2 + i * 64, 66 + i * 64)}`))
}
function decodeBool(value: bigint): boolean {
  if (value !== 0n && value !== 1n) throw new FeedError('Invalid boolean response')
  return value === 1n
}

let preferredRpc = 0
export async function readProtocol(signal: AbortSignal): Promise<ProtocolData> {
  let lastError: unknown
  for (let attempt = 0; attempt < RPC_URLS.length; attempt++) {
    const index = (preferredRpc + attempt) % RPC_URLS.length
    const source = RPC_URLS[index]
    try {
      const head = await jsonRequest(source, signal, [rpcCall(100, 'eth_chainId', []), rpcCall(101, 'eth_blockNumber', [])])
      if (rpcResult(head, 100).toLowerCase() !== CHAIN_ID) throw new FeedError('RPC is not Sepolia')
      const block = rpcResult(head, 101)
      if (!/^0x[0-9a-f]+$/i.test(block)) throw new FeedError('Invalid block number')
      // Pin every contract in this snapshot to the same Ethereum block.
      const batch = await jsonRequest(source, signal, reads.map((r, i) => rpcCall(i + 1, 'eth_call', [{ to: r.to, data: r.data }, block])))
      const result: ProtocolData = {
        supply: null, issued: null, mergesOpen: null, mining: null, stakingPaused: null,
        totalStaked: null, funded: null, block: BigInt(block).toString(), source, failedReads: [],
      }
      reads.forEach((r, i) => {
        try {
          const words = decodeWords(rpcResult(batch, i + 1), r.words)
          switch (r.key) {
            case 'supply': result.supply = words[0].toString(); break
            case 'issued': result.issued = words[0].toString(); break
            case 'mergesOpen': result.mergesOpen = decodeBool(words[0]); break
            case 'mining': result.mining = {
              minted: words[0].toString(), fundedBlocks: words[4].toString(),
              started: words[2] > 0n, paused: decodeBool(words[8]), active: decodeBool(words[9]),
            }; break
            case 'stakingPaused': result.stakingPaused = decodeBool(words[0]); break
            case 'totalStaked': result.totalStaked = words[0].toString(); break
            case 'funded': result.funded = words[0].toString(); break
          }
        } catch { result.failedReads.push(r.key) }
      })
      if (result.failedReads.length === reads.length) throw new FeedError('Contract views unavailable')
      preferredRpc = index
      return result
    } catch (error) {
      if (signal.aborted) throw error
      lastError = error
    }
  }
  throw lastError
}

export interface AccountData {
  address: string
  wallet: string | null
  deposited: string | null
  staked: string | null
  claimable: string | null
  safeBlock: string
  generatedAt: string | null
}

export function validAddress(value: string): boolean {
  return /^0x[\da-f]{40}$/i.test(value.trim()) && !/^0x0{40}$/i.test(value.trim())
}

export async function readAccount(address: string, signal: AbortSignal): Promise<AccountData> {
  if (!validAddress(address)) throw new FeedError('Use a nonzero address: 0x followed by 40 hexadecimal characters.')
  const normalized = address.trim().toLowerCase()
  const raw = object(await jsonRequest(`${ACCOUNT_API}${normalized}?limit=1`, signal))
  const chain = object(raw.chain)
  const components = object(object(raw.deployment).components)
  const pins = [[components.collection, CONTRACTS.nft.address], [components.mining, CONTRACTS.mining.address], [components.staking, CONTRACTS.staking.address]]
  const matchingDeployment = pins.every(([component, expected]) => typeof object(component).address === 'string' && (object(component).address as string).toLowerCase() === (expected as string).toLowerCase())
  if (raw.schemaVersion !== 3 || raw.status !== 'available' || chain.chainId !== '11155111' || raw.account !== normalized || !uint(chain.safeThroughBlock) || !matchingDeployment) {
    throw new FeedError('Account data is unavailable. Try looking up the address again.')
  }
  const counts = object(raw.tokenCounts)
  return {
    address: normalized,
    wallet: uint(counts.wallet), deposited: uint(counts.staking),
    staked: uint(object(raw.stake).principalBaseUnits), claimable: uint(object(raw.rewards).claimableBaseUnits),
    safeBlock: uint(chain.safeThroughBlock)!, generatedAt: date(raw.generatedAt),
  }
}

export const formatInteger = (value: string | null | undefined): string => value == null ? '—' : BigInt(value).toLocaleString('en-US')
export function formatSqk(value: string | null | undefined): string {
  if (value == null) return '—'
  const n = BigInt(value)
  const whole = n / 10n ** 18n
  const fraction = (n % 10n ** 18n).toString().padStart(18, '0').slice(0, 3).replace(/0+$/, '')
  if (n > 0n && whole === 0n && !fraction) return '<0.001'
  return `${whole.toLocaleString('en-US')}${fraction ? `.${fraction}` : ''}`
}

export function wheelIsFresh(data: WheelData | null, now: number): boolean {
  const m = data?.measurement
  return !!m && m.fresh && !!m.receivedAt && now - Date.parse(m.receivedAt) <= m.staleAfterSeconds * 1_000
}
