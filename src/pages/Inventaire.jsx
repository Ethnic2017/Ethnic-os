import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TopBar from '../components/admin/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload, X, Image, Search, Package, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const categoryLabels = {
  tapis: 'Tapis', tissu: 'Tissu', pouf_coussin: 'Pouf / Coussin',
  lumiere: 'Lumière', dreamcatcher: 'Dreamcatcher',
  mobilier: 'Mobilier', accessoire: 'Accessoire', autre: 'Autre'
};

const categoryColors = {
  tapis: 'bg-amber-500/10 text-amber-400',
  tissu: 'bg-blue-500/10 text-blue-400',
  pouf_coussin: 'bg-purple-500/10 text-purple-400',
  lumiere: 'bg-yellow-500/10 text-yellow-400',
  dreamcatcher: 'bg-pink-500/10 text-pink-400',
  mobilier: 'bg-green-500/10 text-green-400',
  accessoire: 'bg-orange-500/10 text-orange-400',
  autre: 'bg-[#8A8A8A]/10 text-[#8A8A8A]',
};

const conditionColors = {
  bon: 'bg-green-500/10 text-green-400',
  moyen: 'bg-yellow-500/10 text-yellow-400',
  mauvais: 'bg-red-500/10 text-red-400',
};

const emptyItem = {
  name: '', category: 'autre', dimensions: '', weight: '',
  quantity: 1, quantity_available: 1, photos: [],
  drive_link: '', notes: '', condition: 'bon'
};

export default function Inventaire() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['deco-items'],
    queryFn: () => base44.entities.DecoItem.list('-created_date', 200),
  });

  const filtered = items.filter(item => {
    const matchCat = filterCat === 'all' || item.category === filterCat;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openNew = () => { setForm(emptyItem); setEditItem(null); setDialogOpen(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditItem(item); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editItem) {
      await base44.entities.DecoItem.update(editItem.id, form);
    } else {
      await base44.entities.DecoItem.create(form);
    }
    queryClient.invalidateQueries({ queryKey: ['deco-items'] });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet article ?')) return;
    await base44.entities.DecoItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ['deco-items'] });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploadedUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(file_url);
    }
    setForm(f => ({ ...f, photos: [...(f.photos || []), ...uploadedUrls] }));
    setUploading(false);
  };

  const removePhoto = (idx) => {
    setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));
  };

  const stats = {
    total: items.length,
    byCategory: Object.entries(categoryLabels).map(([k, v]) => ({
      key: k, label: v, count: items.filter(i => i.category === k).length
    })).filter(c => c.count > 0)
  };

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title="Inventaire">
        <Link to="/ImportInventaire">
          <Button variant="outline" className="border-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]">
            <FolderOpen className="w-4 h-4 mr-2" /> Import dossier
          </Button>
        </Link>
        <Button onClick={openNew} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </TopBar>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-[#8A8A8A]">Total articles</p>
          <p className="text-2xl font-bold text-[#C9A96E]">{stats.total}</p>
        </div>
        {stats.byCategory.slice(0, 3).map(c => (
          <div key={c.key} className="glass-card rounded-xl p-4">
            <p className="text-xs text-[#8A8A8A]">{c.label}</p>
            <p className="text-xl font-bold text-[#F5F0EB]">{c.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#1A1A1A] border-white/10"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${filterCat === 'all' ? 'bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/30' : 'text-[#8A8A8A] border-white/10 hover:border-white/20'}`}
          >Tous</button>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilterCat(k)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${filterCat === k ? 'bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/30' : 'text-[#8A8A8A] border-white/10 hover:border-white/20'}`}
            >{v}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <p className="text-[#8A8A8A]">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Package className="w-12 h-12 text-[#8A8A8A] mx-auto mb-3" />
          <p className="text-[#8A8A8A]">Aucun article trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="glass-card rounded-xl overflow-hidden group hover:border-[#C9A96E]/20 transition-all">
              {/* Photo */}
              <div
                className="h-44 bg-[#0A0A0A] relative cursor-pointer"
                onClick={() => item.photos?.[0] && setLightbox(item.photos[0])}
              >
                {item.photos?.[0] ? (
                  <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-10 h-10 text-[#8A8A8A]/30" />
                  </div>
                )}
                {item.photos?.length > 1 && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    +{item.photos.length - 1}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-[#F5F0EB] text-sm leading-tight">{item.name}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(item)} className="flex items-center justify-center w-7 h-7 rounded hover:bg-white/10 text-[#8A8A8A] hover:text-[#C9A96E]">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="flex items-center justify-center w-7 h-7 rounded hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge className={`${categoryColors[item.category]} text-xs`}>{categoryLabels[item.category]}</Badge>
                  <Badge className={`${conditionColors[item.condition || 'bon']} text-xs`}>{item.condition || 'bon'}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-[#8A8A8A]">
                  <span>{item.dimensions || '—'}</span>
                  <span className="font-medium text-[#C9A96E]">×{item.quantity || 1}</span>
                </div>
                {item.weight && <p className="text-xs text-[#8A8A8A] mt-0.5">{item.weight}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-[#C9A96E]"><X className="w-6 h-6" /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editItem ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-[#0A0A0A] border-white/10" placeholder="Ex: Tapis Ethnic Aztèque" />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>État</Label>
                <Select value={form.condition || 'bon'} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bon">Bon</SelectItem>
                    <SelectItem value="moyen">Moyen</SelectItem>
                    <SelectItem value="mauvais">Mauvais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dimensions</Label>
                <Input value={form.dimensions || ''} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} className="bg-[#0A0A0A] border-white/10" placeholder="Ex: 1,8m*1,8m" />
              </div>
              <div className="space-y-2">
                <Label>Poids</Label>
                <Input value={form.weight || ''} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="bg-[#0A0A0A] border-white/10" placeholder="Ex: 0,5kg" />
              </div>
              <div className="space-y-2">
                <Label>Quantité totale</Label>
                <Input type="number" min="0" value={form.quantity || 1} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} className="bg-[#0A0A0A] border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Quantité disponible</Label>
                <Input type="number" min="0" value={form.quantity_available ?? form.quantity ?? 1} onChange={e => setForm(f => ({ ...f, quantity_available: parseInt(e.target.value) || 0 }))} className="bg-[#0A0A0A] border-white/10" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Lien Google Drive</Label>
                <Input value={form.drive_link || ''} onChange={e => setForm(f => ({ ...f, drive_link: e.target.value }))} className="bg-[#0A0A0A] border-white/10" placeholder="https://drive.google.com/..." />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-[#0A0A0A] border-white/10 h-20" placeholder="État, remarques..." />
              </div>
            </div>

            {/* Photo upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Image className="w-3.5 h-3.5 text-[#C9A96E]" /> Photos</Label>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-white/20 rounded-xl p-4 hover:border-[#C9A96E]/40 transition-colors">
                <Upload className="w-4 h-4 text-[#8A8A8A]" />
                <span className="text-sm text-[#8A8A8A]">{uploading ? 'Upload en cours...' : 'Cliquer pour ajouter des photos'}</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              {form.photos?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.photos.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-400"
                      ><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-[#8A8A8A]">Annuler</Button>
            <Button onClick={handleSave} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]" disabled={uploading}>
              {editItem ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}