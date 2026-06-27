import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TopBar from '../components/admin/TopBar';
import {
  Users, Search, Plus, Shield, Edit2, Check, X, Mail,
  UserCheck, UserX, RefreshCw, Link2, Copy
} from 'lucide-react';

const ACCESS_LEVELS = ['no_access', 'read_only', 'editor', 'manager'];
const MODULES = [
  { key: 'projects_access', label: 'Projects' },
  { key: 'events_access', label: 'Events' },
  { key: 'communication_access', label: 'Com Plan' },
  { key: 'souq_access', label: 'Souq' },
  { key: 'crm_access', label: 'CRM' },
];
const ACCOUNT_TYPES = ['customer', 'team_member', 'manager', 'admin'];
const ACCESS_COLORS = {
  no_access: 'text-[#444] bg-[#1A1A1A]',
  read_only: 'text-blue-400 bg-blue-400/10',
  editor: 'text-[#C9A96E] bg-[#C9A96E]/10',
  manager: 'text-green-400 bg-green-400/10',
};
const TYPE_COLORS = {
  customer: 'text-[#8A8A8A] bg-white/5',
  team_member: 'text-blue-400 bg-blue-400/10',
  manager: 'text-[#C9A96E] bg-[#C9A96E]/10',
  admin: 'text-green-400 bg-green-400/10',
};

function PermissionBadge({ value, onChange }) {
  const idx = ACCESS_LEVELS.indexOf(value);
  const next = ACCESS_LEVELS[(idx + 1) % ACCESS_LEVELS.length];
  return (
    <button
      onClick={() => onChange(next)}
      title="Cliquer pour changer le niveau"
      className={`text-[10px] px-2 py-0.5 rounded tracking-wider uppercase font-medium transition-all hover:scale-105 ${ACCESS_COLORS[value] || ACCESS_COLORS.no_access}`}
    >
      {value?.replace('_', ' ') || 'no access'}
    </button>
  );
}

