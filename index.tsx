
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Wallet, 
  ArrowRightLeft, 
  Settings, 
  ShieldCheck, 
  User, 
  Copy, 
  QrCode, 
  LayoutDashboard, 
  TrendingUp, 
  LogOut,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { ethers } from "ethers";

// --- Types & Interfaces ---

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'admin';
  balance: {
    btc: number;
    usdt: number;
    usd: number;
  };
  // The unique index for this user in the HD wallet tree (m/44'/60'/0'/0/index)
  derivationIndex: number; 
  // Optional free-form notes/tags for this client
  notes?: string;
}

interface AppConfig {
  // Master Public Keys (from Trezor/Cold Storage)
  btcMasterXpub: string;
  ethMasterXpub: string; // Used for USDT-ERC20
  trezorConnected: boolean;
}

// --- Mock / Initial Data ---

const INITIAL_CLIENTS: UserProfile[] = [
  {
    id: 1,
    name: "Alex Trader",
    email: "alex@example.com",
    role: 'client',
    derivationIndex: 1,
    balance: {
      btc: 0.45,
      usdt: 12500.0,
      usd: 450.2
    },
    notes: "Example seeded client for demo"
  }
];

const INITIAL_CONFIG: AppConfig = {
  // Start with empty XPUBs; user or admin must provide them
  btcMasterXpub: "",
  ethMasterXpub: "",
  trezorConnected: false
};

const CONFIG_STORAGE_KEY = 'cryptovault_config_v1';
const CLIENTS_STORAGE_KEY = 'cryptovault_clients_v1';

const getInitialConfig = (): AppConfig => {
  if (typeof window === 'undefined') {
    return INITIAL_CONFIG;
  }
  try {
    const stored = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!stored) return INITIAL_CONFIG;
    const parsed = JSON.parse(stored);
    return {
      btcMasterXpub: parsed.btcMasterXpub ?? "",
      ethMasterXpub: parsed.ethMasterXpub ?? "",
      trezorConnected: Boolean(parsed.trezorConnected)
    };
  } catch {
    return INITIAL_CONFIG;
  }
};

const getInitialClients = (): UserProfile[] => {
  if (typeof window === 'undefined') {
    return INITIAL_CLIENTS;
  }
  try {
    const stored = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!stored) return INITIAL_CLIENTS;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return INITIAL_CLIENTS;
    return parsed;
  } catch {
    return INITIAL_CLIENTS;
  }
};

// --- Crypto Logic Helper ---

class CryptoService {
  /**
   * Derives an ETH address (for USDT-ERC20) from a master XPUB and an index.
   * This allows the Trezor to manage the funds without exposing private keys here.
   * Path: m/44'/60'/0'/0/index (Standard External Chain)
   */
  static deriveUsdtAddress(xpub: string, index: number): string {
    try {
      if (!xpub || !xpub.startsWith('xpub')) return "";
      
      // Initialize HD Node from the master public key
      const node = ethers.HDNodeWallet.fromExtendedKey(xpub);
      
      // Derive the child at the specific index for the user
      // Assuming xpub is at Account level (m/44'/60'/0'), we derive 0/index (Receive/Index)
      const child = node.derivePath(`0/${index}`);
      
      return child.address;
    } catch (e) {
      console.error("Error deriving ETH address:", e);
      return "Error: Invalid XPUB Configuration";
    }
  }

  /**
   * Derives a BTC address from a master XPUB and an index.
   * (Simplified mock for demo as bitcoinjs-lib is not available in this env)
   */
  static deriveBtcAddress(xpub: string, index: number): string {
    // In a real production app, use bitcoinjs-lib or similar
    // This mocks the deterministic nature for the UI
    if (!xpub) return "";
    const mockHash = xpub.substring(10, 20) + index;
    return `bc1q${mockHash.toLowerCase()}k58...`;
  }
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active 
        ? 'bg-blue-600/10 text-blue-500' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </div>
);

