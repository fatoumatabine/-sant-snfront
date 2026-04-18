import React, { useState } from 'react';
import { Brain, ChevronRight, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { questionsEvaluationIA } from '@/lib/iaEvaluation';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { toast } from 'sonner';
import { savePatientTriage } from '@/lib/patientTriage';

const OTHER_OPTION_LABEL = 'Autre';

type ApiDataEnvelope<T> = T | { data?: T };

const unwrapApiData = <T,>(response: ApiDataEnvelope<T>): T => {
  if (typeof response === 'object' && response !== null && 'data' in response && response.data !== undefined) {
    return response.data;
  }

  return response as T;
};

export const IAEvaluation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [reponses, setReponses] = useState<Record<string, string | string[]>>({});
  const [otherChoiceSelections, setOtherChoiceSelections] = useState<Record<string, boolean>>({});
  const [otherChoiceInputs, setOtherChoiceInputs] = useState<Record<string, string>>({});
  const [resultat, setResultat] = useState<{
    id: number;
    niveau: 'faible' | 'modere' | 'eleve';
    urgent: boolean;
    recommandations: string[];
    specialiteConseillee?: string | null;
    redFlags: string[];
    needsHumanReview: boolean;
    orientation: 'auto_soin' | 'rendez_vous' | 'urgence' | 'revue_humaine';
    aiModel?: string | null;
    createdAt: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  type TriageHistoryItem = {
    id: number;
    niveau: 'faible' | 'modere' | 'eleve';
    urgent: boolean;
    specialiteConseillee?: string | null;
    recommandations: string[];
    redFlags: string[];
    needsHumanReview: boolean;
    orientation: 'auto_soin' | 'rendez_vous' | 'urgence' | 'revue_humaine';
    aiModel?: string | null;
    createdAt: string;
  };

  const {
    data: triageHistory = [],
    refetch: refetchTriageHistory,
  } = useQuery({
    queryKey: ['patient-triage-history'],
    queryFn: async () => {
      const response = await apiService.get<ApiDataEnvelope<TriageHistoryItem[]>>(
        `${API_ENDPOINTS.patient.triage.list}?limit=5`
      );
      return unwrapApiData(response) || [];
    },
  });

  const saveTriageMutation = useMutation({
    mutationFn: async (payload: {
      responses: Record<string, string | string[]>;
      contexteLibre?: string;
    }) => {
      const response = await apiService.post<ApiDataEnvelope<TriageHistoryItem>>(
        API_ENDPOINTS.patient.triage.run,
        payload
      );
      return unwrapApiData(response);
    },
  });

  const currentQuestion = questionsEvaluationIA[currentStep];
  const currentQuestionId = currentQuestion.id;
  const isLastQuestion = currentStep === questionsEvaluationIA.length - 1;
  const progress = ((currentStep + 1) / questionsEvaluationIA.length) * 100;
  const currentResponse = reponses[currentQuestionId];
  const currentChoiceValue =
    currentQuestion.type === 'choice'
      ? otherChoiceSelections[currentQuestionId]
        ? OTHER_OPTION_LABEL
        : typeof currentResponse === 'string'
          ? currentResponse
          : undefined
      : undefined;
  const showOtherChoiceInput =
    currentQuestion.type === 'choice' &&
    currentQuestion.options?.includes(OTHER_OPTION_LABEL) &&
    Boolean(otherChoiceSelections[currentQuestionId]);
  const currentOtherChoiceInput =
    typeof otherChoiceInputs[currentQuestionId] === 'string'
      ? otherChoiceInputs[currentQuestionId]
      : '';

  const handleResponse = (questionId: string, value: string | string[]) => {
    setReponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleChoiceSelect = (option: string) => {
    if (option === OTHER_OPTION_LABEL) {
      setOtherChoiceSelections((prev) => ({ ...prev, [currentQuestionId]: true }));
      handleResponse(currentQuestionId, otherChoiceInputs[currentQuestionId] || '');
      return;
    }

    setOtherChoiceSelections((prev) => ({ ...prev, [currentQuestionId]: false }));
    handleResponse(currentQuestionId, option);
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      setIsAnalyzing(true);
      try {
        const savedEvaluation = await saveTriageMutation.mutateAsync({
          responses: reponses,
          contexteLibre: typeof reponses.q6 === 'string' ? reponses.q6 : undefined,
        });

        savePatientTriage({
          evaluationId: savedEvaluation.id,
          level: savedEvaluation.niveau,
          urgent: savedEvaluation.urgent,
          specialiteConseillee: savedEvaluation.specialiteConseillee || undefined,
          recommandations: savedEvaluation.recommandations,
          redFlags: savedEvaluation.redFlags || [],
          needsHumanReview: savedEvaluation.needsHumanReview,
          orientation: savedEvaluation.orientation,
          aiModel: savedEvaluation.aiModel ?? undefined,
          createdAt: savedEvaluation.createdAt,
        });

        setResultat(savedEvaluation);
        await refetchTriageHistory();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible d'obtenir l'évaluation IA");
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetEvaluation = () => {
    setCurrentStep(0);
    setReponses({});
    setOtherChoiceSelections({});
    setOtherChoiceInputs({});
    setResultat(null);
  };

  const canProceed =
    currentResponse !== undefined &&
    (typeof currentResponse === 'string' ? currentResponse.trim() !== '' : currentResponse.length > 0);

  // Résultat final
  if (resultat) {
    const niveauConfig = {
      faible: { 
        color: 'text-green-600', 
        bg: 'bg-green-100', 
        label: 'Faible',
        icon: CheckCircle 
      },
      modere: { 
        color: 'text-amber-600', 
        bg: 'bg-amber-100', 
        label: 'Modéré',
        icon: AlertCircle 
      },
      eleve: { 
        color: 'text-red-600', 
        bg: 'bg-red-100', 
        label: 'Élevé',
        icon: AlertCircle 
      }
    };

    const config = niveauConfig[resultat.niveau];
    const Icon = config.icon;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="card-health">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 ${config.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`h-10 w-10 ${config.color}`} />
            </div>
            <h1 className="text-2xl font-bold font-display mb-2">Résultat de l'évaluation</h1>
            <p className="text-muted-foreground">
              Basé sur vos réponses, voici notre analyse
            </p>
          </div>

          {/* Niveau d'urgence */}
          <div className={`p-4 ${config.bg} rounded-xl mb-6`}>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Niveau d'urgence estimé
            </p>
            <p className={`text-2xl font-bold ${config.color}`}>
              {config.label}
            </p>
          </div>

          {(resultat.urgent || resultat.needsHumanReview) && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
              <p className="font-semibold text-red-900 mb-1">Attention</p>
              <p className="text-sm text-red-800">
                Cette évaluation recommande une revue humaine rapide. Ne retardez pas la prise en charge si vos symptômes s'aggravent.
              </p>
            </div>
          )}

          {/* Spécialité conseillée */}
          {resultat.specialiteConseillee && (
            <div className="bg-primary/10 p-4 rounded-xl mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Spécialité recommandée
              </p>
              <p className="text-xl font-semibold text-primary">
                {resultat.specialiteConseillee}
              </p>
            </div>
          )}

          {/* Recommandations */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Recommandations</h3>
            <ul className="space-y-2">
              {resultat.recommandations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {resultat.redFlags.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Points de vigilance détectés</h3>
              <ul className="space-y-2">
                {resultat.redFlags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {triageHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Historique récent</h3>
              <div className="space-y-2">
                {triageHistory.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium capitalize">
                        Niveau: {item.niveau}
                        {item.urgent ? ' • urgent' : ''}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {item.specialiteConseillee && (
                      <p className="text-muted-foreground mt-1">Spécialité: {item.specialiteConseillee}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-muted p-4 rounded-xl mb-6 text-sm text-muted-foreground">
            <p className="font-medium mb-1">⚠️ Avertissement</p>
            <p>
              Cette évaluation est fournie à titre indicatif uniquement et ne 
              remplace pas un avis médical professionnel. En cas de doute ou de 
              symptômes graves, consultez immédiatement un médecin.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/patient/demander-rdv" className="btn-health-primary flex-1 text-center">
              {resultat.urgent
                ? 'Prendre rendez-vous rapidement'
                : resultat.specialiteConseillee
                  ? `Prendre RDV en ${resultat.specialiteConseillee}`
                  : 'Prendre rendez-vous'}
            </Link>
            <button
              onClick={resetEvaluation}
              className="btn-health-secondary flex-1"
            >
              Nouvelle évaluation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Analyse en cours
  if (isAnalyzing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-health text-center py-12">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Analyse en cours...</h2>
          <p className="text-muted-foreground">
            Notre IA analyse vos réponses pour vous fournir des recommandations personnalisées
          </p>
          <div className="mt-6 h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
            <div className="h-full bg-primary animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Questionnaire
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">Évaluation IA</h1>
        <p className="text-muted-foreground">
          Répondez aux questions pour obtenir une pré-évaluation de vos symptômes
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            Question {currentStep + 1} sur {questionsEvaluationIA.length}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="card-health">
        <h2 className="text-lg font-semibold mb-6">{currentQuestion.question}</h2>

        {/* Options basées sur le type de question */}
        {currentQuestion.type === 'choice' && currentQuestion.options && (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  currentChoiceValue === option
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  checked={currentChoiceValue === option}
                  onChange={() => handleChoiceSelect(option)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  currentChoiceValue === option
                    ? 'border-primary'
                    : 'border-muted-foreground'
                }`}>
                  {currentChoiceValue === option && (
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  )}
                </div>
                <span>{option}</span>
              </label>
            ))}

            {showOtherChoiceInput && (
              <div className="mt-3">
                <input
                  type="text"
                  value={currentOtherChoiceInput}
                  onChange={(e) => {
                    const { value } = e.target;
                    setOtherChoiceInputs((prev) => ({ ...prev, [currentQuestion.id]: value }));
                    handleResponse(currentQuestion.id, value);
                  }}
                  placeholder="Précisez votre symptôme ou motif de consultation"
                  className="input-health"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {currentQuestion.type === 'multiple' && currentQuestion.options && (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => {
              const selected = (reponses[currentQuestion.id] as string[] || []).includes(option);
              return (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const current = (reponses[currentQuestion.id] as string[]) || [];
                      if (selected) {
                        handleResponse(currentQuestion.id, current.filter(v => v !== option));
                      } else {
                        handleResponse(currentQuestion.id, [...current, option]);
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {selected && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {currentQuestion.type === 'scale' && (
          <div className="space-y-4">
            <input
              type="range"
              min="1"
              max="10"
              value={(reponses[currentQuestion.id] as string) || '5'}
              onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1 - Léger</span>
              <span className="font-bold text-foreground text-lg">
                {reponses[currentQuestion.id] || '5'}
              </span>
              <span>10 - Sévère</span>
            </div>
          </div>
        )}

        {currentQuestion.type === 'text' && (
          <textarea
            value={(reponses[currentQuestion.id] as string) || ''}
            onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
            placeholder="Votre réponse..."
            className="input-health min-h-[120px]"
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="btn-health-secondary"
          >
            <ChevronLeft className="h-5 w-5" />
            Précédent
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed && currentQuestion.type !== 'text'}
            className="btn-health-primary"
          >
            {isLastQuestion ? 'Analyser' : 'Suivant'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
