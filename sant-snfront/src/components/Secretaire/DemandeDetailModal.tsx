import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Demande {
  id: number;
  numero: string;
  date: string;
  heure: string;
  type: 'en_ligne' | 'presentiel' | 'prestation';
  statut: 'en_attente' | 'confirme' | 'annule' | 'termine' | 'paye';
  patient?: {
    id: number;
    prenom: string;
    nom: string;
    diabete?: boolean;
    hypertension?: boolean;
    hepatite?: boolean;
    autres_pathologies?: string;
    user?: { email: string };
  };
  medecin?: {
    id: number;
    prenom: string;
    nom: string;
    specialite: string;
  };
  prestation_type?: string;
  created_at?: string;
  createdAt?: string;
}

interface DemandeDetailModalProps {
  demande: Demande;
  onApprove: () => void;
  onReject: (raison: string) => void;
  onClose: () => void;
  disponibilite?: {
    available: boolean;
    reason: string | null;
    creneaux: string[];
    creneauxDisponibles?: string[];
    heureDemandeeDisponible: boolean;
    conflictCount: number;
    creneauReference?: string | null;
  } | null;
  isCheckingDisponibilite?: boolean;
  isSubmittingAction?: boolean;
}

export const DemandeDetailModal: React.FC<DemandeDetailModalProps> = ({
  demande,
  onApprove,
  onReject,
  onClose,
  disponibilite,
  isCheckingDisponibilite = false,
  isSubmittingAction = false,
}) => {
  const REJECT_REASON_MAX_LENGTH = 300;
  const [rejectReason, setRejectReason] = React.useState('');
  const [rejectError, setRejectError] = React.useState('');

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'en_ligne':
        return 'Consultation en ligne';
      case 'presentiel':
        return 'Présentiel';
      case 'prestation':
        return 'Prestation';
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Détails de la demande #{demande.numero}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section Patient */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Informations Patient</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="font-medium">
                  {demande.patient
                    ? `${demande.patient.prenom} ${demande.patient.nom}`
                    : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{demande.patient?.user?.email || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Date de demande</p>
                <p className="font-medium">
                  {demande.createdAt || demande.created_at
                    ? new Date(demande.createdAt || demande.created_at || '').toLocaleDateString('fr-FR')
                    : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Rendez-vous demandé</p>
                <p className="font-medium">
                  {new Date(demande.date).toLocaleDateString('fr-FR')} à {demande.heure}
                </p>
              </div>
            </div>

            {/* Antécédents */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Antécédents médicaux</p>
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={demande.patient?.diabete || false}
                    disabled
                    className="w-4 h-4"
                  />
                  <span>Diabète</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={demande.patient?.hypertension || false}
                    disabled
                    className="w-4 h-4"
                  />
                  <span>Hypertension</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={demande.patient?.hepatite || false}
                    disabled
                    className="w-4 h-4"
                  />
                  <span>Hépatite</span>
                </label>
                {demande.patient?.autres_pathologies && (
                  <div>
                    <p className="text-sm">Autres pathologies:</p>
                    <p className="text-sm font-medium">{demande.patient.autres_pathologies}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Consultation/Prestation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Informations Consultation</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type de consultation</p>
                <p className="font-medium">{getTypeLabel(demande.type)}</p>
              </div>

              {demande.type !== 'prestation' && demande.medecin && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Spécialité demandée</p>
                    <p className="font-medium">{demande.medecin.specialite}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Médecin disponible</p>
                    <p className="font-medium">
                      Dr. {demande.medecin.prenom} {demande.medecin.nom}
                    </p>
                  </div>
                </>
              )}

              {demande.type === 'prestation' && (
                <div>
                  <p className="text-sm text-muted-foreground">Type de prestation</p>
                  <p className="font-medium">
                    {demande.prestation_type || 'Non spécifié'}
                  </p>
                </div>
              )}
            </div>

            {demande.type === 'prestation' && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Prestations disponibles</p>
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-4 h-4"
                    />
                    <span>Radiologie</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-4 h-4"
                    />
                    <span>Analyse</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Statut actuel */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Statut actuel</p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-900">
                {demande.statut === 'en_attente' && 'En attente de traitement'}
                {demande.statut === 'confirme' && 'Accepté'}
                {demande.statut === 'paye' && 'Payé'}
                {demande.statut === 'annule' && 'Refusé'}
                {demande.statut === 'termine' && 'Terminé'}
              </p>
            </div>
          </div>

          {demande.statut === 'en_attente' && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Disponibilité du médecin</p>
              <div
                className={`p-3 rounded-lg border ${
                  isCheckingDisponibilite
                    ? 'bg-slate-50 border-slate-200'
                    : disponibilite?.available
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {isCheckingDisponibilite ? (
                  <p className="text-sm font-medium text-slate-700">Vérification en cours...</p>
                ) : disponibilite?.available ? (
                  <p className="text-sm font-medium text-green-700">Médecin disponible pour ce créneau.</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-700">
                      Médecin indisponible pour ce créneau.
                    </p>
                    {disponibilite?.reason && (
                      <p className="text-xs text-red-700">{disponibilite.reason}</p>
                    )}
                    {disponibilite?.creneauReference ? (
                      <p className="text-xs text-red-700">
                        Créneau de référence: {disponibilite.creneauReference}
                      </p>
                    ) : null}
                    {disponibilite?.creneaux?.length ? (
                      <p className="text-xs text-red-700">
                        Créneaux actifs: {disponibilite.creneaux.join(', ')}
                      </p>
                    ) : null}
                    {disponibilite?.creneauxDisponibles?.length ? (
                      <p className="text-xs text-red-700">
                        Créneaux encore libres: {disponibilite.creneauxDisponibles.join(', ')}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions - Seulement si en attente */}
        {demande.statut === 'en_attente' && (
          <div className="p-6 border-t border-border bg-muted/50 space-y-4">
            <div className="space-y-2">
              <label htmlFor="reject-reason" className="text-sm font-medium">
                Motif du refus (obligatoire)
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(event) => {
                  setRejectReason(event.target.value);
                  if (rejectError) {
                    setRejectError('');
                  }
                }}
                rows={3}
                maxLength={REJECT_REASON_MAX_LENGTH}
                placeholder="Saisissez le motif du refus..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground text-right">
                {rejectReason.length}/{REJECT_REASON_MAX_LENGTH}
              </p>
              {rejectError && <p className="text-sm text-red-600">{rejectError}</p>}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onApprove}
                variant="default"
                className="gap-2 flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmittingAction || isCheckingDisponibilite || disponibilite?.available === false}
              >
                <CheckCircle className="h-5 w-5" />
                {isSubmittingAction ? 'Validation...' : 'Valider le traitement'}
              </Button>
              <Button
                onClick={() => {
                  const reason = rejectReason.trim();
                  if (!reason) {
                    setRejectError('Le motif du refus est obligatoire.');
                    return;
                  }
                  if (reason.length > REJECT_REASON_MAX_LENGTH) {
                    setRejectError(`Le motif ne doit pas dépasser ${REJECT_REASON_MAX_LENGTH} caractères.`);
                    return;
                  }
                  onReject(reason);
                }}
                variant="destructive"
                className="gap-2 flex-1"
                disabled={isSubmittingAction}
              >
                <XCircle className="h-5 w-5" />
                {isSubmittingAction ? 'Traitement...' : 'Refuser'}
              </Button>
            </div>
          </div>
        )}

        {/* Bouton Fermer si pas en attente */}
        {demande.statut !== 'en_attente' && (
          <div className="p-6 border-t border-border">
            <Button onClick={onClose} variant="outline" className="w-full">
              Fermer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
