import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let skip = 0;
  const limit = 200;
  let totalUpdated = 0;
  let totalSkipped = 0;

  while (true) {
    const batch = await base44.asServiceRole.entities.People.list('-created_date', limit, skip);
    if (!batch || batch.length === 0) break;

    for (const person of batch) {
      const notes = person.notes || '';
      if (!notes.includes('Total')) {
        totalSkipped++;
        continue;
      }

      // Extract the numeric value after "Total dépensé: "
      const match = notes.match(/Total\s+d[ée]pens[ée]\s*:\s*([\d.]+)/i);
      const amount = match ? parseFloat(match[1]) : 0.0;

      await base44.asServiceRole.entities.People.update(person.id, {
        total_spent: amount,
        notes: ''
      });
      totalUpdated++;
    }

    if (batch.length < limit) break;
    skip += limit;
  }

  return Response.json({
    success: true,
    updated: totalUpdated,
    skipped: totalSkipped
  });
});