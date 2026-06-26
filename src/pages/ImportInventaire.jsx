import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import TopBar from '../components/admin/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FolderOpen, Check, X, Loader2, Image, ChevronRight, PackagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const categoryLabels = {
  tapis: 'Tapis', tissu: 'Tissu', pouf_coussin: 'Pouf / Coussin',
  lumiere: 'Lumière', dreamcatcher: 'Dreamcatcher',
  mobilier: 'Mobilier', accessoire: 'Accessoire', autre: 'Autre'
};

// Try to guess category from folder/file name
function guessCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('tapis') || n.includes('carpet') || n.includes('rug') || n.includes('margoum')) return 'tapis';
  if (n.includes('tissu') || n.includes('fabric') || n.includes('chemin')) return 'tissu';
  if (n.includes('pouf') || n.includes('coussin') || n.includes('pillow') || n.includes('cushion')) return 'pouf_coussin';
  if (n.includes('lantern') || n.includes('lanterne') || n.includes('lumiere') || n.includes('light') || n.includes('guirlande') || n.includes('bougie')) return 'lumiere';
  if (n.includes('dream') || n.includes('dreamcatcher') || n.includes('capteur')) return 'dreamcatcher';
  if (n.includes('tabouret') || n.includes('meuble') || n.includes('chaise') || n.includes('table')) return 'mobilier';
  if (n.includes('chapeau') || n.includes('collier') || n.includes('tote') || n.includes('bag') || n.includes('ecocup') || n.includes('bijou')) return 'accessoire';
  return 'autre';
}