function UserRow({ perm, onSave, onDelete, crmContacts }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(perm);

  const linked = crmContacts.find(c => c.id === perm.linked_contact_id);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const quickToggleStatus = () => {
    const next = perm.status === 'active' ? 'inactive' : 'active';
    onSave({ ...perm, status: next });
  };

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden mb-3 bg-[#111] hover:border-white/10 transition-colors">
      {/* Header row */}
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] text-sm font-semibold flex-shrink-0">
          {perm.user_name?.[0]?.toUpperCase() || perm.user_email?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-[#F5F0EB] font-medium">{perm.user_name || perm.user_email}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded tracking-wider uppercase font-medium ${TYPE_COLORS[perm.account_type] || TYPE_COLORS.customer}`}>
              {perm.account_type}
            </span>
            <button
              onClick={quickToggleStatus}
              className={`text-[10px] px-2 py-0.5 rounded tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${
                perm.status === 'active' ? 'text-green-400 bg-green-400/10' :
                perm.status === 'suspended' ? 'text-red-400 bg-red-400/10' : 'text-[#8A8A8A] bg-white/5'
              }`}
            >
              {perm.status}
            </button>
          </div>
          <p className="text-xs text-[#8A8A8A] truncate">{perm.user_email}</p>
          {linked && (
            <p className="text-[10px] text-[#C9A96E]/60 mt-0.5 flex items-center gap-1">
              <Link2 className="w-2.5 h-2.5" /> CRM: {linked.name}
            </p>
          )}
        </div>

        {/* Module permissions summary */}
        <div className="hidden md:flex items-center gap-1.5 flex-wrap">
          {MODULES.map(m => (
            <span
              key={m.key}
              title={`${m.label}: ${perm[m.key] || 'no_access'}`}
              className={`text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase ${ACCESS_COLORS[perm[m.key]] || ACCESS_COLORS.no_access}`}
            >
              {m.label[0]}
            </span>
          ))}
        </div>

        {/* Edit toggle */}
        <button
          onClick={() => { setEditing(!editing); setDraft(perm); }}
          className="p-1.5 text-[#8A8A8A] hover:text-[#C9A96E] transition-colors"
        >
          {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="border-t border-white/5 p-4 space-y-4 bg-[#0D0D0D]">
          {/* Account type & status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mb-2 block">Account Type</label>
              <select
                value={draft.account_type || 'customer'}
                onChange={e => setDraft({ ...draft, account_type: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-white/10 text-[#F5F0EB] text-sm rounded-lg px-3 py-2"
              >
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mb-2 block">Status</label>
              <select
                value={draft.status || 'active'}
                onChange={e => setDraft({ ...draft, status: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-white/10 text-[#F5F0EB] text-sm rounded-lg px-3 py-2"
              >
                {['active', 'inactive', 'suspended'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Module permissions */}
          <div>
            <label className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mb-3 block">Module Access</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MODULES.map(m => (
                <div key={m.key} className="flex items-center justify-between bg-[#1A1A1A] rounded-lg px-3 py-2">
                  <span className="text-xs text-[#8A8A8A]">{m.label}</span>
                  <PermissionBadge
                    value={draft[m.key] || 'no_access'}
                    onChange={val => setDraft({ ...draft, [m.key]: val })}
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#555] mt-2">Cliquer sur un badge pour changer le niveau</p>
          </div>

          {/* CRM link */}
          <div>
            <label className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mb-2 block">Lier à un contact CRM</label>
            <select
              value={draft.linked_contact_id || ''}
              onChange={e => setDraft({ ...draft, linked_contact_id: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-white/10 text-[#F5F0EB] text-sm rounded-lg px-3 py-2"
            >
              <option value="">— Aucun —</option>
              {crmContacts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.email || 'no email'})</option>
              ))}
            </select>
          </div>

          {/* Manager */}
          <div>
            <label className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mb-2 block">Manager Email</label>
            <input
              value={draft.manager_email || ''}
              onChange={e => setDraft({ ...draft, manager_email: e.target.value })}
              placeholder="manager@ethnic-community.org"
              className="w-full bg-[#1A1A1A] border border-white/10 text-[#F5F0EB] text-sm rounded-lg px-3 py-2"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-[#8A8A8A] tracking-widest uppercase mb-2 block">Notes</label>
            <textarea
              value={draft.notes || ''}
              onChange={e => setDraft({ ...draft, notes: e.target.value })}
              rows={2}
              className="w-full bg-[#1A1A1A] border border-white/10 text-[#F5F0EB] text-sm rounded-lg px-3 py-2 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-[#C9A96E] text-[#0A0A0A] text-xs font-semibold rounded-lg hover:bg-[#E0CBA8] transition-all"
            >
              <Check className="w-3.5 h-3.5" /> Enregistrer
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-white/10 text-[#8A8A8A] text-xs rounded-lg hover:text-[#F5F0EB] transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newAccountType, setNewAccountType] = useState('team_member');
  const [inviteStatus, setInviteStatus] = useState(''); // 'sending' | 'sent' | 'error'
  const [inviteLink, setInviteLink] = useState('');
  const [inviteError, setInviteError] = useState('');

  const { data: permissions = [] } = useQuery({
    queryKey: ['module-permissions'],
    queryFn: () => base44.entities.ModulePermissions.list('-created_date', 200),
  });

  const { data: crmContacts = [] } = useQuery({
    queryKey: ['crm-people'],
    queryFn: () => base44.entities.People.list('name', 200),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ModulePermissions.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['module-permissions'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ModulePermissions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-permissions'] });
    },
  });

  const handleSave = (perm) => {
    saveMutation.mutate({ id: perm.id, data: perm });
  };

  const handleInviteUser = async () => {
    if (!newUserEmail) return;
    setInviteStatus('sending');
    setInviteError('');
    setInviteLink('');

    try {
      // Secure account creation + CRM linking happens server-side (service-role).
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'grant_access',
          email: newUserEmail.trim().toLowerCase(),
          name: newUserName || null,
          role: newAccountType,
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || 'Échec de la création du compte');
      }

      setInviteLink(data.action_link || '');
      setInviteStatus('sent');
      setNewUserEmail('');
      setNewUserName('');
      queryClient.invalidateQueries({ queryKey: ['module-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['crm-people'] });
    } catch (e) {
      setInviteError(e.message || 'Erreur inconnue');
      setInviteStatus('error');
    }
  };

  const filtered = permissions.filter(p => {
    const matchSearch = !search || p.user_email?.toLowerCase().includes(search.toLowerCase()) || p.user_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || p.account_type === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    total: permissions.length,
    active: permissions.filter(p => p.status === 'active').length,
    team: permissions.filter(p => ['team_member', 'manager', 'admin'].includes(p.account_type)).length,
    customers: permissions.filter(p => p.account_type === 'customer').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <TopBar title="Users & Permissions" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total enregistrés', value: stats.total, color: '#C9A96E' },
          { label: 'Actifs', value: stats.active, color: '#6EC98B' },
          { label: 'Équipe', value: stats.team, color: '#6E9FC9' },
          { label: 'Clients', value: stats.customers, color: '#8A8A8A' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className="text-2xl font-display" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#8A8A8A] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 bg-[#C9A96E]/5 border border-[#C9A96E]/15 rounded-xl flex gap-3">
        <Shield className="w-4 h-4 text-[#C9A96E] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-[#F5F0EB] font-medium mb-1">Contrôle centralisé des accès</p>
          <p className="text-[11px] text-[#8A8A8A] leading-relaxed">
            Invitez des utilisateurs, définissez leur type de compte et contrôlez précisément quels modules ils peuvent voir.
            Les permissions prennent effet immédiatement après sauvegarde.
            Chaque utilisateur peut être lié à une fiche CRM pour une gestion unifiée.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm text-[#F5F0EB] placeholder-[#555] focus:outline-none focus:border-[#C9A96E]/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...ACCOUNT_TYPES].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 text-xs rounded-lg transition-all tracking-wide capitalize ${
                filterType === t ? 'bg-[#C9A96E] text-[#0A0A0A] font-semibold' : 'bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#F5F0EB] border border-white/5'
              }`}
            >
              {t === 'all' ? 'Tous' : t}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A96E] text-[#0A0A0A] text-xs font-semibold rounded-xl hover:bg-[#E0CBA8] transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Inviter un utilisateur
        </button>
      </div>

      {/* Invite / Add user form */}
      {showAddForm && (
        <div className="glass-card rounded-xl p-5 mb-6">
          <h3 className="text-sm font-medium text-[#F5F0EB] mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#C9A96E]" /> Inviter un nouvel utilisateur
          </h3>
          <p className="text-[11px] text-[#555] mb-4">
            Un email d'invitation sera envoyé. L'utilisateur pourra se connecter depuis la page publique.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <input
              value={newUserEmail}
              onChange={e => setNewUserEmail(e.target.value)}
              placeholder="Email *"
              type="email"
              className="bg-[#1A1A1A] border border-white/10 text-[#F5F0EB] text-sm rounded-lg px-3 py-2"
            />
            <input
              value={newUserName}
              onChange={e => setNewUserName(e.target.value)}
              placeholder="Nom complet"
              className="bg-[#1A1A1A] border border-white/10 text-[#F5F0EB] text-sm rounded-lg px-3 py-2"
            />
            <select
              value={newAccountType}
              onChange={e => setNewAccountType(e.target.value)}
              className="bg-[#1A1A1A] border border-white/10 text-[#F5F0EB] text-sm rounded-lg px-3 py-2"
            >
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleInviteUser}
              disabled={!newUserEmail || inviteStatus === 'sending'}
              className="flex items-center gap-2 px-5 py-2 bg-[#C9A96E] text-[#0A0A0A] text-xs font-semibold rounded-lg hover:bg-[#E0CBA8] transition-all disabled:opacity-50"
            >
              {inviteStatus === 'sending' ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Création...</>
              ) : (
                <><Mail className="w-3.5 h-3.5" /> Créer le compte &amp; générer le lien</>
              )}
            </button>
            <button onClick={() => { setShowAddForm(false); setInviteStatus(''); setInviteLink(''); setInviteError(''); }} className="px-4 py-2 border border-white/10 text-[#8A8A8A] text-xs rounded-lg hover:text-[#F5F0EB]">
              Annuler
            </button>
            {inviteStatus === 'error' && (
              <p className="text-xs text-red-400">{inviteError}</p>
            )}
          </div>
          {inviteStatus === 'sent' && (
            <div className="mt-4 p-3 bg-green-400/5 border border-green-400/20 rounded-lg">
              <p className="text-xs text-green-400 mb-2 flex items-center gap-2">
                <Check className="w-3.5 h-3.5" /> Compte créé et relié à la fiche CRM.
              </p>
              {inviteLink ? (
                <>
                  <p className="text-[11px] text-[#8A8A8A] mb-1">Lien magique d'activation — envoie-le à la personne :</p>
                  <div className="flex gap-2">
                    <input readOnly value={inviteLink} onFocus={e => e.target.select()} className="flex-1 bg-[#1A1A1A] border border-white/10 text-[#8A8A8A] text-[11px] rounded px-2 py-1.5" />
                    <button onClick={() => navigator.clipboard?.writeText(inviteLink)} className="flex items-center gap-1 px-3 py-1.5 bg-[#C9A96E] text-[#0A0A0A] text-[11px] font-semibold rounded hover:bg-[#E0CBA8]">
                      <Copy className="w-3 h-3" /> Copier
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-[#8A8A8A]">Lien magique généré.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Users list */}
      <div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#8A8A8A]">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun utilisateur trouvé</p>
            <p className="text-xs mt-1 opacity-60">Invitez des utilisateurs en cliquant sur "Inviter un utilisateur"</p>
          </div>
        ) : (
          filtered.map(perm => (
            <UserRow
              key={perm.id}
              perm={perm}
              onSave={handleSave}
              crmContacts={crmContacts}
            />
          ))
        )}
      </div>
    </div>
  );
}