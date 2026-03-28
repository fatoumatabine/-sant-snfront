import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { extractData } from '@/lib/api-response';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit2 } from 'lucide-react';

interface ConsultationDetail {
  id: number;
  date: string;
  heure: string;
  type: string;
  statut: string;
  diagnostic?: string;
  observations?: string;
  constantes?: any;
  patient?: {
    prenom?: string;
    nom?: string;
    telephone?: string;
    user?: { email?: string };
  };
}

const renderConstantes = (constantes: any) => {
  if (!constantes) return 'Aucune constante';
  if (Array.isArray(constantes)) {
    return constantes
      .map((item) => {
        const nom = item?.nom || 'Constante';
        const valeur = item?.valeur ?? '-';
        const unite = item?.unite ? ` ${item.unite}` : '';
        return `${nom}: ${valeur}${unite}`;
      })
      .join(' | ');
  }
  if (typeof constantes === 'object') {
    return Object.entries(constantes)
      .map(([key, value]) => `${key}: ${value as string}`)
      .join(' | ');
  }
  return String(constantes);
};

export const MedecinConsultationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation-detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await apiService.get(API_ENDPOINTS.consultations.get(String(id)));
      return extractData<ConsultationDetail>(response);
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
          <h1 className="text-2xl font-bold">Consultation #{consultation.id}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(consultation.date).toLocaleDateString('fr-FR')} à {consultation.heure}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/medecin/consultations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button onClick={() => navigate(`/medecin/consultations/${consultation.id}/edit`)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="card-health space-y-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Patient</p>
          <p className="font-medium">
            {consultation.patient?.prenom} {consultation.patient?.nom}
          </p>
          <p className="text-sm text-muted-foreground">
            {consultation.patient?.telephone || '-'} {consultation.patient?.user?.email ? `• ${consultation.patient.user.email}` : ''}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Type</p>
            <p>{consultation.type || '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Statut</p>
            <p>{consultation.statut || '-'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase text-muted-foreground">Constantes</p>
          <p className="text-sm">{renderConstantes(consultation.constantes)}</p>
        </div>

        <div>
          <p className="text-xs uppercase text-muted-foreground">Diagnostic</p>
          <p className="text-sm whitespace-pre-wrap">{consultation.diagnostic || 'Non renseigné'}</p>
        </div>

        <div>
          <p className="text-xs uppercase text-muted-foreground">Observations</p>
          <p className="text-sm whitespace-pre-wrap">{consultation.observations || 'Aucune observation'}</p>
        </div>
      </div>
    </div>
  );
};

