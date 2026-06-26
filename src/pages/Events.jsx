import React, { useState } from 'react';
import { usePermissions } from '../components/usePermissions';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import TopBar from '../components/admin/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import ViewToggle from '@/components/crm/ViewToggle';
import ProjectKanban from '@/components/project/ProjectKanban';

const statusColors = {
  planning: 'bg-blue-500/10 text-blue-400', active: 'bg-green-500/10 text-green-400',
  on_hold: 'bg-yellow-500/10 text-yellow-400', completed: 'bg-[#8A8A8A]/10 text-[#8A8A8A]',
  cancelled: 'bg-red-500/10 text-red-400'
};

const emptyProject = { name: '', type: 'event', description: '', budget: 0, currency: 'EUR', start_date: '', end_date: '', status: 'planning', team_members: [] };

export default function Events() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { can, isAdmin } = usePermissions();
  const canEdit = can('projects', 'editor');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyProject);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('kanban');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  // Filter to only event-type projects
  const eventProjects = projects.filter(p => p.type === 'event');

  const handleStatusChange = async (projectId, newStatus) => {
    await base44.entities.Project.update(projectId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const handleSave = async () => {
    let savedProject;
    if (editing) {
      savedProject = await base44.entities.Project.update(editing.id, form);
    } else {
      savedProject = await base44.entities.Project.create(form);
    }
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    await base44.entities.Project.delete(id);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const openEdit = (p) => { setEditing(p); setForm(p); setDialogOpen(true); };
  const openNew = () => { setEditing(null); setForm(emptyProject); setDialogOpen(true); };

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title={t('events')}>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          {canEdit && (
            <Button onClick={openNew} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
              <Plus className="w-4 h-4 mr-2" /> {t('add')}
            </Button>
          )}
        </div>
      </TopBar>

      {isLoading && <p className="text-[#8A8A8A]">{t('loading')}</p>}

      {view === 'list' && (
        <div className="glass-card rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5 text-[#8A8A8A] text-xs">
              <th className="text-left px-4 py-3 font-medium">Nom</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Statut</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Budget</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date</th>
              <th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {eventProjects.map((p, i) => (
                <tr key={p.id} className={`group border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#F5F0EB]">{p.name}</p>
                    {p.description && <p className="text-xs text-[#8A8A8A] line-clamp-1">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><Badge className={`${statusColors[p.status]} text-xs`}>{p.status}</Badge></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">{p.budget ? `€${p.budget.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">{p.end_date ? format(new Date(p.end_date), 'd MMM yyyy') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <Link to={createPageUrl(`ProjectDetail?id=${p.id}`)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#8A8A8A] hover:text-[#C9A96E]"><ChevronRight className="w-3.5 h-3.5" /></Link>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'kanban' && (
        <ProjectKanban
          projects={eventProjects}
          tasks={tasks}
          canEdit={canEdit}
          onEdit={openEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Edit Event' : 'New Event'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nom de l'événement</Label>
              <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(statusColors).map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget (€)</Label>
                <Input type="number" value={form.budget} onChange={e => setForm(p => ({...p, budget: parseFloat(e.target.value) || 0}))} className="bg-[#0A0A0A] border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.end_date || ''} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-[#8A8A8A]">Annuler</Button>
            <Button onClick={handleSave} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
      </>
    </div>
  );
}