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
import { Plus, Trash2, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import ViewToggle from '@/components/crm/ViewToggle';
import ProjectKanban from '@/components/project/ProjectKanban';
import PullToRefresh from '@/components/mobile/PullToRefresh';

const typeLabels = {
  event: 'Event', video_production: 'Video', festival_collab: 'Festival',
  music_release: 'Music', residency: 'Residency', grant_application: 'Grant', other: 'Other'
};

const statusColors = {
  planning: 'bg-blue-500/10 text-blue-400', active: 'bg-green-500/10 text-green-400',
  on_hold: 'bg-yellow-500/10 text-yellow-400', completed: 'bg-[#8A8A8A]/10 text-[#8A8A8A]',
  cancelled: 'bg-red-500/10 text-red-400'
};

const emptyProject = { name: '', type: 'event', description: '', budget: 0, currency: 'EUR', start_date: '', end_date: '', status: 'planning', team_members: [], related_event_id: '' };

export default function Projects() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canEdit = can('projects', 'editor');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyProject);
  const [formErrors, setFormErrors] = useState({});
  const [view, setView] = useState('kanban');
  const [filterEvents, setFilterEvents] = useState(false);

  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });
  const projects = filterEvents ? allProjects.filter(p => p.type === 'event') : allProjects;

  const { data: events = [] } = useQuery({
    queryKey: ['events-list'],
    queryFn: () => base44.entities.Event.list('-date', 200),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const handleStatusChange = async (projectId, newStatus) => {
    await base44.entities.Project.update(projectId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Le nom est obligatoire.';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    const savedProject = await base44.entities.Project.create(form);
    if (form.related_event_id) {
      await base44.entities.Event.update(form.related_event_id, { related_project_id: savedProject.id });
    }
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce projet ?')) return;
    await base44.entities.Project.delete(id);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const openNew = () => { setForm(emptyProject); setFormErrors({}); setDialogOpen(true); };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title={t('projects')}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterEvents(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${filterEvents ? 'bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/30' : 'text-[#8A8A8A] border-white/10 hover:border-white/20 hover:text-[#F5F0EB]'}`}
          >
            <Calendar className="w-3.5 h-3.5" /> Events
          </button>
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
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Statut</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Budget</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date / Deadline</th>
              <th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={p.id} className={`group border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#F5F0EB]">{p.name}</p>
                    {p.description && <p className="text-xs text-[#8A8A8A] line-clamp-1">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[#C9A96E]">{typeLabels[p.type]}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><Badge className={`${statusColors[p.status]} text-xs`}>{p.status}</Badge></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">{p.budget ? `€${p.budget.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">{p.end_date ? format(new Date(p.end_date), 'd MMM yyyy') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <Link to={createPageUrl(`ProjectDetail?id=${p.id}`)} className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/10 text-[#8A8A8A] hover:text-[#C9A96E]"><ChevronRight className="w-3.5 h-3.5" /></Link>
                      {canEdit && <button onClick={() => handleDelete(p.id)} className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
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
          projects={projects}
          tasks={tasks}
          events={events}
          canEdit={canEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Dialog: New Project only */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Nouveau Projet</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.name} onChange={e => { setForm(p => ({...p, name: e.target.value})); if (e.target.value.trim()) setFormErrors(er => ({...er, name: undefined})); }} className={`bg-[#0A0A0A] border-white/10 ${formErrors.name ? 'border-red-400' : ''}`} />
              {formErrors.name && <p className="text-xs text-red-400">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C9A96E]" /> Lier à un événement</Label>
              <Select value={form.related_event_id || ''} onValueChange={v => setForm(p => ({...p, related_event_id: v === 'none' ? '' : v}))}>
                <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue placeholder="Sélectionner un événement..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun —</SelectItem>
                  {events.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.title} {e.date ? `(${e.date.slice(0,10)})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v}))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date || ''} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-[#8A8A8A]">Annuler</Button>
            <Button onClick={handleSave} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">Créer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}