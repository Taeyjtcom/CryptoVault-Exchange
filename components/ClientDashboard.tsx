import React from "react";
import { TrendingUp } from "lucide-react";
import { UserProfile } from "../models";

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
};

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ client }) => {
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
          <h3 className="font-semibold text-white">Recent Transactions</h3>
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[1, 2, 3].map((_, i) => (
                <tr key={i} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Deposit
                    </span>
                  </td>
                  <td className="px-6 py-4">{i === 0 ? "USDT" : "BTC"}</td>
                  <td className="px-6 py-4">{i === 0 ? "2 500.00" : "0.050"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Confirmed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">2025-01-0{i + 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-500 text-right">
        All transaction data is simulated for demonstration purposes.
      </div>
    </div>
  );
};
