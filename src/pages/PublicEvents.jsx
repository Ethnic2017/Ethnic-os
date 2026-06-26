import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import PublicNav from '../components/public/PublicNav';
import PublicFooter from '../components/public/PublicFooter';
import { format } from 'date-fns';
import { Calendar, MapPin, Ticket, ExternalLink, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// ─── Diamond ornament ──────────────────────────────────────────────────────
function DiamondDecor({ size = 8, opacity = 0.5 }) {
  return (
    <div
      className="flex-shrink-0 bg-[#C9A96E]"
      style={{ width: size, height: size, opacity, transform: 'rotate(45deg)' }}
    />
  );
}

// ─── Diamond clipped image ─────────────────────────────────────────────────
function DiamondImage({ src, alt, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 border border-[#C9A96E]/30"
        style={{ transform: 'rotate(45deg) scale(0.72)', transformOrigin: 'center' }}
      />
      <div
        className="overflow-hidden w-full h-full"
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover scale-150 group-hover:scale-[1.65] transition-transform duration-700"
        />
      </div>
    </div>
  );
}

// ─── Ethnic section divider ────────────────────────────────────────────────
function EthnicDivider() {
  return (
    <div className="flex items-center gap-3 my-10">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A96E]/20" />
      <DiamondDecor size={5} opacity={0.5} />
      <DiamondDecor size={8} opacity={0.8} />
      <DiamondDecor size={5} opacity={0.5} />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A96E]/20" />
    </div>
  );
}

// ─── Single event row ──────────────────────────────────────────────────────
function EventRow({ event, index, lang }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="group border-t border-white/5 hover:border-[#C9A96E]/20 transition-colors last:border-b"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 py-8 px-2">
        {/* Diamond image */}
        {event.cover_image && (
          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative">
            <DiamondImage src={event.cover_image} alt={event.title} className="w-full h-full" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl sm:text-2xl text-[#F5F0EB] group-hover:text-[#C9A96E] transition-colors mb-2 leading-snug">
            {lang === 'fr' && event.title_fr ? event.title_fr : event.title}
          </h3>
          <div className="flex flex-wrap gap-4 text-xs text-[#8A8A8A]">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rotate-45 bg-[#C9A96E] inline-block flex-shrink-0" />
              {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
            </span>
            {event.city && (
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rotate-45 bg-[#C9A96E] inline-block flex-shrink-0" />
                {event.location ? `${event.location}, ` : ''}{event.city}
                {event.country && event.country !== 'France' ? `, ${event.country}` : ''}
              </span>
            )}
          </div>
          {event.lineup?.length > 0 && (
            <p className="text-xs text-[#C9A96E]/60 mt-2 tracking-wider">
              {event.lineup.join(' · ')}
            </p>
          )}
          {event.description && (
            <p className="text-xs text-[#666] mt-2 line-clamp-2 leading-relaxed max-w-lg">
              {lang === 'fr' && event.description_fr ? event.description_fr : event.description}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
          {event.ticket_link && (
            <a
              href={event.ticket_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#C9A96E] text-[#0A0A0A] rounded-full text-xs tracking-widest uppercase font-medium hover:bg-[#E0CBA8] transition-all"
            >
              <Ticket className="w-3 h-3" /> Tickets
            </a>
          )}
          {event.aftermovie_url && (
            <a
              href={event.aftermovie_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-white/10 text-[#8A8A8A] rounded-full text-xs tracking-widest uppercase hover:border-[#C9A96E]/30 hover:text-[#C9A96E] transition-all"
            >
              <ExternalLink className="w-3 h-3" /> Aftermovie
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Past event card (grid) ────────────────────────────────────────────────
function PastEventCard({ event, index, lang }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      className="group"
    >
      <div className="relative aspect-video overflow-hidden mb-4 border border-white/5 group-hover:border-[#C9A96E]/20 transition-colors">
        {event.cover_image ? (
          <img src={event.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#C9A96E]/10 to-[#1A1A1A]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-transparent to-transparent" />

        {/* Diamond corner deco */}
        <div className="absolute top-3 right-3 w-4 h-4 border border-[#C9A96E]/30 rotate-45" />

        {event.aftermovie_url && (
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] text-[#C9A96E]/70 tracking-widest uppercase">▶ Aftermovie</span>
          </div>
        )}
      </div>
      <h3 className="font-display text-base text-[#8A8A8A] group-hover:text-[#F5F0EB] transition-colors mb-1">
        {lang === 'fr' && event.title_fr ? event.title_fr : event.title}
      </h3>
      <p className="text-[10px] text-[#555] tracking-wider">
        {format(new Date(event.date), 'yyyy')}
        {event.city ? ` · ${event.city}` : ''}
      </p>
    </motion.div>
  );
}

export default function PublicEvents() {
  const { t, lang } = useLanguage();

  const { data: events = [] } = useQuery({
    queryKey: ['public-events-all'],
    queryFn: () => base44.entities.Event.filter({ status: 'published' }, '-date', 100),
  });

  const { data: pastEvents = [] } = useQuery({
    queryKey: ['public-events-past'],
    queryFn: () => base44.entities.Event.filter({ status: 'past' }, '-date', 50),
  });

  const upcoming = events.filter(e => new Date(e.date) >= new Date());
  const past = [...events.filter(e => new Date(e.date) < new Date()), ...pastEvents];

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ scrollBehavior: 'smooth' }}>
      <PublicNav />

      {/* ── Page header ─────────────────────────────── */}
      <div className="pt-28 pb-6 px-4 sm:px-8 max-w-6xl mx-auto">
        <p className="text-[#C9A96E] text-[10px] tracking-[0.4em] uppercase mb-3">◆ Agenda</p>
        <h1 className="font-display text-4xl sm:text-6xl text-[#F5F0EB] tracking-wide">
          {t('next_events')}
        </h1>
      </div>

      {/* ── Upcoming events ──────────────────────────── */}
      <section className="px-4 sm:px-8 pb-16 max-w-6xl mx-auto">
        {upcoming.length === 0 && (
          <p className="text-[#8A8A8A] text-sm tracking-widest uppercase py-12">
            {lang === 'fr' ? 'Aucun événement à venir pour l\'instant.' : 'No upcoming events at the moment.'}
          </p>
        )}
        <div>
          {upcoming.map((event, i) => (
            <EventRow key={event.id} event={event} index={i} lang={lang} />
          ))}
        </div>
      </section>

      {/* ── Past events ──────────────────────────────── */}
      {past.length > 0 && (
        <section className="px-4 sm:px-8 pb-24 max-w-6xl mx-auto border-t border-white/5">
          <EthnicDivider />

          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[#C9A96E] text-[10px] tracking-[0.4em] uppercase mb-2">◆ Archives</p>
              <h2 className="font-display text-3xl text-[#8A8A8A] tracking-wide">
                {t('past_events')}
              </h2>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {past.map((event, i) => (
              <PastEventCard key={event.id} event={event} index={i} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}