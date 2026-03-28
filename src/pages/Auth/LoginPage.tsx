import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Loader2, Mail, Lock, Heart,
  ShieldCheck, Clock, Zap, UserPlus, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { useAuthStore, getRedirectPath } from '@/store/authStore';
import { ErrorAlert } from '@/components/Common/Alert';

/* ─── Right-panel trust items ─── */
const TRUST_ITEMS = [
  { Icon: ShieldCheck, text: 'Dossier médical 100 % sécurisé' },
  { Icon: Clock,       text: 'Consultations disponibles 24h / 7j' },
  { Icon: Zap,         text: 'Résultats et ordonnances instantanés' },
];

/* ─── Reusable field wrapper ─── */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

/* ─── Reusable input row ─── */
const InputRow: React.FC<{
  icon?: React.ReactNode;
  after?: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}> = ({ icon, after, children, active }) => (
  <div
    className={`flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3 transition-all duration-200
      ${active
        ? 'border-[#249E94] ring-2 ring-[#249E94]/20 bg-white'
        : 'border-gray-200 hover:border-[#3BC1A8]/60'}`}
  >
    {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
    <div className="flex-1 min-w-0">{children}</div>
    {after}
  </div>
);

export const LoginPage: React.FC = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [focused, setFocused]           = useState('');

  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(email, password);
    if (success) {
      const { user } = useAuthStore.getState();
      if (user) navigate(getRedirectPath(user.role));
    }
  };

  return (
    <div className="min-h-screen bg-[#f0fafa] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#3BC1A8]/10 rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#005461]/10 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl">

          {/* ══════════════ LEFT – Form ══════════════ */}
          <div className="w-full lg:w-[55%] bg-white flex flex-col">

            {/* Brand strip */}
            <div className="px-8 md:px-12 pt-8 pb-6 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  aria-label="Retour à l'accueil"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#005461] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="w-9 h-9 bg-[#3BC1A8] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Heart className="h-5 w-5 text-white fill-white" />
                  </div>
                  <span className="font-bold text-lg font-display">
                    <span className="text-[#005461]">SANTÉ</span>
                    <span className="text-[#3BC1A8]"> SN</span>
                  </span>
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                Pas encore inscrit ?{' '}
                <Link
                  to="/auth/register"
                  className="text-[#249E94] font-semibold hover:text-[#005461] transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>

            {/* Form area */}
            <div className="flex-1 px-8 md:px-12 py-10">
              {/* Title */}
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold font-display text-[#005461] mb-1">
                  Connexion
                </h1>
                <p className="text-gray-500 text-sm">Bon retour ! Entrez vos identifiants pour continuer.</p>
                <div className="mt-3 h-1 w-14 bg-[#3BC1A8] rounded-full" />
              </div>

              {/* Error */}
              {error && <ErrorAlert message={error} onClose={clearError} className="mb-5" />}

              <form onSubmit={handleSubmit} className="space-y-5">

                <Field label="Adresse email">
                  <InputRow icon={<Mail className="h-4 w-4" />} active={focused === 'email'}>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      placeholder="jean.diallo@email.com"
                      autoComplete="email"
                      required
                      className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                    />
                  </InputRow>
                </Field>

                <Field label="Mot de passe">
                  <InputRow
                    icon={<Lock className="h-4 w-4" />}
                    active={focused === 'password'}
                    after={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                      >
                        {showPassword
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused('')}
                      placeholder="Votre mot de passe"
                      autoComplete="current-password"
                      required
                      className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                    />
                  </InputRow>
                </Field>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          rememberMe ? 'bg-[#3BC1A8] border-[#3BC1A8]' : 'bg-white border-gray-300'
                        }`}
                        onClick={() => setRememberMe(!rememberMe)}
                      >
                        {rememberMe && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">Se souvenir de moi</span>
                  </label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm font-medium text-[#249E94] hover:text-[#005461] transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#005461] hover:bg-[#0C7779] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-[#005461]/20 hover:shadow-xl hover:scale-[1.01] mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connexion en cours…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      SE CONNECTER
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">ou</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Register CTA */}
                <Link
                  to="/auth/register"
                  className="w-full flex items-center justify-center gap-2 border-2 border-[#3BC1A8] text-[#005461] font-semibold py-3.5 rounded-xl text-sm hover:bg-[#e6f7f4] transition-all duration-200"
                >
                  <UserPlus className="h-4 w-4 text-[#3BC1A8]" />
                  Créer un nouveau compte
                </Link>
              </form>
            </div>
          </div>

          {/* ══════════════ RIGHT – Welcome Panel ══════════════ */}
          <div
            className="hidden lg:flex w-full lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
            style={{ background: 'linear-gradient(155deg, #005461 0%, #0C7779 50%, #249E94 100%)' }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/10 rounded-full pointer-events-none" />
            <div className="absolute top-1/3 right-8 w-32 h-32 border border-white/10 rounded-full pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full justify-between">

              {/* Top: brand + welcome */}
              <div>
                <div className="flex items-center gap-2 mb-10">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white fill-white" />
                  </div>
                  <span className="text-white font-bold text-lg font-display">SANTÉ SN</span>
                </div>

                <h2 className="text-3xl font-bold font-display text-white leading-tight mb-3">
                  Bienvenue !<br />
                  <span className="text-[#3BC1A8]">Bon retour</span> parmi nous.
                </h2>
                <p className="text-teal-100/80 text-sm leading-relaxed mb-8">
                  Connectez-vous pour accéder à votre dossier médical, vos rendez-vous et vos consultations en ligne.
                </p>

                {/* Feature highlights */}
                <div className="space-y-3 mb-10">
                  {[
                    { label: 'Consultations vidéo', desc: 'Rejoignez votre médecin en un clic' },
                    { label: 'Ordonnances numériques', desc: 'Accédez à vos prescriptions en ligne' },
                    { label: 'Suivi médical complet', desc: 'Historique et résultats centralisés' },
                  ].map(({ label, desc }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/10 border border-white/10"
                    >
                      <div className="w-1.5 h-1.5 bg-[#3BC1A8] rounded-full mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-white text-sm font-semibold leading-none">{label}</p>
                        <p className="text-teal-100/70 text-xs mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Register CTA on panel */}
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-2 bg-white text-[#005461] font-bold px-6 py-3 rounded-full hover:bg-teal-50 transition-all duration-300 shadow-lg shadow-black/10 hover:scale-105 text-sm"
                >
                  <UserPlus className="h-4 w-4 text-[#3BC1A8]" />
                  S'inscrire gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Bottom: trust */}
              <div className="border-t border-white/10 pt-6 space-y-3">
                {TRUST_ITEMS.map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#3BC1A8]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-3.5 w-3.5 text-[#3BC1A8]" />
                    </div>
                    <p className="text-teal-100/80 text-xs">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
