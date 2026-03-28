import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorAlert, SuccessAlert } from '@/components/Common/Alert';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide ou expiré');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.post(API_ENDPOINTS.auth.resetPassword, {
        token,
        password,
      });

      setSuccess('Mot de passe réinitialisé avec succès! Redirection...');
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorAlert
            message="Lien de réinitialisation invalide ou expiré. Demandez un nouveau lien."
            onClose={() => navigate('/auth/forgot-password')}
            className="mb-6"
          />
          <Button onClick={() => navigate('/auth/forgot-password')} className="w-full">
            Demander un nouveau lien
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-primary rounded-full -translate-x-20 -translate-y-20 opacity-80" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary rounded-full translate-x-20 translate-y-20 opacity-80" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-display mb-2">
              Réinitialiser le mot de passe
            </h1>
            <p className="text-muted-foreground">
              Entrez votre nouveau mot de passe ci-dessous
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <ErrorAlert
              message={error}
              onClose={() => setError('')}
              className="mb-6"
            />
          )}
          {success && (
            <SuccessAlert
              message={success}
              className="mb-6"
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
              <div className="flex items-center border-l-4 border-primary bg-muted/30 rounded-lg px-4 py-4 focus-within:bg-muted/50 transition-colors">
                <Lock className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre nouveau mot de passe"
                  autoComplete="new-password"
                  required
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Au moins 8 caractères
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
              <div className="flex items-center border-l-4 border-primary bg-muted/30 rounded-lg px-4 py-4 focus-within:bg-muted/50 transition-colors">
                <Lock className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmNewPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  autoComplete="new-password"
                  required
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Show Password Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 rounded border-input cursor-pointer accent-primary"
              />
              <span className="text-sm text-muted-foreground">Afficher les mots de passe</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 mt-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Réinitialiser le mot de passe
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground text-sm">
              Vous vous souvenez de votre mot de passe?{' '}
              <a href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
