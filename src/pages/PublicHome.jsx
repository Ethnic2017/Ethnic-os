import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ArrowRight, Ticket, ShoppingBag, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicFooter from '../components/public/PublicFooter';

// ─── Ethnic logo SVG (diamond motif) ─────────────────────────────────────────
function EthnicLogoSVG({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="4" width="64" height="64" transform="rotate(45 50 50)" stroke="#C9A96E" strokeWidth="2" fill="none"/>
      <rect x="50" y="18" width="45" height="45" transform="rotate(45 50 50)" stroke="#C9A96E" strokeWidth="1" fill="none"/>
      <rect x="50" y="34" width="23" height="23" transform="rotate(45 50 50)" fill="#C9A96E"/>
      <circle cx="50" cy="15" r="3" fill="#B34233"/>
      <circle cx="85" cy="50" r="3" fill="#B34233"/>
      <circle cx="50" cy="85" r="3" fill="#B34233"/>
      <circle cx="15" cy="50" r="3" fill="#B34233"/>
    </svg>
  );
}

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'IDENTITY', page: 'PublicAbout' },
  { label: 'ARTISTS', page: 'PublicAbout' },
  { label: 'EVENTS', page: 'PublicEvents' },
  { label: 'JOIN', page: 'JoinCommunity' },
  { label: 'CONTACT', page: 'PublicContact' },
  { label: 'WATCH', page: 'PublicWatch' },
];

