import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TopBar from '../components/admin/TopBar';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Globe, Calendar, ShoppingBag, Users, Image, Play, Mail, ExternalLink,
  ArrowRight, Eye, CheckCircle2, AlertCircle, Edit3, FileText
} from 'lucide-react';

const PUBLIC_PAGES = [
  {
    key: 'home',
    label: 'Page d\'accueil',
    page: 'PublicHome',
    adminPage: null,
    icon: Globe,
    desc: 'Hero, piliers, prochains events, artistes, partenaires',
    feeds: ['events', 'products'],
  },
  {
    key: 'events',
    label: 'Événements',
    page: 'PublicEvents',
    adminPage: 'Events',
    icon: Calendar,
    desc: 'Events publiés et passés depuis la base Events',
    feeds: ['events'],
  },
  {
    key: 'about',
    label: 'Notre identité',
    page: 'PublicAbout',
    adminPage: null,
    icon: Users,
    desc: 'Artistes, équipe, disciplines (contenu statique)',
    feeds: [],
  },
  {
    key: 'gallery',
    label: 'Galerie',
    page: 'PublicGallery',
    adminPage: 'Events',
    icon: Image,
    desc: 'Photos extraites automatiquement des events (cover + gallery)',
    feeds: ['events'],
  },
  {
    key: 'watch',
    label: 'Vidéos / Watch',
    page: 'PublicWatch',
    adminPage: null,
    icon: Play,
    desc: 'Sessions Kiosk et aftermovies (contenu statique)',
    feeds: [],
  },
  {
    key: 'souq',
    label: 'Souq (Boutique)',
    page: 'PublicSouq',
    adminPage: 'Products',
    icon: ShoppingBag,
    desc: 'Produits avec statut "published" depuis la base Produits',
    feeds: ['products'],
  },
  {
    key: 'contact',
    label: 'Contact',
    page: 'PublicContact',
    adminPage: 'CRM',
    icon: Mail,
    desc: 'Formulaire de contact → crée une entrée dans le CRM',
    feeds: ['crm'],
  },
  {
    key: 'join',
    label: 'Rejoindre',
    page: 'JoinCommunity',
    adminPage: 'Community',
    icon: Users,
    desc: 'Formulaire d\'adhésion → crée un membre Community (statut pending)',
    feeds: ['community'],
  },
];

