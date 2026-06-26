import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Trash2, ChevronRight, Calendar, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  on_hold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  completed: 'bg-[#8A8A8A]/10 text-[#8A8A8A] border-[#8A8A8A]/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'
};

const statusLabels = {
  planning: 'Planning',
  active: 'Actif',
  on_hold: 'En pause',
  completed: 'Terminé',
  cancelled: 'Annulé'
};

const typeLabels = {
  event: 'Event', video_production: 'Video', festival_collab: 'Festival',
  music_release: 'Music', residency: 'Residency', grant_application: 'Grant', other: 'Other'
};

const COLUMNS = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

function sortByDate(projects) {
  return [...projects].sort((a, b) => {
    const da = a.end_date || a.start_date;
    const db = b.end_date || b.start_date;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return new Date(da) - new Date(db);
  });
}

function ChefAvatar({ assignment }) {
  if (!assignment) return null;
  const name = assignment.contact_name || '?';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  // If contact has a cover_image in future, pass it as assignment.cover_image
  return (
    <div className="relative group/avatar">
      {assignment.cover_image ? (
        <img
          src={assignment.cover_image}
          alt={name}
          className="w-5 h-5 rounded-full object-cover ring-1 ring-[#C9A96E]/30"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-[#C9A96E]/20 ring-1 ring-[#C9A96E]/30 flex items-center justify-center text-[9px] font-semibold text-[#C9A96E] leading-none">
          {initials}
        </div>
      )}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-[#1A1A1A] border border-white/10 rounded text-[10px] text-[#F5F0EB] whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-10">
        {name}
      </div>
    </div>
  );
}

function ProjectCard({ project, tasks, events, canEdit, onDelete, index }) {
  const projectTasks = tasks.filter((t) => t.project_id === project.id);
  const doneTasks = projectTasks.filter((t) => t.status === 'done');

  // Find linked event for cover image
  const linkedEvent = project.related_event_id ? events.find((e) => e.id === project.related_event_id) : null;
  const coverImage = linkedEvent?.cover_image;

  // Chef de projet
  const chefAssignment = project.team_assignments?.find(a => a.role === 'chef_projet');

  return (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) =>
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`glass-card rounded-lg group mb-2 cursor-grab active:cursor-grabbing overflow-hidden ${snapshot.isDragging ? 'opacity-80 shadow-lg shadow-black/40 ring-1 ring-[#C9A96E]/30' : ''}`}>

          {/* Cover image (Trello style) */}
          {coverImage &&
        <div className="w-full h-16 overflow-hidden">
              <img src={coverImage} alt="" className="w-full h-full object-cover opacity-80" />
            </div>
        }

          <div className="p-3">
            {/* Header: title + actions */}
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <Link
              to={createPageUrl(`ProjectDetail?id=${project.id}`)}
              className="text-sm font-medium text-[#F5F0EB] flex-1 hover:text-[#C9A96E] transition-colors leading-tight"
              onClick={(e) => e.stopPropagation()}>

                {project.name}
              </Link>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="p-1 rounded hover:bg-white/10 text-[#8A8A8A] hover:text-[#C9A96E]">
                  <ChevronRight className="w-3 h-3" />
                </Link>
                {canEdit &&
              <button onClick={() => onDelete(project.id)} className="flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 rounded hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              }
              </div>
            </div>

            {/* Date + Type on same line (date first) */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              {project.end_date &&
            <span className="text-xs text-[#8A8A8A] flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(project.end_date), 'd MMM yy')}
                </span>
            }
              <span className="text-xs text-[#C9A96E] ml-auto">{typeLabels[project.type] || project.type}</span>
            </div>

            {/* Tasks summary */}
            {projectTasks.length > 0 &&
          <div className="flex items-center gap-1.5 mb-1.5">
                <CheckSquare className="w-3 h-3 text-[#8A8A8A]" />
                <span className="text-xs text-[#8A8A8A]">{doneTasks.length}/{projectTasks.length}</span>
                <div className="flex-1 bg-white/5 rounded-full h-1 overflow-hidden">
                  <div
                className="h-full bg-[#C9A96E] rounded-full transition-all"
                style={{ width: `${projectTasks.length ? doneTasks.length / projectTasks.length * 100 : 0}%` }} />

                </div>
              </div>
          }

            {/* Footer: chef de projet */}
            {chefAssignment &&
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
                <ChefAvatar assignment={chefAssignment} />
                <span className="text-[10px] text-[#8A8A8A] truncate">{chefAssignment.contact_name}</span>
              </div>
            }







          </div>
        </div>
      }
    </Draggable>);

}

export default function ProjectKanban({ projects: initialProjects, tasks, events = [], canEdit, onDelete, onStatusChange }) {
  const [optimisticProjects, setOptimisticProjects] = React.useState(null);
  const projects = optimisticProjects || initialProjects;

  // Sync when parent data changes
  React.useEffect(() => { setOptimisticProjects(null); }, [initialProjects]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const project = initialProjects.find((p) => p.id === draggableId);
    if (project && project.status !== newStatus) {
      // Optimistic update
      setOptimisticProjects(prev =>
        (prev || initialProjects).map(p => p.id === draggableId ? { ...p, status: newStatus } : p)
      );
      onStatusChange(draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => {
          const sorted = status === 'completed' || status === 'cancelled' ?
          projects.filter((p) => p.status === status) :
          sortByDate(projects.filter((p) => p.status === status));

          return (
            <div key={status} className="flex-shrink-0 w-52">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <Badge className={`${statusColors[status]} text-xs border`}>
                  {statusLabels[status]}
                </Badge>
                <span className="text-xs text-[#8A8A8A]">{sorted.length}</span>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={status}>
                {(provided, snapshot) =>
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[80px] rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-white/[0.03] ring-1 ring-[#C9A96E]/20' : ''}`}>

                    {sorted.map((project, index) =>
                  <ProjectCard
                    key={project.id}
                    project={project}
                    tasks={tasks}
                    events={events}
                    canEdit={canEdit}
                    onDelete={onDelete}
                    index={index} />

                  )}
                    {sorted.length === 0 && !snapshot.isDraggingOver &&
                  <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-[#8A8A8A]">
                        Aucun
                      </div>
                  }
                    {provided.placeholder}
                  </div>
                }
              </Droppable>
            </div>);

        })}
      </div>
    </DragDropContext>);

}