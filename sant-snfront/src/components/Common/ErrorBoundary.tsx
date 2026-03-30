import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const isDomMutationError = (error: Error | null): boolean => {
  if (!error) return false;
  const text = `${error.name} ${error.message}`.toLowerCase();
  return text.includes('notfounderror') || text.includes('removechild');
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const domMutationError = isDomMutationError(this.state.error);

      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h1 className="text-lg font-bold text-gray-900">Erreur</h1>
              </div>
              <p className="text-gray-600 mb-4">
                {domMutationError
                  ? "Une extension navigateur ou la traduction automatique a modifié le DOM de la page."
                  : 'Une erreur est survenue lors du chargement de la page.'}
              </p>
              {domMutationError && (
                <p className="text-sm text-gray-500 mb-4">
                  Désactive les extensions (ou ouvre en navigation privée sans extension), puis recharge.
                </p>
              )}
              <details className="text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded">
                <summary className="cursor-pointer font-medium">Détails</summary>
                <pre className="mt-2 overflow-auto text-xs">{this.state.error?.toString()}</pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Recharger la page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
