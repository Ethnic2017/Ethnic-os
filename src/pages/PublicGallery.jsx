import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import PublicNav from '../components/public/PublicNav';
import PublicFooter from '../components/public/PublicFooter';
import { motion } from 'framer-motion';

export default function PublicGallery() {
  const { t } = useLanguage();

  const { data: events = [] } = useQuery({
    queryKey: ['gallery-events'],
    queryFn: () => base44.entities.Event.list('-date', 100),
  });

  // Collect all gallery images from events
  const galleryItems = events
    .filter(e => e.gallery?.length > 0 || e.cover_image)
    .flatMap(e => {
      const images = [];
      if (e.cover_image) images.push({ url: e.cover_image, event: e.title });
      if (e.gallery) e.gallery.forEach(g => images.push({ url: g, event: e.title }));
      return images;
    });

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <PublicNav />

      <div className="pt-28 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl text-[#F5F0EB] mb-12">{t('gallery')}</h1>

        {galleryItems.length === 0 && (
          <p className="text-[#8A8A8A] text-center py-20">Gallery coming soon...</p>
        )}

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {galleryItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.05 }}
              className="break-inside-avoid group relative rounded-xl overflow-hidden"
            >
              <img src={item.url} alt={item.event} className="w-full rounded-xl group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-sm text-[#F5F0EB]">{item.event}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}