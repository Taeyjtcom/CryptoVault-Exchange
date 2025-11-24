<div align="center">
  <img width="1200" height="475" alt="CryptoVault Exchange" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CryptoVault Exchange – Cold Storage Linked Client Wallets

CryptoVault Exchange is a front‑end demo of a trading platform’s wallet layer.  
It shows how an exchange can link each client to a unique on‑chain deposit address that is derived from cold‑storage master public keys (XPUBs), without ever exposing private keys in the browser.

The app focuses on:

- A client dashboard with BTC, USDT, and USD balances
- A "Deposit Funds" flow that derives per-client USDT (ERC-20) and BTC addresses from XPUBs
- QR-code based deposit instructions and address copy helpers (generated locally)
- An admin panel that simulates connecting a Trezor hardware wallet and importing XPUBs
- A recent "deposit activity" table based on locally derived addresses (mock data)

> Note: This is a UI/architecture demo only. It does **not** connect to real wallets, broadcast transactions, or implement a matching engine. Do not use it to secure or move real funds.

## How It Works

- The admin panel lets you paste **master public keys (XPUBs)** for BTC and ETH (no private keys are ever stored).
- XPUB configuration is saved in your browser's `localStorage` so it persists across reloads and stays on your machine.
- For a given client, the app derives:
  - A USDT (ERC-20) deposit address from the ETH XPUB using `ethers` and standard HD paths.
  - A BTC deposit address using a deterministic HD derivation helper (for UI demonstration only, not a full Bitcoin implementation).
- Each client gets a deterministic deposit address from the HD tree, so deposits can be credited on the exchange side while funds stay under cold-wallet control.

### Derivation Paths (POC)

- USDT (ETH/XPUB): `m/44'/60'/0'/0/index` (external chain, index per client).
- BTC (XPUB): simulated `m/84'/0'/0'/0/index`-style external chain; derived via a generic HD node helper from `ethers` to produce a stable, bech32-like address string for UI purposes.

> These paths are for demonstration only; always verify derivation paths and networks before using XPUBs in production systems.

## POC Flow

End-to-end, the proof-of-concept behaves as follows:

1. Admin opens the app and pastes BTC and ETH XPUBs into the Admin panel.
2. XPUBs are validated and stored locally in `localStorage` (no server-side storage).
3. For each client, the app derives a dedicated USDT (ERC-20) and BTC deposit address based on the client's `derivationIndex`.
4. When the user clicks "Deposit Funds", the modal derives the appropriate address for the selected client + asset and shows a locally generated QR code.
5. Each time an address is successfully derived, a mock "deposit event" is recorded and displayed in the Recent Deposit Activity table.

## Tech Stack

- `React` + `TypeScript` single‑page app
- `Vite` dev/build tooling
- `ethers` for HD wallet (XPUB) address derivation
- `lucide-react` for icons
- `Tailwind CSS` via CDN for styling

## Running Locally

**Prerequisites**

- Node.js (LTS recommended)
- npm or another Node package manager

**Steps**

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Create/update `.env.local` as needed for your environment.  
   The current UI demo does not require any external API keys.
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the printed local URL (for example `http://localhost:5173`) in your browser.

## Project Structure

- `index.html` - HTML shell and Tailwind CDN setup
- `index.tsx` - Main React application shell, layout, and routing between views
- `models.ts` - Shared TypeScript models and initial config/client data
- `crypto.ts` - XPUB-based address derivation helpers (USDT/BTC)
- `components/AdminPanel.tsx` - Admin UI for XPUB configuration, security model, and state export/import
- `components/DepositModal.tsx` - Per-client deposit modal with derived address + QR flow
- `components/ClientDashboard.tsx` - Dashboard view and mocked recent deposit activity
- `vite.config.ts` / `tsconfig.json` - Build and TypeScript configuration

## Configuration & XPUBs

- BTC XPUB: expected to be a mainnet SegWit account XPUB (e.g. `m/84'/0'/0'`).
- ETH XPUB (USDT-ERC20): expected to be a mainnet ETH account-level XPUB for `m/44'/60'/0'`.
- XPUBs are stored only in the browser's `localStorage` under `cryptovault_config_v1`.
- You can reset XPUBs at any time from the Admin panel using "Reset XPUB configuration".
- A JSON export/import section in the Admin panel lets you back up or restore `config`, `clients`, and `deposits`.

## No External Integrations

- No exchange APIs, order books, or account services are called.
- No blockchain explorer APIs are used; activity is based purely on locally derived addresses.
- QR codes are rendered locally using a React QR library; there are no external QR code HTTP calls.

## How to Demo

1. **Open Admin panel**  
   - Start the app, go to "Admin Settings".
   - Paste your BTC XPUB and ETH XPUB (USDT-ERC20) into the corresponding fields.

2. **Configure clients**  
   - (Current POC) Work with the seeded demo client; future iterations can add a full client-management UI.

3. **Generate deposit addresses**  
   - Switch back to the main dashboard.
   - Ensure the desired client is selected in the header dropdown.
   - Click "Deposit Funds", choose USDT or BTC, and note the derived address + QR.

4. **Show activity**  
   - Close the modal and scroll to the Recent Deposit Activity table.
   - Point out that entries are tied to client, asset, derivation index, and derived address, and are persisted locally.

5. **Reset / export state**  
   - In Admin, demonstrate the XPUB reset button and the JSON export/import section to show how the POC can be backed up or restored.

## Disclaimer

This repository is intended for demonstration, prototyping, and educational purposes.  
It omits many production concerns (KYC/AML, full audit trails, withdrawal flows, and real hardware‑wallet integration).  
Do not deploy as‑is to manage real cryptocurrency funds.
