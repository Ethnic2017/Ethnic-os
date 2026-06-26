import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import TopBar from '../components/admin/TopBar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Package, Search, ChevronDown, ChevronUp } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-400', paid: 'bg-green-500/10 text-green-400',
  shipped: 'bg-blue-500/10 text-blue-400', delivered: 'bg-emerald-500/10 text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-400', refunded: 'bg-purple-500/10 text-purple-400'
};

export default function Orders() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const filtered = orders.filter(o =>
    !search || o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  const updateOrderStatus = async (id, status) => {
    await base44.entities.Order.update(id, { status });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title={t('orders')} />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-10 bg-[#1A1A1A] border-white/10" />
      </div>

      {isLoading && <p className="text-[#8A8A8A]">{t('loading')}</p>}

      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="glass-card rounded-xl overflow-hidden hover:border-[#C9A96E]/20 transition-all">
            <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
              <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-[#C9A96E]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#F5F0EB]">{order.customer_name || order.customer_email}</span>
                  <Badge className={`${statusColors[order.status]} text-xs`}>{order.status}</Badge>
                </div>
                <p className="text-xs text-[#8A8A8A] mt-0.5">
                  {order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy') : ''} · {order.items?.length || 0} items
                </p>
              </div>
              <span className="font-bold text-[#C9A96E]">€{order.total?.toFixed(2)}</span>
              {expandedId === order.id ? <ChevronUp className="w-4 h-4 text-[#8A8A8A]" /> : <ChevronDown className="w-4 h-4 text-[#8A8A8A]" />}
            </div>
            {expandedId === order.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#8A8A8A] text-xs">Email</p>
                    <p className="text-[#F5F0EB]">{order.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-[#8A8A8A] text-xs">Shipping</p>
                    <p className="text-[#F5F0EB]">{order.shipping_address || 'N/A'}</p>
                  </div>
                </div>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm bg-white/[0.02] rounded-lg p-2">
                    <span className="text-[#F5F0EB]">{item.product_name} {item.variant ? `(${item.variant})` : ''} × {item.quantity}</span>
                    <span className="text-[#C9A96E]">€{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#8A8A8A]">Update status:</span>
                  <Select value={order.status} onValueChange={v => updateOrderStatus(order.id, v)}>
                    <SelectTrigger className="w-32 bg-[#0A0A0A] border-white/10 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusColors).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-20 text-[#8A8A8A]">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t('no_data')}</p>
          </div>
        )}
      </div>
    </div>
  );
}