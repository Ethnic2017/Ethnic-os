import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const GOLD = '#C9A96E';
const RED = '#B34233';
const BLUE = '#6E9FC9';
const GREEN = '#6EC98B';

function getLast6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return {
      key: format(d, 'yyyy-MM'),
      label: format(d, 'MMM', { locale: fr }),
      start: startOfMonth(d),
      end: endOfMonth(d),
    };
  });
}

function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A] border border-[#C9A96E]/20 rounded-lg px-3 py-2 text-xs">
      <p className="text-[#8A8A8A] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {prefix}{p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

export default function DashboardCharts({ orders, members, projects, events }) {
  const months = getLast6Months();

  const revenueData = months.map(m => ({
    label: m.label,
    revenue: orders
      .filter(o => {
        const d = new Date(o.created_date);
        return d >= m.start && d <= m.end && o.status !== 'cancelled' && o.status !== 'refunded';
      })
      .reduce((sum, o) => sum + (o.total || 0), 0),
  }));

  const membersData = months.map(m => ({
    label: m.label,
    membres: members.filter(mem => {
      const d = new Date(mem.created_date);
      return d >= m.start && d <= m.end;
    }).length,
  }));

  const statusMap = { planning: 'Planif.', active: 'Actifs', on_hold: 'En pause', completed: 'Terminés', cancelled: 'Annulés' };
  const statusColors = { planning: BLUE, active: GREEN, on_hold: '#E0CBA8', completed: GOLD, cancelled: RED };
  const projectPie = Object.entries(
    projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {})
  ).map(([key, value]) => ({ name: statusMap[key] || key, value, color: statusColors[key] || GOLD }));

  const eventPie = [
    { name: 'À venir', value: events.filter(e => e.status === 'published' && new Date(e.date) >= new Date()).length, color: GOLD },
    { name: 'Passés', value: events.filter(e => e.status === 'past' || new Date(e.date) < new Date()).length, color: '#444' },
    { name: 'Brouillon', value: events.filter(e => e.status === 'draft').length, color: BLUE },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Revenus mensuels */}
      <div className="lg:col-span-2 glass-card rounded-xl p-4">
        <h3 className="font-display text-xs text-[#F5F0EB] mb-3">Revenus (6 derniers mois)</h3>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fill: '#8A8A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8A8A8A', fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<CustomTooltip prefix="€" />} />
            <Area type="monotone" dataKey="revenue" stroke={GOLD} fill="url(#revenueGrad)" strokeWidth={2} dot={{ fill: GOLD, r: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition projets */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display text-xs text-[#F5F0EB] mb-3">Projets par statut</h3>
        {projectPie.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={90}>
              <PieChart>
                <Pie data={projectPie} cx="50%" cy="50%" innerRadius={24} outerRadius={40} dataKey="value" strokeWidth={0}>
                  {projectPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-1">
              {projectPie.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[#8A8A8A]">{d.name}</span>
                  </span>
                  <span className="text-[#F5F0EB] font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[#8A8A8A] text-xs">Aucun projet</p>
        )}
      </div>

      {/* Nouveaux membres */}
      <div className="lg:col-span-2 glass-card rounded-xl p-4">
        <h3 className="font-display text-xs text-[#F5F0EB] mb-3">Nouveaux membres (6 derniers mois)</h3>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={membersData} barSize={20}>
            <XAxis dataKey="label" tick={{ fill: '#8A8A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8A8A8A', fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="membres" fill={BLUE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Events */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display text-xs text-[#F5F0EB] mb-3">Events</h3>
        {eventPie.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={90}>
              <PieChart>
                <Pie data={eventPie} cx="50%" cy="50%" innerRadius={24} outerRadius={40} dataKey="value" strokeWidth={0}>
                  {eventPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-1">
              {eventPie.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[#8A8A8A]">{d.name}</span>
                  </span>
                  <span className="text-[#F5F0EB] font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[#8A8A8A] text-xs">Aucun event</p>
        )}
      </div>
    </div>
  );
}