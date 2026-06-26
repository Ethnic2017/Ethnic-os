import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ImportAudience() {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [log, setLog] = useState([]);

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    return lines.slice(1).map(line => {
      // Handle quoted fields with commas inside
      const cols = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { inQ = !inQ; }
        else if (c === ',' && !inQ) { cols.push(cur); cur = ''; }
        else cur += c;
      }
      cols.push(cur);
      const row = {};
      headers.forEach((h, i) => row[h] = (cols[i] || '').replace(/^"|"$/g, '').trim());
      return row;
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('reading');
    const text = await file.text();
    const rows = parseCSV(text);
    setStatus('importing');
    setProgress({ done: 0, total: rows.length, errors: 0 });

    const BATCH = 50;
    let done = 0, errors = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map(r => {
        const prenom = r['Prénom'] || r['Prenom'] || '';
        const nom = r['Nom'] || '';
        const name = `${prenom} ${nom}`.trim() || 'Unknown';
        const tags = ['Shotgun', 'Audience'];
        if (r['Abonné à la newsletter'] === 'Oui') tags.push('Newsletter');
        
        const notes_parts = [];
        if (r['Genre']) notes_parts.push(`Genre: ${r['Genre']}`);
        if (r['Âge'] || r['Age']) notes_parts.push(`Âge: ${r['Âge'] || r['Age']}`);
        if (r['Zone géographique']) notes_parts.push(`Zone: ${r['Zone géographique']}`);
        if (r['Total dépensé'] && r['Total dépensé'] !== '0.00') notes_parts.push(`Dépensé: ${r['Total dépensé']}€`);
        if (r['Total évènements'] && r['Total évènements'] !== '') notes_parts.push(`Évènements: ${r['Total évènements']}`);
        if (r['Département']) notes_parts.push(`Dept: ${r['Département']}`);

        return {
          name,
          email: r['E-mail'] || undefined,
          phone: r['Téléphone'] || undefined,
          city: r['Ville'] || undefined,
          country: r['Pays'] || undefined,
          tags,
          pipeline: 'lead',
          notes: notes_parts.join(' | ') || undefined,
        };
      });

      try {
        await base44.entities.People.bulkCreate(batch);
        done += batch.length;
      } catch (err) {
        errors += batch.length;
        setLog(prev => [...prev, `Erreur batch ${i}-${i+BATCH}: ${err.message}`]);
      }
      setProgress({ done, total: rows.length, errors });
    }

    setStatus('done');
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold text-[#C9A96E]">Import Audience Shotgun → CRM</h1>

      {status === 'idle' && (
        <label className="cursor-pointer border-2 border-dashed border-[#C9A96E]/40 rounded-xl p-10 text-center hover:border-[#C9A96E] transition-colors">
          <div className="text-lg mb-2">📁 Déposer le fichier CSV ici</div>
          <div className="text-sm text-gray-400">audience.csv (export Shotgun)</div>
          <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </label>
      )}

      {(status === 'reading' || status === 'importing') && (
        <div className="w-full max-w-md">
          <div className="flex justify-between text-sm mb-2">
            <span>{status === 'reading' ? 'Lecture du fichier...' : `Import en cours...`}</span>
            <span>{progress.done} / {progress.total}</span>
          </div>
          <div className="w-full bg-[#1A1A1A] rounded-full h-3">
            <div className="bg-[#C9A96E] h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-gray-400 mt-1">{pct}% — {progress.errors} erreurs</div>
        </div>
      )}

      {status === 'done' && (
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-xl font-bold text-[#C9A96E]">{progress.done} contacts importés</div>
          {progress.errors > 0 && <div className="text-red-400 mt-1">{progress.errors} erreurs</div>}
          {log.map((l, i) => <div key={i} className="text-xs text-red-300 mt-1">{l}</div>)}
          <a href="/" className="mt-6 inline-block px-6 py-2 bg-[#C9A96E] text-black rounded-lg font-semibold">
            Retour au dashboard
          </a>
        </div>
      )}
    </div>
  );
}