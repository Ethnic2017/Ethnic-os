import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import TopBar from '../components/admin/TopBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Search, Check, X, Mail } from 'lucide-react';
import ViewToggle from '@/components/crm/ViewToggle';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-400', approved: 'bg-green-500/10 text-green-400', rejected: 'bg-red-500/10 text-red-400'
};

export default function Community() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('grid');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['community'],
    queryFn: () => base44.entities.CommunityMember.list('-created_date', 500),
  });

  const filtered = members.filter(m => {
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id, status) => {
    await base44.entities.CommunityMember.update(id, { status });
    queryClient.invalidateQueries({ queryKey: ['community'] });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title={t('community')}>
        <ViewToggle view={view} onChange={setView} />
      </TopBar>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-10 bg-[#1A1A1A] border-white/10" />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              statusFilter === s ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'bg-white/5 text-[#8A8A8A]'
            }`}>
              {s === 'all' ? 'All' : s} ({s === 'all' ? members.length : members.filter(m => m.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-[#8A8A8A]">{t('loading')}</p>}

      <>{view === 'list' && (
        <div className="glass-card rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5 text-[#8A8A8A] text-xs">
              <th className="text-left px-4 py-3 font-medium">Nom</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Statut</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Type</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Pays</th>
              <th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`group border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3 font-medium text-[#F5F0EB]">{m.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[#8A8A8A]">{m.email || '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><Badge className={`${statusColors[m.status]} text-xs`}>{m.status}</Badge></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">{m.application_type || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">{m.country || '—'}</td>
                  <td className="px-4 py-3">
                    {m.status === 'pending' && (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => updateStatus(m.id, 'approved')} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => updateStatus(m.id, 'rejected')} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {['pending', 'approved', 'rejected'].map(status => (
            <div key={status} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-3">
                <Badge className={`${statusColors[status]} text-xs`}>{status}</Badge>
                <span className="text-xs text-[#8A8A8A]">{filtered.filter(m => m.status === status).length}</span>
              </div>
              <div className="space-y-2">
                {filtered.filter(m => m.status === status).map(m => (
                  <div key={m.id} className="glass-card rounded-lg p-3">
                    <p className="text-sm font-medium text-[#F5F0EB]">{m.name}</p>
                    {m.email && <p className="text-xs text-[#8A8A8A] truncate mt-0.5">{m.email}</p>}
                    {m.country && <p className="text-xs text-[#8A8A8A]">{m.country}</p>}
                    {status === 'pending' && (
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => updateStatus(m.id, 'approved')} className="flex-1 py-1 rounded bg-green-500/10 text-green-400 text-xs">✓ Approuver</button>
                        <button onClick={() => updateStatus(m.id, 'rejected')} className="flex-1 py-1 rounded bg-red-500/10 text-red-400 text-xs">✗ Rejeter</button>
                      </div>
                    )}
                  </div>
                ))}
                {filtered.filter(m => m.status === status).length === 0 && (
                  <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-[#8A8A8A]">Aucun</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'grid' && <div className="grid gap-3">
        {filtered.map(m => (
          <div key={m.id} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-[#C9A96E]/20 transition-all">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A96E]/20 to-[#B34233]/20 flex items-center justify-center text-[#C9A96E] font-bold text-sm">
              {m.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[#F5F0EB]">{m.name}</span>
                <Badge className={`${statusColors[m.status]} text-xs`}>{m.status}</Badge>
                <Badge className="bg-white/5 text-[#8A8A8A] text-xs">{m.application_type}</Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-[#8A8A8A] mt-1">
                {m.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</span>}
                {m.country && <span>{m.country}</span>}
                {m.interests?.length > 0 && <span>{m.interests.join(', ')}</span>}
              </div>
            </div>
            {m.status === 'pending' && (
              <div className="flex gap-1">
                <button onClick={() => updateStatus(m.id, 'approved')} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => updateStatus(m.id, 'rejected')} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-20 text-[#8A8A8A]">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t('no_data')}</p>
          </div>
        )}
      </div>}</>
    </div>
  );
}