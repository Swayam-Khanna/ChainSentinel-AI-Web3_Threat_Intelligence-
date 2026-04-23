import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';
import { formatAddress } from '../utils';

interface ContractIntelligenceProps {
  topContracts: Array<{ address: string; count: number }>;
}

const ContractIntelligence: React.FC<ContractIntelligenceProps> = ({ topContracts }) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
          <Target size={14} className="text-neon-purple" />
          Contract Intelligence
        </h3>
        <div className="px-2 py-0.5 rounded bg-neon-purple/10 border border-neon-purple/20 text-[9px] font-black text-neon-purple">
          TOP TARGETS
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {topContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <TrendingUp size={32} className="mb-2 opacity-10" />
            <p className="text-[10px] uppercase font-bold tracking-widest">Scanning Network...</p>
          </div>
        ) : (
          topContracts.map((contract, i) => (
            <motion.div
              key={contract.address}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center font-mono font-bold text-xs text-neon-purple">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono font-bold text-white/80 truncate">
                  {contract.address}
                </div>
                <div className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">
                  Targeted Instance
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black font-mono text-neon-purple leading-none">
                  {contract.count}
                </div>
                <div className="text-[9px] text-white/20 uppercase font-black">Hits</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContractIntelligence;
