import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Zap, TrendingUp } from 'lucide-react';
import { DashboardStats } from '../types';
import { cn } from '../utils';

interface MetricsGridProps {
  stats: DashboardStats;
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ stats }) => {
  const items = [
    {
      label: 'Mempool Volume',
      value: stats.totalTx,
      sub: `${stats.txPerMinute} TX/MIN`,
      icon: Activity,
      color: 'text-neon-blue',
      bg: 'bg-neon-blue/10',
      border: 'border-neon-blue/20',
    },
    {
      label: 'Threats Blocked',
      value: stats.totalAlerts,
      sub: `${stats.criticalAlerts} CRITICAL`,
      icon: ShieldAlert,
      color: 'text-neon-red',
      bg: 'bg-neon-red/10',
      border: 'border-neon-red/20',
    },
    {
      label: 'Average Gas',
      value: Math.round(stats.avgGasPrice),
      sub: 'GWEI / UNIT',
      icon: Zap,
      color: 'text-neon-purple',
      bg: 'bg-neon-purple/10',
      border: 'border-neon-purple/20',
    },
    {
      label: 'Security Score',
      value: 100 - stats.avgRiskScore,
      sub: 'STABILITY INDEX',
      icon: TrendingUp,
      color: 'text-neon-green',
      bg: 'bg-neon-green/10',
      border: 'border-neon-green/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={cn(
            "glass-panel p-6 border transition-all hover:scale-[1.02] cursor-default",
            item.border
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-2 rounded-xl", item.bg)}>
              <item.icon size={20} className={item.color} />
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
              {item.label}
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono tracking-tighter">
              {item.value.toLocaleString()}
            </span>
          </div>
          
          <div className={cn("text-[10px] font-black mt-1 tracking-wider uppercase", item.color)}>
            {item.sub}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MetricsGrid;
