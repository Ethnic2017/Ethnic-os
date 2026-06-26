import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import PublicNav from '../components/public/PublicNav';
import PublicFooter from '../components/public/PublicFooter';
import ProductDrawer from '../components/souq/ProductDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ImageOff, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', fr: 'Tout', en: 'All' },
  { key: 'merch', fr: 'Vêtements', en: 'Clothing' },
  { key: 'accessories', fr: 'Bijoux & Accessoires', en: 'Jewelry & Accessories' },
  { key: 'limited_edition', fr: 'Éditions limitées', en: 'Limited Editions' },
  { key: 'music', fr: 'Musique', en: 'Music' },
  { key: 'other', fr: 'Goodies', en: 'Goodies' },
];

const catLabelMap = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

function ProductCard({ product, lang, onClick, index }) {
  const name = lang === 'fr' && product.name_fr ? product.name_fr : product.name;
  const cat = catLabelMap[product.category];
  const isSoldOut = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-[#111] mb-4" style={{ aspectRatio: '3/4' }}>
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-[#8A8A8A]/20" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />

        {/* Badges */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[#F5F0EB] text-[10px] tracking-[0.4em] uppercase border border-white/20 px-5 py-1.5 bg-black/50">
              {lang === 'fr' ? 'Épuisé' : 'Sold Out'}
            </span>
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-3 left-3">
            <span className="text-[10px] text-[#B34233] tracking-widest uppercase">
              {lang === 'fr' ? `— ${product.stock} restants` : `— ${product.stock} left`}
            </span>
          </div>
        )}
        {product.category === 'limited_edition' && !isSoldOut && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-2 py-0.5 tracking-widest uppercase">
              {lang === 'fr' ? 'Limité' : 'Limited'}
            </span>
          </div>
        )}

        {/* Quick view on hover */}
        <div className="absolute bottom-0 left-0 right-0 py-3 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center">
          <span className="text-[10px] text-[#F5F0EB] tracking-[0.3em] uppercase">
            {lang === 'fr' ? 'Voir le produit' : 'Quick view'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div>
        {cat && (
          <p className="text-[9px] text-[#C9A96E] tracking-[0.4em] uppercase mb-1">
            {cat[lang] || cat.en}
          </p>
        )}
        <h3 className="text-sm text-[#F5F0EB] font-medium leading-snug group-hover:text-[#C9A96E] transition-colors mb-1">
          {name}
        </h3>
        <p className="text-sm text-[#8A8A8A]">€{product.price?.toFixed(2)}</p>
      </div>
    </motion.article>
  );
}

export default function PublicSouq() {
  const { lang } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: () => base44.entities.Product.filter({ status: 'published' }, '-created_date', 100),
  });

  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0EB]">
      <PublicNav />

      {/* Hero — cinematic full height */}
      <section className="relative h-screen max-h-[700px] min-h-[500px] overflow-hidden flex items-end">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />
        <div className="relative z-10 px-8 sm:px-16 pb-16 sm:pb-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <p className="text-[#C9A96E] text-[10px] tracking-[0.6em] uppercase mb-4">
              — Ethnic Community —
            </p>
            <h1 className="font-display text-7xl sm:text-9xl text-[#F5F0EB] tracking-widest uppercase leading-none mb-6">
              Souq
            </h1>
            <p className="text-[#8A8A8A] text-sm tracking-wider max-w-sm leading-relaxed">
              {lang === 'fr'
                ? 'Vêtements, bijoux & créations ethniques. Chaque pièce raconte une histoire.'
                : 'Clothing, jewelry & ethnic creations. Every piece tells a story.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Shop section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-32">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8A8A8A] tracking-widest">
              {filtered.length} {lang === 'fr' ? 'article' : 'item'}{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-xs tracking-widest uppercase transition-colors ${showFilters ? 'text-[#C9A96E]' : 'text-[#8A8A8A] hover:text-[#F5F0EB]'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {lang === 'fr' ? 'Filtrer' : 'Filter'}
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="flex flex-wrap gap-2 pb-6 border-b border-white/5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-5 py-2 text-[10px] tracking-[0.3em] uppercase transition-all ${
                      activeCategory === cat.key
                        ? 'bg-[#C9A96E] text-[#0A0A0A] font-semibold'
                        : 'border border-white/10 text-[#8A8A8A] hover:text-[#F5F0EB] hover:border-white/20'
                    }`}
                  >
                    {cat[lang] || cat.en}
                  </button>
                ))}
                {activeCategory !== 'all' && (
                  <button
                    onClick={() => setActiveCategory('all')}
                    className="flex items-center gap-1 px-3 py-2 text-[10px] text-[#8A8A8A] hover:text-[#F5F0EB] tracking-widest uppercase transition-colors"
                  >
                    <X className="w-3 h-3" /> {lang === 'fr' ? 'Effacer' : 'Clear'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[#1A1A1A] rounded-sm mb-4" style={{ aspectRatio: '3/4' }} />
                <div className="h-3 bg-[#1A1A1A] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[#1A1A1A] rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-36">
            <ShoppingBag className="w-12 h-12 mx-auto mb-6 text-[#8A8A8A]/20" />
            <p className="font-display text-2xl text-[#F5F0EB]/20 mb-3">
              {lang === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
            </p>
            <p className="text-xs text-[#8A8A8A]/40 tracking-widest uppercase">
              {lang === 'fr' ? 'La boutique ouvre prochainement.' : 'The shop is opening soon.'}
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                index={i}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}

        {/* Editorial strip */}
        {!isLoading && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-32 border-t border-white/5 pt-20 grid sm:grid-cols-3 gap-8 text-center"
          >
            {[
              { icon: '✦', title: lang === 'fr' ? 'Fait main' : 'Handmade', desc: lang === 'fr' ? 'Chaque pièce est artisanale & unique' : 'Every piece is handcrafted & unique' },
              { icon: '◈', title: lang === 'fr' ? 'Livraison mondiale' : 'Worldwide shipping', desc: lang === 'fr' ? 'Expédition partout dans le monde' : 'Shipping anywhere in the world' },
              { icon: '◇', title: lang === 'fr' ? 'Commande directe' : 'Direct order', desc: lang === 'fr' ? 'Contactez-nous pour commander' : 'Contact us to place your order' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-4">
                <span className="text-[#C9A96E] text-2xl">{item.icon}</span>
                <h4 className="text-xs tracking-[0.3em] uppercase text-[#F5F0EB]">{item.title}</h4>
                <p className="text-xs text-[#8A8A8A] leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Product Drawer */}
      {selectedProduct && (
        <ProductDrawer
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <PublicFooter />
    </div>
  );
}