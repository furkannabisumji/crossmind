# CCIP Testnet Access Request Message

## Message to Chainlink Support:

---

**Subject: CCIP Router getFee() Reverts - Need Testnet Access for Cross-chain DeFi Project**

Hi Chainlink Team,

I'm developing a cross-chain DeFi investment vault called "CrossMind" that uses Chainlink CCIP for secure cross-chain messaging between Avalanche Fuji and Ethereum Sepolia testnets.

## Current Issue:

My contracts are correctly deployed and configured, but all CCIP router calls are reverting at the `getFee()` function with no error message. This suggests my contract/account needs to be whitelisted for CCIP testnet usage.

## My Setup:

- **Fuji CrossChainExecutor:** `0xB113bBd621639C3547a068391D3B025361DC1f23`
- **Sepolia CrossChainExecutor:** `0xD63dcF5091d3776D01d727b92d195cF54c10F0d2`
- **My EOA Address:** `0x14D7795A2566Cd16eaA1419A26ddB643CE523655`
- **Router Addresses:** Using official CCIP routers for both networks

## Error Details:

```
Error: Cross-chain calls revert at s_router.getFee(destinationChainSelector, message)
- No error message returned
- Router address is correct
- Contract is funded with AVAX for fees
- This suggests access control/whitelisting issue
```

## What I Need:

1. **CCIP Testnet Access** for my contract addresses
2. **Whitelist my EOA** for CCIP testnet usage
3. **Confirmation** that my setup is correct

## Project Details:

- **Name:** CrossMind
- **Purpose:** Cross-chain automated investment strategies
- **Use Case:** DeFi yield farming across multiple chains
- **Stage:** Development/testing phase

Could you please help me get access to CCIP testnet functionality? I've followed all the documentation but keep hitting this access control issue.

Thank you for your help!

---

## Alternative Shorter Version:

---

**Subject: CCIP getFee() Reverts - Need Testnet Access**

Hi,

I'm building a cross-chain DeFi project using CCIP, but all router calls revert at `getFee()` with no error message. My contracts are deployed correctly and funded.

**Contract Addresses:**

- Fuji: `0xB113bBd621639C3547a068391D3B025361DC1f23`
- Sepolia: `0xD63dcF5091d3776D01d727b92d195cF54c10F0d2`
- EOA: `0x14D7795A2566Cd16eaA1419A26ddB643CE523655`

**Error:** `s_router.getFee()` reverts silently - suggests whitelisting issue.

Can you help me get CCIP testnet access for these addresses?

Thanks!