function cleanName(filename) {
  // Remove extension and clean up
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\d{8,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isImage(filename) {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename);
}

// Group files by folder structure
function groupByFolder(files) {
  const groups = {};
  for (const file of files) {
    const parts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
    let groupKey, displayName;

    if (parts.length >= 3) {
      // Deep folder: use subfolder as group
      groupKey = parts.slice(0, -1).join('/');
      displayName = parts[parts.length - 2];
    } else if (parts.length === 2) {
      // One level: folder/file.jpg → group by folder
      groupKey = parts[0];
      displayName = parts[0];
    } else {
      // Root level: group by filename stem
      groupKey = cleanName(file.name);
      displayName = cleanName(file.name);
    }

    if (!groups[groupKey]) {
      groups[groupKey] = { key: groupKey, displayName, files: [] };
    }
    groups[groupKey].files.push(file);
  }
  return Object.values(groups);
}

export default function ImportInventaire() {
  const queryClient = useQueryClient();
  const folderInputRef = useRef();
  const fileInputRef = useRef();

  const [items, setItems] = useState([]); // parsed groups ready to review
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [done, setDone] = useState(false);

  const processFiles = (allFiles) => {
    const imageFiles = Array.from(allFiles).filter(f => isImage(f.name));
    if (!imageFiles.length) {
      alert('Aucune image trouvée dans la sélection.');
      return;
    }

    const groups = groupByFolder(imageFiles);

    // Build item drafts
    const drafts = groups.map(group => {
      const guessed = guessCategory(group.displayName);
      return {
        id: group.key,
        name: group.displayName.charAt(0).toUpperCase() + group.displayName.slice(1),
        category: guessed,
        quantity: 1,
        condition: 'bon',
        dimensions: '',
        notes: '',
        files: group.files, // raw File objects
        previews: group.files.map(f => URL.createObjectURL(f)),
        uploadedUrls: [],
        status: 'pending', // pending | uploading | done | error
      };
    });

    setItems(drafts);
    setDone(false);
    setSavedCount(0);
  };

  const handleFolderSelect = (e) => {
    processFiles(e.target.files);
  };

  const handleFileSelect = (e) => {
    processFiles(e.target.files);
  };

  const updateItem = (id, patch) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleSaveAll = async () => {
    if (!items.length) return;
    setSaving(true);
    let count = 0;

    for (const item of items) {
      // Upload photos
      updateItem(item.id, { status: 'uploading' });
      const urls = [];
      for (const file of item.files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }

      // Create entity
      await base44.entities.DecoItem.create({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        quantity_available: item.quantity,
        condition: item.condition,
        dimensions: item.dimensions || undefined,
        notes: item.notes || undefined,
        photos: urls,
      });

      updateItem(item.id, { status: 'done', uploadedUrls: urls });
      count++;
      setSavedCount(count);
    }

    queryClient.invalidateQueries({ queryKey: ['deco-items'] });
    setSaving(false);
    setDone(true);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <TopBar title="Import Inventaire Déco">
        <Link to="/Inventaire">
          <Button variant="outline" className="border-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]">
            <ChevronRight className="w-4 h-4 mr-1" /> Voir l'inventaire
          </Button>
        </Link>
      </TopBar>

      {/* Upload zone */}
      {!items.length && (
        <div className="glass-card rounded-2xl p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A96E]/10 flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8 text-[#C9A96E]" />
          </div>
          <div>
            <h2 className="text-lg font-display text-[#F5F0EB] mb-2">Importer des articles</h2>
            <p className="text-sm text-[#8A8A8A] max-w-md mx-auto">
              Sélectionne un <strong className="text-[#F5F0EB]">dossier</strong> ou des <strong className="text-[#F5F0EB]">images</strong>.
              Les sous-dossiers deviennent automatiquement des articles séparés avec la catégorie détectée.
            </p>
            <p className="text-xs text-[#8A8A8A]/60 mt-1">Exemple : <code className="bg-white/5 px-1 rounded">Tapis/photo1.jpg</code> → article "Tapis" catégorie tapis</p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={() => folderInputRef.current?.click()}
              className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]"
            >
              <FolderOpen className="w-4 h-4 mr-2" /> Sélectionner un dossier
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-white/10 text-[#8A8A8A] hover:text-[#F5F0EB]"
            >
              <Image className="w-4 h-4 mr-2" /> Sélectionner des images
            </Button>
          </div>
          <input ref={folderInputRef} type="file" webkitdirectory="true" multiple className="hidden" onChange={handleFolderSelect} />
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>
      )}

      {/* Review */}
      {items.length > 0 && !done && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#8A8A8A]"><span className="text-[#C9A96E] font-semibold">{items.length}</span> articles détectés — vérifiez et ajustez avant d'importer</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setItems([])} className="border-white/10 text-[#8A8A8A]" disabled={saving}>
                <X className="w-4 h-4 mr-1" /> Annuler
              </Button>
              <Button onClick={handleSaveAll} disabled={saving} className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Import {savedCount}/{items.length}</> : <><PackagePlus className="w-4 h-4 mr-2" /> Importer tout ({items.length})</>}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className={`glass-card rounded-xl p-4 flex gap-4 items-start ${item.status === 'done' ? 'opacity-60' : ''}`}>
                {/* Photos preview */}
                <div className="flex gap-1.5 shrink-0">
                  {item.previews.slice(0, 3).map((url, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-[#0A0A0A]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {item.previews.length > 3 && (
                    <div className="w-16 h-16 rounded-lg bg-[#0A0A0A] flex items-center justify-center text-xs text-[#8A8A8A]">+{item.previews.length - 3}</div>
                  )}
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-xs text-[#8A8A8A] mb-1">Nom</p>
                    <Input
                      value={item.name}
                      onChange={e => updateItem(item.id, { name: e.target.value })}
                      className="bg-[#0A0A0A] border-white/10 h-8 text-sm"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8A8A] mb-1">Catégorie</p>
                    <Select value={item.category} onValueChange={v => updateItem(item.id, { category: v })} disabled={saving}>
                      <SelectTrigger className="bg-[#0A0A0A] border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8A8A] mb-1">Qté</p>
                    <Input
                      type="number" min="1"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                      className="bg-[#0A0A0A] border-white/10 h-8 text-sm"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8A8A] mb-1">Dimensions</p>
                    <Input
                      value={item.dimensions}
                      onChange={e => updateItem(item.id, { dimensions: e.target.value })}
                      className="bg-[#0A0A0A] border-white/10 h-8 text-sm"
                      placeholder="ex: 1,8m*2m"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Status / remove */}
                <div className="shrink-0 flex items-center gap-2">
                  {item.status === 'done' && <Check className="w-5 h-5 text-green-400" />}
                  {item.status === 'uploading' && <Loader2 className="w-5 h-5 text-[#C9A96E] animate-spin" />}
                  {item.status === 'pending' && !saving && (
                    <button onClick={() => removeItem(item.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-[#8A8A8A] hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {done && (
        <div className="glass-card rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-lg font-display text-[#F5F0EB]">{savedCount} articles importés avec succès</h2>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => { setItems([]); setDone(false); }} variant="outline" className="border-white/10 text-[#8A8A8A]">
              Nouvel import
            </Button>
            <Link to="/Inventaire">
              <Button className="bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]">
                Voir l'inventaire
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}