import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PublicNav from '../components/public/PublicNav';
import PublicFooter from '../components/public/PublicFooter';
import { useLanguage } from '../components/LanguageContext';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  paid: 'text-green-400 bg-green-400/10',
  shipped: 'text-blue-400 bg-blue-400/10',
  delivered: 'text-[#C9A96E] bg-[#C9A96E]/10',
  cancelled: 'text-red-400 bg-red-400/10',
  refunded: 'text-[#8A8A8A] bg-white/5',
};

export default function MyOrders() {
  const { lang } = useLanguage();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) { base44.auth.redirectToLogin(window.location.pathname); return; }
      setUser(u);
    });
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders-page', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-[#C9A96E] text-[10px] tracking-[0.4em] uppercase mb-2">— Mon compte —</p>
          <h1 className="font-display text-3xl text-[#F5F0EB]">
            {lang === 'fr' ? 'Mes commandes' : 'My orders'}
          </h1>
        </motion.div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-[#1A1A1A] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="text-center py-24">
            <ShoppingBag className="w-14 h-14 mx-auto mb-5 text-[#8A8A8A]/20" />
            <p className="font-display text-xl text-[#F5F0EB]/30 mb-2">
              {lang === 'fr' ? 'Aucune commande' : 'No orders yet'}
            </p>
            <p className="text-xs text-[#8A8A8A]/60 mb-6">
              {lang === 'fr' ? 'Vos commandes apparaîtront ici.' : 'Your orders will appear here.'}
            </p>
            <Link
              to={createPageUrl('PublicSouq')}
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#C9A96E]/30 text-[#C9A96E] text-xs tracking-widest uppercase rounded-full hover:bg-[#C9A96E]/5 transition-all"
            >
              {lang === 'fr' ? 'Aller au Souq' : 'Visit Souq'} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-xs text-[#8A8A8A]">
                    {format(new Date(order.created_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded tracking-widest uppercase ${STATUS_COLORS[order.status] || 'text-[#8A8A8A]'}`}>
                    {order.status}
                  </span>
                  <span className="text-base font-semibold text-[#C9A96E]">€{order.total?.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-1">
                {order.items?.map((item, j) => (
                  <div key={j} className="flex items-center justify-between text-sm">
                    <span className="text-[#F5F0EB]">{item.product_name}</span>
                    <span className="text-[#8A8A8A]">×{item.quantity} · €{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {order.tracking_number && (
                <p className="text-xs text-[#8A8A8A] mt-3 pt-3 border-t border-white/5">
                  Tracking: <span className="text-[#F5F0EB]">{order.tracking_number}</span>
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}