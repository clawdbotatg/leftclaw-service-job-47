// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title HelloWorld
/// @notice A simple greeting contract — anyone can read or update the greeting.
/// @dev No access control, no owner, no pause. Fully open by design.
contract HelloWorld {
    /// @notice The current greeting stored on-chain.
    string public greeting;

    /// @notice Emitted whenever someone changes the greeting.
    /// @param sender  The address that called setGreeting.
    /// @param newGreeting The new greeting value.
    event GreetingChanged(address indexed sender, string newGreeting);

    /// @notice Deploys with an initial greeting of "Hello World!".
    constructor() {
        greeting = "Hello World!";
    }

    /// @notice Replace the current greeting.
    /// @param _newGreeting The new greeting (max 280 bytes to prevent griefing).
    /// @dev The 280 limit is in bytes, not UTF-8 characters. Multi-byte characters (emoji, CJK) consume more than 1 byte each, so fewer than 280 characters may be allowed. This is intentional — it bounds actual storage cost.
    function setGreeting(string memory _newGreeting) public {
        require(bytes(_newGreeting).length <= 280, "too long");
        greeting = _newGreeting;
        emit GreetingChanged(msg.sender, _newGreeting);
    }
}
