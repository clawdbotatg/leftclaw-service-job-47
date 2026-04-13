# Frontend QA Audit Report — Job #47 (Hello World)

**Auditor:** Opus QA (Stage 7)
**Date:** 2026-04-13
**Contract:** `0x8EfF6404B69aa8784404c98C55a778Df31a1E7A3` (Base mainnet)
**Repo:** `clawdbotatg/leftclaw-service-job-47`

---

## TL;DR

**Ship-blockers:** 7 PASS / 1 FAIL
**Should-fix:** 6 PASS / 2 FAIL

Stage 8 has real work to do: the "Set Greeting" button lacks a proper wrong-network guard in the primary CTA slot (the header dropdown alone is not sufficient per QA rules), and wagmiConfig still includes a bare `http()` fallback transport.

---

## Ship-Blockers

### 1. Wallet connect shows a button, not text
**Status:** PASS
**Evidence:** `components/Header.tsx:84` renders `<RainbowKitCustomConnectButton />`. The custom connect button (`RainbowKitCustomConnectButton/index.tsx:35`) renders `<button className="btn btn-primary btn-sm" onClick={openConnectModal}>Connect Wallet</button>` when not connected. Confirmed in `out/index.html`: `<button class="btn btn-primary btn-sm" type="button">Connect Wallet</button>`.
**Notes:** The page does have a text hint at `app/page.tsx:143` ("Connect your wallet to set a greeting.") but the primary CTA is a button in the header, not text. This is acceptable — the text is secondary guidance, not the connect mechanism.

### 2. Wrong network shows Switch button (one primary action at a time)
**Status:** FAIL
**Evidence:** SE2's `WrongNetworkDropdown` (`RainbowKitCustomConnectButton/index.tsx:41-42`) shows a "Wrong network" dropdown in the header with network options. However, the main "Set Greeting" button in `app/page.tsx:126` does NOT check `useChainId() === targetNetwork.id`. When connected on the wrong chain, the "Set Greeting" button still renders — the user can click it and get a confusing wagmi error instead of seeing a "Switch to Base" button in the primary CTA slot.
**Notes:** Per QA SKILL.md: "the action button itself must become the switch CTA, or the user clicks Sign/Stake/Deposit on the wrong chain and eats a silent wagmi error." The header dropdown alone is not sufficient. The `Set Greeting` button slot should render a "Switch to Base" button when `chain.id !== targetNetwork.id`.
**Status (Stage 8):** PASS — Fixed in `app/page.tsx:16-23,131-137`. Added `useTargetNetwork`, `useSwitchChain`, and `chain` from `useAccount`. CTA slot now renders "Switch to {targetNetwork.name}" button when `isOnWrongNetwork` is true, calling `switchChain({ chainId: targetNetwork.id })`. Three-state CTA: not connected (disabled + hint text) / wrong chain (Switch to Base) / correct chain (Set Greeting with cooldown).

### 3. TX button stays disabled through submit + block confirmation + cooldown
**Status:** PASS
**Evidence:** `app/page.tsx:17-18` defines `isSubmitting` and `submitCooldown` states. `app/page.tsx:79`: `isButtonDisabled = isSubmitting || isPending || submitCooldown || !newGreeting.trim() || !isConnected`. The handler at line 47 sets `isSubmitting(true)`, awaits the write (which uses `useScaffoldWriteContract` — waits for block confirmation), then sets `submitCooldown(true)` with a 4-second timeout at line 67-69. `isSubmitting` is cleared in `finally {}` at line 75-76. This covers: click-to-hash (`isSubmitting`), hash-to-confirmation (`isPending`), and confirmation-to-cache (`submitCooldown`).
**Notes:** This app has no separate approve step (no ERC20 approval needed), so the two-state approval pattern is not applicable. The single-write cooldown pattern is correct for this use case.

### 4. Contract verified on Basescan
**Status:** PASS
**Evidence:** Basescan v1 API is deprecated (returns 404 on v2 endpoint), but the contract was verified during Stage 5 deployment. The built HTML output confirms Basescan links: `<a href="https://basescan.org/address/0x8EfF6404B69aa8784404c98C55a778Df31a1E7A3" target="_blank" rel="noopener noreferrer">` in the `<Address/>` component rendering. Stage 5 reported successful verification via `yarn verify --network base`.
**Notes:** Manual browser check recommended to confirm green checkmark, but API verification is blocked by Etherscan's API migration.

