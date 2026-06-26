import React, { useState } from 'react';
import PublicNav from '../components/public/PublicNav';
import PublicFooter from '../components/public/PublicFooter';
import { useLanguage } from '../components/LanguageContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { Check, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = [
  { amount: 9, link: 'https://buy.stripe.com/dRm3cu8gMfxsbvS5A767S06' },
  { amount: 15, link: 'https://buy.stripe.com/bJeaEW54Adpk6by0fN67S07' },
  { amount: 20, link: 'https://buy.stripe.com/4gw5nB1VyeHWeNq9AB' },
  { amount: 30, link: 'https://buy.stripe.com/3cs9DR57K57m20EaEG' },
  { amount: 50, link: 'https://buy.stripe.com/9B64gy0Okbhc6by3rZ67S08' },
];

const BENEFITS = {
  en: [
    'Free access to all our events in France',
    'No more need to contribute to the kitty for free events (kiosk...)',
    'Access to promo codes or free entry to events where we are invited to play',
    'Receive 1 item of all the goodies with the Ethnic logo (Necklace, Bracelet, Totebag, Water bottle...)',
  ],
  fr: [
    'Accès gratuit à tous nos événements en France',
    'Plus besoin de contribuer à la cagnotte pour les événements gratuits (kiosque...)',
    'Accès à des codes promo ou entrée gratuite aux événements où nous sommes invités à jouer',
    'Recevoir 1 article de tous les goodies avec le logo Ethnic (Collier, Bracelet, Totebag, Gourde...)',
  ],
};

export default function JoinCommunity() {
  const { lang } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleContact = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.entities.CommunityMember.create({
      name: form.name,
      email: form.email,
      bio: form.message,
      application_type: 'member',
      status: 'pending',
    });
    setSent(true);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <PublicNav />

      {/* Hero Split */}
      <section className="relative min-h-screen flex items-stretch overflow-hidden">
        <div className="hidden md:block w-1/2 relative">
          <img
            src="https://i0.wp.com/ethnic-community.org/wp-content/uploads/2023/05/Copie-de-19466617_1471193632928688_8575509390155249014_o.jpg?fit=1365%2C2048&ssl=1"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0A0A0A]" />
        </div>
        <div className="w-full md:w-1/2 flex items-center px-6 sm:px-12 py-24 pt-32">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-lg">
            <p className="text-[#C9A96E] font-display italic text-lg mb-2">Join Ethnic</p>
            <h1 className="font-display text-4xl sm:text-5xl text-[#F5F0EB] mb-6">
              {lang === 'fr' ? 'Rejoignez notre communauté' : 'Join Our Community'}
            </h1>
            <p className="text-[#8A8A8A] leading-relaxed mb-4">
              {lang === 'fr'
                ? "Rejoignez le mouvement ! Chez Ethnic Community, nous croyons que l'art est une force puissante pour l'unité. Votre adhésion n'est pas seulement un abonnement ; c'est une contribution directe à la réalisation de cette vision."
                : "Join the movement! At Ethnic Community, we believe art is a powerful force for unity. Your subscription isn't just a membership; it's a direct contribution to bringing this vision to life."}
            </p>
            <p className="text-[#8A8A8A] leading-relaxed mb-4">
              {lang === 'fr'
                ? "Le rythme des cultures vous fait vibrer ? Vous êtes touché par la beauté des arts ? Rejoignez notre association culturelle, un espace vibrant où musique et art résonnent avec nos origines diverses."
                : "Does the rhythm of cultures make you vibrate? Are you touched by the beauty of the arts? Then join our cultural association, a vibrant space where music and art echo our diverse origins."}
            </p>
            <p className="text-[#8A8A8A] leading-relaxed italic">
              {lang === 'fr'
                ? "Un amour de l'art et une ouverture aux autres sont nos seuls passeports."
                : "A love for art and openness to others are our only passports."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-20 px-6 sm:px-8 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl text-[#F5F0EB] mb-12 tracking-wide">
            {lang === 'fr' ? "Adhésion à l'association" : 'Subscription to the Association'}
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {PLANS.map(p => (
              <a
                key={p.amount}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border border-[#C9A96E]/40 text-[#C9A96E] rounded-lg hover:bg-[#C9A96E] hover:text-[#0A0A0A] transition-all font-medium text-sm tracking-wider"
              >
                {lang === 'fr' ? `S'abonner ${p.amount}€/mois` : `Subscribe ${p.amount}€/month`}
              </a>
            ))}
          </div>

          <h3 className="font-display text-2xl text-[#F5F0EB] mb-8">
            {lang === 'fr' ? 'Vos avantages exclusifs' : 'Join and Discover Your Exclusive Benefits'}
          </h3>
          <ul className="text-left space-y-4 mb-16 max-w-lg mx-auto">
            {BENEFITS[lang].map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-[#8A8A8A]">
                <Check className="w-4 h-4 text-[#C9A96E] mt-0.5 shrink-0" />
                <span className="text-sm">{b}</span>
              </li>
            ))}
          </ul>

          <img
            src="https://i0.wp.com/ethnic-community.org/wp-content/uploads/2025/04/join-us-ethic-community.jpg?fit=1200%2C642&ssl=1"
            alt=""
            className="w-full rounded-xl mb-16 object-cover"
          />

          {/* Donate */}
          <div className="glass-card rounded-xl p-8">
            <h3 className="font-display text-2xl text-[#F5F0EB] mb-4">
              {lang === 'fr' ? "Faire un don à l'association" : 'Donate for the Association'}
            </h3>
            <p className="text-[#8A8A8A] text-sm mb-6">
              {lang === 'fr'
                ? "Chaque contribution aide ! Votre soutien nous permet de continuer notre travail. Vous pouvez donner le montant qui vous convient."
                : "Every bit helps! Your support allows us to continue our important work. You can donate any amount you're comfortable with."}
            </p>
            <a
              href="https://buy.stripe.com/14A3cuaoU99443q9Qn67S09"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#B34233] text-white rounded-full hover:bg-[#C9A96E] hover:text-[#0A0A0A] transition-all text-sm tracking-wider uppercase font-medium"
            >
              <Heart className="w-4 h-4" /> {lang === 'fr' ? 'Faire un don' : 'Donate'}
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}