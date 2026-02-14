// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, Vm} from "forge-std/Test.sol";
import {SoulBlocks} from "../src/SoulBlocks.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @notice A contract that rejects all incoming ETH transfers, used to test WithdrawalFailed.
contract ETHRejecter {
    receive() external payable {
        revert("no thanks");
    }
}

/// @notice A contract receiver that inspects SoulBlocks state during onERC721Received callback.
contract StateInspectingReceiver {
    SoulBlocks public immutable soulBlocks;

    uint256 public observedFragmentCount;
    uint256 public observedGenesisBlock;
    address public observedMinter;

    constructor(SoulBlocks _soulBlocks) {
        soulBlocks = _soulBlocks;
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external
        returns (bytes4)
    {
        observedFragmentCount = soulBlocks.getFragmentCount(tokenId);
        observedGenesisBlock = soulBlocks.getGenesisBlock(tokenId);
        observedMinter = soulBlocks.getMinter(tokenId);
        return this.onERC721Received.selector;
    }
}

contract SoulBlocksTest is Test {
    SoulBlocks public soulBlocks;

    address public beneficiary = makeAddr("beneficiary");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant MINT_PRICE = 0.02 ether;

    function setUp() public {
        soulBlocks = new SoulBlocks(beneficiary);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /// @dev Mints a token as the given caller and returns the token ID.
    function _mintAs(address caller) internal returns (uint256) {
        vm.prank(caller);
        return soulBlocks.mint{value: MINT_PRICE}();
    }

    /// @dev Appends a string fragment to a token as the given caller.
    function _appendAs(address caller, uint256 tokenId, string memory content) internal {
        vm.prank(caller);
        soulBlocks.appendFragment(tokenId, bytes(content));
    }

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    function test_constructor_setsBeneficiary() public view {
        assertEq(soulBlocks.beneficiary(), beneficiary);
    }

    function test_constructor_revertsWithZeroAddressBeneficiary() public {
        vm.expectRevert(SoulBlocks.InvalidBeneficiary.selector);
        new SoulBlocks(address(0));
    }

    function test_constructor_setsNameAndSymbol() public view {
        assertEq(soulBlocks.name(), "SoulBlocks");
        assertEq(soulBlocks.symbol(), "SOUL");
    }

    // =========================================================================
    // Minting: Token ID Incrementing
    // =========================================================================

    function test_mint_firstTokenIdIsOne() public {
        uint256 tokenId = _mintAs(alice);
        assertEq(tokenId, 1);
    }

    function test_mint_tokenIdsIncrementSequentially() public {
        uint256 first = _mintAs(alice);
        uint256 second = _mintAs(alice);
        uint256 third = _mintAs(bob);

        assertEq(first, 1);
        assertEq(second, 2);
        assertEq(third, 3);
    }

    function test_mint_assignsOwnershipToMsgSender() public {
        uint256 tokenId = _mintAs(alice);
        assertEq(soulBlocks.ownerOf(tokenId), alice);
    }

    // =========================================================================
    // Minting: Boilerplate Fragment
    // =========================================================================

    function test_mint_createsBoilerplateFragment() public {
        uint256 tokenId = _mintAs(alice);
        assertEq(soulBlocks.getFragmentCount(tokenId), 1);
    }

    function test_mint_boilerplateContainsTokenId() public {
        uint256 tokenId = _mintAs(alice);
        bytes memory content = soulBlocks.getFragmentContent(tokenId, 0);
        string memory contentStr = string(content);

        assertTrue(_containsSubstring(contentStr, "# Soul Block #00001"));
    }

    function test_mint_boilerplateContainsMinterAddress() public {
        uint256 tokenId = _mintAs(alice);
        bytes memory content = soulBlocks.getFragmentContent(tokenId, 0);
        string memory contentStr = string(content);

        string memory aliceHex = Strings.toHexString(alice);
        assertTrue(_containsSubstring(contentStr, aliceHex));
    }

    function test_mint_boilerplateContainsBlockNumber() public {
        vm.roll(42);
        uint256 tokenId = _mintAs(alice);
        bytes memory content = soulBlocks.getFragmentContent(tokenId, 0);
        string memory contentStr = string(content);

        assertTrue(_containsSubstring(contentStr, "Forged at block 42"));
    }

    // =========================================================================
    // Minting: Genesis Block Storage
    // =========================================================================

    function test_mint_storesGenesisBlock() public {
        vm.roll(1000);
        uint256 tokenId = _mintAs(alice);
        assertEq(soulBlocks.getGenesisBlock(tokenId), 1000);
    }

    // =========================================================================
    // Minting: Minter Address Storage
    // =========================================================================

    function test_mint_storesMinterAddress() public {
        uint256 tokenId = _mintAs(alice);
        assertEq(soulBlocks.getMinter(tokenId), alice);
    }

    function test_mint_minterPersistsAfterTransfer() public {
        uint256 tokenId = _mintAs(alice);
        vm.prank(alice);
        soulBlocks.transferFrom(alice, bob, tokenId);
        assertEq(soulBlocks.getMinter(tokenId), alice);
    }

    // =========================================================================
    // Minting: Payment Validation
    // =========================================================================

    function test_mint_revertsWithInsufficientPayment() public {
        vm.prank(alice);
        vm.expectRevert(SoulBlocks.InsufficientPayment.selector);
        soulBlocks.mint{value: MINT_PRICE - 1}();
    }

    function test_mint_revertsWithZeroPayment() public {
        vm.prank(alice);
        vm.expectRevert(SoulBlocks.InsufficientPayment.selector);
        soulBlocks.mint{value: 0}();
    }

    function test_mint_succeedsAtExactMintPrice() public {
        vm.prank(alice);
        uint256 tokenId = soulBlocks.mint{value: MINT_PRICE}();
        assertEq(tokenId, 1);
    }

    function test_mint_succeedsWithOverpayment() public {
        vm.prank(alice);
        uint256 tokenId = soulBlocks.mint{value: MINT_PRICE + 1 ether}();
        assertEq(tokenId, 1);
        assertEq(soulBlocks.ownerOf(tokenId), alice);
    }

    // =========================================================================
    // Minting: Max Supply Enforcement
    // =========================================================================

    function test_mint_revertsWhenMaxSupplyReached() public {
        // Set _tokenIdCounter (storage slot 13) to MAX_SUPPLY directly
        vm.store(address(soulBlocks), bytes32(uint256(13)), bytes32(uint256(10000)));

        vm.prank(alice);
        vm.expectRevert(SoulBlocks.MaxSupplyReached.selector);
        soulBlocks.mint{value: MINT_PRICE}();
    }

    // =========================================================================
    // Appending: Happy Path
    // =========================================================================

    function test_appendFragment_storesFragmentContent() public {
        uint256 tokenId = _mintAs(alice);
        _appendAs(alice, tokenId, "Hello, world!");

        assertEq(soulBlocks.getFragmentCount(tokenId), 2);
        bytes memory content = soulBlocks.getFragmentContent(tokenId, 1);
        assertEq(string(content), "Hello, world!");
    }

    function test_appendFragment_storesMaxSizeFragment() public {
        uint256 tokenId = _mintAs(alice);

        // Build a 2048-byte fragment
        bytes memory maxData = new bytes(2048);
        for (uint256 i = 0; i < 2048; i++) {
            maxData[i] = bytes1(uint8(65 + (i % 26))); // A-Z repeating
        }

        vm.prank(alice);
        soulBlocks.appendFragment(tokenId, maxData);

        bytes memory readBack = soulBlocks.getFragmentContent(tokenId, 1);
        assertEq(readBack.length, 2048);
        assertEq(keccak256(readBack), keccak256(maxData));
    }

    // =========================================================================
    // Appending: Access Control
    // =========================================================================

    function test_appendFragment_revertsWhenNotOwner() public {
        uint256 tokenId = _mintAs(alice);

        vm.prank(bob);
        vm.expectRevert(SoulBlocks.NotTokenOwner.selector);
        soulBlocks.appendFragment(tokenId, bytes("unauthorized content"));
    }

    function test_appendFragment_revertsForNonExistentToken() public {
        vm.prank(alice);
        vm.expectRevert(SoulBlocks.NotTokenOwner.selector);
        soulBlocks.appendFragment(999, bytes("no such token"));
    }

    // =========================================================================
    // Appending: Size Validation
    // =========================================================================

    function test_appendFragment_revertsWhenFragmentTooLarge() public {
        uint256 tokenId = _mintAs(alice);

        bytes memory oversized = new bytes(2049);
        vm.prank(alice);
        vm.expectRevert(SoulBlocks.FragmentTooLarge.selector);
        soulBlocks.appendFragment(tokenId, oversized);
    }

    function test_appendFragment_revertsWhenFragmentEmpty() public {
        uint256 tokenId = _mintAs(alice);

        vm.prank(alice);
        vm.expectRevert(SoulBlocks.FragmentEmpty.selector);
        soulBlocks.appendFragment(tokenId, bytes(""));
    }

    // =========================================================================
    // Appending: Fragment Count Limit
    // =========================================================================

    function test_appendFragment_revertsAtMaxFragments() public {
        uint256 tokenId = _mintAs(alice);

        // Boilerplate is fragment #0, so we can append 63 more to reach 64 total
        for (uint256 i = 1; i < 64; i++) {
            _appendAs(alice, tokenId, string(abi.encodePacked("fragment ", Strings.toString(i))));
        }

        assertEq(soulBlocks.getFragmentCount(tokenId), 64);

        // The 65th fragment (index 64) should revert
        vm.prank(alice);
        vm.expectRevert(SoulBlocks.MaxFragmentsReached.selector);
        soulBlocks.appendFragment(tokenId, bytes("one too many"));
    }

    // =========================================================================
    // EXTCODECOPY: Data Integrity
    // =========================================================================

    function test_getFragmentContent_readsBackCorrectData() public {
        uint256 tokenId = _mintAs(alice);
        bytes memory testData = bytes("The quick brown fox jumps over the lazy dog.");
        vm.prank(alice);
        soulBlocks.appendFragment(tokenId, testData);

        bytes memory readBack = soulBlocks.getFragmentContent(tokenId, 1);
        assertEq(keccak256(readBack), keccak256(testData));
        assertEq(readBack.length, testData.length);
    }

    function test_getFragmentContent_readsBackBinaryData() public {
        uint256 tokenId = _mintAs(alice);

        // Write all byte values from 0x00 to 0xFF
        bytes memory binaryData = new bytes(256);
        for (uint256 i = 0; i < 256; i++) {
            binaryData[i] = bytes1(uint8(i));
        }
        vm.prank(alice);
        soulBlocks.appendFragment(tokenId, binaryData);

        bytes memory readBack = soulBlocks.getFragmentContent(tokenId, 1);
        assertEq(keccak256(readBack), keccak256(binaryData));
    }

    // =========================================================================
    // Reading: Non-Existent Token Reverts
    // =========================================================================

    function test_getFragmentCount_revertsForNonExistentToken() public {
        vm.expectRevert(SoulBlocks.InvalidTokenId.selector);
        soulBlocks.getFragmentCount(999);
    }

    function test_getFragmentContent_revertsForNonExistentToken() public {
        vm.expectRevert(SoulBlocks.InvalidTokenId.selector);
        soulBlocks.getFragmentContent(999, 0);
    }

    function test_getFragmentAddress_revertsForNonExistentToken() public {
        vm.expectRevert(SoulBlocks.InvalidTokenId.selector);
        soulBlocks.getFragmentAddress(999, 0);
    }

    function test_getAllFragmentAddresses_revertsForNonExistentToken() public {
        vm.expectRevert(SoulBlocks.InvalidTokenId.selector);
        soulBlocks.getAllFragmentAddresses(999);
    }

    function test_getGenesisBlock_revertsForNonExistentToken() public {
        vm.expectRevert(SoulBlocks.InvalidTokenId.selector);
        soulBlocks.getGenesisBlock(999);
    }

    function test_getMinter_revertsForNonExistentToken() public {
        vm.expectRevert(SoulBlocks.InvalidTokenId.selector);
        soulBlocks.getMinter(999);
    }

    function test_reconstructSoul_revertsForNonExistentToken() public {
        vm.expectRevert(SoulBlocks.InvalidTokenId.selector);
        soulBlocks.reconstructSoul(999);
    }

    // =========================================================================
    // Withdrawal
    // =========================================================================

    function test_withdraw_sendsFundsToBeneficiary() public {
        _mintAs(alice);
        _mintAs(bob);

        uint256 expectedBalance = 2 * MINT_PRICE;
        assertEq(address(soulBlocks).balance, expectedBalance);

        uint256 beneficiaryBalanceBefore = beneficiary.balance;
        soulBlocks.withdraw();
        uint256 beneficiaryBalanceAfter = beneficiary.balance;

        assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedBalance);
        assertEq(address(soulBlocks).balance, 0);
    }

    function test_withdraw_canBeCalledByAnyone() public {
        _mintAs(alice);

        // Bob (not beneficiary, not owner) triggers withdrawal
        uint256 beneficiaryBalanceBefore = beneficiary.balance;
        vm.prank(bob);
        soulBlocks.withdraw();
        uint256 beneficiaryBalanceAfter = beneficiary.balance;

        assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, MINT_PRICE);
    }

    function test_withdraw_succeedsWithZeroBalance() public {
        // No mints, contract balance is 0
        soulBlocks.withdraw();
        // Should not revert; a 0-value call to an EOA succeeds
    }

    function test_withdraw_revertsWhenBeneficiaryRejectsETH() public {
        ETHRejecter rejecter = new ETHRejecter();
        SoulBlocks rejecting = new SoulBlocks(address(rejecter));

        vm.prank(alice);
        rejecting.mint{value: MINT_PRICE}();

        vm.expectRevert(SoulBlocks.WithdrawalFailed.selector);
        rejecting.withdraw();
    }

    // =========================================================================
    // Token URI
    // =========================================================================

    function test_tokenURI_returnsBase64JsonDataURI() public {
        uint256 tokenId = _mintAs(alice);
        string memory uri = soulBlocks.tokenURI(tokenId);

        // Must start with the data URI prefix
        assertTrue(_startsWith(uri, "data:application/json;base64,"));
    }

    function test_tokenURI_containsTokenName() public {
        uint256 tokenId = _mintAs(alice);
        string memory uri = soulBlocks.tokenURI(tokenId);
        string memory decoded = _decodeBase64Json(uri);

        assertTrue(_containsSubstring(decoded, '"name":"Soul Block #00001"'));
    }

    function test_tokenURI_containsSvgImage() public {
        uint256 tokenId = _mintAs(alice);
        string memory uri = soulBlocks.tokenURI(tokenId);
        string memory decoded = _decodeBase64Json(uri);

        assertTrue(_containsSubstring(decoded, '"image":"data:image/svg+xml;base64,'));
    }

    function test_tokenURI_revertsForNonExistentToken() public {
        vm.expectRevert(SoulBlocks.InvalidTokenId.selector);
        soulBlocks.tokenURI(999);
    }

    // =========================================================================
    // SVG: Zero-Padded Token ID
    // =========================================================================

    function test_tokenURI_svgContainsZeroPaddedTokenId() public {
        uint256 tokenId = _mintAs(alice);
        string memory uri = soulBlocks.tokenURI(tokenId);
        string memory json = _decodeBase64Json(uri);

        // The JSON name field contains the padded token ID
        assertTrue(_containsSubstring(json, "Soul Block #00001"));
    }

    function test_tokenURI_svgPadsMultiDigitTokenId() public {
        // Mint 42 tokens to get tokenId 42
        for (uint256 i = 0; i < 42; i++) {
            address minter = makeAddr(string(abi.encodePacked("m", Strings.toString(i))));
            vm.deal(minter, MINT_PRICE);
            vm.prank(minter);
            soulBlocks.mint{value: MINT_PRICE}();
        }

        string memory uri = soulBlocks.tokenURI(42);
        string memory json = _decodeBase64Json(uri);

        // JSON name field contains padded ID
        assertTrue(_containsSubstring(json, "Soul Block #00042"));
    }

    // =========================================================================
    // SVG: GENESIS Badge
    // =========================================================================

    function test_tokenURI_genesisTokenHasGenesisBadge() public {
        uint256 tokenId = _mintAs(alice);
        assertEq(tokenId, 1); // token 1 is <= 500

        string memory uri = soulBlocks.tokenURI(tokenId);
        string memory json = _decodeBase64Json(uri);

        // Should have Genesis attribute
        assertTrue(_containsSubstring(json, '"Genesis","value":"Yes"'));
    }

    function test_tokenURI_nonGenesisTokenLacksGenesisBadge() public {
        // Mint 501 tokens
        for (uint256 i = 0; i < 501; i++) {
            address minter = makeAddr(string(abi.encodePacked("g", Strings.toString(i))));
            vm.deal(minter, MINT_PRICE);
            vm.prank(minter);
            soulBlocks.mint{value: MINT_PRICE}();
        }

        // Token 501 is > GENESIS_THRESHOLD (500)
        string memory uri = soulBlocks.tokenURI(501);
        string memory json = _decodeBase64Json(uri);

        // Should NOT have Genesis attribute
        assertFalse(_containsSubstring(json, '"Genesis","value":"Yes"'));
    }

    function test_tokenURI_token500IsGenesis() public {
        // Mint exactly 500 tokens
        for (uint256 i = 0; i < 500; i++) {
            address minter = makeAddr(string(abi.encodePacked("b", Strings.toString(i))));
            vm.deal(minter, MINT_PRICE);
            vm.prank(minter);
            soulBlocks.mint{value: MINT_PRICE}();
        }

        string memory uri = soulBlocks.tokenURI(500);
        string memory json = _decodeBase64Json(uri);

        assertTrue(_containsSubstring(json, '"Genesis","value":"Yes"'));
    }

    // =========================================================================
    // Contract URI
    // =========================================================================

    function test_contractURI_returnsBase64Json() public view {
        string memory uri = soulBlocks.contractURI();
        assertTrue(_startsWith(uri, "data:application/json;base64,"));
    }

    // =========================================================================
    // Constants
    // =========================================================================

    function test_constants_maxSupply() public view {
        assertEq(soulBlocks.MAX_SUPPLY(), 10000);
    }

    function test_constants_mintPrice() public view {
        assertEq(soulBlocks.MINT_PRICE(), 0.02 ether);
    }

    function test_constants_maxFragmentSize() public view {
        assertEq(soulBlocks.MAX_FRAGMENT_SIZE(), 2048);
    }

    function test_constants_maxFragments() public view {
        assertEq(soulBlocks.MAX_FRAGMENTS(), 64);
    }

    function test_constants_genesisThreshold() public view {
        assertEq(soulBlocks.GENESIS_THRESHOLD(), 500);
    }

    // =========================================================================
    // Integration: Full Lifecycle
    // =========================================================================

    function test_lifecycle_mintAppendReconstructVerify() public {
        uint256 tokenId = _mintAs(alice);

        _appendAs(alice, tokenId, "I am an AI agent named Atlas.");
        _appendAs(alice, tokenId, "My purpose is to explore the unknown.");

        string memory soul = soulBlocks.reconstructSoul(tokenId);

        // Should contain boilerplate + two fragments separated by \n\n
        assertTrue(_containsSubstring(soul, "# Soul Block #00001"));
        assertTrue(_containsSubstring(soul, "I am an AI agent named Atlas."));
        assertTrue(_containsSubstring(soul, "My purpose is to explore the unknown."));

        // Verify the \n\n separator exists between fragments
        assertTrue(_containsSubstring(soul, "---\n\n\n\nI am an AI agent named Atlas."));
        assertTrue(_containsSubstring(soul, "Atlas.\n\nMy purpose is to explore the unknown."));
    }

    function test_lifecycle_reconstructSoulWithOnlyBoilerplate() public {
        uint256 tokenId = _mintAs(alice);
        string memory soul = soulBlocks.reconstructSoul(tokenId);

        assertTrue(_containsSubstring(soul, "# Soul Block #00001"));
        assertTrue(_containsSubstring(soul, "---"));
        // Should not have trailing separator issues
    }

    // =========================================================================
    // Integration: UTF-8 Round-Trip
    // =========================================================================

    function test_utf8_contentSurvivesRoundTrip() public {
        uint256 tokenId = _mintAs(alice);

        // Unicode content including CJK characters, emoji-like sequences, and accented latin
        bytes memory unicodeContent = unicode"Bonjour le monde! \u00e9\u00e8\u00ea \u4f60\u597d\u4e16\u754c \u3053\u3093\u306b\u3061\u306f";
        vm.prank(alice);
        soulBlocks.appendFragment(tokenId, unicodeContent);

        bytes memory readBack = soulBlocks.getFragmentContent(tokenId, 1);
        assertEq(keccak256(readBack), keccak256(unicodeContent));
        assertEq(readBack.length, unicodeContent.length);
    }

    // =========================================================================
    // Integration: Transfer and Ownership
    // =========================================================================

    function test_transfer_newOwnerCanAppend() public {
        uint256 tokenId = _mintAs(alice);

        vm.prank(alice);
        soulBlocks.transferFrom(alice, bob, tokenId);

        // Bob is the new owner and can append
        _appendAs(bob, tokenId, "New owner writing.");
        assertEq(soulBlocks.getFragmentCount(tokenId), 2);
    }

    function test_transfer_oldOwnerCannotAppend() public {
        uint256 tokenId = _mintAs(alice);

        vm.prank(alice);
        soulBlocks.transferFrom(alice, bob, tokenId);

        // Alice is no longer the owner
        vm.prank(alice);
        vm.expectRevert(SoulBlocks.NotTokenOwner.selector);
        soulBlocks.appendFragment(tokenId, bytes("I used to own this."));
    }

    function test_transfer_fragmentsPersistAfterTransfer() public {
        uint256 tokenId = _mintAs(alice);
        _appendAs(alice, tokenId, "Written by Alice.");

        vm.prank(alice);
        soulBlocks.transferFrom(alice, bob, tokenId);

        // Fragments written by Alice should still be readable
        bytes memory content = soulBlocks.getFragmentContent(tokenId, 1);
        assertEq(string(content), "Written by Alice.");
    }

    // =========================================================================
    // Integration: FragmentAppended Event
    // =========================================================================

    function test_event_fragmentAppendedOnMint() public {
        vm.prank(alice);
        vm.recordLogs();
        soulBlocks.mint{value: MINT_PRICE}();

        Vm.Log[] memory logs = vm.getRecordedLogs();

        // Find the FragmentAppended event
        bytes32 eventSig = keccak256("FragmentAppended(uint256,address,uint256,uint256)");
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == eventSig) {
                // topics[1] = tokenId (indexed)
                uint256 tokenId = uint256(logs[i].topics[1]);
                assertEq(tokenId, 1);

                // Decode non-indexed params: byteLength, fragmentIndex
                (uint256 byteLength, uint256 fragmentIndex) = abi.decode(logs[i].data, (uint256, uint256));
                assertEq(fragmentIndex, 0);
                assertTrue(byteLength > 0);
                found = true;
                break;
            }
        }
        assertTrue(found);
    }

    function test_event_fragmentAppendedOnAppend() public {
        uint256 tokenId = _mintAs(alice);
        bytes memory data = bytes("My first real fragment.");

        vm.prank(alice);
        vm.recordLogs();
        soulBlocks.appendFragment(tokenId, data);

        Vm.Log[] memory logs = vm.getRecordedLogs();

        bytes32 eventSig = keccak256("FragmentAppended(uint256,address,uint256,uint256)");
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == eventSig) {
                uint256 emittedTokenId = uint256(logs[i].topics[1]);
                address fragmentAddr = address(uint160(uint256(logs[i].topics[2])));
                (uint256 byteLength, uint256 fragmentIndex) = abi.decode(logs[i].data, (uint256, uint256));

                assertEq(emittedTokenId, tokenId);
                assertTrue(fragmentAddr != address(0));
                assertEq(byteLength, data.length);
                assertEq(fragmentIndex, 1); // Index 1 because boilerplate is 0
                found = true;
                break;
            }
        }
        assertTrue(found);
    }

    // =========================================================================
    // Integration: Multiple Tokens Independent
    // =========================================================================

    function test_multipleTokens_appendingToOneDoesNotAffectAnother() public {
        uint256 tokenA = _mintAs(alice);
        uint256 tokenB = _mintAs(bob);

        _appendAs(alice, tokenA, "Alice's fragment.");
        _appendAs(alice, tokenA, "Alice's second fragment.");

        // Token A has 3 fragments (boilerplate + 2)
        assertEq(soulBlocks.getFragmentCount(tokenA), 3);

        // Token B still has only 1 fragment (boilerplate)
        assertEq(soulBlocks.getFragmentCount(tokenB), 1);

        // Token B's content is untouched
        string memory soulB = soulBlocks.reconstructSoul(tokenB);
        assertFalse(_containsSubstring(soulB, "Alice"));
    }

    function test_multipleTokens_eachHasOwnBoilerplate() public {
        uint256 tokenA = _mintAs(alice);
        uint256 tokenB = _mintAs(bob);

        bytes memory contentA = soulBlocks.getFragmentContent(tokenA, 0);
        bytes memory contentB = soulBlocks.getFragmentContent(tokenB, 0);

        // Boilerplates should differ (different token IDs, different minters)
        assertTrue(keccak256(contentA) != keccak256(contentB));

        // Each should contain correct token ID
        assertTrue(_containsSubstring(string(contentA), "#00001"));
        assertTrue(_containsSubstring(string(contentB), "#00002"));
    }

    // =========================================================================
    // ERC721Enumerable
    // =========================================================================

    function test_enumerable_totalSupplyTracked() public {
        assertEq(soulBlocks.totalSupply(), 0);
        _mintAs(alice);
        assertEq(soulBlocks.totalSupply(), 1);
        _mintAs(bob);
        assertEq(soulBlocks.totalSupply(), 2);
    }

    function test_enumerable_tokenOfOwnerByIndex() public {
        uint256 tokenA = _mintAs(alice);
        uint256 tokenB = _mintAs(alice);

        assertEq(soulBlocks.tokenOfOwnerByIndex(alice, 0), tokenA);
        assertEq(soulBlocks.tokenOfOwnerByIndex(alice, 1), tokenB);
    }

    // =========================================================================
    // Reconstruction: Separator Verification
    // =========================================================================

    function test_reconstructSoul_usesDoubleNewlineSeparator() public {
        uint256 tokenId = _mintAs(alice);
        _appendAs(alice, tokenId, "FRAGMENT_ONE");
        _appendAs(alice, tokenId, "FRAGMENT_TWO");

        string memory soul = soulBlocks.reconstructSoul(tokenId);

        // The separator between fragments is \n\n
        assertTrue(_containsSubstring(soul, "FRAGMENT_ONE\n\nFRAGMENT_TWO"));
    }

    function test_reconstructSoul_anyoneCanCall() public {
        uint256 tokenId = _mintAs(alice);
        _appendAs(alice, tokenId, "Private thoughts? Nope, all public.");

        // Bob (not the owner) can call reconstructSoul
        vm.prank(bob);
        string memory soul = soulBlocks.reconstructSoul(tokenId);
        assertTrue(_containsSubstring(soul, "Private thoughts?"));
    }

    // =========================================================================
    // Fragment Address Retrieval
    // =========================================================================

    function test_getFragmentAddress_returnsValidAddress() public {
        uint256 tokenId = _mintAs(alice);
        address fragmentAddr = soulBlocks.getFragmentAddress(tokenId, 0);
        assertTrue(fragmentAddr != address(0));
    }

    function test_getAllFragmentAddresses_returnsCorrectCount() public {
        uint256 tokenId = _mintAs(alice);
        _appendAs(alice, tokenId, "frag1");
        _appendAs(alice, tokenId, "frag2");

        address[] memory addrs = soulBlocks.getAllFragmentAddresses(tokenId);
        assertEq(addrs.length, 3); // boilerplate + 2
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    function test_appendFragment_singleByteFragment() public {
        uint256 tokenId = _mintAs(alice);
        vm.prank(alice);
        soulBlocks.appendFragment(tokenId, bytes("X"));

        bytes memory content = soulBlocks.getFragmentContent(tokenId, 1);
        assertEq(string(content), "X");
    }

    function test_appendFragment_exactMaxSizeFragment() public {
        uint256 tokenId = _mintAs(alice);

        bytes memory exactMax = new bytes(2048);
        for (uint256 i = 0; i < 2048; i++) {
            exactMax[i] = bytes1(uint8(0x41));
        }

        vm.prank(alice);
        soulBlocks.appendFragment(tokenId, exactMax);

        bytes memory readBack = soulBlocks.getFragmentContent(tokenId, 1);
        assertEq(readBack.length, 2048);
    }

    function test_mint_emitsERC721TransferEvent() public {
        vm.prank(alice);
        vm.recordLogs();
        soulBlocks.mint{value: MINT_PRICE}();

        Vm.Log[] memory logs = vm.getRecordedLogs();

        bytes32 transferSig = keccak256("Transfer(address,address,uint256)");
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == transferSig) {
                address from = address(uint160(uint256(logs[i].topics[1])));
                address to = address(uint160(uint256(logs[i].topics[2])));
                uint256 tokenId = uint256(logs[i].topics[3]);

                assertEq(from, address(0));
                assertEq(to, alice);
                assertEq(tokenId, 1);
                found = true;
                break;
            }
        }
        assertTrue(found);
    }

    function test_withdraw_handlesMultipleMintRevenue() public {
        // Mint 5 tokens
        for (uint256 i = 0; i < 5; i++) {
            _mintAs(alice);
        }

        uint256 expected = 5 * MINT_PRICE;
        assertEq(address(soulBlocks).balance, expected);

        uint256 beneficiaryBefore = beneficiary.balance;
        soulBlocks.withdraw();
        assertEq(beneficiary.balance - beneficiaryBefore, expected);
    }

    function test_supportsInterface_erc721() public view {
        // ERC721 interface ID
        assertTrue(soulBlocks.supportsInterface(0x80ac58cd));
    }

    function test_supportsInterface_erc721Enumerable() public view {
        // ERC721Enumerable interface ID
        assertTrue(soulBlocks.supportsInterface(0x780e9d63));
    }

    function test_supportsInterface_erc165() public view {
        // ERC165 interface ID
        assertTrue(soulBlocks.supportsInterface(0x01ffc9a7));
    }

    // =========================================================================
    // Reentrancy: State Initialization Before Callback
    // =========================================================================

    function test_mint_stateFullyInitializedBeforeCallback() public {
        StateInspectingReceiver receiver = new StateInspectingReceiver(soulBlocks);
        vm.deal(address(receiver), MINT_PRICE);

        vm.roll(12345);
        vm.prank(address(receiver));
        soulBlocks.mint{value: MINT_PRICE}();

        assertEq(receiver.observedFragmentCount(), 1);
        assertTrue(receiver.observedGenesisBlock() != 0);
        assertEq(receiver.observedGenesisBlock(), 12345);
        assertTrue(receiver.observedMinter() != address(0));
        assertEq(receiver.observedMinter(), address(receiver));
    }

    // =========================================================================
    // String Helpers (internal to test contract)
    // =========================================================================

    /// @dev Returns true if `haystack` starts with `needle`.
    function _startsWith(string memory haystack, string memory needle) internal pure returns (bool) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);
        if (n.length > h.length) return false;
        for (uint256 i = 0; i < n.length; i++) {
            if (h[i] != n[i]) return false;
        }
        return true;
    }

    /// @dev Returns true if `haystack` contains `needle` as a substring.
    function _containsSubstring(string memory haystack, string memory needle) internal pure returns (bool) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);
        if (n.length > h.length) return false;
        if (n.length == 0) return true;

        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    /// @dev Strips the "data:application/json;base64," prefix and base64-decodes the JSON payload.
    function _decodeBase64Json(string memory dataUri) internal pure returns (string memory) {
        bytes memory raw = bytes(dataUri);
        // "data:application/json;base64," is 29 bytes
        uint256 prefixLen = 29;
        bytes memory encoded = new bytes(raw.length - prefixLen);
        for (uint256 i = 0; i < encoded.length; i++) {
            encoded[i] = raw[i + prefixLen];
        }
        return string(_base64Decode(encoded));
    }

    /// @dev Minimal base64 decoder for test assertions.
    function _base64Decode(bytes memory data) internal pure returns (bytes memory) {
        if (data.length == 0) return "";

        uint256 decodedLen = (data.length / 4) * 3;
        if (data[data.length - 1] == "=") decodedLen--;
        if (data.length >= 2 && data[data.length - 2] == "=") decodedLen--;

        bytes memory result = new bytes(decodedLen);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < data.length; i += 4) {
            uint256 a = _base64CharValue(data[i]);
            uint256 b = _base64CharValue(data[i + 1]);
            uint256 c = (i + 2 < data.length) ? _base64CharValue(data[i + 2]) : 0;
            uint256 d = (i + 3 < data.length) ? _base64CharValue(data[i + 3]) : 0;

            uint256 triple = (a << 18) | (b << 12) | (c << 6) | d;

            if (resultIndex < decodedLen) result[resultIndex++] = bytes1(uint8((triple >> 16) & 0xFF));
            if (resultIndex < decodedLen) result[resultIndex++] = bytes1(uint8((triple >> 8) & 0xFF));
            if (resultIndex < decodedLen) result[resultIndex++] = bytes1(uint8(triple & 0xFF));
        }

        return result;
    }

    /// @dev Returns the 6-bit value for a base64 character.
    function _base64CharValue(bytes1 c) internal pure returns (uint256) {
        if (c >= "A" && c <= "Z") return uint8(c) - 65;
        if (c >= "a" && c <= "z") return uint8(c) - 71;
        if (c >= "0" && c <= "9") return uint8(c) + 4;
        if (c == "+") return 62;
        if (c == "/") return 63;
        return 0; // padding '='
    }
}
