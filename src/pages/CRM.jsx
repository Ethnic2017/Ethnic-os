import React, { useState } from 'react';
import { usePermissions } from '../components/usePermissions';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TopBar from '../components/admin/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, X, Users, Building2 } from 'lucide-react';
import PeopleFormDialog from '@/components/crm/PeopleFormDialog';
import PeopleListView from '@/components/crm/PeopleListView';
import PeopleKanbanView from '@/components/crm/PeopleKanbanView';
import ViewToggle from '@/components/crm/ViewToggle';
import PullToRefresh from '@/components/mobile/PullToRefresh';

export const PIPELINE = ['lead', 'actif', 'partenaire', 'inactif'];
export const PIPELINE_LABELS = { lead: 'Lead', actif: 'Actif', partenaire: 'Partenaire', inactif: 'Inactif' };
export const PIPELINE_COLORS = {
  lead: 'bg-[#8A8A8A]/20 text-[#8A8A8A]',
  actif: 'bg-blue-500/20 text-blue-400',
  partenaire: 'bg-green-500/20 text-green-400',
  inactif: 'bg-white/5 text-[#8A8A8A]',
};

// Suggested tags — user can also type custom ones
export const SUGGESTED_TAGS = ['Ethnic Family', 'Ethnic Crew', 'Artist', 'Client', 'Festival', 'Venue', 'Media', 'Partner', 'Sponsor', 'Volunteer'];

