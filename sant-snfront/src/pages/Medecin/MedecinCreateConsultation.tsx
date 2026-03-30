import React, { useState } from 'react';
import { Plus, X, Save, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Constante {
  nom: string;
  valeur: string;
  unite: string;
}

interface ApiPatient {
  id: number;
  prenom: string;
  nom: string;
}

interface ApiRendezVous {
  id: number;
  patientId: number;
  medecinId: number;
  date: string;
  heure: string;
  type: string;
  statut: string;
  patient?: {
    prenom?: string;
    nom?: string;
  };
}

export const MedecinCreateConsultation: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    rendez_vous_id: '',
    symptomes: [] as string[],
    diagnostic: '',
    traitement: '',
    notes: '',
    constantes: [] as Constante[],
    prochain_rdv: '',
    ordonnance: {
      medicaments: [] as any[],
      instructions: ''
    }
  });

  const [newSymptome, setNewSymptome] = useState('');
  const [newConstante, setNewConstante] = useState({ nom: '', valeur: '', unite: '' });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/rendez-vous/medecin/list');
        const rdvList: ApiRendezVous[] = Array.isArray(response?.data)
          ? response.data
          : response?.data?.data || [];

        const unique = new Map<number, ApiPatient>();
        rdvList.forEach((rdv) => {
          if (!unique.has(rdv.patientId)) {
            unique.set(rdv.patientId, {
              id: rdv.patientId,
              prenom: rdv.patient?.prenom || '',
              nom: rdv.patient?.nom || '',
            });
          }
        });

        return Array.from(unique.values());
      } catch {
        return [];
      }
    }
  });

  const { data: rdvs = [] } = useQuery({
    queryKey: ['medecin-rdv-list'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/rendez-vous/medecin/list');
        const data: ApiRendezVous[] = Array.isArray(response?.data)
          ? response.data
          : response?.data?.data || [];
        return data;
      } catch {
        return [];
      }
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiService.post('/consultations', data);
    },
    onSuccess: () => {
      toast.success('Consultation enregistrée avec succès');
      navigate('/medecin/consultations');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  });

  const handleAddSymptome = () => {
    if (newSymptome.trim()) {
      setFormData({
        ...formData,
        symptomes: [...formData.symptomes, newSymptome]
      });
      setNewSymptome('');
    }
  };

  const handleRemoveSymptome = (index: number) => {
    setFormData({
      ...formData,
      symptomes: formData.symptomes.filter((_, i) => i !== index)
    });
  };

  const handleAddConstante = () => {
    if (newConstante.nom && newConstante.valeur) {
      setFormData({
        ...formData,
        constantes: [...formData.constantes, newConstante]
      });
      setNewConstante({ nom: '', valeur: '', unite: '' });
    }
  };

  const handleRemoveConstante = (index: number) => {
    setFormData({
      ...formData,
      constantes: formData.constantes.filter((_, i) => i !== index)
    });
  };

  const handleAddMedicament = () => {
    setFormData({
      ...formData,
      ordonnance: {
        ...formData.ordonnance,
        medicaments: [
          ...formData.ordonnance.medicaments,
          { nom: '', dosage: '', frequence: '', duree: '' }
        ]
      }
    });
  };

  const handleMedicamentChange = (index: number, field: string, value: string) => {
    const updated = [...formData.ordonnance.medicaments];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({
      ...formData,
      ordonnance: { ...formData.ordonnance, medicaments: updated }
    });
  };

  const handleRemoveMedicament = (index: number) => {
    setFormData({
      ...formData,
      ordonnance: {
        ...formData.ordonnance,
        medicaments: formData.ordonnance.medicaments.filter((_, i) => i !== index)
      }
    });
  };

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find((p: ApiPatient) => String(p.id) === patientId);
    setFormData({
      ...formData,
      patient_id: patientId,
      patient_name: patient ? `${patient.prenom} ${patient.nom}` : ''
    });
  };

  const handleSubmit = () => {
    if (!formData.patient_id || !formData.diagnostic || !formData.rendez_vous_id) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    const rdv = rdvs.find((item: ApiRendezVous) => String(item.id) === formData.rendez_vous_id);
    if (!rdv) {
      toast.error('Rendez-vous introuvable');
      return;
    }

    saveMutation.mutate({
      patientId: Number(formData.patient_id),
      medecinId: rdv.medecinId,
      rendezVousId: rdv.id,
      date: rdv.date,
      heure: rdv.heure,
      type: rdv.type,
      constantes: formData.constantes,
      diagnostic: formData.diagnostic,
      observations: formData.notes,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Nouvelle consultation</h1>
          <p className="text-muted-foreground">Enregistrer une consultation complète</p>
        </div>
      </div>

      <div className="space-y-6 card-health p-6">
        {/* Patient Selection */}
        <section className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Sélection du patient</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Patient</label>
              <select
                value={formData.patient_id}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full border border-input rounded-lg p-2 bg-background"
              >
                <option value="">-- Sélectionner --</option>
                {patients.map((p: ApiPatient) => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom}
                  </option>
                ))}
              </select>
            </div>
            {formData.patient_id && (
              <div>
                <label className="block text-sm font-medium mb-2">RDV associé</label>
                <select
                  value={formData.rendez_vous_id}
                  onChange={(e) => setFormData({ ...formData, rendez_vous_id: e.target.value })}
                  className="w-full border border-input rounded-lg p-2 bg-background"
                >
                  <option value="">-- Optionnel --</option>
                  {rdvs
                    .filter((r: ApiRendezVous) => String(r.patientId) === formData.patient_id)
                    .map((r: ApiRendezVous) => (
                      <option key={r.id} value={r.id}>
                        {new Date(r.date).toLocaleDateString('fr-FR')} à {r.heure}
                      </option>
                    ))
                  }
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Symptômes */}
        <section className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Symptômes</h2>
          <div className="flex gap-2 mb-4">
            <input
              value={newSymptome}
              onChange={(e) => setNewSymptome(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSymptome()}
              placeholder="Ajouter un symptôme..."
              className="flex-1 border border-input rounded-lg p-2 bg-background text-sm"
            />
            <Button onClick={handleAddSymptome} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.symptomes.map((symptome, idx) => (
              <div key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                {symptome}
                <button onClick={() => handleRemoveSymptome(idx)} className="hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Constantes vitales */}
        <section className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Constantes vitales</h2>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <input
              placeholder="Nom (ex: Tension)"
              value={newConstante.nom}
              onChange={(e) => setNewConstante({ ...newConstante, nom: e.target.value })}
              className="border border-input rounded-lg p-2 bg-background text-sm"
            />
            <input
              placeholder="Valeur"
              value={newConstante.valeur}
              onChange={(e) => setNewConstante({ ...newConstante, valeur: e.target.value })}
              className="border border-input rounded-lg p-2 bg-background text-sm"
            />
            <div className="flex gap-2">
              <input
                placeholder="Unité"
                value={newConstante.unite}
                onChange={(e) => setNewConstante({ ...newConstante, unite: e.target.value })}
                className="flex-1 border border-input rounded-lg p-2 bg-background text-sm"
              />
              <Button onClick={handleAddConstante} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {formData.constantes.map((const_, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {const_.nom}: {const_.valeur} {const_.unite}
                </span>
                <button
                  onClick={() => handleRemoveConstante(idx)}
                  className="p-1 hover:bg-background rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Diagnostic et traitement */}
        <section className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Diagnostic et traitement</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Diagnostic *</label>
              <textarea
                value={formData.diagnostic}
                onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
                placeholder="Description du diagnostic..."
                className="w-full border border-input rounded-lg p-3 bg-background resize-none h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Traitement recommandé</label>
              <textarea
                value={formData.traitement}
                onChange={(e) => setFormData({ ...formData, traitement: e.target.value })}
                placeholder="Instructions de traitement..."
                className="w-full border border-input rounded-lg p-3 bg-background resize-none h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes supplémentaires..."
                className="w-full border border-input rounded-lg p-3 bg-background resize-none h-16"
              />
            </div>
          </div>
        </section>

        {/* Ordonnance */}
        <section className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Ordonnance</h2>
          <div className="space-y-3 mb-4">
            {formData.ordonnance.medicaments.map((med, idx) => (
              <div key={idx} className="border border-input rounded-lg p-4 space-y-2">
                <div className="grid md:grid-cols-2 gap-2">
                  <input
                    placeholder="Nom du médicament"
                    value={med.nom}
                    onChange={(e) => handleMedicamentChange(idx, 'nom', e.target.value)}
                    className="border border-input rounded p-2 text-sm bg-background"
                  />
                  <input
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) => handleMedicamentChange(idx, 'dosage', e.target.value)}
                    className="border border-input rounded p-2 text-sm bg-background"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <input
                    placeholder="Fréquence"
                    value={med.frequence}
                    onChange={(e) => handleMedicamentChange(idx, 'frequence', e.target.value)}
                    className="border border-input rounded p-2 text-sm bg-background"
                  />
                  <input
                    placeholder="Durée"
                    value={med.duree}
                    onChange={(e) => handleMedicamentChange(idx, 'duree', e.target.value)}
                    className="border border-input rounded p-2 text-sm bg-background"
                  />
                </div>
                {formData.ordonnance.medicaments.length > 1 && (
                  <button
                    onClick={() => handleRemoveMedicament(idx)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Supprimer ce médicament
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleAddMedicament} variant="outline" className="w-full mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un médicament
          </Button>
          <div>
            <label className="block text-sm font-medium mb-2">Instructions générales</label>
            <textarea
              value={formData.ordonnance.instructions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ordonnance: { ...formData.ordonnance, instructions: e.target.value }
                })
              }
              placeholder="Instructions d'utilisation des médicaments..."
              className="w-full border border-input rounded-lg p-3 bg-background resize-none h-16"
            />
          </div>
        </section>

        {/* Prochain RDV */}
        <section className="pb-6">
          <h2 className="text-lg font-semibold mb-4">Suivi</h2>
          <div>
            <label className="block text-sm font-medium mb-2">Prochain rendez-vous recommandé</label>
            <input
              type="date"
              value={formData.prochain_rdv}
              onChange={(e) => setFormData({ ...formData, prochain_rdv: e.target.value })}
              className="border border-input rounded-lg p-2 bg-background"
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => navigate('/medecin/consultations')}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="flex-1 gap-2"
          >
            <Save className="h-4 w-4" />
            Enregistrer la consultation
          </Button>
        </div>
      </div>
    </div>
  );
};
