import React, { useState } from "react";
import { ShieldCheck, Settings, RefreshCw, CheckCircle2, Download, Upload } from "lucide-react";
import { Mnemonic, HDNodeWallet } from "ethers";
import trezorLogo from "../trezor.svg";
import { AppConfig, INITIAL_CONFIG } from "../models";

type AdminPanelProps = {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, setConfig }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [btcError, setBtcError] = useState<string | null>(null);
  const [ethError, setEthError] = useState<string | null>(null);
  const [stateJson, setStateJson] = useState("");
  const [stateMessage, setStateMessage] = useState<string | null>(null);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const CONFIG_STORAGE_KEY = "cryptovault_config_v1";
  const CLIENTS_STORAGE_KEY = "cryptovault_clients_v1";
  const DEPOSITS_STORAGE_KEY = "cryptovault_deposits_v1";

  const validateXpub = (xpub: string): string | null => {
    if (!xpub.trim()) {
      return "XPUB is required";
    }
    if (!xpub.startsWith("xpub") && !xpub.startsWith("zpub")) {
      return 'BTC extended key should start with "xpub" or "zpub" (mainnet)';
    }
    if (xpub.length < 100 || xpub.length > 120) {
      return "XPUB length looks unusual; please verify";
    }
    if (!/^[0-9A-Za-z]+$/.test(xpub)) {
      return "XPUB should contain only base58 characters";
    }
    return null;
  };

  const handleBtcXpubChange = (next: string) => {
    setConfig((prev) => ({
      ...prev,
      btcMasterXpub: next,
    }));
    setBtcError(validateXpub(next));
  };

  const handleEthXpubChange = (next: string) => {
    setConfig((prev) => ({
      ...prev,
      ethMasterXpub: next,
    }));
    setEthError(validateXpub(next));
  };

  const handleResetConfig = () => {
    setConfig({ ...INITIAL_CONFIG });
    setBtcError(null);
    setEthError(null);
    setSuccessMsg("Configuration reset. No XPUBs stored locally.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleConnectTrezor = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setConfig((prev) => ({
        ...prev,
        trezorConnected: true,
        // In a real app, this XPUB comes from TrezorConnect.getPublicKey({ path: "m/44'/60'/0'" })
        ethMasterXpub:
          "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWLTeF2soUFFaxpJZGuGkgWsnaxX33zTiY55S8Qcw4w9885iM5f3s3ld1H4WbUq1nFq2J2q",
      }));
      setIsConnecting(false);
      setSuccessMsg("Trezor connected successfully! Master Public Keys imported.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }, 1500);
  };

  const handleDeriveFromSeed = () => {
    try {
      const phrase = seedPhrase.trim();
      if (!phrase) {
        setSeedMessage("Enter a BIP39 seed phrase to derive XPUBs (test phrases only).");
        return;
      }

      const words = phrase.split(/\s+/);
      if (words.length < 12 || words.length > 24) {
        setSeedMessage("Seed phrase should typically be 12–24 words.");
        return;
      }

      const mnemonic = Mnemonic.fromPhrase(phrase);
      const root = HDNodeWallet.fromSeed(mnemonic.computeSeed());

      const btcAccount = root.derivePath("m/84'/0'/0'");
      const btcXpub = btcAccount.neuter().extendedKey;

      const ethAccount = root.derivePath("m/44'/60'/0'");
      const ethXpub = ethAccount.neuter().extendedKey;

      setConfig((prev) => ({
        ...prev,
        btcMasterXpub: btcXpub,
        ethMasterXpub: ethXpub,
      }));

      setSeedPhrase("");
      setSeedMessage("XPUBs derived from seed phrase in-memory only. Seed was not persisted.");
      setBtcError(null);
      setEthError(null);
    } catch (e) {
      console.error(e);
      setSeedMessage("Could not parse or derive from the provided seed phrase. Please check it and try again.");
    }
  };

  const handleExportState = () => {
    try {
      const payload = {
        config: JSON.parse(window.localStorage.getItem(CONFIG_STORAGE_KEY) || "{}"),
        clients: JSON.parse(window.localStorage.getItem(CLIENTS_STORAGE_KEY) || "[]"),
        deposits: JSON.parse(window.localStorage.getItem(DEPOSITS_STORAGE_KEY) || "[]"),
      };
      const pretty = JSON.stringify(payload, null, 2);
      setStateJson(pretty);
      setStateMessage("State exported. You can copy the JSON below for backup.");
    } catch {
      setStateMessage("Failed to export state from localStorage.");
    }
  };

  const handleImportState = () => {
    try {
      if (!stateJson.trim()) {
        setStateMessage("Paste a JSON payload before importing.");
        return;
      }
      const parsed = JSON.parse(stateJson);
      if (parsed.config) {
        window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(parsed.config));
      }
      if (parsed.clients) {
        window.localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(parsed.clients));
      }
      if (parsed.deposits) {
        window.localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(parsed.deposits));
      }
      setStateMessage("State imported. Reload the page to apply all changes.");
    } catch (e) {
      console.error(e);
      setStateMessage("Invalid JSON. Please check the payload and try again.");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Wallet Management System</h2>
        <p className="text-slate-400">
          Manage cold storage integration for automatic address generation.
        </p>

        <div className="mt-4 bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Security Model (POC)
          </h3>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            <li>
              XPUB-only: the app stores <span className="font-semibold">only</span> master public keys
              (XPUBs) in your browser&apos;s localStorage; private keys never leave your hardware wallet
              or offline system.
            </li>
            <li>
              Non-custodial demo: this interface derives deposit addresses but does not hold funds,
              broadcast transactions, or perform trading/matching.
            </li>
            <li>
              Local-only logic: no external exchange, blockchain explorer, or third-party data APIs are
              called as part of the wallet flow; address derivation happens entirely client-side.
            </li>
          </ul>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      <div className="grid gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={120} className="text-blue-500" />
          </div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <img src={trezorLogo} alt="Trezor" className="h-6 opacity-80" />
                Hardware Wallet Integration
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-lg">
                Connect your Trezor device to import Master Public Keys (XPUBs). The platform will
                automatically derive a unique deposit address for each client. Funds deposited by
                clients go directly to addresses controlled by your Trezor.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleConnectTrezor}
                disabled={config.trezorConnected || isConnecting}
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                  config.trezorConnected
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default"
                    : "bg-white text-slate-900 hover:bg-slate-200 shadow-lg shadow-white/10"
                }`}
              >
                {isConnecting ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : config.trezorConnected ? (
                  <ShieldCheck size={16} />
                ) : (
                  <Settings size={16} />
                )}
                {isConnecting ? "Syncing..." : config.trezorConnected ? "Trezor Active" : "Connect Trezor"}
              </button>
              <button
                type="button"
                onClick={handleResetConfig}
                className="text-xs text-slate-400 hover:text-slate-200 underline-offset-2 hover:underline"
              >
                Reset XPUB configuration
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="group">
              <label className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1 block">
                Bitcoin Master XPUB / ZPUB (SegWit)
              </label>
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={config.btcMasterXpub}
                  onChange={(e) => handleBtcXpubChange(e.target.value)}
                  placeholder="Paste your BTC xpub..."
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg block w-full p-2.5 font-mono"
                />
                {btcError && <p className="text-xs text-red-400">{btcError}</p>}
                {!btcError && (
                  <p className="text-[10px] text-slate-500">
                    Expected: mainnet <code className="font-mono">xpub...</code> or{" "}
                    <code className="font-mono">zpub...</code> from a SegWit account (e.g.{" "}
                    <code className="font-mono">m/84&apos;/0&apos;/0&apos;</code>). Testnet keys are not
                    supported in this POC.
                  </p>
                )}
              </div>
            </div>

            <div className="group">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                  Ethereum Master XPUB (USDT-ERC20)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                    Path: m/44&apos;/60&apos;/0&apos;
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={config.ethMasterXpub}
                  onChange={(e) => handleEthXpubChange(e.target.value)}
                  placeholder="Paste your ETH xpub for USDT addresses..."
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg block w-full p-2.5 font-mono border-l-4 border-l-emerald-500"
                />
                {ethError && <p className="text-xs text-red-400">{ethError}</p>}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Used to generate USDT (ERC20) deposit addresses from your provided master public key.
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Paste an ETH mainnet account-level XPUB for <code className="font-mono">m/44&apos;/60&apos;/0&apos;</code>.
                The app uses it only to derive read-only USDT (ERC20) deposit addresses per client.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-white mb-1">Seed Phrase (POC-only, unsafe)</h3>
          <p className="text-xs text-amber-400">
            Never enter a real production seed here. This helper is for offline test phrases only. The
            phrase is used in-memory to derive XPUBs and is not written to localStorage.
          </p>
          <textarea
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono p-2 resize-y"
            placeholder="example: goose window ... (test seed only)"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleDeriveFromSeed}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Derive BTC &amp; ETH XPUBs
            </button>
            {seedMessage && <p className="text-[11px] text-slate-400 text-right">{seedMessage}</p>}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                State Export / Import
              </h3>
              <p className="text-xs text-slate-500">
                Backup or restore XPUB configuration, clients, and mock deposit activity as JSON.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportState}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-600"
              >
                <Download size={14} />
                Export
              </button>
              <button
                type="button"
                onClick={handleImportState}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-600"
              >
                <Upload size={14} />
                Import
              </button>
            </div>
          </div>
          <textarea
            value={stateJson}
            onChange={(e) => setStateJson(e.target.value)}
            rows={6}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono p-2 resize-y"
            placeholder='Click "Export" to populate with the current local state, or paste JSON here and click "Import".'
          />
          {stateMessage && <p className="text-[11px] text-slate-400">{stateMessage}</p>}
        </div>
      </div>
    </div>
  );
};
