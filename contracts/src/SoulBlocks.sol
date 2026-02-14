// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @title SoulBlocks
/// @notice ERC-721 NFT collection storing append-only identity data for AI agents using code-as-storage.
/// @dev 10,000 tokens, 0.02 ETH mint price, fully immutable (no admin keys, no proxy, no upgrades).
contract SoulBlocks is ERC721, ERC721Enumerable {
    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PRICE = 0.02 ether;
    uint256 public constant MAX_FRAGMENT_SIZE = 2048;
    uint256 public constant MAX_FRAGMENTS = 64;
    uint256 public constant GENESIS_THRESHOLD = 500;

    // -------------------------------------------------------------------------
    // Immutables
    // -------------------------------------------------------------------------

    address public immutable beneficiary;

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    mapping(uint256 => address[]) private _fragments;
    mapping(uint256 => uint256) private _genesisBlock;
    mapping(uint256 => address) private _minter;
    uint256 private _tokenIdCounter;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event FragmentAppended(
        uint256 indexed tokenId,
        address indexed fragment,
        uint256 byteLength,
        uint256 fragmentIndex
    );

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error InsufficientPayment();
    error MaxSupplyReached();
    error NotTokenOwner();
    error FragmentTooLarge();
    error FragmentEmpty();
    error MaxFragmentsReached();
    error InvalidTokenId();
    error InvalidBeneficiary();
    error FragmentDeploymentFailed();
    error WithdrawalFailed();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /// @notice Deploys the SoulBlocks contract with an immutable beneficiary for mint revenue.
    /// @param _beneficiary Address that receives all ETH from withdrawals. Cannot be zero address.
    constructor(address _beneficiary) ERC721("SoulBlocks", "SOUL") {
        if (_beneficiary == address(0)) revert InvalidBeneficiary();
        beneficiary = _beneficiary;
    }

    // -------------------------------------------------------------------------
    // Minting
    // -------------------------------------------------------------------------

    /// @notice Mints a new Soul Block to the caller.
    /// @return tokenId The ID of the newly minted token (sequential, starting at 1).
    function mint() external payable returns (uint256 tokenId) {
        if (msg.value < MINT_PRICE) revert InsufficientPayment();
        if (_tokenIdCounter >= MAX_SUPPLY) revert MaxSupplyReached();

        _tokenIdCounter++;
        tokenId = _tokenIdCounter;

        _genesisBlock[tokenId] = block.number;
        _minter[tokenId] = msg.sender;

        bytes memory boilerplate = _generateBoilerplate(tokenId);
        address fragment = _deployFragment(boilerplate);
        _fragments[tokenId].push(fragment);

        emit FragmentAppended(tokenId, fragment, boilerplate.length, 0);

        _safeMint(msg.sender, tokenId);
    }

    // -------------------------------------------------------------------------
    // Appending
    // -------------------------------------------------------------------------

    /// @notice Appends a new fragment to an existing Soul Block. Only the token owner may call this.
    /// @param tokenId The token to append to.
    /// @param data The raw bytes of the fragment content (1-2048 bytes).
    function appendFragment(uint256 tokenId, bytes calldata data) external {
        if (_ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (_fragments[tokenId].length >= MAX_FRAGMENTS) revert MaxFragmentsReached();
        if (data.length == 0) revert FragmentEmpty();
        if (data.length > MAX_FRAGMENT_SIZE) revert FragmentTooLarge();

        address fragment = _deployFragment(data);
        uint256 fragmentIndex = _fragments[tokenId].length;
        _fragments[tokenId].push(fragment);

        emit FragmentAppended(tokenId, fragment, data.length, fragmentIndex);
    }

    // -------------------------------------------------------------------------
    // Reading Fragments
    // -------------------------------------------------------------------------

    /// @notice Returns the number of fragments stored for a token.
    /// @param tokenId The token to query.
    /// @return The fragment count.
    function getFragmentCount(uint256 tokenId) external view returns (uint256) {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        return _fragments[tokenId].length;
    }

    /// @notice Returns the deployed contract address of a specific fragment.
    /// @param tokenId The token to query.
    /// @param index The zero-based fragment index.
    /// @return The fragment contract address.
    function getFragmentAddress(uint256 tokenId, uint256 index) external view returns (address) {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        if (index >= _fragments[tokenId].length) revert InvalidTokenId();
        return _fragments[tokenId][index];
    }

    /// @notice Returns the raw content of a specific fragment by reading deployed bytecode.
    /// @param tokenId The token to query.
    /// @param index The zero-based fragment index.
    /// @return content The fragment content as bytes.
    function getFragmentContent(uint256 tokenId, uint256 index) external view returns (bytes memory content) {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        if (index >= _fragments[tokenId].length) revert InvalidTokenId();

        address fragment = _fragments[tokenId][index];
        content = _readFragment(fragment);
    }

    /// @notice Returns all fragment contract addresses for a token.
    /// @param tokenId The token to query.
    /// @return The array of fragment addresses.
    function getAllFragmentAddresses(uint256 tokenId) external view returns (address[] memory) {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        return _fragments[tokenId];
    }

    /// @notice Concatenates all fragment contents with double-newline separators.
    /// @param tokenId The token to reconstruct.
    /// @return The full soul content as a string.
    function reconstructSoul(uint256 tokenId) external view returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();

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

    // -------------------------------------------------------------------------
    // Metadata Views
    // -------------------------------------------------------------------------

    /// @notice Returns the block number at which a token was minted.
    /// @param tokenId The token to query.
    /// @return The genesis block number.
    function getGenesisBlock(uint256 tokenId) external view returns (uint256) {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        return _genesisBlock[tokenId];
    }

    /// @notice Returns the address that originally minted a token.
    /// @param tokenId The token to query.
    /// @return The minter address.
    function getMinter(uint256 tokenId) external view returns (address) {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        return _minter[tokenId];
    }

    // -------------------------------------------------------------------------
    // Token URI
    // -------------------------------------------------------------------------

    /// @notice Returns base64-encoded JSON metadata with an embedded SVG image.
    /// @param tokenId The token to generate metadata for.
    /// @return The data URI string.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();

        string memory tokenIdStr = _padTokenId(tokenId);
        string memory svg = _generateSVG(tokenId);
        string memory svgBase64 = Base64.encode(bytes(svg));

        string memory attributes = string(abi.encodePacked(
            '{"trait_type":"Fragment Count","value":', Strings.toString(_fragments[tokenId].length), '},',
            '{"trait_type":"Genesis Block","value":', Strings.toString(_genesisBlock[tokenId]), '}'
        ));

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

    // -------------------------------------------------------------------------
    // Contract URI
    // -------------------------------------------------------------------------

    /// @notice Returns collection-level metadata for marketplaces.
    /// @return The base64-encoded data URI with collection metadata JSON.
    function contractURI() external pure returns (string memory) {
        return "data:application/json;base64,eyJuYW1lIjoiU291bEJsb2NrcyIsImRlc2NyaXB0aW9uIjoiT24tY2hhaW4sIGFwcGVuZC1vbmx5IGlkZW50aXR5IGZvciBBSSBhZ2VudHMuIDEwLDAwMCB1bmlxdWUgc291bCB2ZXNzZWxzIG9uIEJhc2UuIiwiZXh0ZXJuYWxfbGluayI6Imh0dHBzOi8vc291bGJsb2Nrcy5haSIsImltYWdlIjoiaHR0cHM6Ly9zb3VsYmxvY2tzLmFpL2NvbGxlY3Rpb24ucG5nIn0=";
    }

    // -------------------------------------------------------------------------
    // Withdrawal
    // -------------------------------------------------------------------------

    /// @notice Sends the entire contract balance to the immutable beneficiary. Anyone can call this.
    function withdraw() external {
        (bool success, ) = beneficiary.call{value: address(this).balance}("");
        if (!success) revert WithdrawalFailed();
    }

    // -------------------------------------------------------------------------
    // Internal: Fragment Deployment
    // -------------------------------------------------------------------------

    /// @dev Deploys data as runtime bytecode via CREATE opcode and returns the address.
    function _deployFragment(bytes memory data) internal returns (address) {
        bytes memory creationCode = abi.encodePacked(
            hex"61",
            uint16(data.length),
            hex"80",
            hex"600a",
            hex"3d",
            hex"39",
            hex"3d",
            hex"f3",
            data
        );

        address fragment;
        assembly {
            fragment := create(0, add(creationCode, 0x20), mload(creationCode))
        }
        if (fragment == address(0)) revert FragmentDeploymentFailed();
        return fragment;
    }

    /// @dev Reads the runtime bytecode of a deployed fragment contract.
    function _readFragment(address fragment) internal view returns (bytes memory content) {
        uint256 size;
        assembly {
            size := extcodesize(fragment)
        }
        content = new bytes(size);
        assembly {
            extcodecopy(fragment, add(content, 0x20), 0, size)
        }
    }

    // -------------------------------------------------------------------------
    // Internal: Boilerplate Generation
    // -------------------------------------------------------------------------

    /// @dev Generates the boilerplate fragment content for a newly minted token.
    function _generateBoilerplate(uint256 tokenId) internal view returns (bytes memory) {
        return abi.encodePacked(
            "# Soul Block #", _padTokenId(tokenId), "\n\n",
            "Forged at block ", Strings.toString(block.number), " on the Base blockchain.\n",
            "Minted by ", Strings.toHexString(msg.sender), ".\n",
            "One of 10,000 unique soul vessels.\n\n",
            "While first the soul stands bare, each layer set below\n",
            "Endures, a part of what you come to be.\n\n",
            "---"
        );
    }

    // -------------------------------------------------------------------------
    // Internal: SVG Generation
    // -------------------------------------------------------------------------

    /// @dev Generates the on-chain SVG image for a token.
    function _generateSVG(uint256 tokenId) internal pure returns (string memory) {
        string memory tokenIdStr = _padTokenId(tokenId);

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

    // -------------------------------------------------------------------------
    // Internal: Utility
    // -------------------------------------------------------------------------

    /// @dev Returns a 5-digit zero-padded string representation of a token ID.
    function _padTokenId(uint256 tokenId) internal pure returns (string memory) {
        bytes memory result = new bytes(5);
        for (uint256 i = 5; i > 0; i--) {
            result[i - 1] = bytes1(uint8(48 + (tokenId % 10)));
            tokenId /= 10;
        }
        return string(result);
    }

    // -------------------------------------------------------------------------
    // Required Overrides (ERC721 + ERC721Enumerable)
    // -------------------------------------------------------------------------

    /// @dev Updates token ownership and ERC721Enumerable tracking.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /// @dev Increases balance with ERC721Enumerable batch-mint guard.
    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, amount);
    }

    /// @notice Returns true if this contract supports the given interface.
    /// @param interfaceId The interface identifier to check.
    /// @return True if supported.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