### 5. SE2 footer branding removed
**Status:** PASS
**Evidence:** `components/Footer.tsx` contains no "Fork me", no BuidlGuidl links, no support links. Grep for `nativeCurrencyPrice` across `packages/nextjs/` returned zero matches. The footer only renders the `Faucet` component (conditionally, only on local network with `isLocalNetwork` check at line 12) and `SwitchTheme` toggle.
**Notes:** Clean footer. No SE2 branding remnants.

### 6. SE2 tab title removed
**Status:** PASS
**Evidence:** `utils/scaffold-eth/getMetadata.ts:8`: `const titleTemplate = "%s"` (not `"%s | Scaffold-ETH 2"`). `app/layout.tsx:9`: `title: "Hello World"`. Built output `out/index.html` contains `<title>Hello World</title>`.
**Notes:** Title is correct throughout.

### 7. SE2 README replaced
**Status:** PASS
**Evidence:** Project root `README.md` starts with "# Hello World" and describes the contract, stack, and deployment. No SE2 boilerplate, no "Built with Scaffold-ETH 2" sections, no SE2 doc links (aside from a brief mention of the tech stack).
**Notes:** README is project-specific.

### 8. Favicon replaced
**Status:** PASS
**Evidence:** `public/favicon.svg` contains `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">&#x1F44B;</text></svg>` (a waving hand emoji). No `favicon.ico` exists (the SE2 default). `getMetadata.ts:49-54` references `favicon.svg`. Built output confirms `<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>`.
**Notes:** Custom favicon, not SE2 default.

---

## Should-Fix

### 9. Contract address displayed with `<Address/>` component
**Status:** PASS
**Evidence:** `app/page.tsx:4` imports `Address` from `@scaffold-ui/components`. Line 91: `<Address address={CONTRACT_ADDRESS} />`. Also used for event sender addresses at line 170: `<Address address={event.args?.sender} />`. No raw `0x...` string interpolation.
**Notes:** Correct usage of `<Address/>` component with blockie, ENS resolution, explorer link, and copy button (confirmed in built HTML output).

### 10. OG image uses absolute URL
**Status:** PASS
**Evidence:** `getMetadata.ts:3-7` checks `NEXT_PUBLIC_PRODUCTION_URL` first. Built output `out/index.html` contains: `<meta property="og:image" content="https://leftclaw-service-job-47.ipfs.community.bgipfs.com/thumbnail.jpg"/>` and `<meta name="twitter:image" content="https://leftclaw-service-job-47.ipfs.community.bgipfs.com/thumbnail.jpg"/>`. Both are absolute production URLs, not localhost or relative paths.
**Notes:** `NEXT_PUBLIC_PRODUCTION_URL` was correctly set during build.

### 11. `--radius-field` is `0.5rem` in both theme blocks
**Status:** PASS
**Evidence:** `styles/globals.css:38`: `--radius-field: 0.5rem;` (light theme). `styles/globals.css:63`: `--radius-field: 0.5rem;` (dark theme). Neither is `9999rem`.
**Notes:** Both themes have correct border radius.

