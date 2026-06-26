import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Globe, MapPin, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PeopleCard({ person, pipelineColors, pipelineLabels, categoryLabels, onEdit, onDelete }) {
  return (
    <div className="glass-card rounded-xl p-5 flex flex-col gap-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link to={`${createPageUrl('PersonDetail')}?id=${person.id}`} className="hover:text-[#C9A96E] transition-colors">
            <h3 className="text-[#F5F0EB] font-medium truncate">{person.name}</h3>
          </Link>
          {person.contact_person && (
            <p className="text-xs text-[#8A8A8A] mt-0.5">{person.contact_person}{person.contact_role ? ` · ${person.contact_role}` : ''}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`${createPageUrl('PersonDetail')}?id=${person.id}`} className="p-1.5 rounded-lg hover:bg-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]">
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => onEdit(person)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(person.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[#C9A96E]">
          {categoryLabels[person.category] || person.category}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pipelineColors[person.pipeline]}`}>
          {pipelineLabels[person.pipeline] || person.pipeline}
        </span>
      </div>

      {(person.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {person.tags.map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/[0.04] text-[#8A8A8A]">{tag}</span>
          ))}
        </div>
      )}

      <div className="space-y-1 text-xs text-[#8A8A8A]">
        {(person.city || person.country) && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            {[person.city, person.country].filter(Boolean).join(', ')}
          </div>
        )}
        {person.email && (
          <a href={`mailto:${person.email}`} className="flex items-center gap-1.5 hover:text-[#C9A96E] transition-colors">
            <Mail className="w-3 h-3" /> {person.email}
          </a>
        )}
        {person.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> {person.phone}
          </div>
        )}
        {person.website && (
          <a href={person.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#C9A96E] transition-colors truncate">
            <Globe className="w-3 h-3" /> {person.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>

      {person.notes && (
        <p className="text-xs text-[#8A8A8A] border-t border-white/5 pt-2 line-clamp-2">{person.notes}</p>
      )}
    </div>
  );
}