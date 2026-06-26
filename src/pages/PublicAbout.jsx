import React, { useState } from 'react';
import PublicNav from '../components/public/PublicNav';
import PublicFooter from '../components/public/PublicFooter';
import { useLanguage } from '../components/LanguageContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';

const ARTISTS = [
  { name: 'Ahmed Bar', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-14.png?fit=938%2C938&ssl=1', category: 'musician' },
  { name: 'ANAMASTË', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-2.png?fit=938%2C938&ssl=1', category: 'musician' },
  { name: 'FREDERIKA', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-3.png?fit=938%2C938&ssl=1', category: 'musician' },
  { name: 'HUMANKAN', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-4.png?fit=938%2C938&ssl=1', category: 'musician' },
  { name: 'JEAN MALBEZIN - ODJIN', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-5.png?fit=938%2C938&ssl=1', category: 'performer' },
  { name: 'KADANCE', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-6.png?fit=938%2C938&ssl=1', category: 'performer' },
  { name: 'KIMOTO', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-7.png?fit=938%2C938&ssl=1', category: 'musician' },
  { name: 'MILAS', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-8.png?fit=938%2C938&ssl=1', category: 'musician' },
  { name: 'MOVY MOVE', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-1.png?fit=938%2C938&ssl=1', category: 'performer' },
  { name: 'NAÏM', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-9.png?fit=938%2C938&ssl=1', category: 'musician' },
  { name: 'NEJMA', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-10.png?fit=938%2C938&ssl=1', category: 'musician' },
  { name: 'PAJARITO MUNDO', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-11.png?fit=938%2C938&ssl=1', category: 'musician' },
  { name: 'Valdo', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-12.png?fit=938%2C938&ssl=1', category: 'media' },
  { name: 'ZAJAL', img: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2026/01/Ethnic-Community-Artist-13.png?fit=938%2C938&ssl=1', category: 'musician' },
];

const TEAM = [
  { name: 'Naïm', role: 'President · Artistic Director' },
  { name: 'Dorra', role: 'Treasurer · IT' },
  { name: 'Jihed', role: 'General Secretary · Logistics' },
  { name: 'Philippine', role: 'Graphic Design · Partnerships' },
  { name: 'Chahnez', role: 'Video · Project Management' },
  { name: 'Fares', role: 'Project Manager' },
  { name: 'Anaelle', role: 'Project Manager · DJ' },
  { name: 'Valdo', role: 'Video Maker' },
  { name: 'Mohsen', role: 'Administration · Partnerships' },
  { name: 'Akram', role: 'Happiness Manager' },
  { name: 'Mehdi', role: 'Scenography · Set & Decor' },
  { name: 'Guillaume', role: 'Project Manager' },
];

const CATEGORIES = ['all', 'musician', 'performer', 'media'];

export default function PublicAbout() {
  const { lang } = useLanguage();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? ARTISTS : ARTISTS.filter(a => a.category === filter);

  const catLabels = {
    all: lang === 'fr' ? 'Tous' : 'All',
    musician: lang === 'fr' ? 'Musiciens' : 'Musicians',
    performer: 'Performers',
    media: 'Media',
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <PublicNav />

      {/* ——— HERO ——— */}
      <section className="relative min-h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://i0.wp.com/ethnic-community.org/wp-content/uploads/2023/05/21765693_161785347734697_8867592400053757304_o.jpg?fit=592%2C782&ssl=1"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-transparent to-[#0A0A0A]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 w-full pb-20 pt-36">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <p className="text-[#C9A96E] text-xs tracking-[0.4em] uppercase mb-4">
              {lang === 'fr' ? '— Notre histoire —' : '— Our story —'}
            </p>
            <h1 className="font-display text-5xl sm:text-7xl text-[#F5F0EB] tracking-wide mb-8 leading-none">
              {lang === 'fr' ? 'Notre Identité' : 'Our Identity'}
            </h1>
            <div className="max-w-2xl">
              <p className="text-[#8A8A8A] leading-relaxed mb-4 text-sm sm:text-base">
                {lang === 'fr'
                  ? 'Née en 2017 d\'une idée simple, notre communauté s\'est construite autour d\'une conviction forte — '
                  : 'Born in 2017 from a simple idea, our community was built around a strong conviction — '}
                <strong className="text-[#F5F0EB]">
                  {lang === 'fr'
                    ? 'dans un monde de plus en plus divisé, l\'art a le pouvoir de rassembler les gens, au-delà des cultures, des origines et des religions.'
                    : 'in an increasingly divided world, art has the power to bring people together, beyond cultures, origins, and religions.'}
                </strong>
              </p>
              <p className="text-[#8A8A8A] leading-relaxed text-sm">
                {lang === 'fr'
                  ? 'Nous imaginons les événements comme des espaces ouverts et vibrants, où chacun peut se sentir appartenir. En sortant l\'art de ses cadres traditionnels, nous créons des expériences immersives où musique, arts visuels et performances se rejoignent.'
                  : 'We envision events as open and vibrant spaces, where everyone can feel they belong. By taking art out of its traditional frameworks, we create immersive experiences where music, visual arts, and performances come together.'}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ——— DISCIPLINES ——— */}
      <section className="py-20 px-6 sm:px-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl text-[#C9A96E] tracking-widest uppercase mb-12">
            {lang === 'fr' ? 'Nos disciplines' : 'Our Disciplines'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Live Music',
                desc: lang === 'fr' ? 'Musique électronique mêlant instruments traditionnels et sonorités modernes — rythmique, méditatif, transcendant.' : 'Electronic music blending traditional instruments with modern sounds — rhythmic, meditative, transcendent.',
              },
              {
                title: 'Performances',
                desc: lang === 'fr' ? 'Danses traditionnelles en costumes authentiques, spectacles de feu et performances immersives racontant des histoires à travers les cultures.' : 'Traditional dances in authentic costumes, fire shows and immersive performances telling stories across cultures.',
              },
              {
                title: 'SOUQ & Art',
                desc: lang === 'fr' ? 'Créations textiles, artisanat ethnique, bijoux et objets d\'art uniques. Un marché vivant de créativité indépendante.' : 'Textile creations, ethnic crafts, jewelry and unique art objects. A living market of independent creativity.',
              },
              {
                title: 'Scénographie',
                desc: lang === 'fr' ? 'Décors immersifs construits à partir de matériaux recyclés avec une approche zéro déchet. Des espaces sensoriels uniques.' : 'Immersive décor built from recycled materials with a zero-waste mindset. Unique sensory spaces.',
              },
            ].map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-t border-[#C9A96E]/20 pt-6"
              >
                <h3 className="font-display text-[#F5F0EB] text-lg mb-3">{d.title}</h3>
                <p className="text-[#8A8A8A] text-sm leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— ARTISTS ——— */}
      <section className="py-20 px-6 sm:px-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl text-[#F5F0EB] mb-10 tracking-wide">
            {lang === 'fr' ? 'Nos artistes' : 'Our Artists'}
          </h2>
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs tracking-wider uppercase transition-all ${
                  filter === cat
                    ? 'bg-[#C9A96E] text-[#0A0A0A] font-medium'
                    : 'border border-white/10 text-[#8A8A8A] hover:text-[#F5F0EB] hover:border-white/20'
                }`}
              >
                {catLabels[cat]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filtered.map((artist, i) => (
              <motion.div
                key={artist.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="group text-center"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-3 border border-white/5 group-hover:border-[#C9A96E]/30 transition-all">
                  <img src={artist.img} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <p className="text-sm font-medium text-[#F5F0EB] group-hover:text-[#C9A96E] transition-colors">{artist.name}</p>
                <p className="text-xs text-[#555] capitalize mt-0.5">{catLabels[artist.category]}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— TEAM ——— */}
      <section className="py-20 px-6 sm:px-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl text-[#F5F0EB] mb-4 tracking-wide">
            {lang === 'fr' ? 'Notre équipe' : 'Our Team'}
          </h2>
          <p className="text-[#8A8A8A] text-sm mb-10">
            {lang === 'fr'
              ? 'Association loi 1901 — RNA : W951006442 — SIREN : 891198566 — Paris'
              : 'Non-profit association — RNA: W951006442 — SIREN: 891198566 — Paris'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-[#111] border border-white/5 rounded-xl p-4 text-center hover:border-[#C9A96E]/20 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-[#C9A96E] font-display text-sm">{member.name[0]}</span>
                </div>
                <p className="text-sm text-[#F5F0EB] font-medium">{member.name}</p>
                <p className="text-[10px] text-[#8A8A8A] mt-0.5 leading-tight">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA ——— */}
      <section className="py-20 px-6 sm:px-10 border-t border-white/5 text-center">
        <Link
          to={createPageUrl('JoinCommunity')}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#C9A96E] text-[#0A0A0A] font-medium rounded-full hover:bg-[#E0CBA8] transition-all text-xs tracking-[0.2em] uppercase"
        >
          {lang === 'fr' ? 'Rejoindre la communauté' : 'Join the Community'} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
}