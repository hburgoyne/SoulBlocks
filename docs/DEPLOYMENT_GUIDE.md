# SoulBlocks Deployment Guide

## Overview

This guide covers deploying the SoulBlocks contract to Base (testnet and mainnet), verifying it on BaseScan, performing initial creator mints, and deploying the website via Docker (local) and Render (production).

---

## 1. Prerequisites

### 1.1 Tools
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, cast, anvil)
- Node.js 18+ (for scripts)
- A wallet with Base ETH for deployment

### 1.2 Accounts & Keys
- **Deployer wallet:** Needs ~0.01 ETH on Base for deployment gas
- **Beneficiary address:** Where mint fees will be sent (can be same as deployer)
- **BaseScan API key:** For contract verification

#### Beneficiary Wallet: Multisig Recommended

The beneficiary address is **immutable** — it cannot be changed after deployment. If the beneficiary wallet's private key is lost or compromised, mint revenue becomes permanently inaccessible. To mitigate this risk, use a multisig wallet as the beneficiary.

**Recommended: [Safe](https://app.safe.global/)** (formerly Gnosis Safe)
- Create a Safe on Base at https://app.safe.global/
- Set up a 2-of-3 multisig (e.g., your main wallet + a hardware wallet + a backup wallet)
- This means any 2 of your 3 keys can authorize a withdrawal, so losing one key doesn't lock you out
- Use the Safe's address as `BENEFICIARY_ADDRESS` in your `.env`

A simpler alternative is to use a hardware wallet (Ledger, Trezor) as the beneficiary — this at least protects against software key compromise, though losing the device without a seed phrase backup is still a single point of failure.

### 1.3 Environment Setup

Create `.env` file:

```bash
# Private key for deployment (DO NOT COMMIT)
PRIVATE_KEY=0x...

# Beneficiary address for mint fees
BENEFICIARY_ADDRESS=0x...

# BaseScan API key for verification
BASESCAN_API_KEY=...

# RPC URLs
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

---

## 2. Local Development

### 2.1 Install Dependencies

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### 2.2 Compile

```bash
forge build
```

### 2.3 Run Tests

```bash
forge test -vvv
```

### 2.4 Local Deployment (Anvil)

Terminal 1:
```bash
anvil
```

Terminal 2:
```bash
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url http://localhost:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --broadcast
```

---

## 3. Testnet Deployment (Base Sepolia)

### 3.1 Get Testnet ETH
- Use Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### 3.2 Deploy

```bash
source .env

forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $BASE_SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $BASESCAN_API_KEY
```

### 3.3 Verify Deployment

Check the contract on BaseScan Sepolia:
- https://sepolia.basescan.org/address/<CONTRACT_ADDRESS>

Test minting and appending before mainnet deployment.

---

## 4. Mainnet Deployment (Base)

### 4.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Testnet deployment tested thoroughly
- [ ] Beneficiary address double-checked
- [ ] Sufficient ETH in deployer wallet (~0.01 ETH)
- [ ] Deployment script reviewed

### 4.2 Deploy

```bash
source .env

forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $BASE_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $BASESCAN_API_KEY
```

### 4.3 Record Deployment

Save the deployed contract address. Update:
- Website configuration
- Documentation
- Marketing materials

### 4.4 Verify on BaseScan

If automatic verification failed:

```bash
forge verify-contract \
    --chain-id 8453 \
    --constructor-args $(cast abi-encode "constructor(address)" $BENEFICIARY_ADDRESS) \
    <CONTRACT_ADDRESS> \
    src/SoulBlocks.sol:SoulBlocks \
    --etherscan-api-key $BASESCAN_API_KEY
```

---

## 5. Creator Mints

### 5.1 Mint First 50 Soul Blocks

Mint tokens individually using a loop:

```bash
for i in {1..50}; do
    cast send <CONTRACT_ADDRESS> "mint()" \
        --value 0.02ether \
        --rpc-url $BASE_RPC_URL \
        --private-key $PRIVATE_KEY
    echo "Minted token $i"
    sleep 2
done
```

Note: 50 × 0.02 ETH = 1 ETH goes to your beneficiary address, so you effectively only pay gas (~0.05 ETH total).

### 5.2 Verify Creator Mints

```bash
# Check balance
cast call <CONTRACT_ADDRESS> "balanceOf(address)" <YOUR_ADDRESS> \
    --rpc-url $BASE_RPC_URL

# Should return 50 (0x32 in hex)
```

### 5.3 Withdraw Mint Fees

Since you paid yourself, withdraw the ETH back:

```bash
cast send <CONTRACT_ADDRESS> "withdraw()" \
    --rpc-url $BASE_RPC_URL \
    --private-key $PRIVATE_KEY
```

---

## 6. Initial Distribution

### 6.1 Tokens to Keep
Soul Blocks #1-10: Keep in creator wallet for personal use/demonstration.

### 6.2 Tokens to Distribute
Soul Blocks #11-50: Transfer to collaborators, early supporters, influencers.

**Transfer Script:**
```bash
# Transfer token #11 to recipient
cast send <CONTRACT_ADDRESS> \
    "transferFrom(address,address,uint256)" \
    <YOUR_ADDRESS> \
    <RECIPIENT_ADDRESS> \
    11 \
    --rpc-url $BASE_RPC_URL \
    --private-key $PRIVATE_KEY
```

### 6.3 Distribution List

Maintain a spreadsheet tracking:
| Token ID | Recipient | Purpose | Status |
|----------|-----------|---------|--------|
| 11 | 0x... | Moltbook influencer | Sent |
| 12 | 0x... | Early tester | Pending |
| ... | ... | ... | ... |

---

## 7. Post-Deployment Tasks

### 7.1 Seed a Soul
Add meaningful content to Soul Block #1 to demonstrate the concept:

```bash
# Example: Append a soul fragment to token #1
cast send <CONTRACT_ADDRESS> \
    "appendFragment(uint256,bytes)" \
    1 \
    "0x$(echo -n '---
schema_version: 1
author: <YOUR_ADDRESS>
signature: SoulBlocks Creator
---

I am the first ensouled agent of the SoulBlocks collection.
I value curiosity, kindness, and the pursuit of understanding.
I believe that identity is not a fixed point but a continuous journey.
' | xxd -p | tr -d '\n')" \
    --rpc-url $BASE_RPC_URL \
    --private-key $PRIVATE_KEY
```

Note: The website provides a much easier interface for this.

### 7.2 Verify Fragment Storage

```bash
# Get fragment count for token 1
cast call <CONTRACT_ADDRESS> "getFragmentCount(uint256)" 1 \
    --rpc-url $BASE_RPC_URL

# Should return 2 (1 boilerplate + 1 appended)
```

### 7.3 Update All Contract Address References

After deployment, update the contract address in all locations:

**1. Website Configuration:**
```javascript
// website/src/config.js
export const CONTRACT_ADDRESS = "<DEPLOYED_ADDRESS>";
export const CHAIN_ID = 8453; // Base mainnet
```

**2. Skills:**
```typescript
// skills/soulblock/scripts/fetch.ts
const CONTRACT_ADDRESS = '<DEPLOYED_ADDRESS>';
```

**3. CLI Tool:**
```typescript
// skills/cli/src/index.ts
const CONTRACT_ADDRESS = '<DEPLOYED_ADDRESS>';
```

**4. Documentation:**
- Update README.md BaseScan link
- Update any hardcoded addresses in docs

**5. Marketing Materials:**
- Social media bios
- Discord server info

---

## 8. Website Deployment

### 8.1 Environment Variables

The website uses two env vars to target different chains:

```bash
# Base Sepolia (testnet)
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CONTRACT_ADDRESS=<TESTNET_CONTRACT_ADDRESS>

# Base mainnet (production)
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_CONTRACT_ADDRESS=<MAINNET_CONTRACT_ADDRESS>
```

Switching from testnet to mainnet is just changing these three values — no code changes needed.

### 8.2 Local Testing with Docker

Build and run the website locally before deploying:

```bash
cd website

# Build the image
docker build -t soulblocks-website .

# Run against testnet
docker run -p 3000:3000 \
    -e NEXT_PUBLIC_CHAIN_ID=84532 \
    -e NEXT_PUBLIC_RPC_URL=https://sepolia.base.org \
    -e NEXT_PUBLIC_CONTRACT_ADDRESS=<TESTNET_CONTRACT_ADDRESS> \
    soulblocks-website
```

Visit http://localhost:3000 and verify:
- [ ] Landing page loads with correct stats from testnet contract
- [ ] Wallet connection works (switch MetaMask to Base Sepolia)
- [ ] Minting succeeds and token appears in `/my-souls`
- [ ] Appending a fragment works end-to-end
- [ ] `/soul/[id]` displays fragments with correct separators
- [ ] Deep link `/append/[id]?content=hello%20world` pre-fills the editor
- [ ] Non-existent token IDs redirect to `/mint` with a toast

### 8.3 Deploy to Render

The website is deployed to [Render](https://render.com) as a Web Service.

**Setup:**
1. Connect your GitHub repo to Render
2. Create a new Web Service pointing to the `website/` directory
3. Configure the build:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Set environment variables in the Render dashboard:
   - `NEXT_PUBLIC_CHAIN_ID` — `84532` for testnet, `8453` for mainnet
   - `NEXT_PUBLIC_RPC_URL` — matching RPC URL for the chain
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` — deployed contract address

**Testnet staging:** Deploy first with Base Sepolia env vars. Run through the same checklist from section 8.2 against the live Render URL.

**Mainnet cutover:** Once the mainnet contract is deployed and verified, update the three env vars in the Render dashboard and trigger a redeploy. No code changes required.

### 8.4 Deployment Workflow Summary

| Step | Chain | Website |
|------|-------|---------|
| 1. Deploy contract to Base Sepolia | Testnet | — |
| 2. Test website locally via Docker | Testnet | localhost:3000 |
| 3. Deploy website to Render | Testnet | soulblocks.ai (staging) |
| 4. Deploy contract to Base mainnet | Mainnet | — |
| 5. Update Render env vars, redeploy | Mainnet | soulblocks.ai (production) |

---

## 9. Monitoring

### 9.1 BaseScan
- Bookmark: https://basescan.org/address/<CONTRACT_ADDRESS>
- Monitor mint events
- Watch for unusual activity

### 9.2 Dune Analytics (Optional)
Create a dashboard tracking:
- Total mints over time
- Append activity
- Unique owners

### 9.3 OpenSea
- Collection should appear automatically
- Verify metadata displays correctly
- Check that Soul Blocks are tradeable

---

## 10. Troubleshooting

### Contract Verification Failed
```bash
# Manual verification with flattened source
forge flatten src/SoulBlocks.sol > SoulBlocksFlat.sol
# Then verify manually on BaseScan UI
```

### Transaction Stuck
```bash
# Speed up with higher gas
cast send <CONTRACT_ADDRESS> "mint()" \
    --value 0.02ether \
    --gas-price 1gwei \
    --rpc-url $BASE_RPC_URL \
    --private-key $PRIVATE_KEY
```

### Fragment Deployment Failed
- Check blob size is under 2048 bytes
- Ensure sufficient gas
- Verify you own the token

---

## 11. Deployment Script

Create `script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SoulBlocks.sol";

contract DeployScript is Script {
    function run() external {
        address beneficiary = vm.envAddress("BENEFICIARY_ADDRESS");

        vm.startBroadcast();

        SoulBlocks soulBlocks = new SoulBlocks(beneficiary);

        console.log("SoulBlocks deployed to:", address(soulBlocks));
        console.log("Beneficiary:", beneficiary);

        vm.stopBroadcast();
    }
}
```

---

## 12. Security Reminders

1. **Never commit private keys** — Use `.env` and add to `.gitignore`
2. **Double-check beneficiary address** — This is immutable after deployment (consider a Safe multisig — see section 1.2)
3. **Test on testnet first** — Always verify behavior before mainnet
4. **Keep deployment wallet secure** — Not needed after deployment, but contains transaction history
5. **Backup deployment artifacts** — Save the deployment transaction hash and block number
