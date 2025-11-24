import React, { useState } from "react";
import { ShieldCheck, Settings, RefreshCw, CheckCircle2 } from "lucide-react";
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

  const validateXpub = (xpub: string): string | null => {
    if (!xpub.trim()) {
      return "XPUB is required";
    }
    if (!xpub.startsWith("xpub")) {
      return 'XPUB must start with "xpub" (mainnet)';
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

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Wallet Management System</h2>
        <p className="text-slate-400">
          Manage cold storage integration for automatic address generation.
        </p>
        <p className="text-xs text-slate-500 mt-2 max-w-xl">
          Only read-only master public keys (XPUBs) are stored locally in your browser. Private keys
          remain on your hardware wallet or offline system.
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-xl">
          This POC does not call any external exchange, blockchain explorer, or data API; all address
          derivation happens entirely in your browser.
        </p>
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
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/56/Trezor_Logo_w_icon_White.svg"
                  alt="Trezor"
                  className="h-6 opacity-80"
                />
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
                Bitcoin Master XPUB (SegWit)
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
