import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  Database, 
  Globe, 
  Settings, 
  Bell, 
  Search, 
  ChevronDown,
  Zap,
  Waves,
  Flame,
  Layers
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Components
import MetricsGrid from './components/MetricsGrid';
import LiveFeed from './components/LiveFeed';
import AlertPanel from './components/AlertPanel';
import RiskGauge from './components/RiskGauge';
import TrendChart from './components/TrendChart';
import ContractIntelligence from './components/ContractIntelligence';
import ThreatExplorer from './pages/ThreatExplorer';

// Hooks & Utils
import { useWebSocket } from './hooks/useWebSocket';
import { useSentinelStore } from './hooks/useSentinelStore';
import { cn } from './utils';

const Overview: React.FC = () => {
  const { state, defendAlert } = useSentinelStore();

  const handleDefendAction = async (id: string) => {
    const alert = state.alerts.find(a => a.id === id);
    try {
      await fetch('http://localhost:4000/defend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: id, txHash: alert?.txHash, contract: alert?.contract }),
      });
      defendAlert(id);
    } catch (err) {
      toast.error('Defense relay failure');
    }
  };

  const runSimulation = async (scenario: string) => {
    const toastId = toast.loading(`Injecting ${scenario} scenario...`);
    try {
      const res = await fetch('http://localhost:4000/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildMockTx(scenario)),
      });
      if (res.ok) toast.success(`Attack vector injected: ${scenario}`, { id: toastId });
    } catch (err) {
      toast.error('Simulation server offline', { id: toastId });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <MetricsGrid stats={state.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
          <div className="glass-panel p-8 flex flex-col items-center justify-center text-center">
            <RiskGauge score={state.stats.avgRiskScore} />
            <div className="w-full h-24 mt-4">
              <TrendChart data={state.stats.recentRiskScores} />
            </div>
            <h3 className="mt-4 text-xl font-black font-mono tracking-tight">AGGREGATE RISK</h3>
            <p className="text-xs text-white/40 max-w-[200px] mt-2">Real-time risk trend across active mempool transactions.</p>
          </div>

          <div className="glass-panel p-6 border-neon-blue/10 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
              <Zap size={14} className="text-neon-blue" />
              Security Simulation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <SimulatorButton icon={Waves} label="Sandwich" color="neon-blue" onClick={() => runSimulation('sandwich')} />
              <SimulatorButton icon={Flame} label="Gas Spike" color="neon-orange" onClick={() => runSimulation('gas')} />
              <SimulatorButton icon={Zap} label="Burst" color="neon-red" onClick={() => runSimulation('burst')} />
              <SimulatorButton icon={Layers} label="Full Suite" color="neon-purple" onClick={() => runSimulation('all')} />
            </div>
          </div>
          
          <ContractIntelligence topContracts={state.stats.topContracts} />
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-2">
          <div className="flex-1 h-[400px]">
            <LiveFeed transactions={state.transactions} />
          </div>
          <div className="h-[400px]">
            <AlertPanel alerts={state.alerts} onDefend={handleDefendAction} newAlertId={state.newAlertId} />
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { state, handleWsMessage, setConnectionStatus } = useSentinelStore();
  const { status } = useWebSocket(handleWsMessage);
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setConnectionStatus(status);
  }, [status, setConnectionStatus]);

  useEffect(() => {
    if (!state.newAlertId) return;
    const alert = state.alerts.find(a => a.id === state.newAlertId);
    if (!alert) return;

    if (alert.severity === 'critical' || alert.severity === 'high') {
      toast.error(
        `THREAT DETECTED: ${alert.type.replace('_', ' ')} (Score: ${alert.riskScore})`,
        { icon: '🚨', className: 'animate-pulse-red' }
      );
    }
  }, [state.newAlertId, state.alerts]);

  return (
    <BrowserRouter>
      <div className="min-h-screen blockchain-bg flex flex-col lg:flex-row">
        <Toaster position="top-right" />
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden h-16 border-b border-white/5 bg-card/60 backdrop-blur-xl px-6 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-neon-blue" />
            <span className="font-black tracking-tighter text-sm uppercase">ChainSentinel</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10"
          >
            {isMobileMenuOpen ? <Zap size={20} /> : <Layers size={20} />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <div className={cn(
          "fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl lg:hidden transition-all duration-500",
          isMobileMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        )}>
          <div className="p-8 space-y-6 pt-24">
            <SidebarLink to="/" icon={LayoutDashboard} label="Overview" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarLink to="/explorer" icon={Database} label="Threat Explorer" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarLink to="/map" icon={Globe} label="Network Map" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarLink to="/settings" icon={Settings} label="Governance" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
        
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-card/40 backdrop-blur-2xl flex flex-col hidden lg:flex shrink-0">
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-neon-purple">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter">CHAIN<span className="text-neon-blue">SENTINEL</span></h1>
              <p className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">Security Engine</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <SidebarLink to="/" icon={LayoutDashboard} label="Overview" />
            <SidebarLink to="/explorer" icon={Database} label="Threat Explorer" />
            <SidebarLink to="/map" icon={Globe} label="Network Map" />
            <SidebarLink to="/settings" icon={Settings} label="Governance" />
          </nav>

          <div className="p-6 border-t border-white/5">
            <div className="glass-panel p-4 bg-neon-green/5 border-neon-green/10">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-2 h-2 rounded-full", status === 'open' ? "bg-neon-green" : "bg-neon-red")} />
                <span className="text-[10px] font-black uppercase text-white/60">{status}</span>
              </div>
              <p className="text-[9px] text-white/40 leading-relaxed">Mempool scanning is active.</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header (Desktop version, hidden on mobile in favor of Mobile Header) */}
          <header className="h-20 border-b border-white/5 px-4 lg:px-8 flex items-center justify-between bg-card/20 backdrop-blur-lg shrink-0 hidden lg:flex">
            <div className="flex items-center gap-4">
              <button 
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                onClick={() => setSelectedChain(selectedChain === 'ethereum' ? 'polygon' : 'ethereum')}
              >
                <img 
                  src={selectedChain === 'ethereum' ? "https://cryptologos.cc/logos/ethereum-eth-logo.png" : "https://cryptologos.cc/logos/polygon-matic-logo.png"} 
                  className={cn("w-5 h-5 opacity-70", selectedChain === 'ethereum' && "invert")} 
                  alt="" 
                />
                <span className="text-sm font-bold uppercase tracking-tight">
                  {selectedChain === 'ethereum' ? 'Ethereum Mainnet' : 'Polygon POS'}
                </span>
                <ChevronDown size={14} className="text-white/40" />
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 border border-white/5">
                <Search size={14} className="text-white/20" />
                <input type="text" placeholder="Search hash..." className="bg-transparent border-none text-xs text-white placeholder:text-white/20 focus:ring-0 w-32 md:w-64" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all relative">
                <Bell size={18} />
                <div className="absolute top-2 right-2 w-2 h-2 bg-neon-red rounded-full border-2 border-background" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white/60 hover:border-white/20 transition-all cursor-pointer">
                0x...
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/explorer" element={<ThreatExplorer />} />
              <Route path="/map" element={<div className="flex items-center justify-center h-full text-white/20">NETWORK MAP - COMING SOON</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

// Sub-components
const SidebarLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  
  return (
    <Link 
      to={to}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
        active ? "bg-neon-blue/10 text-neon-blue" : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
};

const SimulatorButton = ({ icon: Icon, label, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/5 transition-all group",
      `hover:border-${color}/40 hover:bg-${color}/5`
    )}
  >
    <Icon size={20} className={cn("mb-2 transition-all group-hover:scale-110", `text-${color}`)} />
    <span className="text-[10px] font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100">{label}</span>
  </button>
);

function buildMockTx(scenario: string) {
  const hex = (l=40) => '0x' + Array.from({length:l},()=>Math.floor(Math.random()*16).toString(16)).join('');
  const target = hex();
  
  switch(scenario) {
    case 'sandwich':
      return { hash: hex(64), from: '0xMEV_BOT', to: target, value: '1000000000', gasPrice: '50000000000', scenario: 'sandwich' };
    case 'gas':
      return { hash: hex(64), from: hex(), to: hex(), value: '0', gasPrice: '350000000000', scenario: 'gas_spike' };
    case 'burst':
      return { hash: hex(64), from: hex(), to: target, value: '0', gasPrice: '30000000000', scenario: 'contract_burst' };
    default:
      return { hash: hex(64), from: hex(), to: hex(), value: '5000000000', gasPrice: '20000000000' };
  }
}

export default App;
