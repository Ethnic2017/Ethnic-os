import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Check, Trash2 } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'event', label: 'Event' },
  { value: 'video_production', label: 'Video' },
  { value: 'festival_collab', label: 'Festival' },
  { value: 'music_release', label: 'Music' },
  { value: 'residency', label: 'Residency' },
  { value: 'grant_application', label: 'Grant' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Actif' },
  { value: 'on_hold', label: 'En pause' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
];

// Inline auto-save field — renders as a div row, mobile-safe
function InlineField({ label, value, onSave, type = 'text', placeholder = '—' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const ref = useRef();

  useEffect(() => { setVal(value || ''); }, [value]);

  const commit = () => {
    setEditing(false);
    if (val !== (value || '')) onSave(val);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 border-b border-white/5 py-2 px-3">
      <span className="text-xs text-[#8A8A8A] font-medium sm:w-44 sm:flex-shrink-0 sm:pt-0.5">{label}</span>
      <div className="flex-1">
        {editing ? (
          type === 'textarea' ? (
            <textarea
              ref={ref}
              autoFocus
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={commit}
              rows={3}
              className="w-full bg-[#0A0A0A] border border-[#C9A96E]/40 rounded px-2 py-1 text-xs text-[#F5F0EB] focus:outline-none resize-none"
            />
          ) : (
            <input
              ref={ref}
              autoFocus
              type={type}
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value || ''); setEditing(false); } }}
              className="w-full bg-[#0A0A0A] border border-[#C9A96E]/40 rounded px-2 py-1 text-xs text-[#F5F0EB] focus:outline-none"
            />
          )
        ) : (
          <span
            onClick={() => setEditing(true)}
            className={`text-xs cursor-text hover:bg-white/5 rounded px-1 py-0.5 -mx-1 transition-colors block ${value ? 'text-[#F5F0EB]' : 'text-[#8A8A8A]/40'}`}
          >
            {value || placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

// Select row
function SelectRow({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 border-b border-white/5 py-2 px-3">
      <span className="text-xs text-[#8A8A8A] font-medium sm:w-44 sm:flex-shrink-0">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-[#0A0A0A] border border-white/10 rounded px-2 py-1 text-xs text-[#F5F0EB] focus:outline-none focus:border-[#C9A96E]/50 cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Composant sélecteur contact avec autocomplete live
function ContactSelector({ selectedId, selectedName, onSelect, allContacts }) {
  const [query, setQuery] = useState('');

  const results = query.trim()
    ? allContacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={query || selectedName || ''}
        onChange={e => setQuery(e.target.value)}
        placeholder="Chercher un contact..."
        className="w-full bg-[#0A0A0A] border border-white/10 rounded px-2 py-1.5 text-xs text-[#F5F0EB] focus:outline-none focus:border-[#C9A96E]/50"
      />
      {query.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-[#1A1A1A] border border-white/10 rounded-b-md shadow-xl max-h-40 overflow-y-auto">
          {results.length > 0 ? (
            results.map(c => (
              <button
                key={c.id}
                onClick={() => { onSelect(c.id, c.name); setQuery(''); }}
                className="w-full text-left px-3 py-2 text-xs text-[#F5F0EB] hover:bg-white/5"
              >
                {c.name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-[10px] text-[#8A8A8A]">Aucun résultat</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectInfoTab({ project }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: async () => {
      let all = [];
      let skip = 0;
      let hasMore = true;
      while (hasMore) {
        const batch = await base44.entities.Contact.list('name', 500, skip);
        all = all.concat(batch);
        hasMore = batch.length === 500;
        skip += 500;
      }
      return all;
    },
  });

  const save = async (field, value) => {
    await base44.entities.Project.update(project.id, { [field]: value });
    queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const ROLES = [
    { key: 'chef_projet', label: 'Chef de projet' },
    { key: 'communication', label: 'Communication' },
    { key: 'logistique', label: 'Logistique' },
    { key: 'artistique', label: 'Artistique' },
    { key: 'deco', label: 'Déco' },
    { key: 'stand', label: 'Stand' },
  ];

  const updateTeamAssignment = async (role, contactId, contactName) => {
    const updated = [...(project.team_assignments || [])];
    const idx = updated.findIndex(a => a.role === role);
    if (idx >= 0) {
      if (contactId) updated[idx] = { contact_id: contactId, contact_name: contactName, role };
      else updated.splice(idx, 1);
    } else if (contactId) {
      updated.push({ contact_id: contactId, contact_name: contactName, role });
    }
    await save('team_assignments', updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {saved && (
        <div className="lg:col-span-2 flex items-center gap-1.5 text-xs text-green-400 -mb-4">
          <Check className="w-3 h-3" /> Sauvegardé
        </div>
      )}

      {/* Left: Équipe & Partenaires */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="font-display text-sm text-[#C9A96E] uppercase tracking-wider">Équipe & Partenaires</h3>
          <p className="text-[10px] text-[#8A8A8A] mt-0.5">Sélectionner les contacts responsables</p>
        </div>
        <div className="divide-y divide-white/5">
          {ROLES.map(role => {
            const assignment = (project.team_assignments || []).find(a => a.role === role.key);
            return (
              <div key={role.key} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 px-3">
                <span className="text-xs text-[#8A8A8A] font-medium sm:w-44 sm:flex-shrink-0">{role.label}</span>
                <div className="flex items-center gap-2 flex-1">
                  <ContactSelector
                    selectedId={assignment?.contact_id}
                    selectedName={assignment?.contact_name}
                    onSelect={(id, name) => updateTeamAssignment(role.key, id, name)}
                    allContacts={contacts}
                  />
                  {assignment && (
                    <button
                      onClick={() => updateTeamAssignment(role.key, null, null)}
                      className="p-1 text-[#8A8A8A] hover:text-red-400 hover:bg-red-500/10 rounded flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <InlineField label="Notes équipe" value={project.team_notes} onSave={v => save('team_notes', v)} type="textarea" placeholder="Commentaires…" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 border-b border-white/5 py-2 px-3">
            <span className="text-xs text-[#8A8A8A] font-medium sm:w-44 sm:flex-shrink-0">Lien Drive</span>
            <div className="flex-1 space-y-1">
              {project.drive_link && (
                <a href={project.drive_link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C9A96E] underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Ouvrir le dossier
                </a>
              )}
              <InlineField label="" value={project.drive_link} onSave={v => save('drive_link', v)} placeholder="https://drive.google.com/…" />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Infos Projet */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="font-display text-sm text-[#C9A96E] uppercase tracking-wider">Infos Projet</h3>
          <p className="text-[10px] text-[#8A8A8A] mt-0.5">Cliquer sur un champ pour éditer — sauvegarde automatique</p>
        </div>
        <div className="divide-y divide-white/5">
          <SelectRow label="Type" value={project.type || 'event'} options={TYPE_OPTIONS} onChange={v => save('type', v)} />
          <SelectRow label="Statut" value={project.status || 'planning'} options={STATUS_OPTIONS} onChange={v => save('status', v)} />
          <InlineField label="Date" value={project.end_date} onSave={v => save('end_date', v)} type="date" />
          <InlineField label="Lieu" value={project.location} onSave={v => save('location', v)} />
          <InlineField
            label="Heure de début"
            value={project.schedule_start}
            onSave={v => {
              save('schedule_start', v);
              const end = project.schedule_end || '';
              save('schedule', v && end ? `${v} → ${end}` : v || end);
            }}
            type="time"
            placeholder="—"
          />
          <InlineField
            label="Heure de fin"
            value={project.schedule_end}
            onSave={v => {
              save('schedule_end', v);
              const start = project.schedule_start || '';
              save('schedule', start && v ? `${start} → ${v}` : start || v);
            }}
            type="time"
            placeholder="—"
          />
          <InlineField label="Deal" value={project.deal} onSave={v => save('deal', v)} type="textarea" placeholder="Conditions financières…" />
          <InlineField label="Shotgun" value={project.shotgun_link} onSave={v => save('shotgun_link', v)} placeholder="Lien ou 'Non'" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 py-2 px-3">
            <span className="text-xs text-[#8A8A8A] font-medium sm:w-44 sm:flex-shrink-0">Billetterie</span>
            <div className="flex gap-2">
              {['Oui', 'Non'].map(v => (
                <button key={v} onClick={() => save('ticketing_active', v === 'Oui')}
                  className={`px-3 py-1 rounded text-xs border transition-all ${(project.ticketing_active ? 'Oui' : 'Non') === v ? 'bg-[#C9A96E] text-[#0A0A0A] border-[#C9A96E]' : 'border-white/10 text-[#8A8A8A] hover:border-white/30'}`}
                >{v}</button>
              ))}
            </div>
          </div>
          <InlineField label="Budget (€)" value={project.budget ? String(project.budget) : ''} onSave={v => save('budget', parseFloat(v) || 0)} type="number" placeholder="0" />
        </div>
      </div>
    </div>
  );
}