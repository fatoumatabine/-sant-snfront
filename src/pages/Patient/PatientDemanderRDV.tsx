import React, { useState } from 'react';
import { Calendar, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getPatientTriage, getPatientTriageValidityHours, isPatientTriageValid } from '@/lib/patientTriage';

interface Medecin {
  id: number;
  prenom: string;
  nom: string;
  specialite: string;
  disponible?: boolean;
}

interface FormData {
  type: 'en_ligne' | 'presentiel' | 'prestation';
  date: string;
  heure: string;
  medecin_id: number;
  motif?: string;
  prestation_type?: string;
  specialite?: string;
}

export const PatientDemanderRDV: React.FC = () => {
  const triage = getPatientTriage();
  const hasValidTriage = isPatientTriageValid(triage);
  const triageIsUrgent = Boolean(triage?.urgent && hasValidTriage);

  const [formData, setFormData] = useState<FormData>({
    type: 'presentiel',
    date: '',
    heure: '',
    medecin_id: 0,
    specialite: triage?.specialiteConseillee || '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Récupérer les médecins
  const { data: medecins = [], isLoading: medecinsLoading } = useQuery({
    queryKey: ['medecins-list'],
    queryFn: async () => {
      const response = await apiService.get('/medecins');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    }
  });

  // Récupérer les spécialités
  const { data: specialites = [] } = useQuery({
    queryKey: ['medecins-specialites'],
    queryFn: async () => {
      const response = await apiService.get('/medecins/specialites');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    }
  });

  // Mutation pour créer le RDV
  const createRDVMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiService.post('/rendez-vous', data);
    },
    onSuccess: () => {
      setSubmitted(true);
      setFormData({
        type: 'presentiel',
        date: '',
        heure: '',
        medecin_id: 0,
        specialite: '',
      });
      setErrors({});
      toast.success('Demande de rendez-vous envoyée avec succès');
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message || err.message || 'Erreur lors de la création de la demande';
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'medecin_id' ? Number(value) : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation du type
    if (!formData.type) {
      newErrors.type = 'Le type de consultation est obligatoire';
    }

    // Validation pour consultations (en ligne ou présentielle)
    if (formData.type !== 'prestation') {
      if (!formData.specialite) {
        newErrors.specialite = 'La spécialité médicale est obligatoire';
      }
      if (!formData.medecin_id || formData.medecin_id === 0) {
        newErrors.medecin_id = 'Veuillez sélectionner un médecin';
      }
    } else {
      // Validation pour prestations
      if (!formData.prestation_type) {
        newErrors.prestation_type = 'Le type de prestation est obligatoire';
      }
    }

    // Validation de la date
    if (!formData.date) {
      newErrors.date = 'La date est obligatoire';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'La date ne peut pas être dans le passé';
      }
    }

    // Validation de l'heure
    if (!formData.heure) {
      newErrors.heure = 'L\'horaire est obligatoire';
    } else {
      const [hours, minutes] = formData.heure.split(':').map(Number);
      if (hours < 8 || hours >= 18) {
        newErrors.heure = 'L\'horaire doit être entre 08:00 et 18:00';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasValidTriage) {
      toast.error('Veuillez d’abord faire la pré-évaluation IA avant de demander un rendez-vous');
      return;
    }
    
    // Validation
    if (!validateForm()) {
      toast.error('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    // Préparer les données pour l'API
    const apiData: any = {
      type: formData.type,
      date: formData.date,
      heure: formData.heure,
    };

    if (formData.type !== 'prestation') {
      apiData.medecin_id = formData.medecin_id;
      apiData.specialite = formData.specialite;
      apiData.motif = formData.motif || formData.specialite;
    } else {
      apiData.prestation_type = formData.prestation_type;
      apiData.motif = `Prestation: ${formData.prestation_type}`;
      // Pour les prestations, on peut avoir un médecin par défaut ou null
      apiData.medecin_id = formData.medecin_id || medecins[0]?.id;
    }

    apiData.triage_evaluation_id = triage?.evaluationId;

    createRDVMutation.mutate(apiData);
  };

  // Récupérer les médecins par spécialité
  const filteredMedecins = Array.isArray(medecins)
    ? formData.specialite
      ? medecins.filter(m => m.specialite === formData.specialite)
      : medecins
    : [];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'en_ligne':
        return 'Consultation en ligne';
      case 'presentiel':
        return 'Consultation présentielle';
      case 'prestation':
        return 'Prestation (Radio, Analyse)';
      default:
        return type;
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card-health bg-green-50 border-2 border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-green-900 mb-2">Demande envoyée avec succès !</h2>
              <p className="text-green-800 mb-4">
                Votre demande de rendez-vous a été enregistrée. La secrétaire examinera votre demande et vous confirmera le rendez-vous dans les plus brefs délais.
              </p>
              <div className="bg-green-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-900">
                  <strong>Prochaines étapes :</strong>
                </p>
                <ul className="text-sm text-green-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Vous recevrez une notification de confirmation</li>
                  <li>Consultez l'onglet "Mes rendez-vous" pour suivre l'état</li>
                  <li>La secrétaire vous contactera si besoin</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setSubmitted(false)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Faire une autre demande
                </Button>
                <Button
                  onClick={() => window.location.href = '/patient/rendez-vous'}
                  variant="outline"
                >
                  Voir mes rendez-vous
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fieldClass = (hasError?: boolean) =>
    `w-full h-12 px-4 border-2 rounded-xl bg-background transition-all outline-none ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15'
    }`;

  return (
    <div className="space-y-4 animate-fade-in max-w-7xl mx-auto">
      {!hasValidTriage && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="text-lg font-semibold text-amber-900 mb-1">Pré-évaluation IA requise</h2>
          <p className="text-sm text-amber-800 mb-4">
            Avant la demande de rendez-vous, vous devez compléter l’évaluation IA.
            Validité de l’évaluation: {getPatientTriageValidityHours()} heures.
          </p>
          <Link to="/patient/ia-evaluation">
            <Button className="h-10">Faire la pré-évaluation IA</Button>
          </Link>
        </div>
      )}

      {hasValidTriage && (
        <div className={`rounded-2xl border p-4 ${triageIsUrgent ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
          <p className={`text-sm font-semibold ${triageIsUrgent ? 'text-red-800' : 'text-emerald-800'}`}>
            Pré-évaluation IA validée
          </p>
          <p className={`text-xs mt-1 ${triageIsUrgent ? 'text-red-700' : 'text-emerald-700'}`}>
            Niveau: {triage?.level === 'eleve' ? 'Urgent' : triage?.level === 'modere' ? 'Modéré' : 'Faible'}
            {triage?.specialiteConseillee ? ` • Spécialité conseillée: ${triage.specialiteConseillee}` : ''}
          </p>
          {triage?.needsHumanReview && (
            <p className={`text-xs mt-2 ${triageIsUrgent ? 'text-red-700' : 'text-emerald-700'}`}>
              Une revue humaine rapide a été recommandée par l’évaluation IA.
            </p>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-primary rounded-2xl p-4 md:p-5 text-white">
        <h1 className="text-xl md:text-2xl font-bold font-display mb-1 flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Demander un rendez-vous
        </h1>
        <p className="text-sm text-white/80">
          Remplissez le formulaire pour demander un rendez-vous avec un médecin
        </p>
      </div>

      {/* Erreur globale */}
      {errors.submit && (
        <div className="card-health bg-red-50 border-2 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Erreur de validation</p>
              <p className="text-red-800">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className={`relative rounded-3xl border border-primary/10 bg-gradient-to-b from-white to-slate-50/70 p-4 md:p-5 shadow-sm ${!hasValidTriage ? 'opacity-55 pointer-events-none' : ''}`}>
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400" />
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Type de consultation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:col-span-8">
            <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">
              Type de consultation <span className="text-red-600">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={fieldClass(Boolean(errors.type))}
            >
              <option value="presentiel">Consultation présentielle</option>
              <option value="en_ligne">Consultation en ligne</option>
              <option value="prestation">Prestation (Radio, Analyse)</option>
            </select>
            {errors.type && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.type}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{getTypeLabel(formData.type)}</p>
            </div>

          {/* Spécialité ou Type prestation */}
          {formData.type !== 'prestation' ? (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Spécialité médicale <span className="text-red-600">*</span>
              </label>
              <select
                name="specialite"
                value={formData.specialite || ''}
                onChange={handleInputChange}
                className={fieldClass(Boolean(errors.specialite))}
              >
                <option value="">Sélectionner une spécialité</option>
                {Array.isArray(specialites) && specialites.map((spec: string) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              {errors.specialite && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.specialite}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Type de prestation <span className="text-red-600">*</span>
              </label>
              <select
                name="prestation_type"
                value={formData.prestation_type || ''}
                onChange={handleInputChange}
                className={fieldClass(Boolean(errors.prestation_type))}
              >
                <option value="">Sélectionner une prestation</option>
                <option value="Radiologie">Radiologie</option>
                <option value="Analyse">Analyse</option>
                <option value="Échographie">Échographie</option>
                <option value="Scanner">Scanner</option>
                <option value="IRM">IRM</option>
                <option value="Autre">Autre</option>
              </select>
              {errors.prestation_type && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.prestation_type}
                </p>
              )}
            </div>
          )}

          {/* Médecin */}
          {formData.type !== 'prestation' && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Médecin <span className="text-red-600">*</span>
              </label>
              {medecinsLoading ? (
                <div className="w-full px-4 py-3 border-2 rounded-xl bg-muted/30 text-muted-foreground">
                  Chargement des médecins...
                </div>
              ) : filteredMedecins.length > 0 ? (
                <select
                  name="medecin_id"
                  value={formData.medecin_id}
                  onChange={handleInputChange}
                  className={fieldClass(Boolean(errors.medecin_id))}
                >
                  <option value={0}>Sélectionner un médecin</option>
                  {filteredMedecins.map((medecin: Medecin) => (
                    <option key={medecin.id} value={medecin.id}>
                      Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl bg-orange-50 text-orange-800">
                  {formData.specialite 
                    ? `Aucun médecin disponible pour la spécialité "${formData.specialite}"` 
                    : 'Veuillez d\'abord sélectionner une spécialité'}
                </div>
              )}
              {errors.medecin_id && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.medecin_id}
                </p>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Date du rendez-vous <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className={fieldClass(Boolean(errors.date))}
            />
            {errors.date && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.date}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">À partir d'aujourd'hui</p>
          </div>

          {/* Heure */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Horaire <span className="text-red-600">*</span>
            </label>
            <input
              type="time"
              name="heure"
              value={formData.heure}
              onChange={handleInputChange}
              min="08:00"
              max="18:00"
              className={fieldClass(Boolean(errors.heure))}
            />
            {errors.heure && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.heure}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">08:00 - 18:00</p>
          </div>

          {/* Motif (optionnel) */}
          {formData.type !== 'prestation' && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Motif de consultation (optionnel)
              </label>
              <textarea
                name="motif"
                value={formData.motif || ''}
                onChange={handleInputChange}
                rows={2}
                placeholder="Décrivez brièvement la raison de votre consultation..."
                className="w-full px-4 py-3 border-2 border-input rounded-xl bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none"
              />
            </div>
          )}
          </div>

          <div className="xl:col-span-4 space-y-3">
          {/* Infos */}
          <div className="card-health bg-blue-50 border-2 border-blue-200">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-semibold mb-1 text-sm">Important :</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Votre demande sera examinée par la secrétaire</li>
                  <li>Vous recevrez une confirmation dans les 48 heures</li>
                  <li>Les créneaux sont sous réserve de disponibilité</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={createRDVMutation.isPending}
              className="w-full gap-2 h-11"
            >
              {createRDVMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Demander le rendez-vous
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                setFormData({
                  type: 'presentiel',
                  date: '',
                  heure: '',
                  medecin_id: 0,
                  specialite: '',
                });
                setErrors({});
              }}
            >
              Réinitialiser
            </Button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
};
