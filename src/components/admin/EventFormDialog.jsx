import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Upload } from 'lucide-react';

const empty = {
  title: '', title_fr: '', date: '', end_date: '', location: '', city: '', country: '',
  description: '', description_fr: '', lineup: [], cover_image: '', ticket_link: '',
  aftermovie_url: '', status: 'draft', tags: [], gallery: []
};

export default function EventFormDialog({ open, onOpenChange, event, onSaved }) {
  const [form, setForm] = useState(empty);
  const [lineupStr, setLineupStr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setForm(event);
      setLineupStr((event.lineup || []).join(', '));
    } else {
      setForm(empty);
      setLineupStr('');
    }
  }, [event, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, cover_image: file_url }));
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, lineup: lineupStr.split(',').map(s => s.trim()).filter(Boolean) };
    if (event?.id) {
      await base44.entities.Event.update(event.id, data);
    } else {
      await base44.entities.Event.create(data);
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{event ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Title (EN)</Label>
            <Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Titre (FR)</Label>
            <Input value={form.title_fr} onChange={e => setForm(p => ({...p, title_fr: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="datetime-local" value={form.date?.slice(0,16) || ''} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="datetime-local" value={form.end_date?.slice(0,16) || ''} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
              <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Lineup (comma-separated)</Label>
            <Input value={lineupStr} onChange={e => setLineupStr(e.target.value)} placeholder="DJ A, DJ B, DJ C" className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Description (EN)</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-24" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Description (FR)</Label>
            <Textarea value={form.description_fr} onChange={e => setForm(p => ({...p, description_fr: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-24" />
          </div>
          <div className="space-y-2">
            <Label>Ticket Link</Label>
            <Input value={form.ticket_link} onChange={e => setForm(p => ({...p, ticket_link: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Aftermovie URL</Label>
            <Input value={form.aftermovie_url} onChange={e => setForm(p => ({...p, aftermovie_url: e.target.value}))} className="bg-[#0A0A0A] border-white/10" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              {form.cover_image && <img src={form.cover_image} alt="" className="w-20 h-14 object-cover rounded-lg" />}
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A0A0A] border border-white/10 cursor-pointer hover:bg-white/5 transition-colors text-sm">
                <Upload className="w-4 h-4" /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-[#8A8A8A]">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
            {saving ? 'Saving...' : 'Save Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}