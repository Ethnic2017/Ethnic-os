import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TopBar from '../components/admin/TopBar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Calendar, FolderKanban, Users, ShoppingBag, Heart, FileText } from 'lucide-react';

const ICONS = {
  event: Calendar, project: FolderKanban, contact: Users, member: Heart, order: ShoppingBag, content: FileText
};

const COLORS = {
  event: 'bg-[#C9A96E]/10 text-[#C9A96E]', project: 'bg-blue-500/10 text-blue-400',
  contact: 'bg-purple-500/10 text-purple-400', member: 'bg-green-500/10 text-green-400',
  order: 'bg-orange-500/10 text-orange-400', content: 'bg-pink-500/10 text-pink-400'
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');

  const { data: events = [] } = useQuery({ queryKey: ['search-events'], queryFn: () => base44.entities.Event.list('-date', 200) });
  const { data: projects = [] } = useQuery({ queryKey: ['search-projects'], queryFn: () => base44.entities.Project.list('-created_date', 200) });
  const { data: contacts = [] } = useQuery({ queryKey: ['search-contacts'], queryFn: () => base44.entities.Contact.list('name', 500) });
  const { data: members = [] } = useQuery({ queryKey: ['search-members'], queryFn: () => base44.entities.CommunityMember.list('-created_date', 200) });
  const { data: orders = [] } = useQuery({ queryKey: ['search-orders'], queryFn: () => base44.entities.Order.list('-created_date', 200) });
  const { data: content = [] } = useQuery({ queryKey: ['search-content'], queryFn: () => base44.entities.ContentItem.list('-created_date', 200) });

  const q = query.toLowerCase().trim();

  const results = q.length < 2 ? [] : [
    ...events.filter(e => e.title?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q)).map(e => ({ type: 'event', id: e.id, label: e.title, sub: e.city, page: 'Events' })),
    ...projects.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).map(p => ({ type: 'project', id: p.id, label: p.name, sub: p.status, page: 'Projects' })),
    ...contacts.filter(c => c.name?.toLowerCase().includes(q) || c.organization?.toLowerCase().includes(q)).map(c => ({ type: 'contact', id: c.id, label: c.name, sub: c.organization, page: 'Contacts' })),
    ...members.filter(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)).map(m => ({ type: 'member', id: m.id, label: m.name, sub: m.email, page: 'Community' })),
    ...orders.filter(o => o.customer_name?.toLowerCase().includes(q) || o.customer_email?.toLowerCase().includes(q)).map(o => ({ type: 'order', id: o.id, label: o.customer_name || o.customer_email, sub: `€${o.total}`, page: 'Orders' })),
    ...content.filter(c => c.title?.toLowerCase().includes(q)).map(c => ({ type: 'content', id: c.id, label: c.title, sub: c.type, page: 'Content' })),
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <TopBar title="Ethnic OS — Search" />

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A8A8A]" />
        <Input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search members, projects, events, orders, content..."
          className="pl-12 h-14 text-base bg-[#1A1A1A] border-white/10 focus:border-[#C9A96E]/40"
        />
      </div>

      {q.length >= 2 && (
        <p className="text-xs text-[#8A8A8A] mb-4">{results.length} result{results.length !== 1 ? 's' : ''}</p>
      )}

      <div className="space-y-2">
        {results.map((r, i) => {
          const Icon = ICONS[r.type];
          return (
            <Link
              key={`${r.type}-${r.id}-${i}`}
              to={createPageUrl(r.page)}
              className="flex items-center gap-4 p-4 glass-card rounded-xl hover:border-[#C9A96E]/20 transition-all"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${COLORS[r.type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F5F0EB] truncate">{r.label}</p>
                {r.sub && <p className="text-xs text-[#8A8A8A] truncate">{r.sub}</p>}
              </div>
              <Badge className={`${COLORS[r.type]} text-xs capitalize`}>{r.type}</Badge>
            </Link>
          );
        })}
        {q.length >= 2 && results.length === 0 && (
          <div className="text-center py-16 text-[#8A8A8A]">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No results found for &quot;{query}&quot;</p>
          </div>
        )}
        {q.length < 2 && (
          <div className="text-center py-16 text-[#8A8A8A]">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Type at least 2 characters to search across all modules</p>
          </div>
        )}
      </div>
    </div>
  );
}