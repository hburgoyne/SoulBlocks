# SoulBlocks Smart Contract Specification

## Overview

The SoulBlocks contract is an ERC-721 NFT contract deployed on Base that stores append-only identity data using code-as-storage.

**Key Properties:**
- Immutable (no proxy, no admin functions)
- Fixed supply: 10,000
- Fixed price: 0.02 ETH
- 2048 byte fragment limit
- 64 fragment maximum per token
- Single fragment per append
- On-chain SVG image generation

---

## 1. Contract Parameters

```solidity
// Constants
uint256 public constant MAX_SUPPLY = 10000;
uint256 public constant MINT_PRICE = 0.02 ether;
uint256 public constant MAX_FRAGMENT_SIZE = 2048;
uint256 public constant MAX_FRAGMENTS = 64;
uint256 public constant GENESIS_THRESHOLD = 500;

// Immutable (set at construction)
address public immutable beneficiary;
```

---

## 2. Data Structures

### 2.1 Fragment Storage

```solidity
// tokenId => array of fragment contract addresses
mapping(uint256 => address[]) private _fragments;

// tokenId => genesis block number
mapping(uint256 => uint256) private _genesisBlock;

// tokenId => minter address
mapping(uint256 => address) private _minter;
```

Each address in the fragments array points to a deployed contract whose runtime bytecode contains the fragment content.

### 2.2 Token Counter

```solidity
uint256 private _tokenIdCounter;
```

Tokens are minted sequentially starting from 1.

---

## 3. Core Functions

### 3.1 Minting

```solidity
function mint() external payable returns (uint256 tokenId)
```

**Behavior:**
1. Require `msg.value >= MINT_PRICE`
2. Require `_tokenIdCounter < MAX_SUPPLY`
3. Increment counter and mint token to `msg.sender`
4. Store genesis block number
5. Store minter address
6. Deploy boilerplate fragment
7. Store fragment address
8. Emit events
9. Return token ID

### 3.2 Boilerplate Generation

The boilerplate is generated at mint time and stored as fragment #0 (the first entry in the token's fragment array). It is a separate fragment from any user-appended content — it does not count against or share the 2048-byte limit of subsequent fragments. Each appended fragment gets the full 2048 bytes independently.

```solidity
function _generateBoilerplate(uint256 tokenId) internal view returns (bytes memory) {
    return abi.encodePacked(
        "# Soul Block #", _padTokenId(tokenId), "\n\n",
        "Forged at block ", Strings.toString(block.number), " on the Base blockchain.\n",
        "Minted by ", Strings.toHexString(msg.sender), ".\n",
        "One of 10,000 unique soul vessels.\n\n",
        "While the soul begins bare, everything added below becomes a permanent\n",
        "element of your core identity.\n\n",
        "---\n\n"
    );
}

function _padTokenId(uint256 tokenId) internal pure returns (string memory) {
    // Returns "00042" format (5 digits, zero-padded)
    bytes memory result = new bytes(5);
    for (uint256 i = 5; i > 0; i--) {
        result[i - 1] = bytes1(uint8(48 + (tokenId % 10)));
        tokenId /= 10;
    }
    return string(result);
}
```

### 3.3 Appending Fragments

```solidity
function appendFragment(uint256 tokenId, bytes calldata data) external
```

**Behavior:**
1. Require `_ownerOf(tokenId) == msg.sender`
2. Require `_fragments[tokenId].length < MAX_FRAGMENTS`
3. Require `data.length > 0`
4. Require `data.length <= MAX_FRAGMENT_SIZE`
5. Deploy data as code-storage contract
6. Store fragment address
7. Emit `FragmentAppended` event

### 3.4 Code-as-Storage Deployment

