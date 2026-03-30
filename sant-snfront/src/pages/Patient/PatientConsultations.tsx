import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Download, Eye, Calendar, Pill } from 'lucide-react';
import { OrdonnanceDocument } from '@/components/Common/OrdonnanceDocument';
import { useAuthStore } from '@/store/authStore';
import { useConsultationStore } from '@/store/consultationStore';
import { useMedecinStore } from '@/store/medecinStore';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { useApiMutationRefresh } from '@/hooks/useApiMutationRefresh';
import { apiService } from '@/services/api';
import { downloadBlobFile } from '@/lib/downloadFile';
import { toast } from 'sonner';

export const PatientConsultations: React.FC = () => {
  const [previewOrdonnanceId, setPreviewOrdonnanceId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { consultations, fetchConsultations, isLoading } = useConsultationStore();
  const { medecins, fetchMedecins } = useMedecinStore();

  // Charger les données au montage
  useEffect(() => {
    if (user?.id) {
      fetchConsultations();
      fetchMedecins();
    }
  }, [user?.id]);

  const refreshStores = useCallback(() => {
    if (!user?.id) return;
    fetchConsultations().catch(() => {});
    fetchMedecins().catch(() => {});
  }, [user?.id, fetchConsultations, fetchMedecins]);

  useApiMutationRefresh(refreshStores, 300);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleViewOrdonnance = async (consultationId: string) => {
    try {
      const response: any = await apiService.get(`/ordonnances/consultation/${consultationId}`);
      const ordonnance = response?.data?.data || response?.data || response;
      if (!ordonnance?.id) {
        toast.error('Aucune ordonnance associée à cette consultation');
        return;
      }
      setPreviewOrdonnanceId(String(ordonnance.id));
    } catch (error: any) {
      toast.error(error.message || 'Impossible de charger l\'ordonnance');
    }
  };

  const handleDownloadOrdonnance = async (consultationId: string) => {
    try {
      const response: any = await apiService.get(`/ordonnances/consultation/${consultationId}`);
      const ordonnance = response?.data?.data || response?.data || response;
      if (!ordonnance?.id) {
        toast.error('Aucune ordonnance associée');
        return;
      }
      const blob = await apiService.getBlob(`/ordonnances/${ordonnance.id}/download`);
      downloadBlobFile(blob, `ordonnance-${ordonnance.id}.pdf`);
      toast.success('Ordonnance téléchargée');
    } catch (error: any) {
      toast.error(error.message || 'Téléchargement impossible');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display">Mes consultations</h1>
        <p className="text-muted-foreground">
          Historique de vos consultations médicales
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="card-health text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">Aucune consultation enregistrée</p>
          <p className="text-sm text-muted-foreground">
            Vos consultations apparaîtront ici une fois que vous aurez eu des rendez-vous avec un médecin.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {consultations.map((consultation) => {
            const medecin = medecins.find(m => m.id === consultation.medecinId);
            
            return (
              <div key={consultation.id} className="card-health">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Header */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">
                        {medecin?.prenom?.[0]}{medecin?.nom?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">
                          Dr. {medecin?.prenom} {medecin?.nom}
                        </h3>
                        <span className="text-sm text-primary">{medecin?.specialite}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(consultation.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="btn-health-secondary px-3 py-2 text-sm">
                      <Eye className="h-4 w-4" />
                      Détails
                    </button>
                    <button
                      className="btn-health-secondary px-3 py-2 text-sm"
                      onClick={() => handleViewOrdonnance(consultation.id)}
                    >
                      <Pill className="h-4 w-4" />
                      Ordonnance
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Diagnostic</p>
                    <p className="mt-1">{consultation.diagnostic || 'Non spécifié'}</p>
                  </div>

                  {consultation.constantes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Constantes vitales</p>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-1 mt-1 text-sm">
                        {consultation.constantes.temperature && (
                          <p>Température: {consultation.constantes.temperature}°C</p>
                        )}
                        {consultation.constantes.tension && (
                          <p>Tension: {consultation.constantes.tension}</p>
                        )}
                        {consultation.constantes.poids && (
                          <p>Poids: {consultation.constantes.poids} kg</p>
                        )}
                        {consultation.constantes.taille && (
                          <p>Taille: {consultation.constantes.taille} cm</p>
                        )}
                      </div>
                    </div>
                  )}

                  {consultation.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="mt-1 text-sm">{consultation.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Viewer ordonnance styled */}
      {previewOrdonnanceId && (
        <OrdonnanceDocument
          ordonnanceId={previewOrdonnanceId}
          onClose={() => setPreviewOrdonnanceId(null)}
        />
      )}
    </div>
  );
};
