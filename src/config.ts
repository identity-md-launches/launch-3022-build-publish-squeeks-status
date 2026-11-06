export const STATUS_URL = 'https://api.squeekchain.com/v1/status'
export const ACCOUNT_API = 'https://api.squeekchain.com/v1/accounts/'
export const DOCS_URL = 'https://docs.squeekchain.com'
export const SQUEEKS_URL = 'https://sepolia.squeekchain.com/squeeks'
export const RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://sepolia.drpc.org',
] as const
export const CHAIN_ID = '0xaa36a7'
export const POLL_MS = 2_000
export const CONTRACTS = {
  nft: { name: 'SqueekNFT', address: '0xC4C7982657f00509548F3a3a41db7FA439a6856B' },
  mining: { name: 'SqueekMining', address: '0x2dccb11fcc2defdd188555e45acb52231e82e218' },
  staking: { name: 'SqueekStaking', address: '0x50fd1780526c3186a0c037c7622203bc4fb611ca' },
} as const
