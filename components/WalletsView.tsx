import React, { useMemo, useState } from "react";
import { AlertCircle, ArrowRightLeft, ShieldCheck, RefreshCw } from "lucide-react";
import { formatEther } from "ethers";
import { AppConfig, GeneratedWallet } from "../models";
import { deriveBtcAddress, deriveUsdtAddress } from "../crypto";

type WalletsViewProps = {
  config: AppConfig;
  wallets: GeneratedWallet[];
  setWallets: React.Dispatch<React.SetStateAction<GeneratedWallet[]>>;
};

export const WalletsView: React.FC<WalletsViewProps> = ({ config, wallets, setWallets }) => {
  const [asset, setAsset] = useState<"BTC" | "ETH">("BTC");
  const [count, setCount] = useState(5);
  const [startIndex, setStartIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const hasBtcXpub = !!config.btcMasterXpub;
  const hasEthXpub = !!config.ethMasterXpub;

  const filteredWallets = useMemo(
    () => wallets.filter((w) => w.asset === asset),
    [wallets, asset]
  );

  const generateWallets = () => {
    setMessage(null);

    if (count <= 0) {
      setMessage("Number of wallets must be greater than 0.");
      return;
    }
    if (count > 100) {
      setMessage("For safety, generation is limited to 100 wallets per batch.");
      return;
    }

    const now = new Date().toISOString();
    const next: GeneratedWallet[] = [];

    for (let i = 0; i < count; i += 1) {
      const derivationIndex = startIndex + i;
      let address = "";

      if (asset === "BTC") {
        if (!hasBtcXpub) {
          setMessage("BTC XPUB is not configured. Please set it in Admin Settings first.");
          return;
        }
        address = deriveBtcAddress(config.btcMasterXpub, derivationIndex);
      } else {
        if (!hasEthXpub) {
          setMessage("ETH XPUB is not configured. Please set it in Admin Settings first.");
          return;
        }
        address = deriveUsdtAddress(config.ethMasterXpub, derivationIndex);
      }

      if (!address) {
        setMessage("Unable to derive one or more addresses. Check your XPUB configuration.");
        return;
      }

      next.push({
        id: `${asset}-${derivationIndex}-${now}-${Math.random().toString(36).slice(2)}`,
        asset,
        derivationIndex,
        address,
        createdAt: now,
      });
    }

    setWallets((prev) => [...prev, ...next]);
    setMessage(`Generated ${count} ${asset} wallet(s) starting at index ${startIndex}.`);
  };

  const fetchJson = async (url: string) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const syncFromExplorers = async () => {
    setMessage(null);

    const currentWallets = filteredWallets;
    if (currentWallets.length === 0) {
      setMessage(`No ${asset === "BTC" ? "Bitcoin" : "Ethereum"} wallets to sync yet.`);
      return;
    }

    setSyncing(true);
    try {
      if (asset === "ETH") {
        const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined;
        if (!apiKey) {
          setMessage("VITE_ETHERSCAN_API_KEY is not configured. Add it to your .env.local to enable ETH sync.");
          return;
        }

        const updates: Record<string, { txCount: number; balanceWei: string }> = {};

        for (const w of currentWallets) {
          const addr = w.address;
          const lower = addr.toLowerCase();

          const balanceRes = await fetch(
            `https://api.etherscan.io/api?module=account&action=balance&address=${addr}&tag=latest&apikey=${apiKey}`
          );
          const balanceJson = await balanceRes.json();
          const balanceWei =
            balanceJson && balanceJson.status === "1" && typeof balanceJson.result === "string"
              ? balanceJson.result
              : "0";

          const txRes = await fetch(
            `https://api.etherscan.io/api?module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`
          );
          const txJson = await txRes.json();
          const txCount =
            txJson && txJson.status === "1" && Array.isArray(txJson.result) ? txJson.result.length : 0;

          updates[lower] = { txCount, balanceWei };
        }

        setWallets((prev) =>
          prev.map((w) => {
            if (w.asset !== "ETH") return w;
            const u = updates[w.address.toLowerCase()];
            if (!u) return w;
            return { ...w, txCount: u.txCount, balanceWei: u.balanceWei };
          })
        );
        setMessage("Synced Ethereum wallets from Etherscan.");
      } else {
        // BTC via a CORS-friendly public endpoint (mempool.space); Blockstream main site blocks CORS.
        const updates: Record<string, { txCount: number; balanceSats: number }> = {};

        for (const w of currentWallets) {
          const addr = w.address;
          const json = await fetchJson(`https://mempool.space/api/address/${addr}`);
          const chain = json && json.chain_stats ? json.chain_stats : {};
          const funded = typeof chain.funded_txo_sum === "number" ? chain.funded_txo_sum : 0;
          const spent = typeof chain.spent_txo_sum === "number" ? chain.spent_txo_sum : 0;
          const balanceSats = funded - spent;
          const txCount = typeof chain.tx_count === "number" ? chain.tx_count : 0;

          updates[addr] = { txCount, balanceSats };
        }

        setWallets((prev) =>
          prev.map((w) => {
            if (w.asset !== "BTC") return w;
            const u = updates[w.address];
            if (!u) return w;
            return { ...w, txCount: u.txCount, balanceSats: u.balanceSats };
          })
        );
        setMessage("Synced Bitcoin wallets from mempool.space.");
      }
    } catch (e) {
      console.error(e);
      setMessage(
        `Failed to sync ${asset === "BTC" ? "Bitcoin" : "Ethereum"} wallets. Check your network (and ETH API key).`
      );
    } finally {
      setSyncing(false);
    }
  };

  const formatBalance = (w: GeneratedWallet): string => {
    if (w.asset === "ETH" && w.balanceWei) {
      try {
        const eth = parseFloat(formatEther(BigInt(w.balanceWei)));
        if (Number.isNaN(eth)) return "-";
        return `${eth.toFixed(6)} ETH`;
      } catch {
        return "-";
      }
    }

    if (w.asset === "BTC" && typeof w.balanceSats === "number") {
      const btc = w.balanceSats / 1e8;
      return `${btc.toFixed(8)} BTC`;
    }

    return "-";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-fade-in">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-blue-400" />
              HD Wallet Generator
            </h2>
            <p className="text-xs text-slate-500">
              Derive multiple read-only wallets from your configured XPUBs. Use for address planning and
              demo only.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Blockchain
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAsset("BTC")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  asset === "BTC"
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-slate-900 text-slate-300 border-slate-700"
                }`}
              >
                Bitcoin
              </button>
              <button
                type="button"
                onClick={() => setAsset("ETH")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  asset === "ETH"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-slate-900 text-slate-300 border-slate-700"
                }`}
              >
                Ethereum (USDT path)
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Number of wallets
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value || "0", 10))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 px-3 py-1.5"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Starting index
            </label>
            <input
              type="number"
              min={0}
              value={startIndex}
              onChange={(e) => setStartIndex(parseInt(e.target.value || "0", 10))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 px-3 py-1.5"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={generateWallets}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-500"
          >
            Generate wallets
          </button>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <button
              type="button"
              onClick={syncFromExplorers}
              disabled={syncing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              {syncing ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              Sync balances
            </button>
            <span>
              Read-only wallets derived from XPUBs. No private keys are created; Ethereum data comes from
              Etherscan, Bitcoin data from Blockstream Explorer.
            </span>
          </div>
        </div>

        {message && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-300">
            <AlertCircle size={12} className="text-amber-400" />
            <span>{message}</span>
          </div>
        )}
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-white">Generated {asset} Wallets</h3>
          <span className="text-[11px] text-slate-500">
            Total stored: {filteredWallets.length.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Index</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3">Tx Count</th>
                <th className="px-6 py-3">Balance</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredWallets.map((w) => (
                <tr key={w.id} className="hover:bg-slate-900/70 transition-colors">
                  <td className="px-6 py-3 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                      m/{asset === "BTC" ? "84'/0'/0'" : "44'/60'/0'"}/0/{w.derivationIndex}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-100">{w.address}</td>
                  <td className="px-6 py-3 text-xs text-slate-300">
                    {w.asset === "ETH" ? w.txCount ?? "-" : "N/A"}
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-300">{formatBalance(w)}</td>
                  <td className="px-6 py-3 text-xs text-slate-500">{new Date(w.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {filteredWallets.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-xs text-slate-500" colSpan={5}>
                    No generated wallets yet for {asset}. Configure XPUBs in Admin, then use the form
                    above to derive addresses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