export default function WebsiteManager() {
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-date', 100),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
  });
  const { data: members = [] } = useQuery({
    queryKey: ['community'],
    queryFn: () => base44.entities.CommunityMember.list('-created_date', 100),
  });
  const { data: contents = [] } = useQuery({
    queryKey: ['content'],
    queryFn: () => base44.entities.ContentItem.list('-created_date', 100),
  });

  const publishedEvents = events.filter(e => e.status === 'published');
  const upcomingEvents = publishedEvents.filter(e => new Date(e.date) >= new Date());
  const publishedProducts = products.filter(p => p.status === 'published');
  const pendingMembers = members.filter(m => m.status === 'pending');
  const publishedContent = contents.filter(c => c.status === 'published');
  const galleryImages = events.filter(e => e.cover_image || e.gallery?.length > 0);

  const dataMap = {
    events: { count: publishedEvents.length, label: `${publishedEvents.length} event(s) publiés`, link: 'Events', color: 'text-green-400' },
    products: { count: publishedProducts.length, label: `${publishedProducts.length} produit(s) visibles`, link: 'Products', color: 'text-blue-400' },
    community: { count: pendingMembers.length, label: `${pendingMembers.length} membre(s) en attente`, link: 'Community', color: pendingMembers.length > 0 ? 'text-yellow-400' : 'text-green-400' },
    crm: { count: 0, label: 'Messages → CRM', link: 'CRM', color: 'text-[#C9A96E]' },
  };

  return (
    <div className="max-w-6xl mx-auto">
      <TopBar title="Gestionnaire du Site Public" />

      {/* Alertes */}
      {pendingMembers.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-yellow-300">
              {pendingMembers.length} nouveau(x) membre(s) en attente de validation sur le site public
            </span>
          </div>
          <Link to={createPageUrl('Community')} className="text-yellow-400 text-xs flex items-center gap-1 hover:underline">
            Valider <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-xl p-4">
          <div className="text-2xl font-display text-[#C9A96E]">{upcomingEvents.length}</div>
          <div className="text-xs text-[#8A8A8A] mt-1">Events à venir sur le site</div>
          <Link to={createPageUrl('Events')} className="text-[10px] text-[#C9A96E] mt-2 flex items-center gap-0.5 hover:underline">Gérer <ArrowRight className="w-2.5 h-2.5" /></Link>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-2xl font-display text-[#C9A96E]">{publishedProducts.length}</div>
          <div className="text-xs text-[#8A8A8A] mt-1">Produits visibles dans le Souq</div>
          <Link to={createPageUrl('Products')} className="text-[10px] text-[#C9A96E] mt-2 flex items-center gap-0.5 hover:underline">Gérer <ArrowRight className="w-2.5 h-2.5" /></Link>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-2xl font-display text-[#C9A96E]">{galleryImages.length}</div>
          <div className="text-xs text-[#8A8A8A] mt-1">Events avec images (Galerie)</div>
          <Link to={createPageUrl('Events')} className="text-[10px] text-[#C9A96E] mt-2 flex items-center gap-0.5 hover:underline">Ajouter images <ArrowRight className="w-2.5 h-2.5" /></Link>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className={`text-2xl font-display ${pendingMembers.length > 0 ? 'text-yellow-400' : 'text-[#C9A96E]'}`}>{pendingMembers.length}</div>
          <div className="text-xs text-[#8A8A8A] mt-1">Membres en attente</div>
          <Link to={createPageUrl('Community')} className="text-[10px] text-[#C9A96E] mt-2 flex items-center gap-0.5 hover:underline">Valider <ArrowRight className="w-2.5 h-2.5" /></Link>
        </div>
      </div>

      {/* Pages du site */}
      <h2 className="font-display text-lg text-[#F5F0EB] mb-4 tracking-wide">Pages du site public</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {PUBLIC_PAGES.map(page => {
          const Icon = page.icon;
          return (
            <div key={page.key} className="glass-card rounded-xl p-5 hover:border-[#C9A96E]/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#C9A96E]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#F5F0EB]">{page.label}</h3>
                    <p className="text-xs text-[#8A8A8A] mt-0.5 max-w-xs">{page.desc}</p>
                  </div>
                </div>
              </div>

              {/* Feed status */}
              {page.feeds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {page.feeds.map(feed => {
                    const d = dataMap[feed];
                    if (!d) return null;
                    return (
                      <span key={feed} className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 ${d.color}`}>
                        {d.label}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  to={createPageUrl(page.page)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 text-[#8A8A8A] rounded-lg hover:text-[#F5F0EB] hover:bg-white/10 transition-all"
                >
                  <Eye className="w-3 h-3" /> Voir la page
                </Link>
                {page.adminPage && (
                  <Link
                    to={createPageUrl(page.adminPage)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#C9A96E]/10 text-[#C9A96E] rounded-lg hover:bg-[#C9A96E]/20 transition-all"
                  >
                    <Edit3 className="w-3 h-3" /> Gérer le contenu
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flux de données */}
      <h2 className="font-display text-lg text-[#F5F0EB] mt-10 mb-4 tracking-wide">Comment l'ERP alimente le site</h2>
      <div className="glass-card rounded-xl p-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          {[
            { from: 'ERP Events', arrow: '→', to: 'Site : Events + Home + Galerie', desc: 'Events avec statut "published" apparaissent automatiquement sur le site.' },
            { from: 'ERP Produits', arrow: '→', to: 'Site : Souq', desc: 'Produits avec statut "published" sont visibles dans la boutique en ligne.' },
            { from: 'Site Contact', arrow: '→', to: 'ERP CRM', desc: 'Chaque message du formulaire de contact crée une entrée dans le CRM.' },
            { from: 'Site Rejoindre', arrow: '→', to: 'ERP Community', desc: 'Chaque inscription crée un membre "pending" dans la section Community.' },
            { from: 'ERP Events (gallery)', arrow: '→', to: 'Site : Galerie', desc: 'Les photos ajoutées dans les events (cover + gallery) alimentent la galerie.' },
            { from: 'ERP Content', arrow: '→', to: 'Site (futur)', desc: 'Les articles/annonces avec statut "published" pourront être affichés sur le site.' },
          ].map((flow, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#F5F0EB] bg-white/5 px-2 py-1 rounded">{flow.from}</span>
                <span className="text-[#C9A96E] text-xs">{flow.arrow}</span>
                <span className="text-xs font-medium text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-1 rounded">{flow.to}</span>
              </div>
              <p className="text-xs text-[#8A8A8A] leading-relaxed">{flow.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}