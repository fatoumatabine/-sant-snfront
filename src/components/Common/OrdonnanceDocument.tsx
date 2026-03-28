import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Download, Loader2, Pill, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';

/* ─────────────────────────── Types ─────────────────────────── */
interface Medicament {
  nom: string;
  dosage?: string;
  frequence?: string;
  duree?: string;
  instructions?: string;
}

interface OrdonnanceData {
  id: string | number;
  numero?: string;
  contenu?: string;
  date_emission?: string;
  date_creation?: string;
  createdAt?: string;
  instructions?: string;
  medicaments?: Medicament[];
  patient?: {
    prenom?: string;
    nom?: string;
    user?: { name?: string; email?: string };
    telephone?: string;
    dateNaissance?: string;
  };
  consultation?: {
    medecin?: {
      user?: { name?: string };
      specialite?: string;
    };
  };
  medecin?: {
    user?: { name?: string };
    specialite?: string;
  };
}

export interface OrdonnanceDocumentProps {
  /** ID de l'ordonnance (pour fetch) */
  ordonnanceId?: string | number;
  /** OU données déjà chargées */
  data?: OrdonnanceData;
  onClose: () => void;
}

/* ─────────────────────────── Helpers ─────────────────────────── */
const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const extractMedicaments = (raw: OrdonnanceData): Medicament[] => {
  if (Array.isArray(raw.medicaments) && raw.medicaments.length > 0) return raw.medicaments;

  const contenu = raw.contenu || '';
  const matches = contenu.match(/Médicaments:\n?([\s\S]*?)(?:\n\n|$)/);
  if (!matches) return [];

  return matches[1]
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const clean = line.replace(/^\d+\.\s*/, '').trim();
      const parts = clean.split(/\s*-\s*/);
      return {
        nom: parts[0] || clean,
        dosage: parts[1] || '',
        frequence: parts[2] || '',
        duree: parts[3] || '',
        instructions: parts[4] || '',
      };
    });
};

const extractInstructions = (raw: OrdonnanceData): string => {
  if (raw.instructions) return raw.instructions;
  const contenu = raw.contenu || '';
  const m = contenu.match(/Instructions (?:g[eé]n[eé]rales?|g.n.rales?):\s*([\s\S]*?)(?:\n\n|Médicaments:|$)/i);
  return m ? m[1].trim() : '';
};

const getPatientName = (d: OrdonnanceData) =>
  d.patient?.user?.name ||
  `${d.patient?.prenom || ''} ${d.patient?.nom || ''}`.trim() ||
  '—';

const getMedecinName = (d: OrdonnanceData) =>
  d.medecin?.user?.name ||
  d.consultation?.medecin?.user?.name ||
  '—';

const getSpecialite = (d: OrdonnanceData) =>
  d.medecin?.specialite ||
  d.consultation?.medecin?.specialite ||
  'Médecin généraliste';

const getNumero = (d: OrdonnanceData) =>
  d.numero || `ORD-${d.id}-${new Date(d.date_emission || d.date_creation || d.createdAt || '').toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '')}`;

/* ─────────────────────── Sub-components ─────────────────────── */

/** Identique au FacturePatient — vague teal en haut + rayures décoratives */
const DocumentHeader: React.FC<{ date: string }> = ({ date }) => (
  <div className="relative bg-white overflow-hidden" style={{ minHeight: 120 }}>
    {/* Vague teal haut-droite */}
    <svg className="absolute top-0 right-0" width="300" height="115" viewBox="0 0 300 115" fill="none" aria-hidden>
      <path d="M300 0 L300 115 L110 115 Q175 92 215 50 Q248 18 300 0Z" fill="#0C7779" opacity="0.9" />
      <path d="M300 0 L300 88 L145 88 Q200 65 235 28 Q262 6 300 0Z" fill="#249E94" opacity="0.65" />
    </svg>
    {/* Rayures décoratives bas-gauche */}
    <svg className="absolute bottom-0 left-0" width="64" height="88" viewBox="0 0 64 88" fill="none" aria-hidden>
      {[0, 12, 24, 36, 48].map((x) => (
        <rect key={x} x={x} y="0" width="5" height="88" rx="2.5" fill="#0C7779" opacity="0.15" />
      ))}
    </svg>

    <div className="relative z-10 flex items-start justify-between px-10 pt-6 pb-4">
      {/* Identité clinique */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#0C7779,#249E94)' }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <rect x="8" y="2" width="6" height="18" rx="2" fill="white" />
            <rect x="2" y="8" width="18" height="6" rx="2" fill="white" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-sm leading-tight" style={{ color: '#005461', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            SANTÉ SN
          </p>
          <p className="text-xs font-semibold tracking-wide" style={{ color: '#249E94' }}>
            CLINIQUE MÉDICALE
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">123 Rue Dakar, Dakar, Sénégal</p>
        </div>
      </div>
      {/* Date sur la vague */}
      <p className="font-bold tracking-widest text-sm text-white mt-1 mr-4" style={{ letterSpacing: '0.12em' }}>
        {date.toUpperCase()}
      </p>
    </div>
  </div>
);

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    className="font-bold text-xs tracking-widest mb-2 uppercase"
    style={{ color: '#0C7779', fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '0.1em' }}
  >
    {children}
  </h2>
);

