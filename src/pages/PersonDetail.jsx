import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Pencil, Trash2,
  ExternalLink, Tag, StickyNote, User, Building2, Link2
} from 'lucide-react';
import PeopleFormDialog from '../components/crm/PeopleFormDialog';

const PIPELINE_COLORS = {
  lead: 'bg-[#8A8A8A]/20 text-[#8A8A8A]',
  contacted: 'bg-blue-500/20 text-blue-400',
  discussion: 'bg-yellow-500/20 text-yellow-400',
  signed: 'bg-green-500/20 text-green-400',
};
const PIPELINE_LABELS = { lead: 'Lead', contacted: 'Contacté', discussion: 'En discussion', signed: 'Signé' };
const CATEGORY_LABELS = {
  festival: 'Festival', venue: 'Lieu', artist: 'Artiste', partner: 'Partenaire',
  client: 'Client', media: 'Média', other: 'Autre'
};

export default function PersonDetail() {
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const personId = params.get('id');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: person, isLoading } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => base44.entities.People.filter({ id: personId }, '-updated_date', 1).then(r => r[0]),
    enabled: !!personId,
  });

  const handleSave = async (data) => {
    await base44.entities.People.update(personId, data);
    queryClient.invalidateQueries({ queryKey: ['person', personId] });
    queryClient.invalidateQueries({ queryKey: ['people'] });
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce contact ?')) return;
    await base44.entities.People.delete(personId);
    window.location.href = createPageUrl('CRM');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-[#8A8A8A] text-sm">Chargement...</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Link to={createPageUrl('CRM')} className="text-[#C9A96E] text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour CRM
        </Link>
        <p className="text-[#8A8A8A]">Contact introuvable.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link to={createPageUrl('CRM')} className="text-[#8A8A8A] hover:text-[#F5F0EB] text-sm flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour CRM
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="border-white/10 text-[#8A8A8A] hover:text-[#F5F0EB] bg-transparent"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 bg-transparent"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Supprimer
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-2xl text-[#C9A96E]">{person.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl text-[#F5F0EB] tracking-wide">{person.name}</h1>
            {person.contact_person && (
              <p className="text-sm text-[#8A8A8A] mt-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {person.contact_person}{person.contact_role ? ` — ${person.contact_role}` : ''}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-[#C9A96E] border border-[#C9A96E]/20">
                {CATEGORY_LABELS[person.category] || person.category}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PIPELINE_COLORS[person.pipeline]}`}>
                {PIPELINE_LABELS[person.pipeline] || person.pipeline}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Contact info */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xs text-[#8A8A8A] uppercase tracking-widest mb-4">Coordonnées</h2>
          <div className="space-y-3">
            {(person.city || person.country) && (
              <div className="flex items-center gap-3 text-sm text-[#F5F0EB]">
                <MapPin className="w-4 h-4 text-[#C9A96E] flex-shrink-0" />
                {[person.city, person.country].filter(Boolean).join(', ')}
              </div>
            )}
            {person.email && (
              <a href={`mailto:${person.email}`} className="flex items-center gap-3 text-sm text-[#F5F0EB] hover:text-[#C9A96E] transition-colors">
                <Mail className="w-4 h-4 text-[#C9A96E] flex-shrink-0" />
                {person.email}
              </a>
            )}
            {person.phone && (
              <a href={`tel:${person.phone}`} className="flex items-center gap-3 text-sm text-[#F5F0EB] hover:text-[#C9A96E] transition-colors">
                <Phone className="w-4 h-4 text-[#C9A96E] flex-shrink-0" />
                {person.phone}
              </a>
            )}
            {person.website && (
              <a href={person.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-[#F5F0EB] hover:text-[#C9A96E] transition-colors">
                <Globe className="w-4 h-4 text-[#C9A96E] flex-shrink-0" />
                {person.website.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-3 h-3 text-[#8A8A8A]" />
              </a>
            )}
            {(!person.email && !person.phone && !person.website && !person.city) && (
              <p className="text-xs text-[#555]">Aucune coordonnée renseignée</p>
            )}
          </div>
        </div>

        {/* Tags + social */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xs text-[#8A8A8A] uppercase tracking-widest mb-4">Tags & Réseaux</h2>
          {(person.tags || []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {person.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-[#8A8A8A] border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#555] mb-4">Aucun tag</p>
          )}

          {(person.social_links || []).length > 0 && (
            <div className="space-y-2 mt-2">
              {person.social_links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[#8A8A8A] hover:text-[#C9A96E] transition-colors truncate">
                  <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {link.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {person.notes && (
          <div className="glass-card rounded-xl p-6 sm:col-span-2">
            <h2 className="text-xs text-[#8A8A8A] uppercase tracking-widest mb-4 flex items-center gap-2">
              <StickyNote className="w-3.5 h-3.5" /> Notes
            </h2>
            <p className="text-sm text-[#F5F0EB] leading-relaxed whitespace-pre-wrap">{person.notes}</p>
          </div>
        )}

        {/* Quick actions */}
        <div className="glass-card rounded-xl p-6 sm:col-span-2">
          <h2 className="text-xs text-[#8A8A8A] uppercase tracking-widest mb-4">Actions rapides</h2>
          <div className="flex flex-wrap gap-3">
            {person.email && (
              <a href={`mailto:${person.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A96E]/10 text-[#C9A96E] rounded-lg text-sm hover:bg-[#C9A96E]/20 transition-all">
                <Mail className="w-4 h-4" /> Envoyer un email
              </a>
            )}
            {person.phone && (
              <a href={`tel:${person.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-[#F5F0EB] rounded-lg text-sm hover:bg-white/10 transition-all">
                <Phone className="w-4 h-4" /> Appeler
              </a>
            )}
            {person.website && (
              <a href={person.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-[#F5F0EB] rounded-lg text-sm hover:bg-white/10 transition-all">
                <Globe className="w-4 h-4" /> Visiter le site
              </a>
            )}
          </div>
        </div>
      </div>

      <PeopleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        person={person}
        onSave={handleSave}
      />
    </div>
  );
}