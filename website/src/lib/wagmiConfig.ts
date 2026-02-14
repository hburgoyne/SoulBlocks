import { type CreateConnectorFn, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

function getChainId(): number {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return chainId ? parseInt(chainId, 10) : 8453;
}

function getRpcUrl(): string {
  return process.env.NEXT_PUBLIC_RPC_URL ?? 'https://mainnet.base.org';
}

function getConnectors(): CreateConnectorFn[] {
  const connectors: CreateConnectorFn[] = [injected(), coinbaseWallet({ appName: 'SoulBlocks' })];
  const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (wcProjectId) {
    connectors.push(walletConnect({ projectId: wcProjectId }));
  }
  return connectors;
}

const isTestnet = getChainId() === 84532;

export const wagmiConfig = isTestnet
  ? createConfig({
      chains: [baseSepolia],
      connectors: getConnectors(),
      transports: {
        [baseSepolia.id]: http(getRpcUrl()),
      },
    })
  : createConfig({
      chains: [base],
      connectors: getConnectors(),
      transports: {
        [base.id]: http(getRpcUrl()),
      },
    });
