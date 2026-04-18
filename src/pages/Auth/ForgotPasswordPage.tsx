import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { FormInput } from '@/components/Common/FormElements';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';

type DebugStatus = '' | 'USER_NOT_FOUND' | 'EMAIL_SENT' | 'SMTP_NOT_CONFIGURED' | 'SMTP_SEND_FAILED';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [debugResetLink, setDebugResetLink] = useState('');
  const [debugStatus, setDebugStatus] = useState<DebugStatus>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugResetLink('');
    setDebugStatus('');
    setIsLoading(true);

    try {
      const response = await apiService.post(API_ENDPOINTS.auth.forgotPassword, {
        email: email.trim().toLowerCase(),
      });
      const payload = (response as any)?.data || response;
      setDebugResetLink(typeof payload?.debugResetLink === 'string' ? payload.debugResetLink : '');
      setDebugStatus(typeof payload?.debugStatus === 'string' ? payload.debugStatus as DebugStatus : '');
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    const hasDeliveryIssue =
      debugStatus === 'SMTP_NOT_CONFIGURED' || debugStatus === 'SMTP_SEND_FAILED';
    const title =
      debugStatus === 'USER_NOT_FOUND'
        ? 'Demande traitée'
        : hasDeliveryIssue
          ? 'Lien disponible en local'
          : 'Courriel envoyé !';
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="card-health text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold font-display mb-2">{title}</h1>
            <p className="text-muted-foreground mb-6">
              Si un compte existe avec l&apos;adresse <strong>{email}</strong>,{' '}
              {hasDeliveryIssue
                ? "l'email n'a pas pu être envoyé automatiquement."
                : 'un lien de réinitialisation vous sera envoyé.'}
            </p>

            {debugResetLink && (
              <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-left">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  Mode développement
                </p>
                <p className="mt-1 text-xs text-amber-900">
                  {hasDeliveryIssue
                    ? "L'email n'a pas pu partir. Utilisez ce lien direct de réinitialisation :"
                    : 'Utilisez aussi ce lien direct de réinitialisation :'}
                </p>
                <a
                  href={debugResetLink}
                  className="mt-2 block break-all text-xs font-medium text-amber-900 underline"
                >
                  {debugResetLink}
                </a>
              </div>
            )}

            {!debugResetLink && debugStatus === 'USER_NOT_FOUND' && (
              <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-xs text-amber-900">
                Mode développement : aucun compte actif ne correspond à cette adresse email.
              </p>
            )}

            {!debugResetLink && (debugStatus === 'SMTP_NOT_CONFIGURED' || debugStatus === 'SMTP_SEND_FAILED') && (
              <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-xs text-amber-900">
                Mode développement : l&apos;email n&apos;a pas pu être envoyé par SMTP.
              </p>
            )}

            <Link to="/auth/login" className="btn-health-primary inline-flex">
              <ArrowLeft className="h-5 w-5" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card-health">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-display">Mot de passe oublié ?</h1>
            <p className="text-muted-foreground mt-2">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="relative">
              <FormInput
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                autoComplete="email"
                required
              />
              <Mail className="absolute right-3 top-10 h-5 w-5 text-muted-foreground" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-health-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le lien'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link
              to="/auth/login"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