const BalanceCard = ({ label, amount, currency, trend }: any) => (
  <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Wallet size={60} />
    </div>
    <span className="text-slate-400 text-sm font-medium z-10">{label}</span>
    <div className="flex items-baseline gap-2 z-10">
      <span className="text-2xl font-bold text-white">
        {currency === 'USD' ? '$' : ''}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
        {currency !== 'USD' && <span className="text-sm ml-1 text-slate-500">{currency}</span>}
      </span>
    </div>
    <div className={`text-xs font-medium flex items-center gap-1 z-10 ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
      <TrendingUp size={12} />
      {trend > 0 ? '+' : ''}{trend}% this week
    </div>
  </div>
);

const AdminPanel = ({ config, setConfig }: { config: AppConfig, setConfig: any }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [btcError, setBtcError] = useState<string | null>(null);
  const [ethError, setEthError] = useState<string | null>(null);

  const validateXpub = (xpub: string): string | null => {
    if (!xpub.trim()) {
      return 'XPUB is required';
    }
    if (!xpub.startsWith('xpub')) {
      return 'XPUB must start with "xpub" (mainnet)';
    }
    if (xpub.length < 100 || xpub.length > 120) {
      return 'XPUB length looks unusual; please verify';
    }
    if (!/^[0-9A-Za-z]+$/.test(xpub)) {
      return 'XPUB should contain only base58 characters';
    }
    return null;
  };

  const handleBtcXpubChange = (next: string) => {
    setConfig((prev: AppConfig) => ({
      ...prev,
      btcMasterXpub: next
    }));
    setBtcError(validateXpub(next));
  };

  const handleEthXpubChange = (next: string) => {
    setConfig((prev: AppConfig) => ({
      ...prev,
      ethMasterXpub: next
    }));
    setEthError(validateXpub(next));
  };

  const handleResetConfig = () => {
    setConfig({ ...INITIAL_CONFIG });
    setBtcError(null);
    setEthError(null);
    setSuccessMsg('Configuration reset. No XPUBs stored locally.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleConnectTrezor = () => {
    setIsConnecting(true);
    // Simulate Trezor Connect interaction
    setTimeout(() => {
      setConfig((prev: AppConfig) => ({
        ...prev,
        trezorConnected: true,
        // In a real app, this XPUB comes from TrezorConnect.getPublicKey({ path: "m/44'/60'/0'" })
        ethMasterXpub: "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWLTeF2soUFFaxpJZGuGkgWsnaxX33zTiY55S8Qcw4w9885iM5f3s3ld1H4WbUq1nFq2J2q"
      }));
      setIsConnecting(false);
      setSuccessMsg('Trezor connected successfully! Master Public Keys imported.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Wallet Management System</h2>
        <p className="text-slate-400">Manage cold storage integration for automatic address generation.</p>
        <p className="text-xs text-slate-500 mt-2 max-w-xl">
          Only read-only master public keys (XPUBs) are stored locally in your browser. 
          Private keys remain on your hardware wallet or offline system.
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
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/56/Trezor_Logo_w_icon_White.svg" alt="Trezor" className="h-6 opacity-80"/>
                Hardware Wallet Integration
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-lg">
                Connect your Trezor device to import Master Public Keys (XPUBs). 
                The platform will automatically derive a unique deposit address for each client.
                Funds deposited by clients go directly to addresses controlled by your Trezor.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
            <button 
              onClick={handleConnectTrezor}
              disabled={config.trezorConnected || isConnecting}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                config.trezorConnected 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default' 
                  : 'bg-white text-slate-900 hover:bg-slate-200 shadow-lg shadow-white/10'
              }`}
            >
              {isConnecting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : config.trezorConnected ? (
                <ShieldCheck size={16} />
              ) : (
                <Settings size={16} />
              )}
              {isConnecting ? 'Syncing...' : config.trezorConnected ? 'Trezor Active' : 'Connect Trezor'}
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
              <label className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1 block">Bitcoin Master XPUB (SegWit)</label>
              <div className="flex flex-col gap-1">
                <input 
                  type="text" 
                  value={config.btcMasterXpub}
                  onChange={(e) => handleBtcXpubChange(e.target.value)}
                  placeholder="Paste your BTC xpub..."
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg block w-full p-2.5 font-mono"
                />
                {btcError && (
                  <p className="text-xs text-red-400">{btcError}</p>
                )}
              </div>
            </div>
            
            <div className="group">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Ethereum Master XPUB (USDT-ERC20)</label>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Path: m/44'/60'/0'</span>
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
                {ethError && (
                  <p className="text-xs text-red-400">{ethError}</p>
                )}
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

const DepositModal = ({ isOpen, onClose, user, config }: any) => {
  const [asset, setAsset] = useState<'BTC' | 'USDT'>('USDT');
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate calculation delay for effect
      const timer = setTimeout(() => {
        if (asset === 'USDT') {
          const addr = CryptoService.deriveUsdtAddress(config.ethMasterXpub, user.derivationIndex);
          setAddress(addr);
        } else {
          setAddress(CryptoService.deriveBtcAddress(config.btcMasterXpub, user.derivationIndex));
        }
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [asset, isOpen, config, user]);

  const copyToClipboard = () => {
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
            <QrCode size={20} className="text-blue-500"/>
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
              onClick={() => setAsset('USDT')}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                asset === 'USDT' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white"></div>
              USDT (ERC20)
            </button>
            <button 
              onClick={() => setAsset('BTC')}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                asset === 'BTC' 
                  ? 'bg-orange-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white"></div>
              Bitcoin
            </button>
          </div>

          {/* Warnings */}
          <div className={`border p-4 rounded-xl flex gap-3 transition-colors ${
            asset === 'USDT' ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-orange-900/10 border-orange-500/20'
          }`}>
            <AlertCircle className={`shrink-0 ${asset === 'USDT' ? 'text-emerald-500' : 'text-orange-500'}`} size={20} />
            <div className="text-sm text-slate-300">
              {asset === 'USDT' ? (
                <span>
                  Send only <strong className="text-white">USDT (ERC20)</strong>. 
                  This address is derived from our secure cold wallet specifically for your account.
                </span>
              ) : (
                <span>
                  Send only <strong className="text-white">Bitcoin (BTC)</strong>.
                  This address is unique to you and updates automatically upon receipt.
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
                {asset === 'USDT' && !loading && (
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
                  <div className="h-5 bg-slate-700/50 w-3/4 rounded animate-pulse"></div>
                ) : (
                  <code className="text-sm text-slate-300 font-mono truncate mr-8 select-all">
                    {address}
                  </code>
                )}
                
                <div className={`absolute right-2 p-2 rounded-lg transition-colors ${
                  copied ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-700 text-slate-400 group-hover:text-white'
                }`}>
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </div>
              </div>
              
              {asset === 'USDT' && !loading && (
                 <div className="mt-2 text-center">
                    <a 
                      href={`https://etherscan.io/address/${address}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] text-slate-500 hover:text-blue-400 flex items-center justify-center gap-1 transition-colors"
                    >
                      View on Etherscan <ExternalLink size={10} />
                    </a>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showDeposit, setShowDeposit] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [config, setConfig] = useState<AppConfig>(() => getInitialConfig());
  const [clients, setClients] = useState<UserProfile[]>(() => getInitialClients());
  const [selectedClientId, setSelectedClientId] = useState<number | null>(() => INITIAL_CLIENTS[0]?.id ?? null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore persistence errors in demo
    }
  }, [config]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch {
      // ignore persistence errors in demo
    }
  }, [clients]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? clients[0];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800/50 flex flex-col p-4 bg-slate-950">
        <div className="flex items-center gap-3 px-4 py-4 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <TrendingUp className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            TradeFlow
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard' && !isAdminMode}
            onClick={() => { setActiveTab('dashboard'); setIsAdminMode(false); }}
          />
          <SidebarItem 
            icon={Wallet} 
            label="Wallets" 
            active={activeTab === 'wallets' && !isAdminMode}
            onClick={() => { setActiveTab('wallets'); setIsAdminMode(false); }}
          />
          <SidebarItem 
            icon={ArrowRightLeft} 
            label="Transactions" 
            active={activeTab === 'tx'}
            onClick={() => { setActiveTab('tx'); setIsAdminMode(false); }}
          />
        </nav>

        <div className="pt-4 border-t border-slate-800">
          <button 
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isAdminMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Admin Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md">
          <h2 className="text-lg font-medium text-slate-200">
            {isAdminMode ? 'Platform Administration' : 'Client Overview'}
          </h2>
          <div className="flex items-center gap-4">
            {!isAdminMode && selectedClient && (
              <button 
                onClick={() => setShowDeposit(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
              >
                <QrCode size={16} />
                Deposit Funds
              </button>
            )}
            <div className="h-8 w-px bg-slate-800 mx-2"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-medium text-white">
                    {isAdminMode ? 'Admin' : (selectedClient?.name ?? 'No client selected')}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isAdminMode ? 'System Admin' : 'Verified Client'}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-slate-600">
                  <User size={20} className="text-slate-300" />
                </div>
              </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none"></div>
          
          {isAdminMode ? (
            <AdminPanel config={config} setConfig={setConfig} />
          ) : (
              <div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-fade-in">
                {/* Stats Row (uses selected client balances for now) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <BalanceCard 
                    label="Total Balance (USD)" 
                    amount={68450.25} 
                    currency="USD"
                    trend={12.5}
                  />
                  <BalanceCard 
                    label="Tether" 
                    amount={selectedClient?.balance.usdt ?? 0} 
                    currency="USDT"
                    trend={4.2}
                  />
                  <BalanceCard 
                    label="Bitcoin" 
                    amount={selectedClient?.balance.btc ?? 0} 
                    currency="BTC"
                    trend={-1.2}
                  />
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
                      {[1,2,3].map((_, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                              <ArrowRightLeft size={14} />
                            </div>
                            <span className="text-slate-300">Deposit</span>
                          </td>
                          <td className="px-6 py-4">USDT</td>
                          <td className="px-6 py-4 text-white font-medium">+5,000.00</td>
                          <td className="px-6 py-4"><span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full text-xs border border-emerald-500/20">Completed</span></td>
                          <td className="px-6 py-4">Oct 24, 2024</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

        {selectedClient && (
          <DepositModal 
            isOpen={showDeposit} 
            onClose={() => setShowDeposit(false)} 
            user={selectedClient}
            config={config}
          />
        )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
