import React, { useState } from 'react';
import { Users, Search, Eye, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { extractData } from '@/lib/api-response';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { useAuthStore } from '@/store/authStore';

interface Patient {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  dateNaissance?: string;
  adresse?: string;
  groupeSanguin?: string;
  allergies: string[];
  antecedents?: Array<{
    type: string;
    description: string;
    date?: string;
  }>;
  derniere_consultation?: string;
  total_consultations?: number;
}

export const MedecinPatients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAllergies, setFilterAllergies] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['medecin-patients', currentUserId],
    queryFn: async () => {
      try {
        const response = await apiService.get(API_ENDPOINTS.consultations.list);
        const consultations = extractData<any[]>(response) || [];

        const byPatient = new Map<string, Patient>();

        for (const consultation of consultations) {
          if (
            currentUserId &&
            String(consultation?.medecin?.user?.id || '') !== String(currentUserId)
          ) {
            continue;
          }

          const patient = consultation?.patient;
          const patientUser = patient?.user;
          if (!patient?.id) continue;

          const patientId = String(patient.id);
          const existing = byPatient.get(patientId);

          const consultationDate = consultation?.date;
          const totalConsultations = (existing?.total_consultations || 0) + 1;
          const latestConsultation =
            !existing?.derniere_consultation ||
            (consultationDate && new Date(consultationDate) > new Date(existing.derniere_consultation))
              ? consultationDate
              : existing.derniere_consultation;

          byPatient.set(patientId, {
            id: patientId,
            prenom: patient.prenom || existing?.prenom || '',
            nom: patient.nom || existing?.nom || '',
            email: patientUser?.email || existing?.email || '',
            telephone: patient.telephone || existing?.telephone || '',
            dateNaissance: patient.date_naissance || existing?.dateNaissance,
            adresse: patient.adresse || existing?.adresse,
            groupeSanguin: patient.groupe_sanguin || existing?.groupeSanguin,
            allergies: existing?.allergies || [],
            antecedents: existing?.antecedents || [],
            derniere_consultation: latestConsultation,
            total_consultations: totalConsultations,
          });
        }

        return Array.from(byPatient.values());
      } catch (error) {
        console.error('Erreur chargement patients:', error);
        return [];
      }
    }
  });

  const filtered = patients.filter(p => {
    const matchesSearch = `${p.prenom} ${p.nom}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAllergies = !filterAllergies || p.allergies?.length > 0;
    return matchesSearch && matchesAllergies;
  });

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2">
            <Users className="h-8 w-8" />
            Mes patients
          </h1>
          <p className="text-muted-foreground">Historique et gestion de mes patients</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{patients.length}</p>
          <p className="text-muted-foreground">Patients actifs</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
          />
        </div>
        <button
          onClick={() => setFilterAllergies(!filterAllergies)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterAllergies
              ? 'bg-red-100 text-red-700'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          <AlertCircle className="h-4 w-4 inline mr-2" />
          Allergies
        </button>
      </div>

      {/* Grid de patients */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Aucun patient trouvé</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(patient => (
            <div key={patient.id} className="card-health p-6">
              {/* En-tête */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">
                    {patient.prenom} {patient.nom}
                  </h3>
                  <p className="text-sm text-muted-foreground">{calculateAge(patient.dateNaissance)} ans</p>
                </div>
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>

              {/* Infos */}
              <div className="space-y-2 mb-4 text-sm">
                <p className="text-muted-foreground">{patient.email}</p>
                <p className="text-muted-foreground">{patient.telephone}</p>
                {patient.groupeSanguin && (
                  <p className="font-medium">Sang: <span className="text-primary">{patient.groupeSanguin}</span></p>
                )}
              </div>

              {/* Allergies */}
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-1">Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy, idx) => (
                      <span key={idx} className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Consultations</p>
                  <p className="text-lg font-bold">{patient.total_consultations || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dernière</p>
                  <p className="text-xs font-medium">
                    {patient.derniere_consultation
                      ? new Date(patient.derniere_consultation).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  RDV
                </Button>
                <Button size="sm" className="flex-1 gap-1 text-xs">
                  <MessageSquare className="h-3 w-3" />
                  Consulter
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal détails patient */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="bg-gradient-success text-white p-6">
              <h2 className="text-2xl font-bold">
                {selectedPatient.prenom} {selectedPatient.nom}
              </h2>
              <p className="text-white/80">{calculateAge(selectedPatient.dateNaissance)} ans • {selectedPatient.email}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Infos personnelles */}
              <div>
                <h3 className="font-semibold mb-2">Informations personnelles</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Groupe sanguin</p>
                    <p className="font-medium">{selectedPatient.groupeSanguin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedPatient.telephone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Adresse</p>
                    <p className="font-medium">{selectedPatient.adresse || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Allergies */}
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="font-semibold text-red-700 mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies.map((allergy, idx) => (
                      <span key={idx} className="bg-red-200 text-red-800 px-2 py-1 rounded text-sm">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Antécédents */}
              {selectedPatient.antecedents && selectedPatient.antecedents.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Antécédents</h3>
                  <div className="space-y-2">
                    {selectedPatient.antecedents.map((antec, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                        <p className="font-medium capitalize">{antec.type}</p>
                        <p className="text-muted-foreground">{antec.description}</p>
                        {antec.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(antec.date).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
