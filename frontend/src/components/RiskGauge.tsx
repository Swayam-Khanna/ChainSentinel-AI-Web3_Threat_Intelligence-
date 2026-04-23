import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface RiskGaugeProps {
  score: number;
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const data = [
    { value: score },
    { value: 100 - score },
  ];

  const getColor = (s: number) => {
    if (s < 35) return '#00ffa3'; // Green
    if (s < 70) return '#f97316'; // Orange
    return '#ff3e3e'; // Red
  };

  return (
    <div className="relative flex items-center justify-center h-48 w-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={180}
            endAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={getColor(score)} fillOpacity={0.8} />
            <Cell fill="rgba(255,255,255,0.05)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-4xl font-black font-mono tracking-tighter"
          style={{ color: getColor(score) }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-[-4px]">
          Risk Index
        </span>
      </div>
      
      {/* Decorative Glow */}
      <div 
        className="absolute bottom-10 w-32 h-1 bg-current blur-xl opacity-20"
        style={{ color: getColor(score) }}
      />
    </div>
  );
};

export default RiskGauge;
