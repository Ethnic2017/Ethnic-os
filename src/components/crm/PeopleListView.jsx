import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ChevronRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const PIPELINE_ORDER = ['lead', 'actif', 'partenaire', 'inactif'];

function InlinePipeline({ person, pipelineColors, pipelineLabels }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleChange = async (stage) => {
    setSaving(true);
    setOpen(false);
    await base44.entities.People.update(person.id, { pipeline: stage });
    queryClient.invalidateQueries({ queryKey: ['people'] });
    setSaving(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        className={`transition-all ${saving ? 'opacity-50' : 'hover:ring-1 ring-white/20 rounded'}`}
      >
        <Badge className={`${pipelineColors[person.pipeline]} text-xs cursor-pointer`}>
          {pipelineLabels[person.pipeline] || person.pipeline}
        </Badge>
      </button>
      {open && (
        <div className="absolute z-30 top-6 left-0 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl py-1 w-32" onMouseLeave={() => setOpen(false)}>
          {PIPELINE_ORDER.map(stage => (
            <button
              key={stage}
              onClick={() => handleChange(stage)}
              className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${person.pipeline === stage ? 'text-[#C9A96E]' : 'text-[#8A8A8A]'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${pipelineColors[stage]?.split(' ')[0] || 'bg-white/20'}`} />
              {pipelineLabels[stage]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PeopleListView({ people, pipelineColors, pipelineLabels, onEdit, onDelete }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-[#8A8A8A] text-xs">
            <th className="text-left px-4 py-3 font-medium">Nom</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Company / Poste</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Tags</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Pipeline</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Contact</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {people.map((p, i) => (
            <tr key={p.id} className={`group border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
              <td className="px-4 py-3">
                <Link to={`${createPageUrl('PersonDetail')}?id=${p.id}`} className="font-medium text-[#F5F0EB] hover:text-[#C9A96E] transition-colors">{p.name}</Link>
                {(p.city || p.country) && <p className="text-xs text-[#8A8A8A]">{[p.city, p.country].filter(Boolean).join(', ')}</p>}
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-xs">
                {p.company_name ? (
                  <span className="flex items-center gap-1 text-[#C9A96E]">
                    <Building2 className="w-3 h-3" />{p.company_name}
                  </span>
                ) : null}
                {p.job_title && <p className="text-[#8A8A8A]">{p.job_title}</p>}
                {!p.company_name && !p.job_title && <span className="text-[#8A8A8A]">—</span>}
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {(p.tags || []).slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/[0.05] text-[#8A8A8A]">{tag}</span>
                  ))}
                  {(p.tags || []).length > 3 && <span className="text-xs text-[#8A8A8A]">+{p.tags.length - 3}</span>}
                  {(p.tags || []).length === 0 && <span className="text-xs text-[#8A8A8A]">—</span>}
                </div>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <InlinePipeline person={p} pipelineColors={pipelineColors} pipelineLabels={pipelineLabels} />
              </td>
              <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">
                {p.email ? <a href={`mailto:${p.email}`} className="hover:text-[#C9A96E]">{p.email}</a> : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-0 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                  <Link to={`${createPageUrl('PersonDetail')}?id=${p.id}`} className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/10 text-[#8A8A8A] hover:text-[#C9A96E]"><ChevronRight className="w-3.5 h-3.5" /></Link>
                  <button onClick={() => onEdit(p)} className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDelete(p.id)} className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}