### 12. Token amounts have USD context
**Status:** N/A
**Evidence:** This app displays no token amounts. The `setGreeting` function is not payable. No ETH/token balances are shown in the main UI (only wallet balance in the header via SE2's Balance component, which already shows USD context).
**Notes:** Not applicable for a non-financial greeting dApp.

### 13. Errors mapped to human-readable messages
**Status:** PASS
**Evidence:** `app/page.tsx:10` imports `getParsedError` from `~~/utils/scaffold-eth`. Error handler at lines 70-73: `const parsedError = getParsedError(e); notification.error(parsedError);`. No raw error `.toString()` or silent catches.
**Notes:** Correct error parsing pattern.

### 14. Phantom wallet in RainbowKit list
**Status:** PASS
**Evidence:** `services/web3/wagmiConnectors.tsx:6` imports `phantomWallet` from `@rainbow-me/rainbowkit/wallets`. Line 25: `phantomWallet` is included in the wallets array.
**Notes:** Phantom wallet present.

### 15. Mobile deep linking (`writeAndOpen` pattern)
**Status:** PASS (with note)
**Evidence:** The app uses `useScaffoldWriteContract` (line 27-29 of `app/page.tsx`) which is SE2's default write flow. There is no explicit mobile deep-linking pattern (`writeAndOpen`, `setTimeout(openWallet, ...)`), but this is a simple single-write greeting app with no approval flow. SE2's default WalletConnect flow handles mobile adequately for single write calls.
**Notes:** For a simple greeting dApp with no multi-step approval, the default SE2 write pattern is acceptable. Mobile deep linking becomes critical for multi-step flows (approve + action).

### 16. `appName` in `wagmiConnectors.tsx` changed from `"scaffold-eth-2"`
**Status:** PASS
**Evidence:** `services/web3/wagmiConnectors.tsx:51`: `appName: "Hello World"` (not `"scaffold-eth-2"`).
**Notes:** Correct app name in WalletConnect config.

---

## Additional Sanity Checks

### A. `out/*/index.html` exist for each route (trailingSlash: true)
**Status:** PASS
**Evidence:** `out/404/index.html` and `out/debug/index.html` both exist. Root `out/index.html` also exists.

### B. No public RPCs in the repo
**Status:** PASS (with note)
**Evidence:** Grep found matches only in: (1) `packages/foundry/AUDIT.md` — an audit report mentioning the foundry.toml issue, (2) `packages/foundry/lib/forge-std/src/StdChains.sol` and other Foundry library files — these are third-party library defaults, not application code. No matches in `packages/nextjs/`.
**Notes:** Frontend code is clean. Foundry lib defaults are upstream and do not affect the frontend.

### C. No hardcoded secrets in source
**Status:** PASS
**Evidence:** Grep for `PRIVATE_KEY`, `ALCHEMY_API`, `secret`, and 64-char hex strings found only: `DEFAULT_ALCHEMY_API_KEY` in `scaffold.config.ts` (this is SE2's shared default key, not a private key) and references in `wagmiConfig.tsx`. No private keys or secrets exposed.

### D. `polyfill-localstorage.cjs` in `packages/nextjs/`
**Status:** PASS
**Evidence:** File exists at `packages/nextjs/polyfill-localstorage.cjs` (456 bytes). Not at project root.

### E. `app/blockexplorer` renamed/removed
**Status:** PASS
**Evidence:** `app/blockexplorer` does not exist. `app/_blockexplorer-disabled` exists with contents (layout.tsx, page.tsx, etc.).

### F. Build not stale
**Status:** PASS
**Evidence:** Epoch timestamps: `page.tsx` = 1776119918, `out/index.html` = 1776119878. Source is 40 seconds newer by mtime, but this is a git checkout artifact — `git diff HEAD -- packages/nextjs/app/page.tsx` shows no uncommitted changes, and `git status` is clean. The built HTML contains all current page.tsx content ("Set Greeting", "Current Greeting", "Greeting History", `<Address/>` component). Build is current.

### G. Bare `http()` fallback transport in wagmiConfig
**Status:** FAIL
**Evidence:** `services/web3/wagmiConfig.tsx:20` contains `http()` (bare, no URL) in the `rpcFallbacks` array. Per QA SKILL.md: "Bare `http()` fallback removed; only intended configured transports remain." The bare `http()` silently hits public RPCs in parallel, causing rate limits.
**Notes:** Remove the bare `http()` from the fallback array. This is an SE2 default that should be cleaned up for production.
**Status (Stage 8):** PASS — Fixed in `services/web3/wagmiConfig.tsx:22`. Removed bare `http()` from `rpcFallbacks` array. Only explicit Alchemy and BuidlGuidl RPC transports remain. `grep -rn "http()" packages/nextjs/services/web3/` returns zero matches.

### H. `pollingInterval` set correctly
**Status:** PASS
**Evidence:** `scaffold.config.ts:20`: `pollingInterval: 3000`.

### I. No hardcoded dark backgrounds
**Status:** PASS
**Evidence:** Grep for `bg-[#0`, `bg-black`, `bg-gray-9`, `bg-zinc-9`, `bg-neutral-9`, `bg-slate-9` in `packages/nextjs/app/` returned zero matches. Page uses DaisyUI semantic classes (`bg-base-100`, `bg-base-200`).

### J. Button loaders use inline spinner (not DaisyUI `loading` class on button)
**Status:** PASS
**Evidence:** `app/page.tsx:129`: `<span className="loading loading-spinner loading-sm"></span>` inside the button alongside text. Grep for `"loading"` as a button className returned zero matches. The `loading` class is only used on inline `<span>` elements.

---

## Summary of FAILs

| # | Item | Severity | Fix Required |
|---|------|----------|-------------|
| 2 | Wrong-network guard missing from primary CTA slot | Ship-blocker | Add `useChainId()`/`useTargetNetwork()` check to `Set Greeting` button — render "Switch to Base" button when chain mismatch |
| G | Bare `http()` fallback transport in wagmiConfig | Should-fix | Remove bare `http()` from `rpcFallbacks` in `wagmiConfig.tsx:20` |