```solidity
function _deployFragment(bytes memory data) internal returns (address) {
    // Creation code that returns data as runtime bytecode
    bytes memory creationCode = abi.encodePacked(
        hex"61",                    // PUSH2
        uint16(data.length),        // length (2 bytes)
        hex"80",                    // DUP1
        hex"600a",                  // PUSH1 0x0a (offset = 10 bytes)
        hex"3d",                    // RETURNDATASIZE (0, used as memory dest)
        hex"39",                    // CODECOPY
        hex"3d",                    // RETURNDATASIZE (0)
        hex"f3",                    // RETURN
        data                        // actual data
    );

    address fragment;
    assembly {
        fragment := create(0, add(creationCode, 0x20), mload(creationCode))
    }
    require(fragment != address(0), "Fragment deployment failed");
    return fragment;
}
```

### 3.5 Reading Fragments

```solidity
function getFragmentCount(uint256 tokenId) external view returns (uint256)
```

Returns the number of fragments for a token.

```solidity
function getFragmentAddress(uint256 tokenId, uint256 index) external view returns (address)
```

Returns the address of a specific fragment.

```solidity
function getFragmentContent(uint256 tokenId, uint256 index) external view returns (bytes memory)
```

Returns the content of a specific fragment by reading the deployed contract's bytecode:

```solidity
function getFragmentContent(uint256 tokenId, uint256 index) external view returns (bytes memory) {
    require(index < _fragments[tokenId].length, "Invalid index");
    address fragment = _fragments[tokenId][index];
    uint256 size;
    assembly {
        size := extcodesize(fragment)
    }
    bytes memory content = new bytes(size);
    assembly {
        extcodecopy(fragment, add(content, 0x20), 0, size)
    }
    return content;
}
```

```solidity
function getAllFragmentAddresses(uint256 tokenId) external view returns (address[] memory)
```

Returns all fragment addresses for a token.

### 3.6 Reconstruction Helper

```solidity
function reconstructSoul(uint256 tokenId) external view returns (string memory)
```

Concatenates all fragment contents separated by `\n\n` (double newline) and returns as a single string. This is a public read function — anyone can call it, not just the token owner. The require check verifies the token exists (has been minted), not that the caller owns it.

**Canonical Separator:** All implementations (contract, website, skills) MUST use `\n\n` as the fragment separator for consistency.

```solidity
function reconstructSoul(uint256 tokenId) external view returns (string memory) {
    require(_ownerOf(tokenId) != address(0), "Token does not exist"); // Existence check, not ownership

    address[] storage frags = _fragments[tokenId];
    bytes memory result;

    for (uint256 i = 0; i < frags.length; i++) {
        if (i > 0) {
            result = abi.encodePacked(result, "\n\n");
        }
        result = abi.encodePacked(result, _readFragment(frags[i]));
    }

    return string(result);
}
```

**Note:** With `MAX_FRAGMENTS = 64` and `MAX_FRAGMENT_SIZE = 2048`, the theoretical maximum soul size is 128KB. This function may approach gas limits for tokens near the fragment cap with large fragments. Frontends should implement their own reconstruction logic (fetching fragments individually) for robustness.

### 3.7 Withdrawal

```solidity
function withdraw() external
```

**Behavior:**
1. Transfer entire contract balance to `beneficiary`
2. No access control (anyone can trigger, funds only go to beneficiary)

```solidity
function withdraw() external {
    (bool success, ) = beneficiary.call{value: address(this).balance}("");
    require(success, "Withdrawal failed");
}
```

---

## 4. Token Metadata

### 4.1 Token URI

```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory)
```

Returns a base64-encoded data URI containing JSON metadata with an embedded SVG image.

