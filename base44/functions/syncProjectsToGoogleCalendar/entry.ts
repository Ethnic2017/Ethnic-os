import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Google Calendar access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Fetch all projects with type='event'
    const projects = await base44.entities.Project.filter({
      type: 'event'
    });

    let synced = 0;
    let failed = 0;

    // Sync each event to Google Calendar
    for (const project of projects) {
      try {
        const event = {
          summary: project.name,
          description: project.description || '',
          location: project.location || '',
          start: {
            dateTime: project.start_date ? new Date(project.start_date + 'T' + (project.schedule_start || '00:00')).toISOString() : new Date().toISOString(),
            timeZone: 'Europe/Paris'
          },
          end: {
            dateTime: project.end_date ? new Date(project.end_date + 'T' + (project.schedule_end || '23:59')).toISOString() : new Date().toISOString(),
            timeZone: 'Europe/Paris'
          }
        };

        // Create event in Google Calendar
        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          }
        );

        if (response.ok) {
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return Response.json({
      message: 'Sync completed',
      synced,
      failed,
      total: projects.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});