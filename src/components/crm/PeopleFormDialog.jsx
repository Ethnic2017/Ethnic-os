import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { SUGGESTED_TAGS } from '@/pages/CRM';

const EMPTY = {
  name: '', company_id: '', company_name: '', job_title: '',
  pipeline: 'lead', email: '', phone: '', website: '',
  city: '', country: '', tags: [], notes: '', social_links: []
};

const PIPELINE = [
  { value: 'lead', label: 'Lead' },
  { value: 'actif', label: 'Actif' },
  { value: 'partenaire', label: 'Partenaire' },
  { value: 'inactif', label: 'Inactif' },
];

export default function PeopleFormDialog({ open, onOpenChange, person, companies = [], onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(person ? { ...EMPTY, ...person } : EMPTY);
    setTagInput('');
    setErrors({});
  }, [person, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleTag = (tag) => {
    const tags = form.tags || [];
    if (tags.includes(tag)) {
      set('tags', tags.filter(t => t !== tag));
    } else {
      set('tags', [...tags, tag]);
    }
  };

  const addCustomTag = () => {
    const t = tagInput.trim();
    if (t && !(form.tags || []).includes(t)) {
      set('tags', [...(form.tags || []), t]);
    }
    setTagInput('');
  };

  const handleCompanyChange = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    set('company_id', companyId);
    set('company_name', company ? company.name : '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{person ? 'Modifier le contact' : 'Nouveau contact'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={form.name} onChange={e => { set('name', e.target.value); if (e.target.value.trim()) setErrors(er => ({...er, name: undefined})); }} className={`bg-[#0A0A0A] border-white/10 ${errors.name ? 'border-red-400' : ''}`} placeholder="Prénom Nom" />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Company link */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <select
                value={form.company_id || ''}
                onChange={e => handleCompanyChange(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none"
              >
                <option value="">— Aucune —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Poste / Rôle</Label>
              <Input value={form.job_title || ''} onChange={e => set('job_title', e.target.value)} className="bg-[#0A0A0A] border-white/10" placeholder="Directeur, Programmateur..." />
            </div>
          </div>

          {/* Pipeline */}
          <div className="space-y-2">
            <Label>Pipeline</Label>
            <div className="flex gap-2">
              {PIPELINE.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('pipeline', s.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    form.pipeline === s.value
                      ? 'bg-[#C9A96E] text-[#0A0A0A] border-[#C9A96E]'
                      : 'border-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUGGESTED_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    (form.tags || []).includes(tag)
                      ? 'bg-[#C9A96E] text-[#0A0A0A] border-[#C9A96E]'
                      : 'border-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                className="bg-[#0A0A0A] border-white/10"
                placeholder="Tag personnalisé + Entrée"
              />
              <Button type="button" onClick={addCustomTag} variant="outline" className="border-white/10 text-[#8A8A8A]">+</Button>
            </div>
            {/* Custom tags not in SUGGESTED_TAGS */}
            {(form.tags || []).filter(t => !SUGGESTED_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(form.tags || []).filter(t => !SUGGESTED_TAGS.includes(t)).map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] text-xs text-[#F5F0EB]">
                    {tag}
                    <button onClick={() => set('tags', (form.tags || []).filter(t => t !== tag))} className="text-[#8A8A8A] hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email || ''} onChange={e => { set('email', e.target.value); setErrors(er => ({...er, email: undefined})); }} className={`bg-[#0A0A0A] border-white/10 ${errors.email ? 'border-red-400' : ''}`} />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} className="bg-[#0A0A0A] border-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input value={form.city || ''} onChange={e => set('city', e.target.value)} className="bg-[#0A0A0A] border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input value={form.country || ''} onChange={e => set('country', e.target.value)} className="bg-[#0A0A0A] border-white/10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Site web</Label>
            <Input value={form.website || ''} onChange={e => set('website', e.target.value)} className="bg-[#0A0A0A] border-white/10" placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea
              value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-sm text-[#F5F0EB] placeholder:text-[#8A8A8A] focus:outline-none resize-none"
              placeholder="Informations complémentaires..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-[#8A8A8A]">Annuler</Button>
          <Button onClick={() => {
            const errs = {};
            if (!form.name.trim()) errs.name = 'Le nom est obligatoire.';
            if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide.';
            if (Object.keys(errs).length > 0) { setErrors(errs); return; }
            onSave(form);
          }} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}