import React, { useEffect, useState } from "react";
import { AlertCircle, LogOut, QrCode, RefreshCw, ShieldCheck, Copy } from "lucide-react";
import { AppConfig, UserProfile } from "../models";
import { deriveUsdtAddress, deriveBtcAddress } from "../crypto";

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  config: AppConfig;
  onRecordDeposit: (params: { client: UserProfile; asset: "BTC" | "USDT"; address: string }) => void;
};

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  user,
  config,
  onRecordDeposit,
}) => {
  const [asset, setAsset] = useState<"BTC" | "USDT">("USDT");
  const [address, setAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRecordedKey, setLastRecordedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      const timer = setTimeout(() => {
        if (asset === "USDT") {
          const addr = deriveUsdtAddress(config.ethMasterXpub, user.derivationIndex);
          if (!addr || addr.startsWith("Error:")) {
            setError("Unable to derive USDT address. Please check your ETH XPUB in Admin Settings.");
            setAddress("");
          } else {
            setAddress(addr);
          }
        } else {
          const addr = deriveBtcAddress(config.btcMasterXpub, user.derivationIndex);
          if (!addr || addr.startsWith("Error:")) {
            setError("Unable to derive BTC address. Please check your BTC XPUB in Admin Settings.");
            setAddress("");
          } else {
            setAddress(addr);
          }
        }
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [asset, isOpen, config, user]);

  useEffect(() => {
    if (!isOpen || !address || error) return;
    const key = `${user.id}-${asset}-${address}`;
    if (key === lastRecordedKey) return;
    onRecordDeposit({ client: user, asset, address });
    setLastRecordedKey(key);
  }, [isOpen, address, asset, error, lastRecordedKey, onRecordDeposit, user]);

  const copyToClipboard = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode size={20} className="text-blue-500" />
            Deposit Funds
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <LogOut size={20} className="rotate-45" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Asset Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setAsset("USDT")}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                asset === "USDT" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white"></div>
              USDT (ERC20)
            </button>
            <button
              onClick={() => setAsset("BTC")}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                asset === "BTC" ? "bg-orange-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white"></div>
              Bitcoin
            </button>
          </div>

          {/* Warnings */}
          <div
            className={`border p-4 rounded-xl flex gap-3 transition-colors ${
              asset === "USDT"
                ? "bg-emerald-900/10 border-emerald-500/20"
                : "bg-orange-900/10 border-orange-500/20"
            }`}
          >
            <AlertCircle
              className={`shrink-0 ${asset === "USDT" ? "text-emerald-500" : "text-orange-500"}`}
              size={20}
            />
            <div className="text-sm text-slate-300">
              {error ? (
                <span className="text-red-400">{error}</span>
              ) : asset === "USDT" ? (
                <span>
                  Send only <strong className="text-white">USDT (ERC20)</strong>. This address is derived from our
                  secure cold wallet specifically for your account.
                </span>
              ) : (
                <span>
                  Send only <strong className="text-white">Bitcoin (BTC)</strong>. This address is unique to you and
                  updates automatically upon receipt.
                </span>
              )}
            </div>
          </div>

          {/* QR & Address */}
          <div className="flex flex-col items-center gap-6">
            <div className="bg-white p-3 rounded-xl shadow-lg relative">
              {loading ? (
                <div className="w-40 h-40 flex items-center justify-center bg-slate-100 rounded-lg">
                  <RefreshCw className="animate-spin text-slate-400" size={32} />
                </div>
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${address}`}
                  alt="Deposit QR"
                  className="w-40 h-40"
                />
              )}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 shadow-sm whitespace-nowrap">
                Scan with Wallet
              </div>
            </div>

            <div className="w-full">
              <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block flex justify-between">
                <span>Your {asset} Deposit Address</span>
                {asset === "USDT" && !loading && (
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <ShieldCheck size={10} /> Secure HD Wallet
                  </span>
                )}
              </label>

              <div
                onClick={copyToClipboard}
                className="group relative flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all rounded-xl p-3 cursor-pointer overflow-hidden"
              >
                {loading ? (
                  <span className="text-xs text-slate-500">Deriving address...</span>
                ) : (
                  <>
                    <span className="font-mono text-xs text-slate-100 truncate pr-10">
                      {address || "No address available. Check your XPUB configuration."}
                    </span>
                    <div className="flex items-center gap-2">
                      <Copy size={16} className="text-slate-400 group-hover:text-slate-200" />
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-200">
                        {copied ? "Copied!" : "Click to copy"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
