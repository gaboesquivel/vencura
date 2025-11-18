# ADR 013: Vencura API Test Gas Faucet

## Context

E2E tests for the Vencura API require wallets to have native tokens (ETH for EVM chains) to send transactions. Previously, wallets had to be manually funded with testnet ETH, which was:

- Time-consuming and error-prone
- Required manual intervention for each test run
- Subject to testnet rate limits and network issues
- Slowed down development and CI/CD pipelines

We need an automated solution to fund test wallets with gas tokens without manual intervention.

## Considered Options

### Option A – Local Anvil Blockchain (Chosen)

Use Foundry's Anvil local blockchain for testing, with automatic wallet funding.

**Pros**

- Fast: No network latency, instant transactions
- Reliable: No rate limits or network issues
- Free: Anvil provides pre-funded accounts
- Automated: Wallets funded automatically before tests
- Already available: Foundry is already in the codebase for contract development
- No external dependencies: Works offline, no testnet faucets needed
- Consistent: Same state every test run
- CI/CD friendly: Works in any environment with Foundry installed

**Cons**

- Requires Foundry installation (but already needed for contracts)
- Not testing against real testnets (but Dynamic SDK still uses real APIs)
- Local blockchain state doesn't match testnet exactly

### Option B – Testnet Faucet with Private Key

Read a private key from environment variables and send ETH from a funded testnet account.

**Pros**

- Tests against real testnets
- Can verify testnet-specific behavior
- No additional tooling required

**Cons**

- Slow: Network latency, transaction confirmation times
- Unreliable: Rate limits, network issues, faucet availability
- Requires manual setup: Must fund faucet account periodically
- Cost: Requires maintaining funded testnet accounts
- CI/CD complexity: Need to manage testnet credentials securely
- Rate limits: May hit faucet or RPC rate limits

### Option C – Dynamic Gasless Transactions

Use Dynamic's gasless transaction services (if available).

**Pros**

- No gas funding needed
- Tests real production-like flows

**Cons**

- May not be available for all chains
- Adds dependency on Dynamic's gasless infrastructure
- May have rate limits or costs
- Less control over test environment

### Option D – Mock Transaction Sending

Mock transaction sending in tests.

**Pros**

- Fast and reliable
- No external dependencies

**Cons**

- Doesn't test real transaction flows
- Violates testing philosophy (real APIs, no mocks)
- May miss real-world issues
- Doesn't verify actual blockchain integration

## Decision

We will use **Option A: Local Anvil Blockchain** as the primary approach, with **Option B: Testnet Faucet** as an optional fallback.

**Main reasons:**

- Fast and reliable testing eliminates manual intervention and improves developer experience
- Automated wallet funding makes tests fully automated without setup overhead
- Already have Foundry in codebase for contract development, so no additional dependencies
- CI/CD friendly - works consistently in any environment
- Still tests real Dynamic SDK integration (only blockchain is local)
- Optional testnet mode available when needed for integration testing

## Implementation Details

### Architecture

**Gas Faucet Implementation:**

- Uses TypeScript/Viem (not Foundry/Cast CLI) for consistency with API codebase
- `fundWalletWithGas()` function in `test/helpers.ts` uses Viem's `createWalletClient`
- Uses Anvil's default account private key (well-known for local testing)
- Falls back to `FAUCET_PRIVATE_KEY` environment variable for testnet mode

**Anvil Lifecycle:**

- `test/setup-anvil.ts` manages Anvil startup/shutdown
- Anvil starts automatically before tests run (via Jest `beforeAll` hook)
- Health checks verify Anvil is ready before tests proceed
- Graceful handling if Anvil is already running

**Wallet Auto-Funding:**

- `getOrCreateTestWallet()` helper automatically funds wallets when using local blockchain
- Only funds EVM chains (Solana support can be added later)
- Default funding amount: 1 ETH (configurable)
- Uses RPC URL overrides to point test chains to Anvil

### Configuration

**Environment Variables:**

- `USE_LOCAL_BLOCKCHAIN` (default: `true`) - Enable/disable local Anvil blockchain
- `FAUCET_PRIVATE_KEY` (optional) - Private key for testnet faucet (only if `USE_LOCAL_BLOCKCHAIN=false`)
- `RPC_URL_<CHAIN_ID>` - Override RPC URLs. Set to `http://localhost:8545` for local Anvil

**Test Scripts:**

- `pnpm run test:e2e` - Uses local Anvil (default)
- `pnpm run test:e2e:testnet` - Uses testnet (requires manual funding or `FAUCET_PRIVATE_KEY`)

### Integration Points

**Test Setup:**

- `test/setup.ts` - Starts Anvil before tests, stops after tests
- `test/helpers.ts` - Contains `fundWalletWithGas()` and updated `getOrCreateTestWallet()`
- `test/setup-anvil.ts` - Anvil lifecycle management

**RPC Configuration:**

- Tests override RPC URLs via `RPC_URL_<CHAIN_ID>` environment variables
- Local mode: Point test chains to `http://localhost:8545` (Anvil)
- Testnet mode: Use default testnet RPCs or custom URLs

### Wallet Funding Flow

1. Test creates wallet via Dynamic SDK (real API)
2. `getOrCreateTestWallet()` helper checks if using local blockchain
3. If local: Auto-funds from Anvil default account using Viem
4. If testnet: Uses `FAUCET_PRIVATE_KEY` if provided, otherwise requires manual funding
5. Tests proceed with funded wallet

## Technical Decisions

### Why TypeScript/Viem Instead of Foundry/Cast?

**Decision**: Use TypeScript/Viem for gas faucet implementation, not Foundry/Cast CLI.

**Rationale:**

- API codebase already uses Viem throughout (`createWalletClient`, `createPublicClient`)
- Type-safe, no shelling out to external commands
- Better error handling and integration with Jest
- Consistent with existing codebase patterns
- Foundry scripts remain for contract deployment (one-time), not runtime operations

### Why Local Blockchain as Default?

**Decision**: Use local Anvil blockchain as default, with testnet as optional fallback.

**Rationale:**

- Faster and more reliable for development and CI/CD
- Eliminates manual setup and external dependencies
- Still tests real Dynamic SDK integration (only blockchain is local)
- Testnet mode available when needed for integration testing

## Notes

- Foundry must be installed for local blockchain tests (already required for contracts)
- Anvil starts automatically before tests run
- Wallets are automatically funded with 1 ETH (configurable)
- Testnet mode available via `USE_LOCAL_BLOCKCHAIN=false`
- Solana support can be added later using `solana-test-validator`
- Dynamic SDK still uses real APIs - only the blockchain is local
- Token deployment uses Foundry scripts (separate concern from runtime gas faucet)

## Future Enhancements

- Support Solana local validator for Solana tests
- Configurable funding amounts per test
- Token deployment automation for local Anvil
- Integration with CI/CD for automated testnet testing when needed
