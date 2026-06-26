import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TopBar from '../components/admin/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, FileText, Pencil, Trash2, Globe } from 'lucide-react';
import { format } from 'date-fns';

const typeColors = {
  article: 'bg-blue-500/10 text-blue-400',
  video: 'bg-purple-500/10 text-purple-400',
  gallery: 'bg-pink-500/10 text-pink-400',
  announcement: 'bg-[#C9A96E]/10 text-[#C9A96E]',
};

const statusColors = {
  draft: 'bg-yellow-500/10 text-yellow-400',
  published: 'bg-green-500/10 text-green-400',
  archived: 'bg-[#8A8A8A]/10 text-[#8A8A8A]',
};

const empty = { title: '', title_fr: '', type: 'article', status: 'draft', content: '', content_fr: '', tags: [], cover_image: '', related_event_id: '', related_project_id: '' };

export default function Content() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagsStr, setTagsStr] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: () => base44.entities.ContentItem.list('-created_date', 200),
  });

  const { data: events = [] } = useQuery({ queryKey: ['events-list'], queryFn: () => base44.entities.Event.list('-date', 100) });
  const { data: projects = [] } = useQuery({ queryKey: ['projects-list'], queryFn: () => base44.entities.Project.list('-created_date', 100) });

  const filtered = typeFilter === 'all' ? items : items.filter(i => i.type === typeFilter);

  const handleSave = async () => {
    const data = { ...form, tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean) };
    if (editing) {
      await base44.entities.ContentItem.update(editing.id, data);
    } else {
      await base44.entities.ContentItem.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['content'] });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this content?')) return;
    await base44.entities.ContentItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ['content'] });
  };

  const togglePublish = async (item) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    await base44.entities.ContentItem.update(item.id, { status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null });
    queryClient.invalidateQueries({ queryKey: ['content'] });
  };

  const openEdit = (c) => { setEditing(c); setForm(c); setTagsStr((c.tags || []).join(', ')); setDialogOpen(true); };
  const openNew = () => { setEditing(null); setForm(empty); setTagsStr(''); setDialogOpen(true); };

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title="Content">
        <Button onClick={openNew} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </TopBar>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'article', 'video', 'gallery', 'announcement'].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${typeFilter === t ? 'bg-[#C9A96E] text-[#0A0A0A] font-medium' : 'border border-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-[#8A8A8A]">Loading...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(item => (
          <div key={item.id} className="glass-card rounded-xl p-5 group hover:border-[#C9A96E]/20 transition-all">
            {item.cover_image && (
              <img src={item.cover_image} alt="" className="w-full h-32 object-cover rounded-lg mb-4" />
            )}
            <div className="flex items-start justify-between mb-3">
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${typeColors[item.type]} text-xs`}>{item.type}</Badge>
                <Badge className={`${statusColors[item.status]} text-xs`}>{item.status}</Badge>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-white/5 text-[#8A8A8A]"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-500/10 text-[#8A8A8A]"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h3 className="font-semibold text-[#F5F0EB] mb-2 line-clamp-2">{item.title}</h3>
            {item.content && <p className="text-sm text-[#8A8A8A] line-clamp-2 mb-3">{item.content}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#8A8A8A]">{item.published_at ? format(new Date(item.published_at), 'MMM d, yyyy') : 'Not published'}</span>
              <button
                onClick={() => togglePublish(item)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all ${item.status === 'published' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-white/5 text-[#8A8A8A] hover:text-[#F5F0EB]'}`}
              >
                <Globe className="w-3 h-3" /> {item.status === 'published' ? 'Published' : 'Publish'}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !isLoading && (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-16 text-[#8A8A8A]">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No content yet</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Edit Content' : 'New Content'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v}))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['article', 'video', 'gallery', 'announcement'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Title (EN)</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
            <div className="space-y-2"><Label>Titre (FR)</Label><Input value={form.title_fr} onChange={e => setForm(p => ({...p, title_fr: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
            <div className="space-y-2"><Label>Content (EN)</Label><Textarea value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-24" /></div>
            <div className="space-y-2"><Label>Cover Image URL</Label><Input value={form.cover_image} onChange={e => setForm(p => ({...p, cover_image: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Linked Event</Label>
                <Select value={form.related_event_id || 'none'} onValueChange={v => setForm(p => ({...p, related_event_id: v === 'none' ? '' : v}))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Linked Project</Label>
                <Select value={form.related_project_id || 'none'} onValueChange={v => setForm(p => ({...p, related_project_id: v === 'none' ? '' : v}))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={tagsStr} onChange={e => setTagsStr(e.target.value)} className="bg-[#0A0A0A] border-white/10" /></div>
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