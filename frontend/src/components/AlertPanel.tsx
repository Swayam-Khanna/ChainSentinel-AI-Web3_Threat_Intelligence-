import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Zap, Clock, ShieldCheck } from 'lucide-react';
import { Alert } from '../types';
import { formatAddress, timeAgo, cn } from '../utils';

interface AlertPanelProps {
  alerts: Alert[];
  onDefend: (id: string) => void;
  newAlertId: string | null;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onDefend, newAlertId }) => {
  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden border-neon-red/10">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-neon-red/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-red animate-ping" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-neon-red text-glow-red">Threat Intelligence</h2>
        </div>
        <div className="flex gap-1">
          {['CRITICAL', 'HIGH'].map(sev => (
            <div key={sev} className="px-2 py-0.5 rounded-md bg-neon-red/10 border border-neon-red/20 text-[9px] font-black text-neon-red">
              {alerts.filter(a => a.severity === sev.toLowerCase()).length} {sev}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "relative group overflow-hidden rounded-2xl border transition-all duration-500",
                alert.severity === 'critical' ? "border-neon-red/30 bg-neon-red/[0.03] animate-pulse-red" : "border-white/5 bg-white/[0.02]",
                alert.defended && "border-neon-green/30 bg-neon-green/[0.03] opacity-80"
              )}
            >
              <div className="p-4 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      alert.severity === 'critical' ? "bg-neon-red/20 text-neon-red" : "bg-neon-orange/20 text-neon-orange"
                    )}>
                      {alert.defended ? <ShieldCheck size={20} className="text-neon-green" /> : <ShieldAlert size={20} />}
                    </div>
                    <div>
                      <div className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        alert.severity === 'critical' ? "text-neon-red" : "text-neon-orange"
                      )}>
                        {alert.type.replace('_', ' ')}
                      </div>
                      <div className="text-xl font-black font-mono tracking-tighter text-white/90">
                        RISK: {alert.riskScore}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-white/40 flex items-center gap-1 justify-end">
                      <Clock size={10} />
                      {timeAgo(alert.timestamp)}
                    </div>
                    {alert.defended && (
                      <div className="text-[10px] font-black text-neon-green mt-1">MITIGATED</div>
                    )}
                  </div>
                </div>

                <div className="bg-black/40 rounded-xl p-3 border border-white/5 mb-4">
                  <div className="text-xs text-white/70 leading-relaxed italic">
                    "{alert.reason}"
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-[9px] font-bold text-white/30 uppercase mb-1">Target Contract</div>
                    <div className="text-xs font-mono text-neon-purple font-bold">
                      {formatAddress(alert.contract)}
                    </div>
                  </div>
                  
                  {!alert.defended && (
                    <button
                      onClick={() => onDefend(alert.id)}
                      className="px-4 py-2 rounded-xl bg-neon-red/10 border border-neon-red/30 text-neon-red text-xs font-black uppercase tracking-tighter hover:bg-neon-red hover:text-white transition-all flex items-center gap-2 group/btn"
                    >
                      <Zap size={14} className="group-hover/btn:fill-current" />
                      Defend
                    </button>
                  )}
                </div>
              </div>

              {/* Decorative Background Glow */}
              <div className={cn(
                "absolute -right-10 -top-10 w-32 h-32 blur-[60px] rounded-full opacity-10 pointer-events-none",
                alert.severity === 'critical' ? "bg-neon-red" : "bg-neon-orange"
              )} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertPanel;
