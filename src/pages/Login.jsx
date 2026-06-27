import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [resetSent, setResetSent] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const from = searchParams.get('from') || '/Dashboard';
  const target = from.startsWith('http') ? '/Dashboard' : from;

  // Navigate once the session is actually established (avoids the race where
  // we'd redirect before AuthContext flips isAuthenticated → bounced to login).
  useEffect(() => {
    if (isAuthenticated) {
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, target, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
    // On success: AuthContext sets isAuthenticated → the effect above navigates.
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  };

  const handleMagicLink = async () => {
    if (!email) { setError('Entre ton email pour recevoir un lien.'); return; }
    setLoading(true); setError('');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (otpError) setError(otpError.message);
    else setMagicSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src="/logo.png"
            alt="Ethnic Community"
            className="w-20 h-20 mx-auto mb-6 object-contain"
          />
          <h1 className="text-white text-2xl font-light tracking-widest uppercase">Ethnic OS</h1>
          <p className="text-[#8A8A8A] text-sm mt-2 tracking-wide">Plateforme de gestion</p>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-lg p-8">
          {mode === 'login' ? (
            <>
              <h2 className="text-[#F5F0EB] text-lg font-medium mb-6">Connexion</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[#8A8A8A] text-xs uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#0A0A0A] border border-[#333333] text-[#F5F0EB] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[#8A8A8A] text-xs uppercase tracking-widest mb-2">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#0A0A0A] border border-[#333333] text-[#F5F0EB] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C9A96E] hover:bg-[#b8935a] text-black font-medium py-3 rounded text-sm tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              {/* Alternatives de connexion */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#222]"></div>
                <span className="text-[10px] text-[#555] uppercase tracking-widest">ou</span>
                <div className="flex-1 h-px bg-[#222]"></div>
              </div>
              {magicSent ? (
                <p className="text-[#C9A96E] text-xs text-center bg-[#C9A96E]/5 border border-[#C9A96E]/20 rounded px-3 py-2">
                  Lien de connexion envoyé ! Vérifie ta boîte mail.
                </p>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-2 bg-white text-[#1A1A1A] font-medium py-2.5 rounded text-sm hover:bg-[#f0f0f0] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Se connecter avec Google
                  </button>
                  <button
                    type="button"
                    onClick={handleMagicLink}
                    disabled={loading}
                    className="w-full border border-[#333] text-[#F5F0EB] py-2.5 rounded text-sm hover:border-[#C9A96E]/50 transition-colors disabled:opacity-50"
                  >
                    Recevoir un lien de connexion par email
                  </button>
                </div>
              )}

              <button
                onClick={() => { setMode('reset'); setError(''); }}
                className="mt-4 text-[#8A8A8A] hover:text-[#C9A96E] text-xs transition-colors w-full text-center"
              >
                Mot de passe oublié ?
              </button>
            </>
          ) : (
            <>
              <h2 className="text-[#F5F0EB] text-lg font-medium mb-2">Réinitialiser le mot de passe</h2>
              {resetSent ? (
                <div className="text-center py-6">
                  <p className="text-[#C9A96E] text-sm mb-2">Email envoyé !</p>
                  <p className="text-[#8A8A8A] text-xs">Vérifiez votre boîte mail pour réinitialiser votre mot de passe.</p>
                  <button
                    onClick={() => { setMode('login'); setResetSent(false); }}
                    className="mt-4 text-[#8A8A8A] hover:text-[#C9A96E] text-xs transition-colors"
                  >
                    ← Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <p className="text-[#8A8A8A] text-xs mb-4">
                    Entrez votre email pour recevoir un lien de réinitialisation.
                  </p>
                  <div>
                    <label className="block text-[#8A8A8A] text-xs uppercase tracking-widest mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-[#0A0A0A] border border-[#333333] text-[#F5F0EB] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors"
                      placeholder="votre@email.com"
                    />
                  </div>
                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#C9A96E] hover:bg-[#b8935a] text-black font-medium py-3 rounded text-sm tracking-wide transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="w-full text-[#8A8A8A] hover:text-[#C9A96E] text-xs transition-colors"
                  >
                    ← Retour à la connexion
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-[#8A8A8A] text-xs mt-6">
          © 2024 Ethnic Community — ethnic-community.org
        </p>
      </div>
    </div>
  );
}
