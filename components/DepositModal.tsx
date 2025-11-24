import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, LogOut, QrCode, RefreshCw, ShieldCheck, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AppConfig, UserProfile } from "../models";
import { deriveUsdtAddress, deriveBtcAddress } from "../crypto";
import usdtLogo from "../assets/tokens/usdt.svg";
import usdcLogo from "../assets/tokens/usdc.png";
import btcLogo from "../assets/tokens/bitcoin.webp";

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  config: AppConfig;
  onRecordDeposit: (params: { client: UserProfile; asset: "BTC" | "USDT" | "USDC"; address: string }) => void;
};

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  user,
  config,
  onRecordDeposit,
}) => {
  const AssetIcon = ({ type }: { type: "USDT" | "USDC" | "BTC" }) => {
    if (type === "USDT") {
      return <img src={usdtLogo} alt="USDT" className="h-6 w-6 rounded-full shadow-sm" />;
    }
    if (type === "USDC") {
      return <img src={usdcLogo} alt="USDC" className="h-6 w-6 rounded-full shadow-sm" />;
    }
    return <img src={btcLogo} alt="BTC" className="h-6 w-6 rounded-full shadow-sm" />;
  };

  const [asset, setAsset] = useState<"BTC" | "USDT" | "USDC">("USDT");
  const [address, setAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRecordedKey, setLastRecordedKey] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [amountCurrency, setAmountCurrency] = useState<"ASSET" | "USD">("ASSET");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      const timer = setTimeout(() => {
        if (asset === "USDT" || asset === "USDC") {
          const addr = deriveUsdtAddress(config.ethMasterXpub, user.derivationIndex);
          if (!addr || addr.startsWith("Error:")) {
            setError("Unable to derive ERC20 address. Please check your ETH XPUB in Admin Settings.");
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

  const parsedAmount = useMemo(() => {
    const numeric = parseFloat(amount);
    if (!amount || Number.isNaN(numeric) || numeric <= 0) return null;
    return numeric;
  }, [amount]);

  const qrValue = useMemo(() => {
    if (!address) return "Waiting for address";

    // USDT (ERC20) — use EIP-681 style transfer with mainnet USDT contract.
    if (asset === "USDT" || asset === "USDC") {
      const contract =
        asset === "USDT" ? "0xdAC17F958D2ee523a2206206994597C13D831ec7" : "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

      if (parsedAmount) {
        const value = Math.round(parsedAmount * 1_000_000); // USDT/USDC use 6 decimals
        return `ethereum:${contract}/transfer?address=${address}&uint256=${value}`;
      }
      return `ethereum:${contract}/transfer?address=${address}`;
    }

    // BTC — BIP21 with optional amount in BTC. If user enters USD, embed as memo.
    if (asset === "BTC" && parsedAmount && amountCurrency === "ASSET") {
      const amt = parsedAmount.toFixed(8);
      return `bitcoin:${address}?amount=${amt}`;
    }

    if (asset === "BTC" && parsedAmount && amountCurrency === "USD") {
      const memo = encodeURIComponent(`USD ${parsedAmount.toFixed(2)}`);
      return `bitcoin:${address}?message=${memo}`;
    }

    return address;
  }, [address, asset, parsedAmount, amountCurrency]);

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
          <div className="grid grid-cols-3 gap-2 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setAsset("USDT")}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                asset === "USDT"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <AssetIcon type="USDT" />
              <span>USDT</span>
              <span className="text-[10px] text-emerald-100/80">ERC20</span>
            </button>
            <button
              onClick={() => setAsset("USDC")}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                asset === "USDC"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <AssetIcon type="USDC" />
              <span>USDC</span>
              <span className="text-[10px] text-sky-100/90">ERC20</span>
            </button>
            <button
              onClick={() => setAsset("BTC")}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                asset === "BTC"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <AssetIcon type="BTC" />
              <span>BTC</span>
              <span className="text-[10px] text-orange-100/90">SegWit</span>
            </button>
          </div>

          {/* Warnings */}
          <div
            className={`border p-4 rounded-xl flex gap-3 transition-colors ${
              asset === "USDT"
                ? "bg-emerald-900/10 border-emerald-500/20"
                : asset === "USDC"
                  ? "bg-sky-900/10 border-sky-500/20"
                  : "bg-orange-900/10 border-orange-500/20"
            }`}
          >
            <AlertCircle
              className={`shrink-0 ${
                asset === "USDT" ? "text-emerald-500" : asset === "USDC" ? "text-sky-400" : "text-orange-500"
              }`}
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
              ) : asset === "USDC" ? (
                <span>
                  Send only <strong className="text-white">USDC (ERC20)</strong>. This address is derived from our
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

          {/* Amount entry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-bold">
              <span>Requested amount</span>
              <div className="flex gap-1 rounded-lg bg-slate-800 p-1">
                <button
                  onClick={() => setAmountCurrency("ASSET")}
                  className={`px-2 py-1 rounded-md text-[11px] ${
                    amountCurrency === "ASSET" ? "bg-slate-700 text-white" : "text-slate-400"
                  }`}
                >
                  {asset}
                </button>
                <button
                  onClick={() => setAmountCurrency("USD")}
                  className={`px-2 py-1 rounded-md text-[11px] ${
                    amountCurrency === "USD" ? "bg-slate-700 text-white" : "text-slate-400"
                  }`}
                >
                  USD
                </button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="0.00000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter ${amountCurrency === "USD" ? "USD" : asset} amount (optional)`}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 px-3 py-2"
            />
            <p className="text-[11px] text-slate-500">
              Amount is encoded into the QR. For BTC, USD amounts are attached as a memo; no conversion is performed.
            </p>
          </div>

          {/* QR & Address */}
          <div className="flex flex-col items-center gap-6">
            <div className="bg-white p-3 rounded-xl shadow-lg relative">
              {loading ? (
                <div className="w-40 h-40 flex items-center justify-center bg-slate-100 rounded-lg">
                  <RefreshCw className="animate-spin text-slate-400" size={32} />
                </div>
              ) : (
                <QRCodeSVG
                  value={qrValue}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#020617"
                  includeMargin
                />
              )}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 shadow-sm whitespace-nowrap">
                Scan with Wallet
              </div>
            </div>

            <div className="w-full">
              <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block flex justify-between">
                <span>Your {asset} Deposit Address</span>
                {(asset === "USDT" || asset === "USDC") && !loading && (
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