// ─── Split hero: video left + nav right ───────────────────────────────────────
function HeroSplit({ lang }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative w-full h-screen flex overflow-hidden">

      {/* LEFT: Video / image */}
      <div className="relative w-full lg:w-1/2 h-full overflow-hidden">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="https://i0.wp.com/ethnic-community.org/wp-content/uploads/2025/05/9-16-transp-1.png?fit=540%2C960&ssl=1"
        >
          <source src="https://ethnic-community.org/wp-content/uploads/2025/09/ethnic-community-reel.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />

        {/* Logo top-left */}
        <div className="absolute top-6 left-6 z-20 flex flex-col items-center gap-1">
          <EthnicLogoSVG size={42} />
          <span className="text-[#C9A96E] text-[8px] tracking-[0.25em] uppercase font-light">ETHNIC</span>
        </div>

        {/* Hamburger top-right (mobile only) */}
        <button
          className="lg:hidden absolute top-6 right-6 z-20 text-[#C9A96E]"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col items-center justify-center"
            >
              <button className="absolute top-6 right-6 text-[#8A8A8A]" onClick={() => setMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
              <nav className="flex flex-col items-center gap-8">
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.label}
                    to={createPageUrl(link.page)}
                    onClick={() => setMenuOpen(false)}
                    className="font-display text-3xl text-[#8A8A8A] hover:text-[#F5F0EB] tracking-[0.2em] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: Nav panel (desktop) */}
      <div className="hidden lg:flex w-1/2 h-full bg-[#0A0A0A] flex-col items-center justify-center relative">
        {/* Hamburger icon top-right */}
        <div className="absolute top-6 right-8 flex gap-1">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-0.5 h-5 bg-[#8A8A8A]" />
          ))}
        </div>

        {/* Vertical nav */}
        <nav className="flex flex-col items-center gap-7">
          {NAV_LINKS.map((link, i) => (
            <motion.div
              key={link.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
            >
              <Link
                to={createPageUrl(link.page)}
                className="font-display text-3xl xl:text-4xl text-[#6B6B6B] hover:text-[#F5F0EB] tracking-[0.18em] transition-colors duration-300 uppercase"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </nav>
      </div>
    </section>
  );
}

// ─── Events section ───────────────────────────────────────────────────────────
function EventsSection({ events, lang }) {
  const upcoming = events.filter(e => new Date(e.date) >= new Date()).slice(0, 3);
  if (upcoming.length === 0) return null;

  return (
    <section className="py-20 px-6 sm:px-12 max-w-5xl mx-auto">
      <h2 className="font-display text-xs tracking-[0.4em] text-[#8A8A8A] uppercase mb-12">
        {lang === 'fr' ? 'Prochains Événements' : 'Next Events'}
      </h2>
      <div className="space-y-0">
        {upcoming.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group border-t border-white/5 last:border-b hover:border-[#C9A96E]/20 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-8">
              {/* Image */}
              {event.cover_image && (
                <div className="flex-shrink-0 w-24 h-24 overflow-hidden">
                  <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-100" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-display text-xl sm:text-2xl text-[#F5F0EB] group-hover:text-[#C9A96E] transition-colors mb-2">
                  {lang === 'fr' && event.title_fr ? event.title_fr : event.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-xs text-[#555] tracking-widest uppercase">
                  <span>{format(new Date(event.date), 'EEEE, MMMM d')}</span>
                  {event.city && <span>{event.city}</span>}
                </div>
                {event.lineup?.length > 0 && (
                  <p className="text-xs text-[#C9A96E]/50 mt-2 tracking-wider">{event.lineup.slice(0, 4).join(' · ')}</p>
                )}
              </div>

              {event.ticket_link && (
                <a
                  href={event.ticket_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-xs tracking-[0.2em] uppercase text-[#8A8A8A] hover:text-[#C9A96E] border border-white/10 hover:border-[#C9A96E]/30 px-5 py-2.5 transition-all"
                >
                  Tickets
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-10">
        <Link to={createPageUrl('PublicEvents')} className="text-xs tracking-[0.3em] uppercase text-[#555] hover:text-[#C9A96E] transition-colors inline-flex items-center gap-2">
          {lang === 'fr' ? 'Voir tous les événements' : 'View all events'} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}

// ─── Artists section ──────────────────────────────────────────────────────────
const STATIC_ARTISTS = [
  { name: 'FREDERIKA', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-3.png?fit=938%2C938&ssl=1' },
  { name: 'NEJMA', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-10.png?fit=938%2C938&ssl=1' },
  { name: 'ANAMASTË', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-2.png?fit=938%2C938&ssl=1' },
  { name: 'NAÏM', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-9.png?fit=938%2C938&ssl=1' },
  { name: 'Ahmed Bar', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-14.png?fit=938%2C938&ssl=1' },
  { name: 'MILAS', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-8.png?fit=938%2C938&ssl=1' },
  { name: 'HUMANKAN', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-4.png?fit=938%2C938&ssl=1' },
  { name: 'KADANCE', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-6.png?fit=938%2C938&ssl=1' },
  { name: 'PAJARITO MUNDO', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-11.png?fit=938%2C938&ssl=1' },
  { name: 'JEAN MALBEZIN', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-5.png?fit=938%2C938&ssl=1' },
  { name: 'MOVY MOVE', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-1.png?fit=938%2C938&ssl=1' },
  { name: 'ZAJAL', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-13.png?fit=938%2C938&ssl=1' },
  { name: 'Valdo', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-12.png?fit=938%2C938&ssl=1' },
  { name: 'KIMOTO', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-7.png?fit=938%2C938&ssl=1' },
];

const PARTNERS = [
  { name: 'Cosmo Vision', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/02/Cosmo-vision-2.jpg?fit=150%2C150&ssl=1' },
  { name: 'Ritmos del Sur', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/02/ritmos-del-sur-2.jpg?fit=150%2C150&ssl=1' },
  { name: 'Ville de Paris', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/02/Ville-de-Paris.jpg?fit=150%2C150&ssl=1' },
  { name: 'Goethe Institut', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/02/goethe-institut.jpg?fit=150%2C150&ssl=1' },
  { name: 'Creative Europe', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/02/creative-europe.jpg?fit=150%2C150&ssl=1' },
  { name: 'Entente Nocturne', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/02/entente-nocturne-2026.jpg?fit=150%2C150&ssl=1' },
  { name: 'Horde', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/02/horde.jpg?fit=150%2C150&ssl=1' },
  { name: 'Paléo Festival', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/02/paleo-2025.jpg?fit=150%2C150&ssl=1' },
  { name: 'Jiboiana', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/02/jiboiana.jpg?fit=150%2C150&ssl=1' },
];

export default function PublicHome() {
  const { lang } = useLanguage();

  const { data: events = [] } = useQuery({
    queryKey: ['public-events-home'],
    queryFn: () => base44.entities.Event.filter({ status: 'published' }, '-date', 10),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['public-products-home'],
    queryFn: () => base44.entities.Product.filter({ status: 'published' }, '-created_date', 4),
  });

  const { data: artistContacts = [] } = useQuery({
    queryKey: ['public-artists-ethnic'],
    queryFn: () => base44.entities.Contact.filter({ tags: { $in: ['artist_ethnic'] } }, 'name', 100),
  });

  // Fusionner : contacts dynamiques d'abord, puis statiques pour ceux non couverts
  const dynamicNames = new Set(artistContacts.map(c => c.name.toUpperCase()));
  const staticFallbacks = STATIC_ARTISTS.filter(a => !dynamicNames.has(a.name.toUpperCase()));
  const allArtists = [
    ...artistContacts.map(c => ({ name: c.name, img: c.cover_image || null, isDynamic: true })),
    ...staticFallbacks.map(a => ({ ...a, isDynamic: false })),
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>

      {/* ══ HERO: split screen ══ */}
      <HeroSplit lang={lang} />

      {/* ══ NEXT EVENTS ══ */}
      <EventsSection events={events} lang={lang} />

      {/* ══ ARTISTS GRID ══ */}
      <section className="py-20 px-6 sm:px-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-xs tracking-[0.4em] text-[#8A8A8A] uppercase mb-12">
            {lang === 'fr' ? 'Nos Artistes' : 'Our Artists'}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-7 gap-6">
            {allArtists.map((artist, i) => (
              <motion.div
                key={artist.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="group text-center"
              >
                <div className="aspect-square overflow-hidden mb-2 grayscale group-hover:grayscale-0 transition-all duration-500 bg-[#111]">
                  {artist.img ? (
                    <img src={artist.img} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">
                      {artist.name[0]}
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-[#444] group-hover:text-[#8A8A8A] transition-colors tracking-[0.15em] uppercase leading-tight">
                  {artist.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PARTNERS ══ */}
      <section className="py-20 px-6 sm:px-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-xs tracking-[0.4em] text-[#8A8A8A] uppercase mb-12 text-center">
            {lang === 'fr' ? 'Ils nous font confiance' : 'They trust us'}
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
            {PARTNERS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group"
              >
                <img
                  src={p.img}
                  alt={p.name}
                  className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-full opacity-30 hover:opacity-80 transition-opacity duration-500 grayscale hover:grayscale-0"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRODUCTS (if any) ══ */}
      {products.length > 0 && (
        <section className="py-20 px-6 sm:px-12 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <h2 className="font-display text-xs tracking-[0.4em] text-[#8A8A8A] uppercase">
                {lang === 'fr' ? 'Boutique' : 'Shop'}
              </h2>
              <Link to={createPageUrl('PublicSouq')} className="text-xs text-[#555] tracking-widest uppercase hover:text-[#C9A96E] transition-colors">
                {lang === 'fr' ? 'Voir tout →' : 'View all →'}
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group cursor-pointer"
                  onClick={() => window.location.href = createPageUrl('PublicSouq')}
                >
                  <div className="aspect-square overflow-hidden mb-3 bg-[#111]">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-[#333]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#8A8A8A] group-hover:text-[#F5F0EB] transition-colors truncate tracking-wider">
                    {lang === 'fr' && product.name_fr ? product.name_fr : product.name}
                  </p>
                  <p className="text-xs text-[#C9A96E] mt-0.5">€{product.price}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ NEWSLETTER CTA ══ */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-md mx-auto text-center">
          <h2 className="font-display text-xs tracking-[0.4em] text-[#8A8A8A] uppercase mb-8">
            {lang === 'fr' ? 'Notre newsletter' : 'Our newsletter'}
          </h2>
          <Link
            to={createPageUrl('JoinCommunity')}
            className="inline-flex items-center gap-3 px-8 py-3 border border-[#C9A96E]/30 text-[#C9A96E] text-xs tracking-[0.3em] uppercase hover:bg-[#C9A96E] hover:text-[#0A0A0A] transition-all"
          >
            {lang === 'fr' ? "S'abonner" : 'Subscribe'}
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}