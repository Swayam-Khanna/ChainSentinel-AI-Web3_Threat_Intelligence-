import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowUpRight, Cpu } from 'lucide-react';
import { Transaction } from '../types';
import { formatAddress, formatEth, timeAgo, cn } from '../utils';

interface LiveFeedProps {
  transactions: Transaction[];
}

const LiveFeed: React.FC<LiveFeedProps> = ({ transactions }) => {
  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/90">Real-Time Mempool</h2>
        </div>
        <div className="text-[10px] font-mono text-white/40">
          STREAMING {transactions.length} BUFFERED
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        <AnimatePresence initial={false}>
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="group p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all hover:border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-neon-blue/10 flex items-center justify-center">
                    <Activity size={14} className="text-neon-blue" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white/90 flex items-center gap-1">
                      {formatAddress(tx.hash)}
                      <ArrowUpRight size={10} className="text-white/20 group-hover:text-neon-blue transition-colors" />
                    </div>
                    <div className="text-[10px] text-white/40">
                      {timeAgo(tx.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-neon-green">
                    {formatEth(tx.value)} ETH
                  </div>
                  <div className="text-[10px] text-white/40">
                    Value Transferred
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-white/30 border-t border-white/5 pt-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white/50">TO:</span>
                  <span className="font-mono text-white/60">{tx.to ? formatAddress(tx.to) : 'Contract Deploy'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white/50">GAS:</span>
                  <span className="font-mono text-white/60">{(Number(tx.gasPrice) / 1e9).toFixed(1)} Gwei</span>
                </div>
                {tx.data !== '0x' && (
                  <div className="ml-auto flex items-center gap-1 text-neon-purple/60">
                    <Cpu size={10} />
                    <span className="font-bold uppercase">Contract Call</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveFeed;