const InfoLine: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-baseline gap-2 text-xs py-0.5">
    <span className="text-gray-500 font-medium shrink-0 w-36">{label} :</span>
    <span className="text-gray-800 font-semibold">{value || '—'}</span>
  </div>
);

/* ─────────────────────────── Main ─────────────────────────── */
export const OrdonnanceDocument: React.FC<OrdonnanceDocumentProps> = ({
  ordonnanceId,
  data: initialData,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<OrdonnanceData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData && !!ordonnanceId);
  const [error, setError] = useState<string | null>(null);

  /* Fetch si on n'a que l'ID */
  useEffect(() => {
    if (initialData || !ordonnanceId) return;

    let cancelled = false;
    setLoading(true);
    apiService
      .get(`/ordonnances/${ordonnanceId}`)
      .then((res: any) => {
        if (cancelled) return;
        const d = res?.data?.data ?? res?.data ?? res;
        setData(d);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Impossible de charger l\'ordonnance');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ordonnanceId, initialData]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=820,height=1000');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Ordonnance ${data ? getNumero(data) : ''}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#fff}
    @page{size:A4;margin:0}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    /* Attendre que Tailwind CDN + polices soient chargés avant impression */
    setTimeout(() => { win.print(); win.close(); }, 1800);
  };

  /* ── Médicaments parsés ── */
  const medicaments = data ? extractMedicaments(data) : [];
  const instructions = data ? extractInstructions(data) : '';
  const emissionDate = data
    ? formatDate(data.date_emission ?? data.date_creation ?? data.createdAt)
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex flex-col" style={{ maxHeight: '95vh', width: '100%', maxWidth: 720 }}>

        {/* Barre outils */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="gap-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200" onClick={handlePrint} disabled={loading || !!error}>
              <Printer className="h-4 w-4" /> Imprimer
            </Button>
            <Button variant="secondary" size="sm" className="gap-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200" onClick={handlePrint} disabled={loading || !!error}>
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Document papier */}
        <div className="overflow-y-auto rounded-lg shadow-2xl bg-white">

          {/* États loading / error */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-sm">Chargement de l'ordonnance…</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-24 text-red-500 gap-3">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
            </div>
          )}

          {/* Contenu de l'ordonnance */}
          {!loading && !error && data && (
            <div ref={printRef} style={{ fontFamily: "'Inter',sans-serif", background: '#fff' }}>

              {/* ── HEADER ── */}
              <DocumentHeader date={emissionDate} />

              {/* ── CORPS ── */}
              <div className="px-10 pb-10 pt-5 space-y-6">

                {/* Titre */}
                <div className="text-center py-1">
                  <h1
                    className="font-bold text-lg tracking-wider"
                    style={{ color: '#1a1a2e', fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '0.06em' }}
                  >
                    ORDONNANCE MÉDICALE
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    N° {getNumero(data)} &nbsp;·&nbsp; Émise le {emissionDate}
                  </p>
                </div>

                {/* ── INFORMATIONS GÉNÉRALES ── */}
                <div className="grid grid-cols-2 gap-x-10 gap-y-0">
                  {/* Colonne patient */}
                  <section>
                    <SectionHeading>Informations patient</SectionHeading>
                    <div
                      className="rounded-lg p-4 space-y-1"
                      style={{ background: '#f0faf8', border: '1px solid #c6ede8' }}
                    >
                      <InfoLine label="Nom complet"  value={getPatientName(data)} />
                      <InfoLine label="Email"        value={data.patient?.user?.email} />
                      <InfoLine label="Téléphone"    value={data.patient?.telephone} />
                      <InfoLine label="Date naiss."  value={formatDate(data.patient?.dateNaissance)} />
                    </div>
                  </section>

                  {/* Colonne médecin */}
                  <section>
                    <SectionHeading>Médecin prescripteur</SectionHeading>
                    <div
                      className="rounded-lg p-4 space-y-1"
                      style={{ background: '#f0faf8', border: '1px solid #c6ede8' }}
                    >
                      <InfoLine label="Dr."         value={getMedecinName(data)} />
                      <InfoLine label="Spécialité"  value={getSpecialite(data)} />
                      <InfoLine label="Clinique"    value="Santé SN" />
                      <InfoLine label="Tél. cabinet" value="+221 33 000 0000" />
                    </div>
                  </section>
                </div>

                {/* ── MÉDICAMENTS PRESCRITS ── */}
                <section>
                  <SectionHeading>Médicaments prescrits</SectionHeading>
                  {medicaments.length > 0 ? (
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr style={{ background: '#e6f7f4' }}>
                          {['#', 'Médicament', 'Dosage', 'Fréquence', 'Durée', 'Notes'].map((h) => (
                            <th
                              key={h}
                              className="text-left px-3 py-2 border border-gray-300 font-semibold"
                              style={{ color: '#005461' }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {medicaments.map((med, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 border border-gray-300 text-gray-500 text-center font-medium">{i + 1}</td>
                            <td className="px-3 py-2 border border-gray-300 font-semibold text-gray-800">
                              <div className="flex items-center gap-1.5">
                                <Pill className="h-3 w-3 shrink-0" style={{ color: '#0C7779' }} />
                                {med.nom}
                              </div>
                            </td>
                            <td className="px-3 py-2 border border-gray-300 text-gray-700">{med.dosage || '—'}</td>
                            <td className="px-3 py-2 border border-gray-300 text-gray-700">{med.frequence || '—'}</td>
                            <td className="px-3 py-2 border border-gray-300 text-gray-700">{med.duree || '—'}</td>
                            <td className="px-3 py-2 border border-gray-300 text-gray-600 italic">{med.instructions || ''}</td>
                          </tr>
                        ))}
                        {/* lignes vides de signature */}
                        {Array.from({ length: Math.max(0, 3 - medicaments.length) }).map((_, i) => (
                          <tr key={`empty-${i}`}>
                            {Array.from({ length: 6 }).map((_, j) => (
                              <td key={j} className="px-3 py-2 border border-gray-300" style={{ height: 30 }}>&nbsp;</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div
                      className="text-center py-6 rounded-lg text-sm text-gray-400 italic"
                      style={{ border: '1px dashed #c6ede8' }}
                    >
                      Aucun médicament renseigné
                    </div>
                  )}
                </section>

                {/* ── INSTRUCTIONS GÉNÉRALES ── */}
                <section>
                  <SectionHeading>Instructions générales</SectionHeading>
                  <div
                    className="rounded-lg p-4 text-xs text-gray-700 min-h-16"
                    style={{ background: '#fafafa', border: '1px solid #e5e7eb' }}
                  >
                    {instructions || (
                      <span className="text-gray-400 italic">Aucune instruction particulière.</span>
                    )}
                  </div>
                </section>

                {/* ── ZONE SIGNATURE ── */}
                <section>
                  <div className="grid grid-cols-2 gap-10 mt-4">
                    <div>
                      <SectionHeading>Cachet &amp; signature du médecin</SectionHeading>
                      <div
                        className="rounded-lg"
                        style={{ height: 80, border: '1px dashed #a3d9d4' }}
                      />
                    </div>
                    <div>
                      <SectionHeading>Date &amp; lieu de délivrance</SectionHeading>
                      <div
                        className="rounded-lg p-3 text-xs text-gray-700"
                        style={{ height: 80, border: '1px solid #e5e7eb', background: '#fafafa' }}
                      >
                        <p>Date : <span className="font-semibold">{emissionDate}</span></p>
                        <p className="mt-1">Lieu : Dakar, Sénégal</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="pt-4 border-t border-gray-200 text-center">
                  <p className="text-[10px] text-gray-400">
                    Ce document est une ordonnance médicale officielle émise par Santé SN — Clinique Médicale.
                    Valable 3 mois à compter de la date d'émission. Document médical confidentiel.
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    © {new Date().getFullYear()} Santé SN · +221 33 000 0000 · contact@sante-sn.sn
                  </p>
                </footer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
