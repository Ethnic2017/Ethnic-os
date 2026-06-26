import React, { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, LayoutList, LayoutGrid, Check, CheckCircle2 } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#8A8A8A' },
  { id: 'in_progress', label: 'In Progress', color: '#C9A96E' },
  { id: 'review', label: 'Review', color: '#6E9FC9' },
  { id: 'done', label: 'Done', color: '#6EC98B' },
];

const PRIORITY_COLORS = { low: 'bg-blue-500', medium: 'bg-yellow-500', high: 'bg-orange-500', urgent: 'bg-red-500' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

const STATUS_COLORS = {
  todo: 'bg-[#8A8A8A]/10 text-[#8A8A8A]',
  in_progress: 'bg-[#C9A96E]/10 text-[#C9A96E]',
  review: 'bg-blue-500/10 text-blue-400',
  done: 'bg-green-500/10 text-green-400'
};
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

// Inline editable cell
function EditableCell({ value, onSave, className = '', placeholder = '—', type = 'text' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const ref = useRef();

  const commit = () => {
    setEditing(false);
    if (val !== (value || '')) onSave(val);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        autoFocus
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value || ''); setEditing(false); } }}
        className={`bg-[#0A0A0A] border border-white/20 rounded px-2 py-0.5 text-xs text-[#F5F0EB] focus:outline-none focus:border-[#C9A96E] w-full ${className}`}
      />
    );
  }
  return (
    <span
      onClick={() => { setVal(value || ''); setEditing(true); }}
      className={`cursor-text hover:text-[#F5F0EB] transition-colors text-xs ${value ? 'text-[#F5F0EB]' : 'text-[#8A8A8A]/40'} ${className}`}
    >
      {value || placeholder}
    </span>
  );
}

function PrioritySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[value]} hover:ring-2 ring-white/20 transition-all`} title={PRIORITY_LABELS[value]} />
      {open && (
        <div className="absolute z-20 top-4 left-0 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl py-1 w-28" onMouseLeave={() => setOpen(false)}>
          {Object.entries(PRIORITY_LABELS).map(([k, l]) => (
            <button key={k} onClick={() => { onChange(k); setOpen(false); }} className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-white/5 ${value === k ? 'text-[#C9A96E]' : 'text-[#8A8A8A]'}`}>
              <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[k]}`} />{l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}>
        <Badge className={`${STATUS_COLORS[value]} text-xs cursor-pointer hover:opacity-80`}>{STATUS_LABELS[value]}</Badge>
      </button>
      {open && (
        <div className="absolute z-20 top-6 left-0 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl py-1 w-36" onMouseLeave={() => setOpen(false)}>
          {Object.entries(STATUS_LABELS).map(([k, l]) => (
            <button key={k} onClick={() => { onChange(k); setOpen(false); }} className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-white/5 ${value === k ? 'text-[#C9A96E]' : 'text-[#8A8A8A]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[k] || 'bg-white/30'}`} />{l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Quick add row
function AddTaskRow({ projectId, onAdded }) {
  const [title, setTitle] = useState('');
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Le titre est obligatoire.'); return; }
    await base44.entities.Task.create({ title: title.trim(), status: 'todo', priority: 'medium', project_id: projectId });
    setTitle('');
    setError('');
    setActive(false);
    onAdded();
  };

  if (!active) {
    return (
      <button onClick={() => setActive(true)} className="flex items-center gap-2 text-[#8A8A8A] hover:text-[#C9A96E] text-xs px-4 py-2 transition-colors w-full">
        <Plus className="w-3.5 h-3.5" /> Ajouter une tâche…
      </button>
    );
  }

  return (
    <div className="px-4 py-2 border-t border-white/5">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={title}
          onChange={e => { setTitle(e.target.value); if (e.target.value.trim()) setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setActive(false); setTitle(''); setError(''); } }}
          placeholder="Titre de la tâche…"
          className={`flex-1 bg-transparent border-b text-xs text-[#F5F0EB] focus:outline-none pb-0.5 ${error ? 'border-red-400' : 'border-[#C9A96E]'}`}
        />
        <button onClick={handleSubmit} className="px-3 py-1 rounded bg-[#C9A96E] text-[#0A0A0A] text-xs font-medium hover:bg-[#E0CBA8] transition-colors">Valider</button>
        <button onClick={() => { setActive(false); setTitle(''); setError(''); }} className="px-3 py-1 rounded border border-white/10 text-[#8A8A8A] text-xs hover:text-red-400 hover:border-red-400/30 transition-colors">Annuler</button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default function TasksTab({ projectId }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [savedId, setSavedId] = useState(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }, '-created_date', 200),
    enabled: !!projectId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const updateTask = async (id, data) => {
    // Optimistic update
    queryClient.setQueryData(['tasks', projectId], (old = []) =>
      old.map(t => t.id === id ? { ...t, ...data } : t)
    );
    queryClient.setQueryData(['tasks'], (old = []) =>
      old.map(t => t.id === id ? { ...t, ...data } : t)
    );
    await base44.entities.Task.update(id, data);
    refresh();
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1200);
  };

  const deleteTask = async (id) => {
    await base44.entities.Task.delete(id);
    refresh();
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    await updateTask(result.draggableId, { status: result.destination.droppableId });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1">
          <button onClick={() => setView('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'list' ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'}`}>
            <LayoutList className="w-3.5 h-3.5" /> Liste
          </button>
          <button onClick={() => setView('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'kanban' ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'}`}>
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
          </button>
        </div>
        <span className="text-xs text-[#8A8A8A]">{tasks.filter(t => t.status !== 'done').length} en cours · {tasks.filter(t => t.status === 'done').length} terminées</span>
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-[#8A8A8A] text-xs">
                <th className="text-left px-4 py-2.5 font-medium">Tâche</th>
                <th className="text-left px-4 py-2.5 font-medium">Personne</th>
                <th className="text-left px-4 py-2.5 font-medium">Deadline</th>
                <th className="text-left px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr key={task.id} className={`group border-b border-white/5 last:border-0 transition-colors ${savedId === task.id ? 'bg-green-500/5' : `hover:bg-white/[0.02] ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}`}>
                  <td className="px-4 py-2.5">
                    <EditableCell value={task.title} onSave={v => updateTask(task.id, { title: v })} placeholder="Sans titre" />
                  </td>
                  <td className="px-4 py-2.5">
                    <EditableCell value={task.assigned_to} onSave={v => updateTask(task.id, { assigned_to: v })} placeholder="—" />
                  </td>
                  <td className="px-4 py-2.5">
                    <EditableCell value={task.due_date} onSave={v => updateTask(task.id, { due_date: v })} type="date" placeholder="—" className="text-[#C9A96E]" />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusSelect value={task.status || 'todo'} onChange={v => updateTask(task.id, { status: v })} />
                  </td>
                  <td className="px-4 py-2.5">
                    {savedId === task.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#8A8A8A] hover:text-red-400 transition-all flex items-center justify-center min-w-[44px] min-h-[44px] -mx-3"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <AddTaskRow projectId={projectId} onAdded={refresh} />
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map(col => (
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
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_COLORS[task.priority || 'medium']}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[#F5F0EB] leading-snug">{task.title}</p>
                                  {task.assigned_to && <p className="text-xs text-[#8A8A8A] mt-0.5">{task.assigned_to}</p>}
                                  {task.due_date && <p className="text-xs text-[#C9A96E] mt-0.5">{task.due_date}</p>}
                                </div>
                                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-[#8A8A8A] hover:text-red-400 text-xs">×</button>
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
      )}
    </div>
  );
}