export default function CRM() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canEdit = can('crm', 'editor');
  const [search, setSearch] = useState('');
  const [filterPipeline, setFilterPipeline] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('people'); // 'people' | 'companies'

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    // 0 = pas de limite : le wrapper auto-pagine pour récupérer TOUS les contacts
    queryFn: () => base44.entities.People.list('-updated_date', 0),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-updated_date', 500),
  });

  // Disable kanban for large datasets (> 200 people)
  const effectiveView = people.length > 200 ? 'list' : view;

  const allTags = [...new Set(people.flatMap(p => p.tags || []))].sort();

  const filtered = people.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase());
    const matchPipeline = !filterPipeline || p.pipeline === filterPipeline;
    const matchTag = !filterTag || (p.tags || []).includes(filterTag);
    return matchSearch && matchPipeline && matchTag;
  });

  const filteredCompanies = companies.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.People.update(editing.id, data);
    } else {
      await base44.entities.People.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['people'] });
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce contact ?')) return;
    await base44.entities.People.delete(id);
    queryClient.invalidateQueries({ queryKey: ['people'] });
  };

  const handleEdit = (person) => { setEditing(person); setDialogOpen(true); };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['people'] });
    await queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div>
      <TopBar title="Contacts">
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          {canEdit && (
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
              <Plus className="w-4 h-4 mr-2" /> Ajouter
            </Button>
          )}
        </div>
      </TopBar>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {PIPELINE.map(stage => (
          <button
            key={stage}
            onClick={() => setFilterPipeline(filterPipeline === stage ? '' : stage)}
            className={`glass-card rounded-xl p-4 text-left transition-all border ${filterPipeline === stage ? 'border-[#C9A96E]/50' : 'border-transparent'}`}
          >
            <div className="text-2xl font-bold text-[#F5F0EB]">
              {people.filter(p => p.pipeline === stage).length}
            </div>
            <div className={`text-xs mt-1 font-medium px-2 py-0.5 rounded-full w-fit ${PIPELINE_COLORS[stage]}`}>
              {PIPELINE_LABELS[stage]}
            </div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.03] rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('people')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'people' ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'}`}
        >
          <Users className="w-3.5 h-3.5" /> Personnes <span className="text-xs opacity-70">({people.length})</span>
        </button>
        <button
          onClick={() => setTab('companies')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'companies' ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'}`}
        >
          <Building2 className="w-3.5 h-3.5" /> Companies <span className="text-xs opacity-70">({companies.length})</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 bg-white/[0.03] border-white/10 w-52"
          />
        </div>

        {tab === 'people' && (
          <>
            {/* Tag filter pills */}
            <div className="flex gap-1 flex-wrap items-center">
              {SUGGESTED_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterTag === tag ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'bg-white/[0.03] text-[#8A8A8A] hover:text-[#F5F0EB]'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {/* Custom tags from data that aren't in SUGGESTED_TAGS */}
              {allTags.filter(t => !SUGGESTED_TAGS.includes(t)).map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterTag === tag ? 'bg-[#C9A96E] text-[#0A0A0A]' : 'bg-white/[0.03] text-[#8A8A8A] hover:text-[#F5F0EB]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {(filterPipeline || filterTag || search) && (
              <button
                onClick={() => { setFilterPipeline(''); setFilterTag(''); setSearch(''); }}
                className="text-xs text-[#8A8A8A] hover:text-[#F5F0EB] flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Effacer
              </button>
            )}
          </>
        )}
      </div>

      <div className="text-xs text-[#8A8A8A] mb-4">
        {tab === 'people' ? `${filtered.length} personne${filtered.length > 1 ? 's' : ''}` : `${filteredCompanies.length} company${filteredCompanies.length > 1 ? 'ies' : ''}`}
      </div>

      {isLoading ? (
        <div className="text-[#8A8A8A] text-sm">Chargement...</div>
      ) : tab === 'people' ? (
        <>
          {filtered.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-[#8A8A8A]">Aucun contact trouvé</div>
          ) : view === 'list' ? (
            <PeopleListView
              people={filtered}
              pipelineColors={PIPELINE_COLORS}
              pipelineLabels={PIPELINE_LABELS}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <PeopleKanbanView
              people={filtered}
              pipeline={PIPELINE}
              pipelineColors={PIPELINE_COLORS}
              pipelineLabels={PIPELINE_LABELS}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          {people.length > 200 && view === 'kanban' && (
            <p className="text-xs text-[#8A8A8A] mt-2">Vue Kanban désactivée pour les grands volumes (utilise la vue liste).</p>
          )}
        </>
      ) : (
        <CompaniesView companies={filteredCompanies} queryClient={queryClient} />
      )}

      <PeopleFormDialog
        open={dialogOpen}
        onOpenChange={open => { setDialogOpen(open); if (!open) setEditing(null); }}
        person={editing}
        companies={companies}
        onSave={handleSave}
      />
    </div>
    </PullToRefresh>
  );
}

function CompaniesView({ companies, queryClient }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'other', email: '', phone: '', website: '', city: '', country: '', notes: '', tags: [], pipeline: 'lead' });

  const COMPANY_TYPES = ['festival', 'venue', 'label', 'agency', 'media', 'brand', 'ngo', 'other'];
  const PIPELINE_COLORS = { lead: 'bg-[#8A8A8A]/20 text-[#8A8A8A]', actif: 'bg-blue-500/20 text-blue-400', partenaire: 'bg-green-500/20 text-green-400', inactif: 'bg-white/5 text-[#8A8A8A]' };

  const openEdit = (c) => { setEditing(c); setForm(c); setDialogOpen(true); };
  const openNew = () => { setEditing(null); setForm({ name: '', type: 'other', email: '', phone: '', website: '', city: '', country: '', notes: '', tags: [], pipeline: 'lead' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.Company.update(editing.id, form);
    else await base44.entities.Company.create(form);
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette company ?')) return;
    await base44.entities.Company.delete(id);
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openNew} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle company
        </Button>
      </div>
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/5 text-[#8A8A8A] text-xs">
            <th className="text-left px-4 py-3 font-medium">Nom</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Pipeline</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Ville</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Email</th>
            <th className="px-4 py-3" />
          </tr></thead>
          <tbody>
            {companies.map((c, i) => (
              <tr key={c.id} className={`group border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#F5F0EB]">{c.name}</p>
                  {c.notes && <p className="text-xs text-[#8A8A8A] line-clamp-1">{c.notes}</p>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-[#C9A96E] capitalize">{c.type}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Badge className={`${PIPELINE_COLORS[c.pipeline]} text-xs capitalize`}>{c.pipeline}</Badge>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">{c.email || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]">✏️</button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-[#8A8A8A]">Aucune company</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Company form dialog inline */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg text-[#F5F0EB] mb-4">{editing ? 'Modifier' : 'Nouvelle Company'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#8A8A8A]">Nom *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#8A8A8A]">Type *</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none">
                    {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#8A8A8A]">Pipeline</label>
                <div className="flex gap-2">
                  {['lead','actif','partenaire','inactif'].map(s => (
                    <button key={s} type="button" onClick={() => setForm(f => ({...f, pipeline: s}))} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.pipeline === s ? 'bg-[#C9A96E] text-[#0A0A0A] border-[#C9A96E]' : 'border-white/10 text-[#8A8A8A]'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs text-[#8A8A8A]">Email</label><input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none" /></div>
                <div className="space-y-1"><label className="text-xs text-[#8A8A8A]">Téléphone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs text-[#8A8A8A]">Ville</label><input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none" /></div>
                <div className="space-y-1"><label className="text-xs text-[#8A8A8A]">Pays</label><input value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none" /></div>
              </div>
              <div className="space-y-1"><label className="text-xs text-[#8A8A8A]">Site web</label><input value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none" placeholder="https://..." /></div>
              <div className="space-y-1"><label className="text-xs text-[#8A8A8A]">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none resize-none" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg border border-white/10 text-[#8A8A8A] text-sm">Annuler</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[#C9A96E] text-[#0A0A0A] text-sm font-medium">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}