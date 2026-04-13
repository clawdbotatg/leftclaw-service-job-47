# Hello World

A simple on-chain greeting dApp deployed on Base. Read the current greeting, connect your wallet, and set a new one. Built with Scaffold-ETH 2 (Foundry flavor).

## Contract

- **HelloWorld** deployed at [`0x8EfF6404B69aa8784404c98C55a778Df31a1E7A3`](https://basescan.org/address/0x8EfF6404B69aa8784404c98C55a778Df31a1E7A3) on Base mainnet
- Functions: `greeting()` (view), `setGreeting(string)` (write)
- Events: `GreetingChanged(address indexed sender, string newGreeting)`

## Stack

- Solidity (Foundry)
- Next.js + RainbowKit + Wagmi + Viem
- Tailwind CSS + DaisyUI
- IPFS (bgipfs) for hosting
