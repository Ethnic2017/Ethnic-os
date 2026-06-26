import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Supabase handles the token exchange automatically via the URL hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const type = searchParams.get('type');
        if (type === 'recovery') {
          // Password reset flow — redirect to a password update page
          navigate('/MyAccount', { replace: true });
        } else {
          navigate('/Dashboard', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#333333] border-t-[#C9A96E] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#8A8A8A] text-sm">Connexion en cours...</p>
      </div>
    </div>
  );
}
