import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { extractData } from '@/lib/api-response';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

interface ConsultationEditable {
  id: number;
  diagnostic?: string;
  observations?: string;
  statut?: string;
  constantes?: any;
}

export const MedecinEditConsultation: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [diagnostic, setDiagnostic] = useState('');
  const [observations, setObservations] = useState('');
  const [statut, setStatut] = useState('en_cours');

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation-edit', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await apiService.get(API_ENDPOINTS.consultations.get(String(id)));
      return extractData<ConsultationEditable>(response);
    },
  });

  useEffect(() => {
    if (!consultation) return;
    setDiagnostic(consultation.diagnostic || '');
    setObservations(consultation.observations || '');
    setStatut(consultation.statut || 'en_cours');
  }, [consultation]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return apiService.put(API_ENDPOINTS.consultations.get(String(id)), {
        diagnostic,
        observations,
        statut,
      });
    },
    onSuccess: () => {
      toast.success('Consultation mise à jour');
      navigate(`/medecin/consultations/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Mise à jour impossible');
    },
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement de la consultation...</div>;
  }

  if (!consultation?.id) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Consultation introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/medecin/consultations')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modifier la consultation #{consultation.id}</h1>
        </div>
        <Button variant="outline" onClick={() => navigate(`/medecin/consultations/${consultation.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Annuler
        </Button>
      </div>

      <div className="card-health space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Statut</label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="w-full border border-input rounded-lg p-2 bg-background"
          >
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminée</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Diagnostic</label>
          <textarea
            value={diagnostic}
            onChange={(e) => setDiagnostic(e.target.value)}
            className="w-full border border-input rounded-lg p-3 bg-background resize-none h-32"
            placeholder="Diagnostic de la consultation..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Observations</label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="w-full border border-input rounded-lg p-3 bg-background resize-none h-32"
            placeholder="Observations complémentaires..."
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};
