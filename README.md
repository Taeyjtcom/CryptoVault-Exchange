# CryptoVault Exchange - XPUB-Derived Wallet Layer

CryptoVault Exchange is a front-end proof-of-concept that models how an exchange could link every client to deterministic deposit addresses derived from cold-storage XPUBs—without ever exposing private keys in the browser.

## What This POC Demonstrates

- XPUB-only custody model: Admin supplies BTC and ETH XPUBs; addresses are derived locally per-client and persisted in `localStorage` only.
- Client dashboard: Shows mocked balances and a recent deposit activity table populated from locally derived addresses.
- Deposit flow: Per-client deposit modal derives USDT (ERC20) or BTC addresses, renders a QR code, and logs a mock deposit event for the activity table.
- HD Wallet generator: Batch-derive BTC or ETH/USDT paths with configurable start index and count; optional read-only balance/tx sync from Etherscan (ETH) or Blockstream (BTC).
- Admin controls: XPUB validation, simulated Trezor connect, unsafe-but-handy seed-phrase XPUB derivation (for demos), and JSON export/import of app state.

> This is a UI/architecture demo. It does **not** broadcast transactions or handle real custody. Use test data only.

## Derivation Model

- USDT (ERC20): `m/44'/60'/0'/0/index` derived from the provided ETH XPUB (read-only).
- BTC: `m/84'/0'/0'/0/index` derived from a BTC XPUB or zpub (zpubs are normalized to xpub internally for display). Returned addresses are deterministic, bech32-style strings for demo purposes.
- Client-specific index: Each client is assigned a `derivationIndex` (see `models.ts`), ensuring deterministic per-client deposit addresses from the shared XPUBs.

## Views & Data Flow

- **Dashboard** (`ClientDashboard`): Displays demo balances and the Recent Deposit Activity table, which updates whenever a deposit address is derived in the modal.
- **Deposit Modal** (`DepositModal`): Generates QR + address for BTC or USDT, copies to clipboard, and records a mock deposit event tied to the selected client and derivation index.
- **Wallets** (`WalletsView`): Derive N addresses starting from an index for BTC or ETH. Supports optional read-only sync:
  - ETH via Etherscan (`VITE_ETHERSCAN_API_KEY` required)
  - BTC via Blockstream Explorer (no key required)
- **Admin** (`AdminPanel`): Paste XPUBs, reset config, simulate Trezor connect, derive XPUBs from a seed phrase (POC only), and export/import state JSON.

### Local Persistence (browser `localStorage`)

- `cryptovault_config_v1` — XPUBs + Trezor connection flag
- `cryptovault_clients_v1` — client list with `derivationIndex`
- `cryptovault_deposits_v1` — mock deposit events created when addresses are derived
- `cryptovault_generated_wallets_v1` — batch-generated wallets from the Wallets view

## Running Locally

Prereqs: Node.js (LTS), npm (or another Node package manager).

1. Install dependencies: `npm install`
2. (Optional) Create `.env.local` for explorer sync:  
   - `VITE_ETHERSCAN_API_KEY=<your_key>` (enables ETH balance/tx sync in Wallets)
3. Start dev server: `npm run dev`
4. Open the printed URL (default `http://localhost:5173`).

## How to Demo

1) Go to **Admin Settings**, paste BTC and ETH XPUBs (or use the seed phrase helper for demo-only XPUBs).  
2) Optional: click **Connect Trezor (Simulated)** to auto-fill an ETH XPUB.  
3) Switch to **Wallets** to batch-derive addresses (choose asset, start index, count). Optionally sync balances via explorers.  
4) Return to **Dashboard**, pick the active client, click **Deposit Funds**, choose BTC or USDT, and show the QR/address. A mock activity row is recorded automatically.  
5) Use **Export/Import State** in Admin to show how client/config/deposit data can be backed up locally.

## Tech Stack

- React + TypeScript + Vite single-page app
- `ethers` for HD wallet derivation, base58/zpub normalization
- `qrcode.react` for QR rendering, `lucide-react` for icons
- Tailwind via CDN for styling

## Limitations & Warnings

- No real custody, signing, or transaction broadcast; activity is simulated except optional explorer lookups.  
- Seed-phrase helper is for throwaway demo phrases only; never use production secrets here.  
- Not production-ready (missing KYC/AML, withdrawals, auditing, multi-sig, HSM flows, etc.).
