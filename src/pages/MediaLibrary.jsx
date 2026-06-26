import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import TopBar from '../components/admin/TopBar';
import { Upload, Copy, Trash2, Image, Search, Check, X } from 'lucide-react';

// We store media in a simple entity-less approach: files uploaded via Core.UploadFile
// and stored as a MediaItem entity
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function MediaLibrary() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef();
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [selected, setSelected] = useState([]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media-items'],
    queryFn: () => base44.entities.MediaItem.list('-created_date', 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MediaItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media-items'] }),
  });

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.MediaItem.create({
        url: file_url,
        name: file.name,
        size: file.size,
        mime_type: file.type,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['media-items'] });
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  const copyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const deleteSelected = async () => {
    if (!confirm(`Supprimer ${selected.length} fichier(s) ?`)) return;
    for (const id of selected) await deleteMutation.mutateAsync(id);
    setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const filtered = items.filter(i =>
    !search || i.name?.toLowerCase().includes(search.toLowerCase())
  );

  const isImage = (mime) => mime?.startsWith('image/');

  return (
    <div className="max-w-7xl mx-auto">
      <TopBar title="Médiathèque">
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer ({selected.length})
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A96E] text-[#0A0A0A] text-xs font-semibold rounded-lg hover:bg-[#E0CBA8] transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Envoi...' : 'Importer'}
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => handleUpload(e.target.files)} />
        </div>
      </TopBar>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-sm text-[#8A8A8A]">
        <span>{items.length} fichier{items.length > 1 ? 's' : ''}</span>
        {selected.length > 0 && <span className="text-[#C9A96E]">{selected.length} sélectionné{selected.length > 1 ? 's' : ''}</span>}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm text-[#F5F0EB] placeholder-[#555] focus:outline-none focus:border-[#C9A96E]/30"
        />
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center mb-6 hover:border-[#C9A96E]/30 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-[#8A8A8A] mx-auto mb-2" />
        <p className="text-sm text-[#8A8A8A]">Glissez des images ici ou <span className="text-[#C9A96E]">cliquez pour importer</span></p>
        <p className="text-xs text-[#555] mt-1">PNG, JPG, GIF, WebP, MP4...</p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-[#8A8A8A] text-sm">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#8A8A8A]">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aucun média importé</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`group relative rounded-xl overflow-hidden bg-[#1A1A1A] border-2 transition-all cursor-pointer ${
                selected.includes(item.id) ? 'border-[#C9A96E]' : 'border-transparent hover:border-white/20'
              }`}
              onClick={() => toggleSelect(item.id)}
            >
              {/* Thumbnail */}
              <div className="aspect-square">
                {isImage(item.mime_type) ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8A8A8A]">
                    <Image className="w-8 h-8 opacity-30" />
                  </div>
                )}
              </div>

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); copyUrl(item.url, item.id); }}
                  className="p-2 bg-[#1A1A1A] rounded-lg text-[#F5F0EB] hover:text-[#C9A96E] transition-colors"
                  title="Copier l'URL"
                >
                  {copied === item.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteMutation.mutate(item.id); }}
                  className="p-2 bg-[#1A1A1A] rounded-lg text-[#8A8A8A] hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Selected indicator */}
              {selected.includes(item.id) && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#C9A96E] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#0A0A0A]" />
                </div>
              )}

              {/* Name */}
              <div className="p-2">
                <p className="text-[10px] text-[#8A8A8A] truncate">{item.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}