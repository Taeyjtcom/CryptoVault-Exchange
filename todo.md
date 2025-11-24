# CryptoVault Exchange - POC TODO

Goal: turn this demo into a self-contained proof of concept that:

- Accepts BTC/ETH XPUBs you provide (no hard-coded keys).
- Derives clean per-client deposit addresses from those XPUBs.
- Does **not** connect to any external platforms/APIs beyond local code execution.
- Does **not** broadcast transactions or hold real funds.

---

## 1. XPUB Configuration (Must Have)

- [x] (1.1) Replace hard-coded `INITIAL_CONFIG` XPUB values with empty defaults.
- [x] (1.2) Add UI fields to input BTC XPUB and ETH XPUB in the Admin panel.
- [x] (1.3) Add basic XPUB validation (prefix, length, checksum where possible).
- [x] (1.4) Persist XPUB configuration in `localStorage` so it survives reloads.
- [x] (1.5) Add a "Reset configuration" button to clear stored XPUBs.
- [x] (1.6) Update copy to clearly state that only public keys are stored locally.

## 2. Client & Address Model (Must Have)

- [x] (2.1) Define a minimal client model (`id`, `name`, `derivationIndex`, optional tags).
- [x] (2.2) Implement in-memory client list with ability to:
  - [x] (2.3) Create a new client.
  - [x] (2.4) Auto-assign the next available `derivationIndex` for each new client.
  - [x] (2.5) Edit client name / notes.
- [x] (2.6) Persist client list and indexes in `localStorage`.
- [x] (2.7) Ensure derivation indexes are never reused once assigned.

## 3. Address Derivation Logic (Must Have)

- [x] (3.1) Keep ETH/USDT derivation using XPUB + `ethers.HDNodeWallet.fromExtendedKey`.
- [x] (3.2) Use a standard derivation path convention and document it (e.g. `m/44'/60'/0'/0/index`).
- [x] (3.3) Replace the mock BTC derivation with a deterministic, library-based function (e.g. via `bitcoinjs-lib` or similar) **without** external network calls.
- [x] (3.4) Handle and display derivation errors gracefully (invalid XPUB, wrong network, etc.).
- [ ] (3.5) Add unit-test-style helpers (or a small test harness) to confirm deterministic address generation for sample XPUBs and indexes.

## 4. Deposit Flow (Must Have)

- [x] (4.1) Update the "Deposit Funds" modal to work with a selectable client (not just a single mock user).
- [x] (4.2) Show derived BTC and USDT addresses for the chosen client and asset.
- [ ] (4.3) Replace external QR code API calls with a local QR generator library (no HTTP requests).
- [x] (4.4) Add "Copy address" and visual confirmation (already present, verify it works for all assets).
- [x] (4.5) Add clear warnings: "Send only USDT (ERC-20)" vs "Send only BTC" for each address.

## 5. Recent Activity View (Must Have for POC UX, Mocked)

- [ ] (5.1) Implement a simple mocked "Recent Deposits" table that:
  - [ ] (5.2) Record when a deposit address is generated/shown to the user.
  - [ ] (5.3) Tie each record to client, asset, and derivation index.
- [ ] (5.4) Persist these mock events in `localStorage` for demonstration.
- [ ] (5.5) Clearly label all activity as simulated / mock (no real chain data).

## 6. No External Integrations (Must Enforce)

- [ ] (6.1) Remove or replace any HTTP calls (e.g. external QR code APIs).
- [ ] (6.2) Ensure there are no calls to exchange APIs, blockchain explorers, or data providers.
- [ ] (6.3) Add a small "No external connections" note on the Admin/Settings screen.

## 7. Security & UX Messaging (Must Have)

- [ ] (7.1) Add an in-app "Security Model" section:
  - [ ] (7.2) Explain XPUB-only usage and that private keys stay off-device.
  - [ ] (7.3) Clarify that this is a non-custodial, non-trading demo.
- [ ] (7.4) Add inline help text near XPUB inputs explaining expected format and network.
- [ ] (7.5) Add a top-level banner warning: "POC only - do not use for real funds."

## 8. Documentation (Must Have)

- [ ] (8.1) Update `README.md` with:
  - [ ] (8.2) Add a short description of the new POC flow.
  - [ ] (8.3) Document exact derivation path conventions for BTC and ETH/USDT.
  - [ ] (8.4) Document instructions for supplying your own XPUBs and resetting state.
  - [ ] (8.5) Clearly state that no external platforms are contacted.
- [ ] (8.6) Add a brief "How to demo" script: admin setup → add clients → generate addresses.

## 9. Nice-to-Have (Optional for First POC)

- [ ] (9.1) Add simple "Export state" / "Import state" JSON for XPUBs, clients, and mock activity.
- [ ] (9.2) Add optional passphrase/PIN to gate access to the Admin/XPUB screen (stored locally).
- [ ] (9.3) Add per-client option to generate multiple deposit addresses (multiple indices) and label them.
- [ ] (9.4) Add dark/light mode toggle for presentation.