```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");

    string memory tokenIdStr = _padTokenId(tokenId);
    string memory svg = _generateSVG(tokenId);
    string memory svgBase64 = Base64.encode(bytes(svg));

    // Build attributes array
    string memory attributes = string(abi.encodePacked(
        '{"trait_type":"Fragment Count","value":', Strings.toString(_fragments[tokenId].length), '},',
        '{"trait_type":"Genesis Block","value":', Strings.toString(_genesisBlock[tokenId]), '}'
    ));

    // Add Genesis attribute for tokens #1-500
    if (tokenId <= GENESIS_THRESHOLD) {
        attributes = string(abi.encodePacked(
            attributes,
            ',{"trait_type":"Genesis","value":"Yes"}'
        ));
    }

    string memory json = string(abi.encodePacked(
        '{"name":"Soul Block #', tokenIdStr, '",',
        '"description":"An append-only identity vessel on the Base blockchain. One of 10,000 unique souls.",',
        '"image":"data:image/svg+xml;base64,', svgBase64, '",',
        '"external_url":"https://soulblocks.ai/soul/', Strings.toString(tokenId), '",',
        '"attributes":[', attributes, ']}'
    ));

    return string(abi.encodePacked(
        "data:application/json;base64,",
        Base64.encode(bytes(json))
    ));
}
```

### 4.2 SVG Generation

```solidity
uint256 public constant GENESIS_THRESHOLD = 500;

function _generateSVG(uint256 tokenId) internal pure returns (string memory) {
    string memory tokenIdStr = _padTokenId(tokenId);

    // Genesis badge for tokens #1-500
    string memory genesisBadge = "";
    if (tokenId <= GENESIS_THRESHOLD) {
        genesisBadge = '<text x="922" y="840" fill="#ffffff" font-family="monospace" font-size="48" font-weight="500" text-anchor="end">GENESIS</text>';
    }

    return string(abi.encodePacked(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">',
        '<rect width="1024" height="1024" fill="#000000"/>',
        '<text x="102" y="200" fill="#ffffff" font-family="monospace" font-size="123" font-weight="500">Soul Blocks</text>',
        '<text x="88" y="377" fill="#ffffff" font-family="monospace" font-size="163" font-weight="500">:~$</text>',
        '<text x="102" y="840" fill="#ffffff" font-family="monospace" font-size="68" font-weight="500">#',
        tokenIdStr,
        '/10000</text>',
        genesisBadge,
        '</svg>'
    ));
}
```

### 4.3 Contract URI

```solidity
function contractURI() external pure returns (string memory)
```

Returns collection-level metadata for marketplaces:

```solidity
function contractURI() external pure returns (string memory) {
    return "data:application/json;base64,eyJuYW1lIjoiU291bEJsb2NrcyIsImRlc2NyaXB0aW9uIjoiT24tY2hhaW4sIGFwcGVuZC1vbmx5IGlkZW50aXR5IGZvciBBSSBhZ2VudHMuIDEwLDAwMCB1bmlxdWUgc291bCB2ZXNzZWxzIG9uIEJhc2UuIiwiZXh0ZXJuYWxfbGluayI6Imh0dHBzOi8vc291bGJsb2Nrcy5haSIsImltYWdlIjoiaHR0cHM6Ly9zb3VsYmxvY2tzLmFpL2NvbGxlY3Rpb24ucG5nIn0=";
}
```

Decoded:
```json
{
    "name": "SoulBlocks",
    "description": "On-chain, append-only identity for AI agents. 10,000 unique soul vessels on Base.",
    "external_link": "https://soulblocks.ai",
    "image": "https://soulblocks.ai/collection.png"
}
```

---

## 5. Events

```solidity
event FragmentAppended(
    uint256 indexed tokenId,
    address indexed fragment,
    uint256 byteLength,
    uint256 fragmentIndex
);
```

Emitted for each fragment appended (including boilerplate at mint).

---

## 6. Error Handling

```solidity
error InsufficientPayment();
error MaxSupplyReached();
error NotTokenOwner();
error FragmentTooLarge();
error FragmentEmpty();
error MaxFragmentsReached();
error InvalidTokenId();
error WithdrawalFailed();
```

Use custom errors for gas efficiency.

---

