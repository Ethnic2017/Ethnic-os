import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import TopBar from '../components/admin/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import {
  ArrowLeft, Calendar, MapPin, Music, Users, FolderKanban,
  Plus, ExternalLink, Ticket, CheckCircle2, Clock, AlertCircle, Pencil
} from 'lucide-react';
import EventFormDialog from '../components/admin/EventFormDialog';

const statusColors = {
  draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  published: 'bg-green-500/10 text-green-400 border-green-500/20',
  past: 'bg-[#8A8A8A]/10 text-[#8A8A8A] border-[#8A8A8A]/20',
};

const kanbanCols = [
  { id: 'todo', label: 'To Do', color: '#8A8A8A' },
  { id: 'in_progress', label: 'In Progress', color: '#C9A96E' },
  { id: 'review', label: 'Review', color: '#6E9FC9' },
  { id: 'done', label: 'Done', color: '#6EC98B' },
];

const priorityColors = { low: 'bg-blue-500', medium: 'bg-yellow-500', high: 'bg-orange-500', urgent: 'bg-red-500' };

export default function EventDetail() {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  const [editEventOpen, setEditEventOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', due_date: '', assigned_to: '', status: 'todo' });
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch event
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
    select: d => d[0],
  });

  // Fetch linked project
  const { data: project } = useQuery({
    queryKey: ['project-for-event', eventId],
    queryFn: () => base44.entities.Project.filter({ related_event_id: eventId }),
    enabled: !!eventId,
    select: d => d[0],
  });

  // Fetch tasks for the linked project
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-for-event', project?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: project.id }, '-created_date', 200),
    enabled: !!project?.id,
  });

  // Fetch all projects (to allow linking)
  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects-all'],
    queryFn: () => base44.entities.Project.list('-created_date', 50),
  });

  const handleAddTask = async () => {
    if (!project) return;
    await base44.entities.Task.create({ ...taskForm, project_id: project.id });
    queryClient.invalidateQueries({ queryKey: ['tasks-for-event', project.id] });
    setTaskDialogOpen(false);
    setTaskForm({ title: '', priority: 'medium', due_date: '', assigned_to: '', status: 'todo' });
  };

  const onDragEnd = async (result) => {
    if (!result.destination || !project) return;
    await base44.entities.Task.update(result.draggableId, { status: result.destination.droppableId });
    queryClient.invalidateQueries({ queryKey: ['tasks-for-event', project.id] });
  };

  const handleDeleteTask = async (id) => {
    await base44.entities.Task.delete(id);
    queryClient.invalidateQueries({ queryKey: ['tasks-for-event', project.id] });
  };

  const handleLinkProject = async (projectId) => {
    await base44.entities.Event.update(eventId, { related_project_id: projectId });
    await base44.entities.Project.update(projectId, { related_event_id: eventId });
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    queryClient.invalidateQueries({ queryKey: ['project-for-event', eventId] });
  };

  const taskStats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  };

  if (isLoading) return <div className="text-[#8A8A8A] p-8">Loading...</div>;
  if (!event) return <div className="text-[#8A8A8A] p-8">Event not found.</div>;

  const title = lang === 'fr' && event.title_fr ? event.title_fr : event.title;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-2 text-sm text-[#8A8A8A]">
        <Link to={createPageUrl('Events')} className="flex items-center gap-1 hover:text-[#F5F0EB] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Events
        </Link>
        <span>/</span>
        <span className="text-[#F5F0EB]">{title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        {event.cover_image ? (
          <img src={event.cover_image} alt="" className="w-full sm:w-32 h-24 sm:h-20 object-cover rounded-xl" />
        ) : (
          <div className="w-full sm:w-32 h-20 bg-gradient-to-br from-[#C9A96E]/20 to-[#B34233]/20 rounded-xl flex items-center justify-center">
            <Music className="w-8 h-8 text-[#C9A96E]/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-display text-[#F5F0EB]">{title}</h1>
            <Badge className={`${statusColors[event.status]} border text-xs`}>{event.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#8A8A8A]">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C9A96E]" /> {format(new Date(event.date), 'EEE, MMM d yyyy')}</span>
            {event.city && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#C9A96E]" /> {event.city}{event.country ? `, ${event.country}` : ''}</span>}
            {event.lineup?.length > 0 && <span className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-[#C9A96E]" /> {event.lineup.join(' · ')}</span>}
          </div>
        </div>
        <button onClick={() => setEditEventOpen(true)} className="p-2 rounded-lg hover:bg-white/5 text-[#8A8A8A] hover:text-[#F5F0EB] flex-shrink-0">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 w-fit">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'project', label: 'Project', icon: project ? <FolderKanban className="w-3.5 h-3.5" /> : null },
          { id: 'tasks', label: `Tasks ${tasks.length > 0 ? `(${taskStats.done}/${taskStats.total})` : ''}` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === tab.id ? 'bg-[#C9A96E] text-[#0A0A0A] font-medium' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ——— TAB: OVERVIEW ——— */}
      {activeTab === 'overview' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tasks Total', value: taskStats.total, icon: CheckCircle2, color: '#C9A96E' },
            { label: 'In Progress', value: taskStats.inProgress, icon: Clock, color: '#6E9FC9' },
            { label: 'Done', value: taskStats.done, icon: CheckCircle2, color: '#6EC98B' },
            { label: 'Urgent', value: taskStats.urgent, icon: AlertCircle, color: '#B34233' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#8A8A8A] tracking-wider uppercase">{s.label}</span>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="text-3xl font-display" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}

          {/* Ticket link */}
          {event.ticket_link && (
            <div className="glass-card rounded-xl p-5 sm:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="w-4 h-4 text-[#C9A96E]" />
                <span className="text-xs text-[#8A8A8A] tracking-wider uppercase">Billetterie</span>
              </div>
              <a href={event.ticket_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#5EC8B8] hover:text-[#F5F0EB] transition-colors">
                {event.ticket_link} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Linked project summary */}
          {project && (
            <div className="glass-card rounded-xl p-5 sm:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <FolderKanban className="w-4 h-4 text-[#C9A96E]" />
                <span className="text-xs text-[#8A8A8A] tracking-wider uppercase">Projet lié</span>
              </div>
              <button onClick={() => setActiveTab('project')} className="text-sm text-[#F5F0EB] hover:text-[#C9A96E] transition-colors font-medium">
                {project.name}
              </button>
              <p className="text-xs text-[#8A8A8A] mt-1 capitalize">{project.status} · {project.type}</p>
            </div>
          )}
        </div>
      )}

      {/* ——— TAB: PROJECT ——— */}
      {activeTab === 'project' && (
        <div>
          {project ? (
            <div className="glass-card rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-display text-[#F5F0EB] mb-1">{project.name}</h2>
                  <div className="flex flex-wrap gap-2 text-xs text-[#8A8A8A]">
                    <Badge className="bg-white/5 text-[#8A8A8A] border-white/10 border capitalize">{project.status}</Badge>
                    <Badge className="bg-white/5 text-[#8A8A8A] border-white/10 border capitalize">{project.type}</Badge>
                    {project.budget && <span>Budget: {project.budget} {project.currency || 'EUR'}</span>}
                  </div>
                </div>
                <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="flex items-center gap-1.5 text-xs text-[#C9A96E] hover:text-[#E0CBA8]">
                  Ouvrir le kanban <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              {project.description && <p className="text-sm text-[#8A8A8A] leading-relaxed">{project.description}</p>}
              {(project.start_date || project.end_date) && (
                <div className="flex gap-4 text-xs text-[#8A8A8A]">
                  {project.start_date && <span>Début : <span className="text-[#F5F0EB]">{project.start_date}</span></span>}
                  {project.end_date && <span>Fin : <span className="text-[#F5F0EB]">{project.end_date}</span></span>}
                </div>
              )}
              {project.team_members?.length > 0 && (
                <div>
                  <p className="text-xs text-[#8A8A8A] mb-2 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Équipe</p>
                  <div className="flex flex-wrap gap-2">
                    {project.team_members.map(m => (
                      <span key={m} className="px-2.5 py-1 bg-white/5 rounded-full text-xs text-[#F5F0EB]">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-8 text-center">
              <FolderKanban className="w-10 h-10 mx-auto mb-4 text-[#8A8A8A]/30" />
              <p className="text-[#8A8A8A] mb-4">Aucun projet lié à cet événement.</p>
              <div className="max-w-xs mx-auto">
                <Select onValueChange={handleLinkProject}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10">
                    <SelectValue placeholder="Lier un projet existant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allProjects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ——— TAB: TASKS (Kanban) ——— */}
      {activeTab === 'tasks' && (
        <div>
          {!project ? (
            <div className="glass-card rounded-xl p-8 text-center text-[#8A8A8A]">
              <p>Liez d'abord un projet à cet événement pour gérer les tâches.</p>
              <button onClick={() => setActiveTab('project')} className="mt-3 text-[#C9A96E] text-sm underline">Lier un projet →</button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-[#8A8A8A]">{project.name}</p>
                <Button onClick={() => setTaskDialogOpen(true)} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Task
                </Button>
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {kanbanCols.map(col => (
                    <Droppable key={col.id} droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`rounded-xl p-4 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-white/[0.04]' : 'bg-white/[0.02]'}`}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                            <h3 className="text-sm font-medium text-[#F5F0EB]">{col.label}</h3>
                            <span className="text-xs text-[#8A8A8A] ml-auto">{tasks.filter(t => t.status === col.id).length}</span>
                          </div>
                          <div className="space-y-2">
                            {tasks.filter(t => t.status === col.id).map((task, idx) => (
                              <Draggable key={task.id} draggableId={task.id} index={idx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`glass-card rounded-lg p-3 group cursor-grab ${snapshot.isDragging ? 'shadow-xl border-[#C9A96E]/30' : ''}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${priorityColors[task.priority]}`} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[#F5F0EB] leading-snug">{task.title}</p>
                                        {task.assigned_to && <p className="text-xs text-[#8A8A8A] mt-1">{task.assigned_to}</p>}
                                        {task.due_date && <p className="text-xs text-[#C9A96E] mt-1">{task.due_date}</p>}
                                      </div>
                                      <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-[#8A8A8A] hover:text-red-400 text-xs">×</button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </DragDropContext>
            </>
          )}
        </div>
      )}

      {/* Edit Event Dialog */}
      <EventFormDialog
        open={editEventOpen}
        onOpenChange={setEditEventOpen}
        event={event}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['event', eventId] })}
      />

      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB]">
          <DialogHeader><DialogTitle className="font-display">New Task</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} className="bg-[#0A0A0A] border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} className="bg-[#0A0A0A] border-white/10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assigned To (email)</Label>
              <Input value={taskForm.assigned_to} onChange={e => setTaskForm(p => ({ ...p, assigned_to: e.target.value }))} className="bg-[#0A0A0A] border-white/10" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)} className="border-white/10 text-[#8A8A8A]">Cancel</Button>
            <Button onClick={handleAddTask} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">Add Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}