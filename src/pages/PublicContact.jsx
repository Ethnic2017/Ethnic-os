import React, { useState } from 'react';
import PublicNav from '../components/public/PublicNav';
import PublicFooter from '../components/public/PublicFooter';
import { useLanguage } from '../components/LanguageContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { Send, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PublicContact() {
  const { lang } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.entities.Contact.create({
      name: form.name,
      email: form.email,
      notes: form.message,
      type: 'other',
    });
    setSent(true);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <PublicNav />

      {/* Hero banner */}
      <section className="relative h-64 sm:h-80 overflow-hidden flex items-end">
        <img
          src="https://i0.wp.com/ethnic-community.org/wp-content/uploads/2025/04/music-ethnic-community-8.jpg?fit=945%2C532&ssl=1"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
        <div className="relative z-10 px-8 sm:px-12 pb-12">
          <h1 className="font-display text-4xl sm:text-6xl text-[#F5F0EB] tracking-wide uppercase">Contact Us</h1>
        </div>
      </section>

      <section className="py-20 px-6 sm:px-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          {/* Info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-[#C9A96E] font-display italic text-lg mb-2">
              {lang === 'fr' ? "N'hésitez pas à" : "don't shy away from"}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-[#F5F0EB] mb-6 uppercase">
              {lang === 'fr' ? 'Nous envoyer un message' : 'Sending Us a Message'}
            </h2>
            <div className="w-16 h-0.5 bg-[#C9A96E]/40 mb-8" />
            <p className="text-[#8A8A8A] leading-relaxed mb-10">
              {lang === 'fr'
                ? "Vous avez une question ou un commentaire ? Nous serions ravis de vous entendre. Remplissez le formulaire ci-dessous et nous vous répondrons dès que possible."
                : "Have a question or comment? We'd love to hear from you. Please fill out the form below and we'll get back to you as soon as possible."}
            </p>

            <h3 className="font-display text-xl text-[#C9A96E] mb-6 uppercase tracking-wider">Booking</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#8A8A8A]">
                <Mail className="w-4 h-4 text-[#C9A96E]" />
                <a href="mailto:contact@ethnic-community.org" className="hover:text-[#F5F0EB] transition-colors text-sm">contact@ethnic-community.org</a>
              </div>
              <div className="flex items-center gap-3 text-[#8A8A8A]">
                <Phone className="w-4 h-4 text-[#C9A96E]" />
                <a href="tel:+33635996293" className="hover:text-[#F5F0EB] transition-colors text-sm">+33(0) 6 35 99 62 93</a>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-5 mt-10">
              {[
                { href: 'https://open.spotify.com', label: 'Spotify', icon: '🎵' },
                { href: 'https://music.apple.com', label: 'Apple Music', icon: '🎶' },
                { href: 'https://instagram.com/ethnic_community_collective', label: 'Instagram', icon: '📸' },
                { href: 'https://facebook.com', label: 'Facebook', icon: '👥' },
                { href: 'https://youtube.com', label: 'YouTube', icon: '▶️' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                  className="w-9 h-9 border border-white/10 rounded-full flex items-center justify-center text-sm hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/10 transition-all">
                  {s.icon}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            {sent ? (
              <div className="glass-card rounded-xl p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-7 h-7 text-[#C9A96E]" />
                </div>
                <h3 className="font-display text-xl text-[#F5F0EB] mb-2">
                  {lang === 'fr' ? 'Message envoyé !' : 'Message Sent!'}
                </h3>
                <p className="text-sm text-[#8A8A8A]">
                  {lang === 'fr' ? 'Merci, nous reviendrons vers vous bientôt.' : "Thank you, we'll get back to you soon."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder={lang === 'fr' ? 'Votre nom' : 'Your name'}
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                    className="bg-[#1A1A1A] border-white/10 h-12"
                  />
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                    className="bg-[#1A1A1A] border-white/10 h-12"
                  />
                </div>
                <Textarea
                  placeholder="Message"
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  className="bg-[#1A1A1A] border-white/10 h-40"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full h-12 bg-[#C9A96E] text-[#0A0A0A] font-medium rounded-lg hover:bg-[#E0CBA8] transition-all tracking-[0.2em] uppercase text-sm"
                >
                  {sending ? '...' : 'SEND'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}