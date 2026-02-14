export function padTokenId(id: number): string {
  return String(id).padStart(5, '0');
}

export function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAge(genesisBlock: bigint, currentBlock: bigint): string {
  const blockDiff = currentBlock - genesisBlock;
  if (blockDiff <= 0n) return 'Born just now';

  const secondsPerBlock = 2n;
  const totalSeconds = blockDiff * secondsPerBlock;
  const days = totalSeconds / 86400n;

  if (days === 0n) {
    const hours = totalSeconds / 3600n;
    if (hours === 0n) {
      const minutes = totalSeconds / 60n;
      if (minutes === 0n) return 'Born just now';
      return `Born ${minutes} minute${minutes === 1n ? '' : 's'} ago`;
    }
    return `Born ${hours} hour${hours === 1n ? '' : 's'} ago`;
  }

  return `Born ${days} day${days === 1n ? '' : 's'} ago`;
}

export function getByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function decodeHexContent(hex: `0x${string}`): string {
  const stripped = hex.slice(2);
  const bytes = new Uint8Array(stripped.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/** Returns the expected chain ID from env, defaulting to Base mainnet. */
export function getExpectedChainId(): number {
  const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return envChainId ? Number(envChainId) : 8453;
}

export function isTokenNotFoundError(error: unknown): boolean {
  const message = extractMessage(error);
  return (
    message.includes('InvalidTokenId') ||
    message.includes('Token does not exist') ||
    message.includes('ERC721NonexistentToken') ||
    message.includes('ERC721: invalid token ID') ||
    message.includes('nonexistent token')
  );
}

export function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return 'An unknown error occurred.';
  }

  const message = extractMessage(error);

  if (message.includes('InvalidTokenId') || message.includes('Token does not exist')) {
    return 'This Soul Block does not exist.';
  }
  if (message.includes('NotTokenOwner') || message.includes('Not token owner')) {
    return 'You are not the owner of this Soul Block.';
  }
  if (message.includes('FragmentTooLarge') || (message.includes('Fragment') && message.includes('large'))) {
    return 'Fragment exceeds the 2048 byte limit.';
  }
  if (message.includes('FragmentEmpty')) {
    return 'Fragment content cannot be empty.';
  }
  if (message.includes('MaxFragmentsReached')) {
    return 'This Soul Block has reached its maximum of 64 fragments.';
  }
  if (message.includes('InsufficientPayment') || message.includes('Insufficient')) {
    return 'Insufficient payment. Minting costs 0.02 ETH.';
  }
  if (message.includes('MaxSupplyReached') || message.includes('Max supply')) {
    return 'All 10,000 Soul Blocks have been minted.';
  }
  if (message.includes('WithdrawalFailed')) {
    return 'Withdrawal failed.';
  }
  if (message.includes('User rejected') || message.includes('user rejected') || message.includes('ACTION_REJECTED')) {
    return 'Transaction was rejected.';
  }
  if (message.includes('insufficient funds')) {
    return 'Insufficient funds in your wallet.';
  }

  return 'Network error - please try again.';
}

function extractMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (typeof error !== 'object' || error === null) return '';

  const err = error as Record<string, unknown>;

  if (typeof err.shortMessage === 'string') return err.shortMessage;
  if (typeof err.reason === 'string') return err.reason;
  if (typeof err.message === 'string') return err.message;
  if (err.cause) return extractMessage(err.cause);

  return '';
}
