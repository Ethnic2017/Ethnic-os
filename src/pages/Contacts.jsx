import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import TopBar from '../components/admin/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, Users, Pencil, Trash2, Mail, Phone } from 'lucide-react';

const typeColors = {
  artist: 'bg-purple-500/10 text-purple-400', venue: 'bg-blue-500/10 text-blue-400',
  festival: 'bg-pink-500/10 text-pink-400', partner: 'bg-green-500/10 text-green-400',
  media: 'bg-orange-500/10 text-orange-400', community_member: 'bg-cyan-500/10 text-cyan-400',
  other: 'bg-[#8A8A8A]/10 text-[#8A8A8A]'
};

const emptyContact = { name: '', organization: '', role: '', type: 'artist', email: '', phone: '', city: '', country: '', tags: [], notes: '' };

export default function Contacts() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyContact);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagsStr, setTagsStr] = useState('');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('name', 500),
  });

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.organization?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleSave = async () => {
    const data = { ...form, tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean) };
    if (editing) {
      await base44.entities.Contact.update(editing.id, data);
    } else {
      await base44.entities.Contact.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await base44.entities.Contact.delete(id);
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  const openEdit = (c) => { setEditing(c); setForm(c); setTagsStr((c.tags || []).join(', ')); setDialogOpen(true); };
  const openNew = () => { setEditing(null); setForm(emptyContact); setTagsStr(''); setDialogOpen(true); };

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title={t('contacts')}>
        <Button onClick={openNew} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
          <Plus className="w-4 h-4 mr-2" /> {t('add')}
        </Button>
      </TopBar>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-10 bg-[#1A1A1A] border-white/10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-[#1A1A1A] border-white/10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.keys(typeColors).map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-[#8A8A8A]">{t('loading')}</p>}

      <div className="grid gap-3">
        {filtered.map(c => (
          <div key={c.id} className="glass-card rounded-xl p-4 flex items-center gap-4 group hover:border-[#C9A96E]/20 transition-all">
            <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center text-[#C9A96E] font-bold text-sm flex-shrink-0">
              {c.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[#F5F0EB]">{c.name}</span>
                <Badge className={`${typeColors[c.type]} text-xs`}>{c.type?.replace('_', ' ')}</Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-[#8A8A8A] mt-1">
                {c.organization && <span>{c.organization}</span>}
                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-white/5 text-[#8A8A8A]"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-[#8A8A8A]"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-20 text-[#8A8A8A]">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t('no_data')}</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Edit Contact' : 'New Contact'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
              <div className="space-y-2"><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v}))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(typeColors).map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Organization</Label><Input value={form.organization} onChange={e => setForm(p => ({...p, organization: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
              <div className="space-y-2"><Label>Role</Label><Input value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
              <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
            </div>
            <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={tagsStr} onChange={e => setTagsStr(e.target.value)} className="bg-[#0A0A0A] border-white/10" /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-20" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-[#8A8A8A]">Cancel</Button>
            <Button onClick={handleSave} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}