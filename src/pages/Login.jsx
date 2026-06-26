import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/Dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      navigate(from.startsWith('http') ? '/Dashboard' : from, { replace: true });
    }
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rotate-45 border-2 border-[#C9A96E] mb-6">
            <span className="text-[#C9A96E] font-bold text-xl -rotate-45">E</span>
          </div>
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
