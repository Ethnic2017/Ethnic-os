import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

// One-time tool to restore tags (Paris, Newsletter) lost during male/female cleanup
// Logic: read notes field to determine if person was from Paris and/or had newsletter
// Notes format: "Ajouté: ...; Total dépensé: X.X"
// Tags to restore from city field: Paris
// Tags to restore: Newsletter (if city was Paris → they were Shotgun Paris audience)

export default function FixTags() {
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const runFix = async () => {
    setStatus('running');
    setLog([]);

    // Fetch all people with empty tags
    const all = await base44.entities.People.list('-created_date', 1500);
    const empty = all.filter(p => !p.tags || p.tags.length === 0);
    
    setProgress({ done: 0, total: empty.length });
    setLog([`${empty.length} contacts avec tags vides trouvés`]);

    let fixed = 0;
    const BATCH = 20;

    for (let i = 0; i < empty.length; i += BATCH) {
      const batch = empty.slice(i, i + BATCH);
      await Promise.all(batch.map(async (p) => {
        const tags = [];
        // Restore city tag if Paris
        if (p.city === 'Paris') tags.push('Paris');
        // Restore Newsletter tag if they were newsletter subscribers
        // We can infer from notes — original import tagged newsletter contacts
        // Since we can't recover that info cleanly, we add "Client Shotgun" for all
        tags.push('Client Shotgun');
        await base44.entities.People.update(p.id, { tags });
        fixed++;
      }));
      setProgress({ done: i + batch.length, total: empty.length });
    }

    setLog(prev => [...prev, `✅ ${fixed} contacts restaurés avec tags`]);
    setStatus('done');
  };

  const runNewsletterFix = async () => {
    setStatus('running');
    setLog([]);

    // Contacts that still have 'newsletter' tag → rename to 'Newsletter'
    const all = await base44.entities.People.list('-created_date', 1500);
    const withNewsletter = all.filter(p => (p.tags || []).includes('newsletter'));
    
    setProgress({ done: 0, total: withNewsletter.length });
    setLog([`${withNewsletter.length} contacts avec tag 'newsletter' (lowercase) trouvés`]);

    let fixed = 0;
    for (let i = 0; i < withNewsletter.length; i += 20) {
      const batch = withNewsletter.slice(i, i + 20);
      await Promise.all(batch.map(async (p) => {
        const newTags = (p.tags || []).map(t => t === 'newsletter' ? 'Newsletter' : t);
        await base44.entities.People.update(p.id, { tags: newTags });
        fixed++;
      }));
      setProgress({ done: i + batch.length, total: withNewsletter.length });
    }

    setLog(prev => [...prev, `✅ ${fixed} tags 'newsletter' → 'Newsletter'`]);
    setStatus('done');
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <div className="glass-card rounded-2xl p-6">
        <h1 className="text-xl font-display text-[#F5F0EB] mb-2">🔧 Fix Tags — Admin Tool</h1>
        <p className="text-sm text-[#8A8A8A] mb-6">Restaure les tags perdus lors du nettoyage male/female.</p>

        <div className="space-y-3">
          <Button
            onClick={runFix}
            disabled={status === 'running'}
            className="w-full bg-[#C9A96E] text-[#0A0A0A] hover:bg-[#E0CBA8]"
          >
            1. Restaurer tags vides (Paris + Client Shotgun)
          </Button>

          <Button
            onClick={runNewsletterFix}
            disabled={status === 'running'}
            variant="outline"
            className="w-full border-white/10 text-[#F5F0EB]"
          >
            2. Normaliser 'newsletter' → 'Newsletter'
          </Button>
        </div>

        {status === 'running' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#8A8A8A] mb-1">
              <span>Progression</span>
              <span>{progress.done} / {progress.total}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C9A96E] transition-all duration-300"
                style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="mt-4 p-3 bg-black/30 rounded-lg space-y-1">
            {log.map((l, i) => <p key={i} className="text-xs text-[#8A8A8A]">{l}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}