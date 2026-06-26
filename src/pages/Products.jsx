import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import TopBar from '../components/admin/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, ShoppingBag, Pencil, Trash2, Upload, Image } from 'lucide-react';
import ViewToggle from '@/components/crm/ViewToggle';

const categories = ['merch', 'accessories', 'limited_edition', 'music', 'other'];
const statusColors = { draft: 'bg-yellow-500/10 text-yellow-400', published: 'bg-green-500/10 text-green-400', sold_out: 'bg-red-500/10 text-red-400' };

const emptyProduct = { name: '', name_fr: '', description: '', description_fr: '', images: [], category: 'merch', price: 0, stock: 0, status: 'draft', variants: [] };

export default function Products() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('grid');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date', 200),
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, images: [...(prev.images || []), file_url] }));
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const [formErrors, setFormErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Le nom (EN) est obligatoire.';
    if (!form.price || form.price <= 0) errs.price = 'Le prix doit être supérieur à 0.';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    if (editing) {
      await base44.entities.Product.update(editing.id, form);
    } else {
      await base44.entities.Product.create(form);
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await base44.entities.Product.delete(id);
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const openEdit = (p) => { setEditing(p); setForm(p); setFormErrors({}); setDialogOpen(true); };
  const openNew = () => { setEditing(null); setForm(emptyProduct); setFormErrors({}); setDialogOpen(true); };

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title="Souq — Products">
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={openNew} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
            <Plus className="w-4 h-4 mr-2" /> {t('add')}
          </Button>
        </div>
      </TopBar>

      {isLoading && <p className="text-[#8A8A8A]">{t('loading')}</p>}

      {view === 'list' && (
        <div className="glass-card rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5 text-[#8A8A8A] text-xs">
              <th className="text-left px-4 py-3 font-medium">Produit</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Catégorie</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Prix</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Stock</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Statut</th>
              <th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} className={`group border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center"><Image className="w-4 h-4 text-[#8A8A8A]/30" /></div>
                    )}
                    <span className="font-medium text-[#F5F0EB]">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[#C9A96E]">{p.category?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm font-bold text-[#F5F0EB]">€{p.price?.toFixed(2)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#8A8A8A]">{p.stock}</td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Badge className={`${statusColors[p.status]} text-xs`}>{p.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {['draft', 'published', 'sold_out'].map(status => (
            <div key={status} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-3">
                <Badge className={`${statusColors[status]} text-xs`}>{status.replace('_', ' ')}</Badge>
                <span className="text-xs text-[#8A8A8A]">{products.filter(p => p.status === status).length}</span>
              </div>
              <div className="space-y-2">
                {products.filter(p => p.status === status).map(p => (
                  <div key={p.id} className="glass-card rounded-lg p-3 group">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium text-[#F5F0EB] flex-1">{p.name}</p>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => openEdit(p)} className="p-1 rounded hover:bg-white/10 text-[#8A8A8A]"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-[#C9A96E] mt-1">{p.category?.replace('_', ' ')}</p>
                    <p className="text-sm font-bold text-[#F5F0EB] mt-1">€{p.price?.toFixed(2)}</p>
                    <p className="text-xs text-[#8A8A8A]">{p.stock} en stock</p>
                  </div>
                ))}
                {products.filter(p => p.status === status).length === 0 && (
                  <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-[#8A8A8A]">Aucun</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'grid' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(p => (
          <div key={p.id} className="glass-card rounded-xl overflow-hidden group hover:border-[#C9A96E]/20 transition-all">
            {p.images?.[0] ? (
              <img src={p.images[0]} alt="" className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-[#C9A96E]/10 to-[#B34233]/10 flex items-center justify-center">
                <Image className="w-10 h-10 text-[#8A8A8A]/30" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-[#F5F0EB]">{p.name}</h3>
                  <p className="text-xs text-[#C9A96E] mt-0.5">{p.category?.replace('_', ' ')}</p>
                </div>
                <Badge className={`${statusColors[p.status]} text-xs`}>{p.status}</Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-[#F5F0EB]">€{p.price?.toFixed(2)}</span>
                <span className="text-xs text-[#8A8A8A]">{p.stock} in stock</span>
              </div>
              <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(p)} className="flex-1 p-2 rounded-lg bg-white/5 text-[#8A8A8A] hover:text-[#F5F0EB] text-xs">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && !isLoading && (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-20 text-[#8A8A8A]">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t('no_data')}</p>
          </div>
        )}
      </div>}

      <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-[#F5F0EB] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Edit Product' : 'New Product'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (EN) *</Label>
                <Input value={form.name} onChange={e => { setForm(p => ({...p, name: e.target.value})); if (e.target.value.trim()) setFormErrors(er => ({...er, name: undefined})); }} className={`bg-[#0A0A0A] border-white/10 ${formErrors.name ? 'border-red-400' : ''}`} />
                {formErrors.name && <p className="text-xs text-red-400">{formErrors.name}</p>}
              </div>
              <div className="space-y-2"><Label>Nom (FR)</Label><Input value={form.name_fr || ''} onChange={e => setForm(p => ({...p, name_fr: e.target.value}))} className="bg-[#0A0A0A] border-white/10" /></div>
            </div>
            <div className="space-y-2"><Label>Description (EN)</Label><Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="bg-[#0A0A0A] border-white/10 h-20" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v}))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="sold_out">Sold Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix (€) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={e => { setForm(p => ({...p, price: parseFloat(e.target.value) || 0})); if (parseFloat(e.target.value) > 0) setFormErrors(er => ({...er, price: undefined})); }} className={`bg-[#0A0A0A] border-white/10 ${formErrors.price ? 'border-red-400' : ''}`} />
                {formErrors.price && <p className="text-xs text-red-400">{formErrors.price}</p>}
              </div>
              <div className="space-y-2"><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm(p => ({...p, stock: parseInt(e.target.value) || 0}))} className="bg-[#0A0A0A] border-white/10" /></div>
            </div>
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="flex gap-2 flex-wrap">
                {form.images?.map((img, i) => (
                  <div key={i} className="relative w-16 h-16">
                    <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[#C9A96E]/40 transition-colors">
                  {uploading ? <div className="w-4 h-4 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" /> : <Upload className="w-5 h-5 text-[#8A8A8A]" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-[#8A8A8A]">Cancel</Button>
            <Button onClick={handleSave} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      </>
    </div>
  );
}