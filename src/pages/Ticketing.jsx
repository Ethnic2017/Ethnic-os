import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TopBar from '../components/admin/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket, Users, TrendingUp, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function Ticketing() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [ticketForm, setTicketForm] = useState({ name: '', price: 0, capacity: 0 });
  const [addTicketOpen, setAddTicketOpen] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['events-ticketing'],
    queryFn: () => base44.entities.Event.list('-date', 200),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-ticketing'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const upcoming = events.filter(e => e.status === 'published' || e.status === 'draft');

  const getEventOrders = (eventId) => orders.filter(o =>
    o.items?.some(item => item.product_id === eventId || item.variant === eventId)
  );

  const getRevenue = (eventId) => {
    return getEventOrders(eventId).reduce((sum, o) => sum + (o.total || 0), 0);
  };

  const getAttendees = (eventId) => {
    return getEventOrders(eventId).filter(o => o.status !== 'cancelled').length;
  };

  const handleAddTicketType = async () => {
    if (!editingEvent) return;
    const types = [...(editingEvent.ticket_types || []), ticketForm];
    await base44.entities.Event.update(editingEvent.id, { ticket_types: types });
    queryClient.invalidateQueries({ queryKey: ['events-ticketing'] });
    setAddTicketOpen(false);
    setTicketForm({ name: '', price: 0, capacity: 0 });
  };

  const totalRevenue = upcoming.reduce((sum, e) => sum + getRevenue(e.id), 0);
  const totalAttendees = upcoming.reduce((sum, e) => sum + getAttendees(e.id), 0);

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title="Ticketing & Attendees" />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center"><Ticket className="w-5 h-5 text-[#C9A96E]" /></div>
          <div><p className="text-xs text-[#8A8A8A]">Active Events</p><p className="text-xl font-bold text-[#F5F0EB]">{upcoming.length}</p></div>
        </div>
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-blue-400" /></div>
          <div><p className="text-xs text-[#8A8A8A]">Total Attendees</p><p className="text-xl font-bold text-[#F5F0EB]">{totalAttendees}</p></div>
        </div>
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-400" /></div>
          <div><p className="text-xs text-[#8A8A8A]">Total Revenue</p><p className="text-xl font-bold text-[#F5F0EB]">€{totalRevenue.toFixed(0)}</p></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Events list */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-display text-lg text-[#F5F0EB] mb-4">Events</h2>
          {upcoming.map(event => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
              className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${selectedEvent?.id === event.id ? 'border-[#C9A96E]/40' : 'hover:border-white/10'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-[#F5F0EB] text-sm line-clamp-1">{event.title}</h3>
                <Badge className={`text-xs ml-2 ${event.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{event.status}</Badge>
              </div>
              <p className="text-xs text-[#8A8A8A] mb-2">{format(new Date(event.date), 'MMM d, yyyy')} · {event.city}</p>
              <div className="flex gap-4 text-xs">
                <span className="text-[#C9A96E]">{getAttendees(event.id)} attendees</span>
                <span className="text-green-400">€{getRevenue(event.id).toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Event detail */}
        <div className="lg:col-span-2">
          {selectedEvent ? (
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="font-display text-xl text-[#F5F0EB]">{selectedEvent.title}</h2>
                  <Button
                    size="sm"
                    onClick={() => { setEditingEvent(selectedEvent); setAddTicketOpen(true); }}
                    className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8] text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Ticket Type
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-white/[0.02] rounded-lg">
                    <p className="text-xs text-[#8A8A8A]">Capacity</p>
                    <p className="text-lg font-bold text-[#F5F0EB]">{selectedEvent.capacity || '—'}</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-lg">
                    <p className="text-xs text-[#8A8A8A]">Sold</p>
                    <p className="text-lg font-bold text-[#F5F0EB]">{getAttendees(selectedEvent.id)}</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-lg">
                    <p className="text-xs text-[#8A8A8A]">Revenue</p>
                    <p className="text-lg font-bold text-green-400">€{getRevenue(selectedEvent.id).toFixed(0)}</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-lg">
                    <p className="text-xs text-[#8A8A8A]">Price</p>
                    <p className="text-lg font-bold text-[#C9A96E]">{selectedEvent.ticket_price ? `€${selectedEvent.ticket_price}` : '—'}</p>
                  </div>
                </div>

                {/* Ticket types */}
                {selectedEvent.ticket_types?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[#F5F0EB] mb-3">Ticket Types</h3>
                    <div className="grid gap-2">
                      {selectedEvent.ticket_types.map((tt, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                          <span className="text-sm text-[#F5F0EB]">{tt.name}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-[#C9A96E]">€{tt.price}</span>
                            <span className="text-[#8A8A8A]">{tt.capacity} seats</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Attendees */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg text-[#F5F0EB] mb-4">Attendees ({getEventOrders(selectedEvent.id).length})</h3>
                <div className="space-y-2">
                  {getEventOrders(selectedEvent.id).slice(0, 20).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                      <div>
                        <p className="text-sm text-[#F5F0EB]">{order.customer_name || order.customer_email}</p>
                        <p className="text-xs text-[#8A8A8A]">{order.customer_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#C9A96E]">€{order.total}</p>
                        <Badge className={`text-xs ${order.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {getEventOrders(selectedEvent.id).length === 0 && (
                    <p className="text-sm text-[#8A8A8A]">No attendees yet</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 glass-card rounded-xl">
              <div className="text-center text-[#8A8A8A]">
                <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Select an event to view ticketing details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add ticket type dialog */}
      <Dialog open={addTicketOpen} onOpenChange={setAddTicketOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-md">
          <DialogHeader><DialogTitle>Add Ticket Type</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Name</Label><Input value={ticketForm.name} onChange={e => setTicketForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Early Bird, VIP..." className="bg-[#0A0A0A] border-white/10" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Price (€)</Label><Input type="number" value={ticketForm.price} onChange={e => setTicketForm(p => ({...p, price: parseFloat(e.target.value) || 0}))} className="bg-[#0A0A0A] border-white/10" /></div>
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={ticketForm.capacity} onChange={e => setTicketForm(p => ({...p, capacity: parseInt(e.target.value) || 0}))} className="bg-[#0A0A0A] border-white/10" /></div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setAddTicketOpen(false)} className="border-white/10 text-[#8A8A8A]">Cancel</Button>
            <Button onClick={handleAddTicketType} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}