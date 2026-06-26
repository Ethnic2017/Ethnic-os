import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PublicNav from '../components/public/PublicNav';
import PublicFooter from '../components/public/PublicFooter';
import { useLanguage } from '../components/LanguageContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save, ShoppingBag, ArrowRight, Shield, Check, Trash2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function MyAccount() {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) return;
      setUser(u);
      setForm({ full_name: u.full_name || '', email: u.email || '' });
    });
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  const { data: permissions } = useQuery({
    queryKey: ['my-permissions', user?.email],
    queryFn: () => base44.entities.ModulePermissions.filter({ user_email: user.email }),
    enabled: !!user?.email,
    select: data => data?.[0],
  });

  const handleSave = async () => {
    await base44.auth.updateMe({ full_name: form.full_name });
    // Sync to CRM if linked
    if (permissions?.linked_contact_id) {
      await base44.entities.People.update(permissions.linked_contact_id, {
        name: form.full_name,
        email: user.email,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!user) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
    </div>
  );

  const TABS = [
    { key: 'profile', label: lang === 'fr' ? 'Profil' : 'Profile' },
    { key: 'orders', label: lang === 'fr' ? 'Commandes' : 'Orders' },
    { key: 'access', label: lang === 'fr' ? 'Accès' : 'Access' },
  ];

  const ORDER_STATUS_COLORS = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    paid: 'text-green-400 bg-green-400/10',
    shipped: 'text-blue-400 bg-blue-400/10',
    delivered: 'text-[#C9A96E] bg-[#C9A96E]/10',
    cancelled: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <PublicNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-28 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] text-2xl font-display">
            {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="font-display text-2xl text-[#F5F0EB]">{user.full_name || user.email}</h1>
            <p className="text-xs text-[#8A8A8A] tracking-wider mt-0.5">
              {permissions?.account_type || 'customer'} · {user.email}
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/5 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm tracking-wide transition-colors relative ${
                activeTab === tab.key ? 'text-[#F5F0EB]' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-[#C9A96E]" />
              )}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="text-xs text-[#8A8A8A] tracking-widest uppercase">
                {lang === 'fr' ? 'Informations personnelles' : 'Personal information'}
              </h2>
              <div>
                <label className="text-xs text-[#8A8A8A] mb-1.5 block">
                  {lang === 'fr' ? 'Nom complet' : 'Full name'}
                </label>
                <input
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-white/10 text-[#F5F0EB] text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#C9A96E]/30"
                />
              </div>
              <div>
                <label className="text-xs text-[#8A8A8A] mb-1.5 block">Email</label>
                <input
                  value={form.email}
                  disabled
                  className="w-full bg-[#111] border border-white/5 text-[#555] text-sm rounded-lg px-4 py-3 cursor-not-allowed"
                />
                <p className="text-[10px] text-[#555] mt-1">
                  {lang === 'fr' ? 'L\'email ne peut pas être modifié.' : 'Email cannot be changed.'}
                </p>
              </div>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A96E] text-[#0A0A0A] text-xs font-semibold rounded-lg hover:bg-[#E0CBA8] transition-all"
              >
                {saved ? <><Check className="w-4 h-4" /> {lang === 'fr' ? 'Sauvegardé !' : 'Saved!'}</> : <><Save className="w-4 h-4" /> {lang === 'fr' ? 'Enregistrer' : 'Save'}</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-[#8A8A8A]/20" />
                <p className="text-[#8A8A8A] text-sm">{lang === 'fr' ? 'Aucune commande pour le moment' : 'No orders yet'}</p>
                <Link to={createPageUrl('PublicSouq')} className="inline-flex items-center gap-2 mt-4 text-xs text-[#C9A96E] tracking-widest uppercase hover:text-[#E0CBA8] transition-colors">
                  {lang === 'fr' ? 'Découvrir le Souq' : 'Explore Souq'} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#F5F0EB] font-medium">{order.items?.map(i => i.product_name).join(', ') || 'Order'}</p>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">
                      {order.items?.length || 0} {lang === 'fr' ? 'article(s)' : 'item(s)'} · {format(new Date(order.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#C9A96E]">€{order.total?.toFixed(2)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded tracking-wider uppercase ${ORDER_STATUS_COLORS[order.status] || 'text-[#8A8A8A]'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Access Tab */}
        {activeTab === 'access' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xs text-[#8A8A8A] tracking-widest uppercase mb-4 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Mes accès' : 'My access'}
              </h2>
              {permissions ? (
                <div className="space-y-2">
                  {[
                    { key: 'projects_access', label: 'Projects' },
                    { key: 'events_access', label: 'Events' },
                    { key: 'communication_access', label: 'Communication Plan' },
                    { key: 'souq_access', label: 'Souq' },
                    { key: 'crm_access', label: 'CRM' },
                  ].map(m => {
                    const level = permissions[m.key] || 'no_access';
                    if (level === 'no_access') return null;
                    return (
                      <div key={m.key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-sm text-[#F5F0EB]">{m.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded tracking-wider uppercase text-[#C9A96E] bg-[#C9A96E]/10">
                          {level.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                  {!['projects_access', 'events_access', 'communication_access', 'souq_access', 'crm_access'].some(k => permissions[k] && permissions[k] !== 'no_access') && (
                    <p className="text-sm text-[#8A8A8A]">
                      {lang === 'fr' ? 'Aucun module ERP accessible pour l\'instant.' : 'No ERP module access currently assigned.'}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#8A8A8A]">
                  {lang === 'fr' ? 'Aucun profil d\'accès trouvé.' : 'No access profile found.'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Delete Account Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pb-16">
        <div className="glass-card rounded-xl p-6 border border-red-500/10">
          <h2 className="text-xs text-red-400/70 tracking-widest uppercase mb-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            {lang === 'fr' ? 'Zone dangereuse' : 'Danger zone'}
          </h2>
          <p className="text-xs text-[#8A8A8A] mb-4">
            {lang === 'fr'
              ? 'La suppression de votre compte est irréversible. Toutes vos données seront perdues.'
              : 'Deleting your account is irreversible. All your data will be permanently lost.'}
          </p>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-all select-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'Supprimer mon compte' : 'Delete my account'}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-red-400">
                {lang === 'fr'
                  ? `Tapez votre email « ${user.email} » pour confirmer :`
                  : `Type your email « ${user.email} » to confirm:`}
              </p>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder={user.email}
                className="w-full bg-[#0A0A0A] border border-red-500/30 text-[#F5F0EB] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500/60"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-[#8A8A8A] text-xs hover:border-white/20 transition-all select-none"
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  disabled={deleteInput !== user.email}
                  onClick={() => {
                    base44.auth.logout('/');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs border border-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-500/30 transition-all select-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {lang === 'fr' ? 'Confirmer la suppression' : 'Confirm deletion'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}