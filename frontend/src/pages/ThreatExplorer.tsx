import React from 'react';
import { Database, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useSentinelStore } from '../hooks/useSentinelStore';
import { formatAddress, shortHash } from '../utils';

const ThreatExplorer: React.FC = () => {
  const { state } = useSentinelStore();
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tighter">THREAT EXPLORER</h2>
        <div className="flex gap-2">
           <div className="px-4 py-2 rounded-xl bg-neon-red/10 border border-neon-red/20 text-xs font-black text-neon-red">
             {state.alerts.length} ACTIVE THREATS
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {state.alerts.length === 0 ? (
          <div className="glass-panel p-20 flex flex-col items-center justify-center text-center">
            <ShieldCheck size={48} className="text-neon-green mb-4 opacity-20" />
            <h3 className="text-lg font-bold opacity-40">NETWORK IS SECURE</h3>
            <p className="text-xs opacity-20">No active anomalies detected in current mempool.</p>
          </div>
        ) : (
          state.alerts.map((alert) => (
            <div key={alert.id} className="glass-panel p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 border-l-4 border-l-neon-red">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neon-red/10 flex items-center justify-center text-neon-red shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0 space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neon-red">{alert.type.replace('_', ' ')}</span>
                </div>
                <h4 className="text-xs md:text-sm font-bold truncate max-w-xs mx-auto md:mx-0">Contract: {alert.contract || 'Direct Transfer'}</h4>
                <p className="text-[10px] md:text-xs text-white/40">{alert.reason}</p>
              </div>
              <div className="flex items-center justify-center gap-4 md:gap-8 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-white/5">
                <div className="text-center">
                  <div className="text-lg md:text-xl font-black font-mono text-neon-red">{alert.riskScore}</div>
                  <div className="text-[8px] md:text-[9px] font-black opacity-20 uppercase">Risk Index</div>
                </div>
                <div className="text-center min-w-[80px] md:min-w-[100px]">
                  <div className="text-[10px] md:text-xs font-mono font-bold text-white/60">{shortHash(alert.txHash)}</div>
                  <div className="text-[8px] md:text-[9px] font-black opacity-20 uppercase">TX Hash</div>
                </div>
                <button className="px-4 md:px-6 py-2 rounded-xl bg-neon-blue text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:shadow-neon-blue transition-all">
                  Inspect
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ThreatExplorer;
