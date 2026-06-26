import React from 'react';
import PublicNav from '../components/public/PublicNav';
import PublicFooter from '../components/public/PublicFooter';
import { useLanguage } from '../components/LanguageContext';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const VIDEOS = [
  { title: 'Ethnic Kiosk Session S2 EP2', youtubeId: 'dQw4w9WgXcQ', thumb: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2019/02/ethnic-kiosk-sessions-S02-EP2-j.jpg?fit=2048%2C1152&ssl=1' },
  { title: 'Ethnic Kiosk Session S2 EP1', youtubeId: 'dQw4w9WgXcQ', thumb: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2019/02/Ethnic-Kiosk-Sessions-S02-EP01.jpg?fit=1080%2C1080&ssl=1' },
  { title: 'Ethnic Community x Horde Cruise', youtubeId: 'dQw4w9WgXcQ', thumb: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2024/09/Horde.jpg?fit=1920%2C1080&ssl=1' },
  { title: 'Ethnic Caravel S1EP2 x Cosmo Vision', youtubeId: 'dQw4w9WgXcQ', thumb: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2025/04/Horde-cruise-ethnic-community.png?fit=1239%2C987&ssl=1' },
  { title: 'FDLM 25 – Paris', youtubeId: 'dQw4w9WgXcQ', thumb: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2019/02/DSC06985-scaled.jpg?fit=2560%2C1441&ssl=1' },
  { title: 'FDLM 23 – Paris', youtubeId: 'dQw4w9WgXcQ', thumb: 'https://i0.wp.com/ethnic-community.org/wp-content/uploads/2025/09/DSC01684.jpg?fit=1365%2C2048&ssl=1' },
];

export default function PublicWatch() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <PublicNav />

      <div className="pt-28 pb-24 px-4 sm:px-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl sm:text-5xl text-[#F5F0EB] mb-2">
            {lang === 'fr' ? 'Ethnic — Sessions Live & Communautaires' : 'Ethnic — Live & Community Sessions'}
          </h1>
          <div className="w-16 h-0.5 bg-[#C9A96E]/40 mb-12" />
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VIDEOS.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-xl overflow-hidden aspect-video cursor-pointer"
              onClick={() => window.open(`https://www.youtube.com/watch?v=${v.youtubeId}`, '_blank')}
            >
              <img src={v.thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-[#0A0A0A]/50 group-hover:bg-[#0A0A0A]/30 transition-all flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-white/60 flex items-center justify-center group-hover:border-[#C9A96E] group-hover:bg-[#C9A96E]/20 transition-all">
                  <Play className="w-5 h-5 text-white fill-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0A] to-transparent">
                <p className="text-sm font-medium text-[#F5F0EB]">{v.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}