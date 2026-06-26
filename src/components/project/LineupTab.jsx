import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Check, X, Music, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PERF_TYPES = ['live', 'dj_set', 'showcase', 'performance', 'visual', 'other'];
const PERF_LABELS = { live: 'Live', dj_set: 'DJ Set', showcase: 'Showcase', performance: 'Performance', visual: 'Visual', other: 'Autre' };

const CONFIRM_COLORS = {
  confirmed: 'bg-green-500/15 text-green-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  cancelled: 'bg-red-500/15 text-red-400'
};
const CONFIRM_LABELS = { confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé' };

const EMPTY = { contact_id: '', artist_name: '', performance_type: 'dj_set', confirmed: 'pending', set_time: '', set_duration: '', fee: '', notes: '' };

// Sélecteur artiste : autocomplete Contacts + nom libre
function ArtistSelector({ contactId, artistName, onChange, contacts }) {
  const [query, setQuery] = useState('');
  const selected = contactId ? contacts.find(c => c.id === contactId) : null;

  // Normalize pour accents
  const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = contacts.filter(c => normalize(c.name).includes(normalize(query)));

  const useFreeName = () => {
    onChange('', query.trim());
    setQuery('');
  };

  return (
    <div className="relative flex-1">
      <Input
        value={query || selected?.name || artistName || ''}
        onChange={e => { setQuery(e.target.value); if (!e.target.value) onChange('', ''); }}
        placeholder="Chercher ou saisir un nom d'artiste..."
        className="bg-[#0A0A0A] border-white/10 h-8 text-xs text-[#F5F0EB] placeholder:text-[#555]"
      />
      {query.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-[#1A1A1A] border border-white/10 rounded-b-md shadow-xl max-h-48 overflow-y-auto">
          {filtered.slice(0, 8).map(c => (
            <button
              key={c.id}
              onClick={() => { onChange(c.id, c.name); setQuery(''); }}
              className="w-full text-left px-3 py-2 text-xs text-[#F5F0EB] hover:bg-white/5 flex items-center gap-2"
            >
              {c.cover_image && <img src={c.cover_image} className="w-5 h-5 rounded-full object-cover" alt="" />}
              <span>{c.name}</span>
              {c.tags?.length > 0 && <span className="text-[#C9A96E]/60 ml-auto text-[9px]">{c.tags.slice(0,2).join(', ')}</span>}
            </button>
          ))}
          {/* Option nom libre */}
          <button
            onClick={useFreeName}
            className="w-full text-left px-3 py-2 text-xs text-[#C9A96E] hover:bg-white/5 flex items-center gap-2 border-t border-white/5"
          >
            <Plus className="w-3 h-3" />
            Utiliser « {query.trim()} » (nom libre)
          </button>
        </div>
      )}
    </div>
  );
}

// "HH:MM" → minutes depuis minuit (supporte nuit : si < 12h on considère le lendemain)
function timeToMin(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// minutes → "HH:MM"
function minToTime(min) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Calcule l'heure de fin d'un slot (set_time + set_duration en minutes)
function endTime(item) {
  const start = timeToMin(item.set_time);
  const dur = timeToMin(item.set_duration); // durée exprimée comme "HH:MM" = heures:minutes
  if (start === null || dur === null) return null;
  return start + dur;
}

export default function LineupTab({ projectId, project }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: artistContacts = [] } = useQuery({
    queryKey: ['contacts-artists'],
    queryFn: () => base44.entities.Contact.list('name', 500),
  });
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editForm, setEditForm] = useState({});

  const { data: rawLineup = [] } = useQuery({
    queryKey: ['lineup', projectId],
    queryFn: () => base44.entities.Lineup.filter({ project_id: projectId }, 'order', 200),
    enabled: !!projectId,
  });

  // Tri par heure de passage (items sans heure à la fin)
  const lineup = useMemo(() => {
    return [...rawLineup].sort((a, b) => {
      const ta = timeToMin(a.set_time);
      const tb = timeToMin(b.set_time);
      if (ta === null && tb === null) return 0;
      if (ta === null) return 1;
      if (tb === null) return -1;
      // Gestion nuit : si l'heure < 12h on considère que c'est après minuit (ajout 24h)
      const normalA = ta < 12 * 60 ? ta + 24 * 60 : ta;
      const normalB = tb < 12 * 60 ? tb + 24 * 60 : tb;
      return normalA - normalB;
    });
  }, [rawLineup]);

  // Conflits : index des slots dont le début est avant la fin du précédent
  const conflicts = useMemo(() => {
    const set = new Set();
    for (let i = 1; i < lineup.length; i++) {
      const prev = lineup[i - 1];
      const curr = lineup[i];
      const prevEnd = endTime(prev);
      const currStart = timeToMin(curr.set_time);
      if (prevEnd !== null && currStart !== null) {
        const normalPrevEnd = timeToMin(prev.set_time) < 12 * 60 ? prevEnd + 24 * 60 : prevEnd;
        const normalCurrStart = currStart < 12 * 60 ? currStart + 24 * 60 : currStart;
        if (normalCurrStart < normalPrevEnd) {
          set.add(prev.id);
          set.add(curr.id);
        }
      }
    }
    return set;
  }, [lineup]);

  // Suggestion de next slot = fin du dernier artiste ayant une heure
  const suggestedNextTime = useMemo(() => {
    for (let i = lineup.length - 1; i >= 0; i--) {
      const end = endTime(lineup[i]);
      if (end !== null) return minToTime(end % (24 * 60));
    }
    return '';
  }, [lineup]);

  const [saveToContacts, setSaveToContacts] = useState(false);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleAdd = async () => {
    if (!form.contact_id && !form.artist_name) return;
    let finalContactId = form.contact_id;
    // Si nom libre + option activée → créer le contact CRM
    if (!form.contact_id && form.artist_name && saveToContacts) {
      const newContact = await base44.entities.Contact.create({
        name: form.artist_name,
        type: 'artist',
        tags: ['artist'],
      });
      finalContactId = newContact.id;
      queryClient.invalidateQueries({ queryKey: ['contacts-artists'] });
    }
    await base44.entities.Lineup.create({ ...form, contact_id: finalContactId, project_id: projectId, order: rawLineup.length });
    queryClient.invalidateQueries({ queryKey: ['lineup', projectId] });
    setForm(EMPTY);
    setSaveToContacts(false);
    setAdding(false);
  };

  const openAdd = () => {
    setForm({ ...EMPTY, set_time: suggestedNextTime });
    setAdding(true);
  };

  const handleEdit = (item) => { setEditingId(item.id); setEditForm(item); };
  const handleUpdate = async () => {
    await base44.entities.Lineup.update(editingId, editForm);
    queryClient.invalidateQueries({ queryKey: ['lineup', projectId] });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.Lineup.delete(id);
    queryClient.invalidateQueries({ queryKey: ['lineup', projectId] });
  };

  const toggleConfirm = async (item) => {
    const next = item.confirmed === 'pending' ? 'confirmed' : item.confirmed === 'confirmed' ? 'cancelled' : 'pending';
    await base44.entities.Lineup.update(item.id, { confirmed: next });
    queryClient.invalidateQueries({ queryKey: ['lineup', projectId] });
  };

  return (
    <div>
      {/* Plage horaire de l'événement */}
      {(project?.schedule_start || project?.schedule_end) && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 glass-card rounded-lg text-xs">
          <span className="text-[#8A8A8A]">Plage événement :</span>
          <span className="text-[#C9A96E] font-medium">
            {project.schedule_start || '?'} → {project.schedule_end || '?'}
          </span>
          {project.schedule_start && project.schedule_end && (
            <span className="text-[#555]">
              ({(() => {
                const s = timeToMin(project.schedule_start);
                let e = timeToMin(project.schedule_end);
                if (e <= s) e += 24 * 60; // passage minuit
                const diff = e - s;
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`;
              })()})
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3 text-xs text-[#8A8A8A]">
          <span className="text-green-400 font-medium">{rawLineup.filter(l => l.confirmed === 'confirmed').length} confirmé(s)</span>
          <span>·</span>
          <span className="text-yellow-400">{rawLineup.filter(l => l.confirmed === 'pending').length} en attente</span>
          <span>·</span>
          <span>{rawLineup.length} total</span>
          {conflicts.size > 0 && (
            <>
              <span>·</span>
              <span className="text-orange-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {conflicts.size / 2} chevauchement(s)
              </span>
            </>
          )}
        </div>
        <Button onClick={openAdd} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
          <Plus className="w-4 h-4 mr-2" /> Ajouter artiste
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[#8A8A8A] text-xs">
              <th className="text-left px-4 py-3 font-medium">Artiste</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Horaire</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Durée</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Fin</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Cachet</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {/* Add row */}
            {adding && (
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <td className="px-3 py-2">
                 <ArtistSelector
                   contactId={form.contact_id}
                   artistName={form.artist_name}
                   onChange={(cid, name) => { set('contact_id', cid); set('artist_name', name); if (cid) setSaveToContacts(false); }}
                   contacts={artistContacts}
                 />
                 {!form.contact_id && form.artist_name && (
                   <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                     <input
                       type="checkbox"
                       checked={saveToContacts}
                       onChange={e => setSaveToContacts(e.target.checked)}
                       className="accent-[#C9A96E] w-3 h-3"
                     />
                     <span className="text-[10px] text-[#C9A96E]">Enregistrer dans les contacts CRM</span>
                   </label>
                 )}
                </td>
                <td className="px-3 py-2">
                  <select value={form.performance_type} onChange={e => set('performance_type', e.target.value)} className="w-full bg-[#0A0A0A] border border-white/10 rounded px-2 py-1.5 text-xs text-[#F5F0EB] focus:outline-none">
                    {PERF_TYPES.map(t => <option key={t} value={t}>{PERF_LABELS[t]}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  <Input type="time" value={form.set_time} onChange={e => set('set_time', e.target.value)} className="bg-[#0A0A0A] border-white/10 h-8 text-xs text-[#F5F0EB]" />
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  <Input type="time" value={form.set_duration} onChange={e => set('set_duration', e.target.value)} className="bg-[#0A0A0A] border-white/10 h-8 text-xs text-[#F5F0EB]" />
                </td>
                <td className="px-3 py-2 hidden md:table-cell text-xs text-[#555]">
                  {form.set_time && form.set_duration ? minToTime((timeToMin(form.set_time) + timeToMin(form.set_duration)) % (24 * 60)) : '—'}
                </td>
                <td className="px-3 py-2 hidden lg:table-cell">
                  <Input type="number" value={form.fee} onChange={e => set('fee', e.target.value)} placeholder="€" className="bg-[#0A0A0A] border-white/10 h-8 text-xs text-[#F5F0EB] placeholder:text-[#555]" />
                </td>
                <td className="px-3 py-2">
                  <select value={form.confirmed} onChange={e => set('confirmed', e.target.value)} className="w-full bg-[#0A0A0A] border border-white/10 rounded px-2 py-1.5 text-xs text-[#F5F0EB] focus:outline-none">
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={handleAdd} className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setAdding(false); setForm(EMPTY); }} className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            )}

            {lineup.map((item, i) => {
              const end = endTime(item);
              const hasConflict = conflicts.has(item.id);
              return editingId === item.id ? (
                <tr key={item.id} className="border-b border-white/5 bg-white/[0.02]">
                  <td className="px-3 py-2"><Input value={editForm.artist_name} onChange={e => setEditForm(f => ({...f, artist_name: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-8 text-xs text-[#F5F0EB]" /></td>
                  <td className="px-3 py-2">
                    <select value={editForm.performance_type} onChange={e => setEditForm(f => ({...f, performance_type: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/10 rounded px-2 py-1.5 text-xs text-[#F5F0EB] focus:outline-none">
                      {PERF_TYPES.map(t => <option key={t} value={t}>{PERF_LABELS[t]}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell"><Input type="time" value={editForm.set_time || ''} onChange={e => setEditForm(f => ({...f, set_time: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-8 text-xs text-[#F5F0EB]" /></td>
                  <td className="px-3 py-2 hidden md:table-cell"><Input type="time" value={editForm.set_duration || ''} onChange={e => setEditForm(f => ({...f, set_duration: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-8 text-xs text-[#F5F0EB]" /></td>
                  <td className="px-3 py-2 hidden md:table-cell text-xs text-[#555]">
                    {editForm.set_time && editForm.set_duration ? minToTime((timeToMin(editForm.set_time) + timeToMin(editForm.set_duration)) % (24 * 60)) : '—'}
                  </td>
                  <td className="px-3 py-2 hidden lg:table-cell"><Input type="number" value={editForm.fee || ''} onChange={e => setEditForm(f => ({...f, fee: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-8 text-xs text-[#F5F0EB]" /></td>
                  <td className="px-3 py-2">
                    <select value={editForm.confirmed} onChange={e => setEditForm(f => ({...f, confirmed: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/10 rounded px-2 py-1.5 text-xs text-[#F5F0EB] focus:outline-none">
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={handleUpdate} className="p-1.5 rounded bg-green-500/10 text-green-400"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded bg-red-500/10 text-red-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className={`group border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${hasConflict ? 'bg-orange-500/5' : i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {hasConflict && <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                      {!hasConflict && <Music className="w-3.5 h-3.5 text-[#C9A96E] flex-shrink-0" />}
                      <span className="font-medium text-[#F5F0EB]">{item.artist_name}</span>
                    </div>
                    {item.notes && <p className="text-xs text-[#8A8A8A] mt-0.5 pl-5">{item.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#C9A96E]">{PERF_LABELS[item.performance_type] || item.performance_type}</td>
                  <td className={`px-4 py-3 hidden md:table-cell text-xs ${hasConflict ? 'text-orange-400' : 'text-[#8A8A8A]'}`}>
                    {item.set_time || '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[#8A8A8A]">
                    {item.set_duration || '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[#555]">
                    {end !== null ? minToTime(end % (24 * 60)) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">
                    {item.fee ? `€${Number(item.fee).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleConfirm(item)}>
                      <Badge className={`${CONFIRM_COLORS[item.confirmed]} text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
                        {CONFIRM_LABELS[item.confirmed]}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => handleEdit(item)} className="p-1.5 rounded hover:bg-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {lineup.length === 0 && !adding && (
              <tr><td colSpan={8} className="text-center py-12 text-[#8A8A8A] text-sm">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Aucun artiste dans la programmation
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}