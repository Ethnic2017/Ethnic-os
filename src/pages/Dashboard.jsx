import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import TopBar from '../components/admin/TopBar';
import StatCard from '../components/admin/StatCard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import {
  Calendar, FolderKanban, Users, ArrowRight, Clock, TrendingUp, Globe, CheckCircle2, Circle, Loader2 } from
'lucide-react';
import DashboardComPlan from '../components/admin/DashboardComPlan';
import PullToRefresh from '../components/mobile/PullToRefresh';

function QuickTaskToggle({ task, onToggle }) {
  const [loading, setLoading] = useState(false);
  const isDone = task.status === 'done';

  const handleClick = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onToggle(task.id, isDone ? 'todo' : 'done');
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex-shrink-0 transition-all ${loading ? 'opacity-40' : 'hover:scale-110'}`}
      title={isDone ? 'Marquer comme à faire' : 'Marquer comme terminé'}>

      {isDone ?
      <CheckCircle2 className="w-4 h-4 text-green-400" /> :
      <Circle className="w-4 h-4 text-[#8A8A8A] hover:text-[#C9A96E]" />
      }
    </button>);

}

export default function Dashboard() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-date', 50)
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 50)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 50)
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community'],
    queryFn: () => base44.entities.CommunityMember.list('-created_date', 20)
  });

  const { data: crmCount = 0 } = useQuery({
    queryKey: ['crmCount'],
    queryFn: () => base44.entities.People.count()
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 20)
  });

  const toggleTaskStatus = async (id, newStatus) => {
    await base44.entities.Task.update(id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleSyncGoogleCalendar = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const response = await base44.functions.invoke('syncProjectsToGoogleCalendar', {});
      setSyncStatus({ success: true, message: `${response.data.synced} événements synchronisés` });
    } catch (error) {
      setSyncStatus({ success: false, message: 'Erreur lors de la synchronisation' });
    }
    setSyncing(false);
  };

  const upcomingEvents = events.filter((e) => e.status === 'published' && new Date(e.date) >= new Date());
  const activeProjects = projects.filter((p) => p.status === 'active');
  const pendingTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress');
  const pendingMembers = members.filter((m) => m.status === 'pending');
  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="max-w-7xl mx-auto">
      <TopBar title="Ethnic OS — Dashboard">
        <button
          onClick={handleSyncGoogleCalendar}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#C9A96E]/10 hover:bg-[#C9A96E]/20 text-[#C9A96E] text-sm transition-colors disabled:opacity-50">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          {syncing ? 'Synchro...' : 'Sync Calendar'}
        </button>
      </TopBar>

      {syncStatus && (
        <div className={`mb-6 p-3 rounded-xl border ${
          syncStatus.success
            ? 'border-green-500/20 bg-green-500/5 text-green-300'
            : 'border-red-500/20 bg-red-500/5 text-red-300'
        }`}>
          {syncStatus.message}
        </div>
      )}

      {/* Alert membres en attente */}
      {pendingMembers.length > 0 &&
      <Link to={createPageUrl('Community')} className="flex items-center justify-between mb-6 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all">
          <span className="text-sm text-yellow-300">⚠ {pendingMembers.length} nouveau(x) membre(s) du site en attente de validation</span>
          <ArrowRight className="w-4 h-4 text-yellow-400" />
        </Link>
      }

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to={createPageUrl('Events')} className="block">
          <StatCard title="Events à venir" value={upcomingEvents.length} icon={Calendar} color="#C9A96E" />
        </Link>
        <Link to={createPageUrl('Projects')} className="block">
          <StatCard title="Projets actifs" value={activeProjects.length} icon={FolderKanban} color="#B34233" />
        </Link>
        <Link to={createPageUrl('CRM')} className="block">
          <StatCard title="Contacts CRM" value={crmCount} icon={Users} color="#6E9FC9" />
        </Link>
        <Link to={createPageUrl('Orders')} className="block">
          <StatCard title="Ventes totales" value={`€${totalSales.toFixed(0)}`} icon={TrendingUp} color="#6EC98B" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-[#F5F0EB]">{t('upcoming_events')}</h2>
            <Link to={createPageUrl('Events')} className="text-[#C9A96E] text-sm flex items-center gap-1 hover:underline">
              {t('view_all')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 && <p className="text-[#8A8A8A] text-sm">{t('no_data')}</p>}
            {upcomingEvents.slice(0, 4).map((event) =>
            <Link key={event.id} to={createPageUrl('Events')} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                {event.cover_image ?
              <img src={event.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover" /> :
              <div className="w-12 h-12 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-[#C9A96E]" /></div>
              }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F5F0EB] truncate">{event.title}</p>
                  <p className="text-xs text-[#8A8A8A]">{format(new Date(event.date), 'MMM d, yyyy')} · {event.city || event.location}</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-[#F5F0EB]">{t('pending_tasks')}</h2>
            <Link to={createPageUrl('Projects')} className="text-[#C9A96E] text-sm flex items-center gap-1 hover:underline">
              {t('view_all')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {pendingTasks.length === 0 && <p className="text-[#8A8A8A] text-sm">{t('no_data')}</p>}
            {pendingTasks.slice(0, 6).map((task) =>
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                <QuickTaskToggle task={task} onToggle={toggleTaskStatus} />
                <Link to={createPageUrl('Projects')} className="flex-1 min-w-0 flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                task.priority === 'urgent' ? 'bg-red-500' :
                task.priority === 'high' ? 'bg-orange-500' :
                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`
                } />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F5F0EB] truncate">{task.title}</p>
                    <p className="text-xs text-[#8A8A8A]">{task.assigned_to || 'Non assigné'}</p>
                  </div>
                  {task.status === 'in_progress' &&
                <Clock className="w-4 h-4 text-[#C9A96E] flex-shrink-0" />
                }
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* New Community Members */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-[#F5F0EB]">{t('new_members')}</h2>
            <Link to={createPageUrl('Community')} className="text-[#C9A96E] text-sm flex items-center gap-1 hover:underline">
              {t('view_all')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {members.length === 0 && <p className="text-[#8A8A8A] text-sm">{t('no_data')}</p>}
            {members.slice(0, 5).map((m) =>
            <Link key={m.id} to={createPageUrl('Community')} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#C9A96E]/10 flex items-center justify-center text-[#C9A96E] text-xs font-bold">
                  {m.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F5F0EB] truncate">{m.name}</p>
                  <p className="text-xs text-[#8A8A8A]">{m.country} · {m.application_type}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
              m.status === 'approved' ? 'bg-green-500/10 text-green-400' :
              m.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`
              }>
                  {m.status}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Lien site public rapide */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-[#F5F0EB]">Site Public</h2>
            <Link to={createPageUrl('WebsiteManager')} className="text-[#C9A96E] text-sm flex items-center gap-1 hover:underline">
              Gérer <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {[
            { label: 'Events publiés (visibles sur le site)', value: upcomingEvents.length, page: 'Events' },
            { label: 'Membres en attente de validation', value: pendingMembers.length, page: 'Community', alert: pendingMembers.length > 0 }].
            map((item) =>
            <Link key={item.label} to={createPageUrl(item.page)} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <span className={`text-sm ${item.alert ? 'text-yellow-300' : 'text-[#F5F0EB]'}`}>{item.label}</span>
                <span className={`text-sm font-medium ${item.alert ? 'text-yellow-400' : 'text-[#C9A96E]'}`}>{item.value}</span>
              </Link>
            )}
            <Link to={createPageUrl('PublicHome')} className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-sm text-[#8A8A8A] hover:text-[#F5F0EB]">
              <Globe className="w-4 h-4 text-[#C9A96E]" /> Voir le site public <ArrowRight className="w-3 h-3 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Com Plan Global */}
        <DashboardComPlan />

        {/* Recent Orders */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-[#F5F0EB]">{t('recent_orders')}</h2>
            <Link to={createPageUrl('Orders')} className="text-[#C9A96E] text-sm flex items-center gap-1 hover:underline">
              {t('view_all')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {orders.length === 0 && <p className="text-[#8A8A8A] text-sm">{t('no_data')}</p>}
            {orders.slice(0, 5).map((order) =>
            <Link key={order.id} to={createPageUrl('Orders')} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div>
                  <p className="text-sm text-[#F5F0EB]">{order.customer_name || order.customer_email}</p>
                  <p className="text-xs text-[#8A8A8A]">{order.items?.length || 0} items</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#C9A96E]">€{order.total?.toFixed(2)}</p>
                  <span className={`text-xs ${
                order.status === 'paid' ? 'text-green-400' :
                order.status === 'shipped' ? 'text-blue-400' : 'text-yellow-400'}`
                }>{order.status}</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
    </PullToRefresh>);

}