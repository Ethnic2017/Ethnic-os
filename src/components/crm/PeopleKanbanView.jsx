import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PeopleKanbanView({ people, pipeline, pipelineColors, pipelineLabels, onEdit, onDelete }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipeline.map(stage => {
        const stagePeople = people.filter(p => p.pipeline === stage);
        return (
          <div key={stage} className="flex-shrink-0 w-64">
            <div className="flex items-center justify-between mb-3">
              <Badge className={`${pipelineColors[stage]} text-xs`}>{pipelineLabels[stage]}</Badge>
              <span className="text-xs text-[#8A8A8A]">{stagePeople.length}</span>
            </div>
            <div className="space-y-2">
              {stagePeople.map(p => (
                <div key={p.id} className="glass-card rounded-lg p-3 group">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <Link to={`${createPageUrl('PersonDetail')}?id=${p.id}`} className="text-sm font-medium text-[#F5F0EB] hover:text-[#C9A96E] flex-1 leading-tight">
                      {p.name}
                    </Link>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => onEdit(p)} className="p-1 rounded hover:bg-white/10 text-[#8A8A8A]"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => onDelete(p.id)} className="p-1 rounded hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  {p.company_name && (
                    <p className="text-xs text-[#C9A96E] flex items-center gap-1 mb-1">
                      <Building2 className="w-3 h-3" />{p.company_name}
                    </p>
                  )}
                  {p.job_title && <p className="text-xs text-[#8A8A8A] mb-1">{p.job_title}</p>}
                  {(p.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/[0.05] text-[#8A8A8A]">{tag}</span>
                      ))}
                      {p.tags.length > 3 && <span className="text-xs text-[#8A8A8A]">+{p.tags.length - 3}</span>}
                    </div>
                  )}
                  {p.email && <p className="text-xs text-[#8A8A8A] truncate mt-1">{p.email}</p>}
                </div>
              ))}
              {stagePeople.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-[#8A8A8A]">Aucun</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}