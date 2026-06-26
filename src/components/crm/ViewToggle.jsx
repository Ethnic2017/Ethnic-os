import React from 'react';
import { List, Columns } from 'lucide-react';

const VIEWS = [
  { id: 'kanban', icon: Columns, label: 'Kanban' },
  { id: 'list', icon: List, label: 'Liste' },
];

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-lg p-1">
      {VIEWS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          title={label}
          className={`p-1.5 rounded-md transition-all ${
            view === id
              ? 'bg-[#C9A96E] text-[#0A0A0A]'
              : 'text-[#8A8A8A] hover:text-[#F5F0EB]'
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}