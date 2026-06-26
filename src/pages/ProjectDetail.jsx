import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TopBar from '../components/admin/TopBar';
import { ArrowLeft, Info, Music, Megaphone, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import ProjectInfoTab from '../components/project/ProjectInfoTab';
import LineupTab from '../components/project/LineupTab';
import ComPlanTab from '../components/admin/ComPlanTab';
import TasksTab from '../components/project/TasksTab';

const statusColors = {
  planning: 'bg-blue-500/10 text-blue-400', active: 'bg-green-500/10 text-green-400',
  on_hold: 'bg-yellow-500/10 text-yellow-400', completed: 'bg-[#8A8A8A]/10 text-[#8A8A8A]',
  cancelled: 'bg-red-500/10 text-red-400'
};

const BASE_TABS = [
  { id: 'info', label: 'Infos', icon: Info },
  { id: 'tasks', label: 'To Do', icon: CheckSquare },
];

const EVENT_TABS = [
  { id: 'lineup', label: 'Programmation', icon: Music },
  { id: 'complan', label: 'Plan de com', icon: Megaphone },
];

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const [activeTab, setActiveTab] = useState('info');

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.list('-created_date', 500).then(all => all.find(p => p.id === projectId)),
    enabled: !!projectId,
  });

  return (
    <div className="max-w-full mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link to={createPageUrl('Projects')} className="text-[#8A8A8A] hover:text-[#F5F0EB] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-[#8A8A8A] text-sm">Projets</span>
      </div>

      <TopBar title={project?.name || '…'}>
        {project && (
          <Badge className={`${statusColors[project.status]} text-xs capitalize`}>{project.status?.replace('_', ' ')}</Badge>
        )}
      </TopBar>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 w-fit overflow-x-auto">
        {[...BASE_TABS, ...(project?.type === 'event' ? EVENT_TABS : [])].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && project && <ProjectInfoTab project={project} />}
      {activeTab === 'lineup' && <LineupTab projectId={projectId} project={project} />}
      {activeTab === 'complan' && <ComPlanTab projectId={projectId} projectName={project?.name} />}
      {activeTab === 'tasks' && <TasksTab projectId={projectId} />}
    </div>
  );
}