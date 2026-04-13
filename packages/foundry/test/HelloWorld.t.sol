// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/HelloWorld.sol";

contract HelloWorldTest is Test {
    HelloWorld public helloWorld;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    event GreetingChanged(address indexed sender, string newGreeting);

    function setUp() public {
        helloWorld = new HelloWorld();
    }

    /// @notice Constructor sets greeting to "Hello World!"
    function testConstructorSetsGreeting() public view {
        assertEq(helloWorld.greeting(), "Hello World!");
    }

    /// @notice setGreeting updates the stored greeting
    function testSetGreetingUpdatesStorage() public {
        vm.prank(alice);
        helloWorld.setGreeting("Goodbye!");
        assertEq(helloWorld.greeting(), "Goodbye!");
    }

    /// @notice setGreeting emits GreetingChanged with correct args
    function testSetGreetingEmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit GreetingChanged(alice, "New greeting");
        helloWorld.setGreeting("New greeting");
    }

    /// @notice Exactly 280 bytes passes, 281 bytes reverts
    function testLengthGuard() public {
        // 280 bytes should succeed
        bytes memory ok = new bytes(280);
        for (uint256 i = 0; i < 280; i++) {
            ok[i] = "a";
        }
        helloWorld.setGreeting(string(ok));
        assertEq(bytes(helloWorld.greeting()).length, 280);

        // 281 bytes should revert
        bytes memory tooLong = new bytes(281);
        for (uint256 i = 0; i < 281; i++) {
            tooLong[i] = "a";
        }
        vm.expectRevert("too long");
        helloWorld.setGreeting(string(tooLong));
    }

    /// @notice Fuzz: setGreeting succeeds for inputs <= 280 bytes and reverts for > 280 bytes
    function testFuzz_SetGreetingLengthBoundary(bytes memory input) public {
        vm.assume(input.length <= 400);
        string memory s = string(input);
        if (input.length <= 280) {
            helloWorld.setGreeting(s);
            assertEq(helloWorld.greeting(), s);
        } else {
            vm.expectRevert("too long");
            helloWorld.setGreeting(s);
        }
    }

    /// @notice Two different senders can both update the greeting (no access control)
    function testMultipleSendersCanUpdate() public {
        vm.prank(alice);
        helloWorld.setGreeting("Alice says hi");
        assertEq(helloWorld.greeting(), "Alice says hi");

        vm.prank(bob);
        helloWorld.setGreeting("Bob says hi");
        assertEq(helloWorld.greeting(), "Bob says hi");
    }
}
