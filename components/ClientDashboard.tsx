import React from "react";
import { TrendingUp } from "lucide-react";
import { UserProfile, DepositEvent } from "../models";

type BalanceCardProps = {
  label: string;
  amount: number;
  currency: string;
  trend: number;
};

const BalanceCard: React.FC<BalanceCardProps> = ({ label, amount, currency, trend }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <TrendingUp size={60} />
    </div>
    <span className="text-slate-400 text-sm font-medium z-10">{label}</span>
    <div className="flex items-baseline gap-2 z-10">
      <span className="text-2xl font-bold text-white">
        {currency === "USD" ? "$" : ""}
        {amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
        {currency !== "USD" && <span className="text-sm ml-1 text-slate-500">{currency}</span>}
      </span>
    </div>
    <div
      className={`text-xs font-medium flex items-center gap-1 z-10 ${
        trend > 0 ? "text-emerald-500" : "text-red-500"
      }`}
    >
      <TrendingUp size={12} />
      {trend > 0 ? "+" : ""}
      {trend}% this week
    </div>
  </div>
);

type ClientDashboardProps = {
  client: UserProfile | undefined;
  deposits: DepositEvent[];
};

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ client, deposits }) => {
  const balances = client?.balance ?? { btc: 0, usdt: 0, usd: 0 };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-fade-in">
      {/* Stats Row (uses selected client balances for now) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard label="Total Balance (USD)" amount={68450.25} currency="USD" trend={12.5} />
        <BalanceCard label="Tether" amount={balances.usdt} currency="USDT" trend={4.2} />
        <BalanceCard label="Bitcoin" amount={balances.btc} currency="BTC" trend={-1.2} />
      </div>

      {/* Recent Activity Mock */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-white">Recent Deposit Activity (Simulated)</h3>
          <span className="text-[10px] text-slate-500">Derived addresses only, no on-chain data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Derivation Index</th>
                <th className="px-6 py-3">Address (prefix)</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {deposits.map((event) => (
                <tr key={event.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-6 py-4">{event.clientName}</td>
                  <td className="px-6 py-4">{event.asset}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      m/…/{event.derivationIndex}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-300">
                    {event.address.slice(0, 8)}…
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-slate-500 text-xs" colSpan={5}>
                    No derived deposit addresses yet. Open the Deposit dialog to generate one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-500 text-right">
        All deposit activity above is simulated and based only on locally derived addresses.
      </div>
    </div>
  );
};
