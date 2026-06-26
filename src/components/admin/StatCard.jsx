import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, color = '#C9A96E' }) {
  return (
    <div className="glass-card rounded-xl p-5 group hover:border-[#C9A96E]/20 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#8A8A8A] text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
          {trend && (
            <p className="text-xs mt-2 text-[#C9A96E]">{trend}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}