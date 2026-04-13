// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/HelloWorld.sol";

/**
 * @notice Deploy script for HelloWorld contract
 * @dev Inherits ScaffoldETHDeploy which:
 *      - Includes forge-std/Script.sol for deployment
 *      - Includes ScaffoldEthDeployerRunner modifier
 *      - Provides `deployer` variable
 * Example:
 * yarn deploy --file DeployHelloWorld.s.sol  # local anvil chain
 * yarn deploy --file DeployHelloWorld.s.sol --network base # live network (requires keystore)
 */
contract DeployHelloWorld is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        new HelloWorld();
    }
}
