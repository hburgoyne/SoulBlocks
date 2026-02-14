import { type Address } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';

export const SOULBLOCKS_ABI = [
  // Constants
  {
    type: 'function',
    name: 'MAX_SUPPLY',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MINT_PRICE',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_FRAGMENT_SIZE',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_FRAGMENTS',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'GENESIS_THRESHOLD',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'beneficiary',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },

  // ERC721 standard
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },

  // ERC721Enumerable
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenOfOwnerByIndex',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },

  // Collection metadata
  {
    type: 'function',
    name: 'contractURI',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'pure',
  },

  // Minting
  {
    type: 'function',
    name: 'mint',
    inputs: [],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'payable',
  },

  // Fragment operations
  {
    type: 'function',
    name: 'appendFragment',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getFragmentCount',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getFragmentAddress',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getFragmentContent',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: 'content', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAllFragmentAddresses',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'reconstructSoul',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },

  // Metadata views
  {
    type: 'function',
    name: 'getGenesisBlock',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMinter',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },

  // Withdrawal
  {
    type: 'function',
    name: 'withdraw',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // Events
  {
    type: 'event',
    name: 'FragmentAppended',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'fragment', type: 'address', indexed: true },
      { name: 'byteLength', type: 'uint256', indexed: false },
      { name: 'fragmentIndex', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'approved', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'ApprovalForAll',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'operator', type: 'address', indexed: true },
      { name: 'approved', type: 'bool', indexed: false },
    ],
  },

  // Errors
  { type: 'error', name: 'InsufficientPayment', inputs: [] },
  { type: 'error', name: 'MaxSupplyReached', inputs: [] },
  { type: 'error', name: 'NotTokenOwner', inputs: [] },
  { type: 'error', name: 'FragmentTooLarge', inputs: [] },
  { type: 'error', name: 'FragmentEmpty', inputs: [] },
  { type: 'error', name: 'MaxFragmentsReached', inputs: [] },
  { type: 'error', name: 'InvalidTokenId', inputs: [] },
  { type: 'error', name: 'WithdrawalFailed', inputs: [] },
] as const;

export function getContractAddress(): Address {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    // Return zero address during build/SSR when env var is not yet available.
    // Actual contract calls only happen client-side where the env must be set.
    return '0x0000000000000000000000000000000000000000' as Address;
  }
  return address as Address;
}

function getChainId(): number {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return chainId ? parseInt(chainId, 10) : 8453;
}

export function getChain() {
  const chainId = getChainId();
  switch (chainId) {
    case 84532:
      return baseSepolia;
    case 8453:
    default:
      return base;
  }
}

export function getExplorerUrl(): string {
  const chain = getChain();
  const explorer = chain.blockExplorers?.default;
  return explorer?.url ?? 'https://basescan.org';
}

export function getContractExplorerUrl(): string {
  return `${getExplorerUrl()}/address/${getContractAddress()}`;
}

export function getTransactionExplorerUrl(hash: string): string {
  return `${getExplorerUrl()}/tx/${hash}`;
}

export function getAddressExplorerUrl(address: string): string {
  return `${getExplorerUrl()}/address/${address}`;
}
