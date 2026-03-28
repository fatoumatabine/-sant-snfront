export type TriageLevel = 'faible' | 'modere' | 'eleve';
export type TriageOrientation = 'auto_soin' | 'rendez_vous' | 'urgence' | 'revue_humaine';

export interface PatientTriageState {
  evaluationId: number;
  level: TriageLevel;
  urgent: boolean;
  specialiteConseillee?: string;
  recommandations: string[];
  redFlags: string[];
  needsHumanReview: boolean;
  orientation: TriageOrientation;
  aiModel?: string | null;
  createdAt: string;
}

const STORAGE_KEY = 'sante-sn-patient-triage';
const TRIAGE_VALID_HOURS = 72;

export function savePatientTriage(input: Omit<PatientTriageState, 'createdAt'> & { createdAt?: string }): void {
  const payload: PatientTriageState = {
    ...input,
    createdAt: input.createdAt || new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getPatientTriage(): PatientTriageState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PatientTriageState;
  } catch {
    return null;
  }
}

export function isPatientTriageValid(triage: PatientTriageState | null): boolean {
  if (!triage?.createdAt || !triage.evaluationId) return false;
  const createdAt = new Date(triage.createdAt).getTime();
  if (Number.isNaN(createdAt)) return false;
  const maxAgeMs = TRIAGE_VALID_HOURS * 60 * 60 * 1000;
  return Date.now() - createdAt <= maxAgeMs;
}

export function getPatientTriageValidityHours(): number {
  return TRIAGE_VALID_HOURS;
}
