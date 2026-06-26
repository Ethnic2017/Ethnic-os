import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  nouveau: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_cours: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  pret: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  publie: 'bg-green-500/10 text-green-400 border-green-500/20',
  annule: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_LABELS = {
  nouveau: 'Nouveau', en_cours: 'En cours', pret: 'Prêt', publie: 'Publié', annule: 'Annulé'
};

const CHANNELS = ['Instagram', 'Facebook', 'Whatsapp', 'Newsletter', 'Youtube', 'TikTok', 'Twitter/X', 'LinkedIn'];

const empty = { title: '', publication_date: '', deadline: '', channels: [], details: '', deliverable: '', owner_id: '', owner_name: '', status: 'nouveau', notes: '' };

export default function ComPlanTab({ projectId, projectName }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-team'],
    queryFn: () => base44.entities.Contact.list('name', 500),
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['composts', projectId],
    queryFn: () => projectId
      ? base44.entities.ComPost.filter({ project_id: projectId }, 'publication_date', 200)
      : base44.entities.ComPost.filter({ project_name: projectName }, 'publication_date', 200),
    enabled: !!(projectId || projectName),
  });

  const [formError, setFormError] = useState('');

  const openNew = () => { setEditing(null); setForm(empty); setFormError(''); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm(p); setFormError(''); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { setFormError('Le titre est obligatoire.'); return; }
    setFormError('');
    const data = { ...form, project_id: projectId, project_name: projectName };
    if (editing) {
      await base44.entities.ComPost.update(editing.id, data);
    } else {
      await base44.entities.ComPost.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['composts', projectId] });
    queryClient.invalidateQueries({ queryKey: ['composts-all'] });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette publication ?')) return;
    await base44.entities.ComPost.delete(id);
    queryClient.invalidateQueries({ queryKey: ['composts', projectId] });
    queryClient.invalidateQueries({ queryKey: ['composts-all'] });
  };

  const toggleChannel = (ch) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch]
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-[#8A8A8A]">{posts.length} publication{posts.length !== 1 ? 's' : ''} planifiée{posts.length !== 1 ? 's' : ''}</p>
        <Button onClick={openNew} size="sm" className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Ajouter
        </Button>
      </div>

      {isLoading && <p className="text-[#8A8A8A] text-sm">Chargement...</p>}

      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="glass-card rounded-xl p-4 group hover:border-[#C9A96E]/20 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge className={`text-xs border ${STATUS_COLORS[post.status]}`}>{STATUS_LABELS[post.status]}</Badge>
                  {post.channels?.map(ch => (
                    <span key={ch} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[#8A8A8A]">{ch}</span>
                  ))}
                </div>
                <p className="font-medium text-[#F5F0EB] mb-1">{post.title}</p>
                <div className="flex items-center gap-4 text-xs text-[#8A8A8A] flex-wrap">
                  {post.publication_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#C9A96E]" />
                      Publi : {format(new Date(post.publication_date), 'dd/MM/yyyy')}
                    </span>
                  )}
                  {post.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-red-400" />
                      Deadline : {format(new Date(post.deadline), 'dd/MM/yyyy')}
                    </span>
                  )}
                  {post.owner_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {post.owner_name}
                    </span>
                  )}
                </div>
                {post.details && <p className="text-xs text-[#8A8A8A] mt-1.5 line-clamp-2">{post.details}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#8A8A8A]"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && !isLoading && (
          <div className="text-center py-12 text-[#8A8A8A]">
            <p className="text-sm">Aucune publication planifiée</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Modifier la publication' : 'Nouvelle publication'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Titre / Nom de la publication *</Label>
              <Input value={form.title} onChange={e => { setForm(p => ({...p, title: e.target.value})); if (e.target.value.trim()) setFormError(''); }} className={`bg-[#0A0A0A] border-white/10 ${formError ? 'border-red-400' : ''}`} />
              {formError && <p className="text-xs text-red-400">{formError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date de publication</Label>
                <Input type="date" value={form.publication_date || ''} onChange={e => setForm(p => ({...p, publication_date: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Deadline livrable</Label>
                <Input type="date" value={form.deadline || ''} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Canaux de diffusion</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(ch => (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      form.channels?.includes(ch)
                        ? 'bg-[#C9A96E]/20 border-[#C9A96E]/50 text-[#C9A96E]'
                        : 'border-white/10 text-[#8A8A8A] hover:border-white/20'
                    }`}
                  >{ch}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                 <Label>Responsable</Label>
                 <div className="relative">
                   <input
                     type="text"
                     value={form.owner_name || ''}
                     onChange={e => setForm(p => ({...p, owner_name: e.target.value}))}
                     placeholder="Chercher un contact..."
                     className="w-full bg-[#0A0A0A] border border-white/10 rounded px-3 py-1.5 text-xs text-[#F5F0EB] placeholder:text-[#555] focus:outline-none focus:border-[#C9A96E]/50"
                   />
                   {form.owner_name && (
                     <div className="absolute top-full left-0 right-0 z-50 bg-[#1A1A1A] border border-white/10 rounded-b-md shadow-xl max-h-40 overflow-y-auto">
                       {contacts
                         .filter(c => c.name.toLowerCase().includes(form.owner_name.toLowerCase()))
                         .slice(0, 5)
                         .map(c => (
                           <button
                             key={c.id}
                             onClick={() => setForm(p => ({...p, owner_id: c.id, owner_name: c.name}))}
                             className="w-full text-left px-3 py-2 text-xs text-[#F5F0EB] hover:bg-white/5"
                           >
                             {c.name}
                           </button>
                         ))}
                     </div>
                   )}
                 </div>
               </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Détails</Label>
              <Textarea value={form.details || ''} onChange={e => setForm(p => ({...p, details: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-16" />
            </div>
            <div className="space-y-2">
              <Label>Livrable</Label>
              <Input value={form.deliverable || ''} onChange={e => setForm(p => ({...p, deliverable: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes || ''} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-16" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-[#8A8A8A]">Annuler</Button>
            <Button onClick={handleSave} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}