## 7. Inheritance

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract SoulBlocks is ERC721, ERC721Enumerable {
    // ...
}
```

Use OpenZeppelin v5.x for battle-tested implementations.

---

## 8. Gas Estimates

### 8.1 Minting
- Base mint: ~100k gas
- Boilerplate deployment (~300 bytes): ~90k gas
- **Total mint: ~190k gas**

### 8.2 Appending
- Per fragment deployment: ~32k base + ~200 gas per byte
- 2048 byte fragment: ~440k gas
- 512 byte fragment: ~135k gas

On Base at typical gas prices (~0.001 gwei), costs are negligible (~$0.01-0.10).

---

## 9. Security Considerations

1. **No reentrancy risk:** Withdrawal uses call pattern with no state changes after
2. **No overflow:** Using Solidity 0.8.x with built-in overflow checks
3. **Fragment deployment:** CREATE cannot fail silently; we check for zero address
4. **No admin functions:** Contract is fully immutable after deployment
5. **Size enforcement:** Only contract enforces 2048 byte limit and 64 fragment cap
6. **No token burning:** The contract does not implement burn functionality. Once minted, a Soul Block exists forever. This is intentional — souls are permanent.
7. **Non-existent token handling:** All read functions (`getFragmentCount`, `getGenesisBlock`, `getMinter`, `tokenURI`) revert for non-existent token IDs with `InvalidTokenId()` error.
8. **Constructor validation:** Beneficiary address must not be zero address; constructor reverts if `beneficiary == address(0)`.

---

## 10. Testing Requirements

### Unit Tests
- [ ] Minting increments token ID correctly
- [ ] Minting deploys boilerplate fragment with correct content
- [ ] Minting records genesis block and minter address
- [ ] Minting fails when max supply reached
- [ ] Minting fails with insufficient payment
- [ ] Append fails for non-owner
- [ ] Append fails for fragments exceeding 2048 bytes
- [ ] Append fails for empty fragments
- [ ] Append fails when token has reached 64 fragments
- [ ] Fragment content can be read correctly via EXTCODECOPY
- [ ] Withdrawal sends funds to beneficiary
- [ ] tokenURI returns valid JSON with embedded SVG
- [ ] SVG contains correct token ID (zero-padded)

### Integration Tests
- [ ] Full mint → append → read flow
- [ ] Reconstruction produces valid UTF-8
- [ ] Transfer updates ownership correctly
- [ ] Events are emitted correctly
- [ ] OpenSea displays metadata correctly

---

## 11. Complete Interface

```solidity
interface ISoulBlocks {
    // Events
    event FragmentAppended(uint256 indexed tokenId, address indexed fragment, uint256 byteLength, uint256 fragmentIndex);

    // Minting
    function mint() external payable returns (uint256);

    // Appending
    function appendFragment(uint256 tokenId, bytes calldata data) external;

    // Reading
    function getFragmentCount(uint256 tokenId) external view returns (uint256);
    function getFragmentAddress(uint256 tokenId, uint256 index) external view returns (address);
    function getFragmentContent(uint256 tokenId, uint256 index) external view returns (bytes memory);
    function getAllFragmentAddresses(uint256 tokenId) external view returns (address[] memory);
    function reconstructSoul(uint256 tokenId) external view returns (string memory);

    // Metadata
    function getGenesisBlock(uint256 tokenId) external view returns (uint256);
    function getMinter(uint256 tokenId) external view returns (address);

    // Admin
    function withdraw() external;

    // Constants
    function MAX_SUPPLY() external view returns (uint256);
    function MINT_PRICE() external view returns (uint256);
    function MAX_FRAGMENT_SIZE() external view returns (uint256);
    function MAX_FRAGMENTS() external view returns (uint256);
    function GENESIS_THRESHOLD() external view returns (uint256);
    function beneficiary() external view returns (address);
}
```

---

## 12. File Structure

```
contracts/
├── src/
│   └── SoulBlocks.sol           # Main contract
├── script/
│   └── Deploy.s.sol             # Deployment script
├── test/
│   └── SoulBlocks.t.sol         # Foundry tests
├── foundry.toml                 # Foundry config
└── .env.example                 # Environment template
```
