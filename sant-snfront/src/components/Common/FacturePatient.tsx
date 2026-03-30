import React, { useEffect, useRef } from 'react';
import { X, Printer, Download, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─────────────────────────── Types ─────────────────────────── */
export interface FacturePaiement {
  id: number | string;
  montant: number;
  methode: string;
  statut: string;
  transactionId?: string | null;
  date_paiement?: string | null;
  createdAt: string;
  rendezVous?: {
    date: string;
    heure: string;
    motif: string;
    medecin: {
      user: { name: string };
      specialite: string;
    };
  };
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  patientDob?: string;
  patientGenre?: string;
}

interface FacturePatientProps {
  paiement: FacturePaiement;
  onClose: () => void;
}

/* ─────────────────────────── Helpers ─────────────────────────── */
const METHODE_LABELS: Record<string, string> = {
  especes: 'Espèces',
  carte_bancaire: 'Carte bancaire',
  carte: 'Carte bancaire',
  mobile_money: 'Mobile Money',
  wave: 'Wave',
  orange_money: 'Orange Money',
  virement: 'Virement bancaire',
};

const formatMontant = (v: number) =>
  new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(v);

const formatDate = (iso: string | null | undefined, fallback = '—') => {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const statutConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  paye:       { label: 'Payé',        color: '#16a34a', icon: <CheckCircle2 size={14} /> },
  en_attente: { label: 'En attente',  color: '#d97706', icon: <Clock size={14} /> },
  echec:      { label: 'Échec',       color: '#dc2626', icon: <XCircle size={14} /> },
  echoue:     { label: 'Échec',       color: '#dc2626', icon: <XCircle size={14} /> },
  rembourse:  { label: 'Remboursé',   color: '#6b7280', icon: <RefreshCw size={14} /> },
};

/* ─────────────────────── Sub-components ─────────────────────── */

/** Teal wave / decorative header identical to the reference design */
const InvoiceHeader: React.FC<{ date: string }> = ({ date }) => (
  <div className="relative bg-white overflow-hidden" style={{ minHeight: 120 }}>
    {/* Top-right teal wave */}
    <svg
      className="absolute top-0 right-0"
      width="280"
      height="110"
      viewBox="0 0 280 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M280 0 L280 110 L100 110 Q160 90 200 50 Q230 20 280 0Z"
        fill="#0C7779"
        opacity="0.9"
      />
      <path
        d="M280 0 L280 85 L130 85 Q185 65 220 30 Q248 8 280 0Z"
        fill="#249E94"
        opacity="0.7"
      />
    </svg>

    {/* Bottom-left decorative stripes (like in the image) */}
    <svg
      className="absolute bottom-0 left-0"
      width="60"
      height="90"
      viewBox="0 0 60 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {[0, 10, 20, 30, 40].map((x) => (
        <rect key={x} x={x} y="0" width="4" height="90" rx="2" fill="#0C7779" opacity="0.18" />
      ))}
    </svg>

    {/* Clinic branding — left */}
    <div className="relative z-10 flex items-start justify-between px-10 pt-6 pb-4">
      <div className="flex items-center gap-3">
        {/* Medical cross logo */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#0C7779,#249E94)' }}
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

      {/* Date — sits over the wave */}
      <div className="z-10 mt-1 mr-4">
        <p
          className="font-bold tracking-widest text-sm text-white"
          style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '0.12em' }}
        >
          {date.toUpperCase()}
        </p>
      </div>
    </div>
  </div>
);

/** Teal section heading identical to the reference */
const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    className="font-bold text-sm tracking-wider mb-3 pb-0.5"
    style={{ color: '#0C7779', fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '0.08em' }}
  >
    {children}
  </h2>
);

/** Two-column info table row */
const InfoRow: React.FC<{ label: string; value?: string | React.ReactNode; full?: boolean }> = ({
  label,
  value,
  full,
}) => (
  <div
    className={`flex gap-1 border border-gray-300 ${full ? 'col-span-2' : ''}`}
    style={{ minHeight: 28 }}
  >
    <span className="text-xs text-gray-600 px-2 py-1.5 whitespace-nowrap" style={{ minWidth: 130 }}>
      {label} :
    </span>
    <span className="text-xs font-medium text-gray-800 px-2 py-1.5 flex-1 border-l border-gray-300">
      {value || ''}
    </span>
  </div>
);

