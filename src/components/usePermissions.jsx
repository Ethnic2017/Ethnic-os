import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useState, useEffect } from 'react';

const LEVELS = ['no_access', 'read_only', 'editor', 'manager'];

/**
 * Central permissions hook.
 * Usage: const { user, permissions, can, isAdmin, isLoading } = usePermissions();
 * can('projects', 'editor') => true/false
 * can('crm', 'read_only') => true/false
 */
export function usePermissions() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); setUserLoading(false); })
      .catch(() => setUserLoading(false));
  }, []);

  const { data: permissions, isLoading: permLoading } = useQuery({
    queryKey: ['my-permissions', user?.email],
    queryFn: async () => {
      const results = await base44.entities.ModulePermissions.filter({ user_email: user.email });
      if (results && results.length > 0) {
        const rec = results[0];
        // Migrate old records that have no_access on all modules (default blank creation)
        const allNoAccess = ['projects_access','events_access','communication_access','souq_access','crm_access']
          .every(k => !rec[k] || rec[k] === 'no_access');
        if (allNoAccess && user.role !== 'admin') {
          const updated = await base44.entities.ModulePermissions.update(rec.id, {
            projects_access: 'read_only',
            events_access: 'read_only',
            communication_access: 'read_only',
            souq_access: 'read_only',
            crm_access: 'read_only',
          });
          return { ...rec, ...updated };
        }
        return rec;
      }

      // Auto-create a minimal permissions record for first-time login
      // Admins get full access via isAdmin flag, no need to create a record
      if (user.role !== 'admin') {
        const created = await base44.entities.ModulePermissions.create({
          user_email: user.email,
          user_name: user.full_name || '',
          account_type: 'customer',
          status: 'active',
          projects_access: 'read_only',
          events_access: 'read_only',
          communication_access: 'read_only',
          souq_access: 'read_only',
          crm_access: 'read_only',
        });
        return created;
      }
      return null;
    },
    enabled: !!user?.email,
    staleTime: 30000, // permissions are stable for 30s, then re-fetched
  });

  const isAdmin = user?.role === 'admin';
  const isLoading = userLoading || permLoading;

  /**
   * can(module, level)
   * module: 'projects' | 'events' | 'crm' | 'souq' | 'communication'
   * level: 'read_only' | 'editor' | 'manager'
   */
  const can = (module, level = 'read_only') => {
    if (isAdmin) return true;
    if (!permissions) return false;
    // Suspended or inactive users have no access
    if (permissions.status && permissions.status !== 'active') return false;
    const key = `${module}_access`;
    const userLevel = permissions[key] || 'read_only';
    return LEVELS.indexOf(userLevel) >= LEVELS.indexOf(level);
  };

  return { user, permissions, can, isAdmin, isLoading };
}