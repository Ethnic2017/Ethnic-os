import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all People records (up to 2000)
  let all = [];
  let skip = 0;
  const limit = 200;
  while (true) {
    const batch = await base44.asServiceRole.entities.People.list(null, limit, skip);
    if (!batch || batch.length === 0) break;
    all = all.concat(batch);
    if (batch.length < limit) break;
    skip += limit;
  }

  // Filter only those that still have notes with "Total dépensé"
  const toMigrate = all.filter(p => p.notes && p.notes.includes('Total dépensé'));

  let updated = 0;
  let failed = 0;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  for (const person of toMigrate) {
    try {
      const match = person.notes.match(/Total d[ée]pens[ée]\s*:\s*([\d.]+)/i);
      const total_spent = match ? parseFloat(match[1]) : 0;
      await base44.asServiceRole.entities.People.update(person.id, {
        total_spent,
        notes: ''
      });
      updated++;
      await sleep(200); // avoid rate limit
    } catch (e) {
      failed++;
      await sleep(500);
    }
  }

  return Response.json({
    total_found: toMigrate.length,
    updated,
    failed,
    message: `Migration terminée : ${updated} enregistrements mis à jour.`
  });
});