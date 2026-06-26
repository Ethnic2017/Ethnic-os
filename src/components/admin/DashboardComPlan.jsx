import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Calendar, User, Filter } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  nouveau: 'bg-blue-500/10 text-blue-400',
  en_cours: 'bg-yellow-500/10 text-yellow-400',
  pret: 'bg-purple-500/10 text-purple-400',
  publie: 'bg-green-500/10 text-green-400',
  annule: 'bg-red-500/10 text-red-400',
};
const STATUS_LABELS = {
  nouveau: 'Nouveau', en_cours: 'En cours', pret: 'Prêt', publie: 'Publié', annule: 'Annulé'
};

export default function DashboardComPlan() {
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['composts-all'],
    queryFn: () => base44.entities.ComPost.list('publication_date', 200),
  });

  const projects = [...new Set(posts.map(p => p.project_name).filter(Boolean))].sort();

  const filtered = posts.filter(p => {
    const byProject = filterProject === 'all' || p.project_name === filterProject;
    const byStatus = filterStatus === 'all' || p.status === filterStatus;
    return byProject && byStatus;
  });

  // Group by week / date
  const upcoming = filtered.filter(p => !p.publication_date || new Date(p.publication_date) >= new Date());
  const past = filtered.filter(p => p.publication_date && new Date(p.publication_date) < new Date());

  const PostRow = ({ post }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
      <div className="w-16 flex-shrink-0 text-center">
        {post.publication_date ? (
          <>
            <p className="text-[#C9A96E] text-xs font-medium">{format(new Date(post.publication_date), 'dd/MM')}</p>
            <p className="text-[#8A8A8A] text-[10px]">{format(new Date(post.publication_date), 'yyyy')}</p>
          </>
        ) : (
          <p className="text-[#8A8A8A] text-xs">—</p>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <Badge className={`text-[10px] px-1.5 ${STATUS_COLORS[post.status]}`}>{STATUS_LABELS[post.status]}</Badge>
          <span className="text-xs text-[#C9A96E] font-medium">{post.project_name}</span>
        </div>
        <p className="text-sm text-[#F5F0EB] truncate">{post.title}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {post.channels?.length > 0 && (
            <span className="text-[10px] text-[#8A8A8A]">{post.channels.join(' · ')}</span>
          )}
          {post.owner && (
            <span className="text-[10px] text-[#8A8A8A] flex items-center gap-0.5">
              <User className="w-2.5 h-2.5" />{post.owner}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-[#F5F0EB]">Plan de Communication Global</h2>
        <span className="text-xs text-[#8A8A8A]">{filtered.length} publication{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="text-xs bg-[#0A0A0A] border border-white/10 rounded-lg px-2.5 py-1.5 text-[#F5F0EB] focus:outline-none"
        >
          <option value="all">Tous les projets</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-xs bg-[#0A0A0A] border border-white/10 rounded-lg px-2.5 py-1.5 text-[#F5F0EB] focus:outline-none"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading && <p className="text-[#8A8A8A] text-sm">Chargement...</p>}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#C9A96E] font-medium uppercase tracking-wider mb-2">À venir ({upcoming.length})</p>
          <div className="space-y-1">
            {upcoming.slice(0, 8).map(post => <PostRow key={post.id} post={post} />)}
            {upcoming.length > 8 && (
              <p className="text-xs text-[#8A8A8A] text-center pt-2">+{upcoming.length - 8} de plus</p>
            )}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p className="text-xs text-[#8A8A8A] font-medium uppercase tracking-wider mb-2">Passées ({past.length})</p>
          <div className="space-y-1">
            {past.slice(0, 4).map(post => <PostRow key={post.id} post={post} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <p className="text-[#8A8A8A] text-sm text-center py-8">Aucune publication</p>
      )}
    </div>
  );
}