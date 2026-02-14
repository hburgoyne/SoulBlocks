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