/* ─────────────────────────── Main component ─────────────────────────── */
export const FacturePatient: React.FC<FacturePatientProps> = ({ paiement, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const statut = statutConfig[paiement.statut] ?? statutConfig['en_attente'];
  const consultDate = paiement.rendezVous?.date ?? paiement.createdAt;
  const invoiceDate = formatDate(paiement.date_paiement ?? paiement.createdAt);
  const invoiceRef = paiement.transactionId ?? `FACT-${String(paiement.id).padStart(5, '0')}`;

  const tva = 0; // Médical exonéré de TVA au Sénégal
  const total = paiement.montant;

  const handlePrint = () => {
    if (!printRef.current) return;

    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${invoiceRef}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:white}
    @page{size:A4;margin:0}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 1800);
  };

  return (
    /* ── Overlay ── */
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 md:p-6"
      onClick={onClose}
    >
      <div className="fixed right-4 top-4 z-20 md:right-6 md:top-6">
        <Button
          variant="secondary"
          className="gap-2 border border-white/30 bg-white/95 text-slate-900 shadow-lg hover:bg-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          Fermer
        </Button>
      </div>

      {/* ── Wrapper ── */}
      <div
        className="mx-auto flex min-h-full w-full items-start justify-center py-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex flex-col" style={{ maxHeight: '95vh', width: '100%', maxWidth: 700 }}>
        {/* Toolbar (outside the paper) */}
        <div className="sticky top-0 z-10 mb-3 flex items-center justify-between px-1">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              onClick={handlePrint}
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ── Paper document ── */}
        <div
          className="overflow-y-auto rounded-lg shadow-2xl"
          style={{ background: '#fff' }}
        >
          <div ref={printRef} style={{ fontFamily: "'Inter',sans-serif", background: '#fff' }}>

            {/* ── HEADER ── */}
            <InvoiceHeader date={invoiceDate} />

            {/* ── BODY ── */}
            <div className="px-10 pb-10 pt-4 space-y-6">

              {/* Document title */}
              <div className="text-center py-2">
                <h1
                  className="font-bold text-lg tracking-wider"
                  style={{ color: '#1a1a2e', fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '0.06em' }}
                >
                  FACTURE DE CONSULTATION
                </h1>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">Réf : {invoiceRef}</span>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: statut.color, background: `${statut.color}18` }}
                  >
                    {statut.icon}
                    {statut.label}
                  </span>
                </div>
              </div>

              {/* ── INFORMATIONS PATIENT ── */}
              <section>
                <SectionHeading>INFORMATIONS PATIENT</SectionHeading>
                <div className="grid grid-cols-2 gap-0 border-t border-l border-gray-300">
                  <InfoRow label="Nom complet"     value={paiement.patientName || '—'} />
                  <InfoRow label="Téléphone"       value={paiement.patientPhone || '—'} />
                  <InfoRow label="Date de naissance" value={paiement.patientDob ? formatDate(paiement.patientDob) : '—'} />
                  <InfoRow label="Email"           value={paiement.patientEmail || '—'} />
                  <InfoRow label="Genre"           value={paiement.patientGenre || '—'} />
                  <InfoRow label="Contact d'urgence" value="—" />
                </div>
              </section>

              {/* ── DÉTAILS DE LA CONSULTATION ── */}
              <section>
                <SectionHeading>DÉTAILS DE LA CONSULTATION</SectionHeading>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="font-medium w-36 text-gray-500">Médecin :</span>
                    <span className="font-semibold">
                      {paiement.rendezVous?.medecin?.user?.name ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="font-medium w-36 text-gray-500">Spécialité :</span>
                    <span>{paiement.rendezVous?.medecin?.specialite ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="font-medium w-36 text-gray-500">Date :</span>
                    <span>{formatDate(consultDate)}{paiement.rendezVous?.heure ? ` à ${paiement.rendezVous.heure}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="font-medium w-36 text-gray-500">Motif :</span>
                    <span>{paiement.rendezVous?.motif ?? '—'}</span>
                  </div>
                </div>
                <div className="mt-3 border-b border-dashed border-gray-300" />
              </section>

              {/* ── PRESTATIONS / SERVICES ── */}
              <section>
                <SectionHeading>PRESTATIONS / SERVICES</SectionHeading>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: '#e6f7f4' }}>
                      <th className="text-left px-3 py-2 border border-gray-300 font-semibold" style={{ color: '#005461' }}>
                        Description
                      </th>
                      <th className="text-center px-3 py-2 border border-gray-300 font-semibold w-16" style={{ color: '#005461' }}>
                        Qté
                      </th>
                      <th className="text-right px-3 py-2 border border-gray-300 font-semibold w-32" style={{ color: '#005461' }}>
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 border border-gray-300 text-gray-700">
                        Consultation médicale — {paiement.rendezVous?.medecin?.specialite ?? 'Médecin généraliste'}
                      </td>
                      <td className="px-3 py-2 border border-gray-300 text-center text-gray-700">1</td>
                      <td className="px-3 py-2 border border-gray-300 text-right font-medium text-gray-800">
                        {formatMontant(paiement.montant)}
                      </td>
                    </tr>
                    {/* empty rows like in the reference */}
                    {[1, 2].map((i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 border border-gray-300" style={{ height: 28 }}>&nbsp;</td>
                        <td className="px-3 py-2 border border-gray-300 text-center">&nbsp;</td>
                        <td className="px-3 py-2 border border-gray-300 text-right">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* ── RÉCAPITULATIF FINANCIER ── */}
              <section>
                <SectionHeading>RÉCAPITULATIF FINANCIER</SectionHeading>
                <div className="ml-auto w-72">
                  {[
                    { label: 'Sous-total',   value: formatMontant(paiement.montant) },
                    { label: 'TVA (0 %)',    value: formatMontant(tva) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs text-gray-600 py-1 border-b border-dashed border-gray-200">
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <div
                    className="flex justify-between text-sm font-bold mt-2 px-3 py-2 rounded"
                    style={{ background: '#e6f7f4', color: '#005461' }}
                  >
                    <span>TOTAL</span>
                    <span>{formatMontant(total)}</span>
                  </div>
                </div>
              </section>

              {/* ── INFORMATIONS DE PAIEMENT ── */}
              <section>
                <SectionHeading>INFORMATIONS DE PAIEMENT</SectionHeading>
                <div className="space-y-1.5">
                  {[
                    {
                      label: 'Méthode de paiement',
                      value: METHODE_LABELS[paiement.methode] ?? paiement.methode,
                    },
                    {
                      label: 'Date du paiement',
                      value: formatDate(paiement.date_paiement),
                    },
                    {
                      label: 'Heure du paiement',
                      value: formatTime(paiement.date_paiement) || '—',
                    },
                    {
                      label: 'Référence transaction',
                      value: paiement.transactionId ?? invoiceRef,
                    },
                    {
                      label: 'Statut',
                      value: (
                        <span
                          className="inline-flex items-center gap-1 font-semibold"
                          style={{ color: statut.color }}
                        >
                          {statut.icon}
                          {statut.label}
                        </span>
                      ),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-44 text-gray-500 font-medium">{label} :</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-b border-dashed border-gray-300" />
              </section>

              {/* ── NOTES DU MÉDECIN ── */}
              <section>
                <SectionHeading>NOTES / OBSERVATIONS</SectionHeading>
                <div className="space-y-2">
                  {[
                    'Évaluation initiale :',
                    'Tests / Traitements recommandés :',
                  ].map((label) => (
                    <div key={label} className="flex items-end gap-2 text-xs text-gray-700">
                      <span className="whitespace-nowrap">• {label}</span>
                      <div className="flex-1 border-b border-gray-400" style={{ marginBottom: 2 }} />
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-xs text-gray-700 mt-1">
                    <span className="whitespace-nowrap">• Prochain rendez-vous :</span>
                    <label className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border border-gray-500 rounded-sm" />
                      <span>Oui</span>
                    </label>
                    <label className="flex items-center gap-1 ml-2">
                      <span className="inline-block w-3 h-3 border border-gray-500 rounded-sm" />
                      <span>Non</span>
                    </label>
                    <span className="ml-3">Date :</span>
                    <div className="flex-1 border-b border-gray-400" style={{ marginBottom: 2 }} />
                  </div>
                </div>
              </section>

              {/* ── Footer ── */}
              <footer className="pt-4 border-t border-gray-200 text-center">
                <p className="text-[10px] text-gray-400">
                  Ce document est une facture officielle émise par Santé SN — Clinique Médicale.
                  Conservez-le pour vos dossiers. Pour toute question, contactez-nous au +221 33 000 0000.
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  © {new Date().getFullYear()} Santé SN. Tous droits réservés.
                </p>
              </footer>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
