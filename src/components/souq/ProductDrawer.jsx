import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ChevronDown, ChevronUp, ImageOff } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const catLabels = {
  merch: { fr: 'Merch', en: 'Merch' },
  accessories: { fr: 'Accessoires', en: 'Accessories' },
  limited_edition: { fr: 'Édition limitée', en: 'Limited Edition' },
  music: { fr: 'Musique', en: 'Music' },
  other: { fr: 'Autre', en: 'Other' },
};

export default function ProductDrawer({ product, onClose }) {
  const { lang } = useLanguage();
  const [activeImg, setActiveImg] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!product) return null;

  const name = lang === 'fr' && product.name_fr ? product.name_fr : product.name;
  const desc = lang === 'fr' && product.description_fr ? product.description_fr : product.description;
  const isSoldOut = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const mailSubject = encodeURIComponent(`Commande / Order — ${name}`);
  const mailBody = encodeURIComponent(`Bonjour,\n\nJe suis intéressé(e) par : ${name} (€${product.price?.toFixed(2)})\n\nMerci.`);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Drawer */}
        <motion.div
          className="relative ml-auto h-full w-full max-w-2xl bg-[#111] border-l border-white/5 overflow-y-auto flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 250 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 p-2 text-[#8A8A8A] hover:text-[#F5F0EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Images */}
          <div className="relative aspect-square bg-[#0D0D0D] overflow-hidden shrink-0">
            {product.images?.length > 0 ? (
              <>
                <motion.img
                  key={activeImg}
                  src={product.images[activeImg]}
                  alt={name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                          i === activeImg ? 'border-[#C9A96E]' : 'border-white/10 opacity-60'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="w-12 h-12 text-[#8A8A8A]/20" />
              </div>
            )}

            {/* Overlays */}
            {isSoldOut && (
              <div className="absolute inset-0 bg-[#0A0A0A]/60 flex items-center justify-center">
                <span className="text-[#F5F0EB] text-sm tracking-[0.4em] uppercase border border-white/20 px-6 py-2">
                  {lang === 'fr' ? 'Épuisé' : 'Sold Out'}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 px-8 py-8">
            <p className="text-[10px] text-[#C9A96E] tracking-[0.4em] uppercase mb-3">
              {catLabels[product.category]?.[lang] || product.category}
            </p>
            <h2 className="font-display text-3xl text-[#F5F0EB] mb-2 leading-tight">{name}</h2>
            <p className="text-2xl text-[#C9A96E] font-semibold mb-6">€{product.price?.toFixed(2)}</p>

            {isLowStock && (
              <p className="text-xs text-[#B34233] tracking-wider uppercase mb-6">
                ⚑ {lang === 'fr' ? `Plus que ${product.stock} en stock` : `Only ${product.stock} left in stock`}
              </p>
            )}

            {desc && (
              <p className="text-sm text-[#8A8A8A] leading-relaxed mb-8">{desc}</p>
            )}

            {/* Variants */}
            {product.variants?.map((variant, vi) => (
              <div key={vi} className="mb-6">
                <p className="text-xs text-[#8A8A8A] tracking-widest uppercase mb-3">{variant.label}</p>
                <div className="flex flex-wrap gap-2">
                  {variant.options?.map((opt, oi) => (
                    <button
                      key={oi}
                      className="px-4 py-2 border border-white/10 text-xs text-[#F5F0EB] tracking-wider hover:border-[#C9A96E]/40 hover:text-[#C9A96E] transition-all rounded-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* CTA */}
            {!isSoldOut && (
              <a
                href={`mailto:contact@ethnic-community.org?subject=${mailSubject}&body=${mailBody}`}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#C9A96E] text-[#0A0A0A] font-semibold text-xs tracking-[0.3em] uppercase hover:bg-[#E0CBA8] transition-all rounded-sm mb-4"
              >
                <Mail className="w-4 h-4" />
                {lang === 'fr' ? 'Commander par email' : 'Order by email'}
              </a>
            )}

            {/* Details accordion */}
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex items-center justify-between py-4 border-t border-white/5 text-xs text-[#8A8A8A] tracking-widest uppercase hover:text-[#F5F0EB] transition-colors"
            >
              {lang === 'fr' ? 'Infos & livraison' : 'Details & shipping'}
              {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {detailsOpen && (
              <div className="pb-6 text-xs text-[#8A8A8A] leading-relaxed space-y-2">
                <p>
                  {lang === 'fr'
                    ? '• Livraison mondiale — délais variables selon destination.'
                    : '• Worldwide shipping — delays vary by destination.'}
                </p>
                <p>
                  {lang === 'fr'
                    ? '• Contactez-nous pour les tailles, disponibilités ou échanges.'
                    : '• Contact us for sizes, availability or exchanges.'}
                </p>
                <p>
                  {lang === 'fr'
                    ? '• Pièces artisanales — légères variations possibles.'
                    : '• Handcrafted items — slight variations may occur.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}