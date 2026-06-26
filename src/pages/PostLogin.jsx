import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

/**
 * PostLogin — smart redirect page after authentication.
 * Reads the user's role + module permissions and redirects
 * them to the correct space automatically.
 */
export default function PostLogin() {
  const [status, setStatus] = useState('Vérification de vos accès...');

  useEffect(() => {
    async function redirect() {
      const user = await base44.auth.me().catch(() => null);
      if (!user) {
        base44.auth.redirectToLogin(createPageUrl('PostLogin'));
        return;
      }

      // Admins always go to Dashboard
      if (user.role === 'admin') {
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      // Fetch permissions record
      const perms = await base44.entities.ModulePermissions
        .filter({ user_email: user.email })
        .then(r => r?.[0])
        .catch(() => null);

      if (!perms) {
        // No permissions record → personal account page
        setStatus('Redirection vers votre espace...');
        window.location.href = createPageUrl('MyAccount');
        return;
      }

      if (perms.status === 'suspended' || perms.status === 'inactive') {
        window.location.href = createPageUrl('MyAccount');
        return;
      }

      // Managers always go to Dashboard
      if (perms.account_type === 'manager') {
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      // Team members → find first accessible module
      if (perms.account_type === 'team_member') {
        const LEVELS = ['no_access', 'read_only', 'editor', 'manager'];
        const MODULES = [
          { key: 'projects_access', page: 'Projects' },
          { key: 'events_access', page: 'Events' },
          { key: 'crm_access', page: 'CRM' },
          { key: 'souq_access', page: 'Products' },
          { key: 'communication_access', page: 'Content' },
        ];
        const accessible = MODULES.find(m => LEVELS.indexOf(perms[m.key] || 'no_access') > 0);
        window.location.href = createPageUrl(accessible ? accessible.page : 'MyAccount');
        return;
      }

      // Customers → personal account
      window.location.href = createPageUrl('MyAccount');
    }

    redirect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin mb-6" />
      <p className="text-[#8A8A8A] text-sm tracking-widest">{status}</p>
    </div>
  );
}