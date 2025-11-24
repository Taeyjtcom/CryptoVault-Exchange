<div align="center">
  <img width="1200" height="475" alt="CryptoVault Exchange" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CryptoVault Exchange – Cold Storage Linked Client Wallets

CryptoVault Exchange is a front‑end demo of a trading platform’s wallet layer.  
It shows how an exchange can link each client to a unique on‑chain deposit address that is derived from cold‑storage master public keys (XPUBs), without ever exposing private keys in the browser.

The app focuses on:

- A client dashboard with BTC, USDT, and USD balances
- A “Deposit Funds” flow that derives per‑client USDT (ERC‑20) and BTC addresses
- QR‑code based deposit instructions and address copy helpers
- An admin panel that simulates connecting a Trezor hardware wallet and importing XPUBs
- A recent‑transactions view for monitoring client activity (mock data)

> Note: This is a UI/architecture demo only. It does **not** connect to real wallets, broadcast transactions, or implement a matching engine. Do not use it to secure or move real funds.

## How It Works

- The admin panel lets you paste **master public keys (XPUBs)** for BTC and ETH (no private keys are ever stored).
- XPUB configuration is saved in your browser's `localStorage` so it persists across reloads and stays on your machine.
- For a given client, the app derives:
  - A USDT (ERC‑20) deposit address from the ETH XPUB using `ethers` and standard HD paths.
  - A BTC deposit address using a simplified mock derivation (for UI demonstration only).
- Each client gets a deterministic deposit address from the HD tree, so deposits can be credited on the exchange side while funds stay under cold‑wallet control.

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

- `index.html` – HTML shell and Tailwind CDN setup
- `index.tsx` – Main React application, wallet logic, and UI
- `vite.config.ts` / `tsconfig.json` – Build and TypeScript configuration

## Disclaimer

This repository is intended for demonstration, prototyping, and educational purposes.  
It omits many production concerns (KYC/AML, full audit trails, withdrawal flows, and real hardware‑wallet integration).  
Do not deploy as‑is to manage real cryptocurrency funds.
