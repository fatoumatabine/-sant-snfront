import React, { useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  User,
  Stethoscope,
  CalendarDays,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
  new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(v);

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

const statutConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  paye: {
    label: 'Payé',
    color: '#16a34a',
    bg: '#dcfce7',
    icon: <CheckCircle2 size={13} />,
  },
  en_attente: {
    label: 'En attente',
    color: '#d97706',
    bg: '#fef3c7',
    icon: <Clock size={13} />,
  },
  echec: {
    label: 'Échec',
    color: '#dc2626',
    bg: '#fee2e2',
    icon: <XCircle size={13} />,
  },
  echoue: {
    label: 'Échec',
    color: '#dc2626',
    bg: '#fee2e2',
    icon: <XCircle size={13} />,
  },
  rembourse: {
    label: 'Remboursé',
    color: '#6b7280',
    bg: '#f3f4f6',
    icon: <RefreshCw size={13} />,
  },
};

/* ──────────────────── Sub-components ──────────────────── */

/** Premium teal gradient invoice header */
const InvoiceHeader: React.FC<{ invoiceRef: string; invoiceDate: string }> = ({
  invoiceRef,
  invoiceDate,
}) => (
  <div
    className="relative overflow-hidden"
    style={{
      background: 'linear-gradient(135deg, #064e50 0%, #0C7779 45%, #1a9b8e 100%)',
      minHeight: 140,
    }}
  >
    {/* Decorative circles */}
    <div
      className="absolute"
      style={{
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }}
    />
    <div
      className="absolute"
      style={{
        top: 20,
        right: 40,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }}
    />
    <div
      className="absolute"
      style={{
        bottom: -20,
        left: 200,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
      }}
    />

    {/* Content */}
    <div className="relative z-10 flex items-center justify-between px-8 py-6">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 52,
            height: 52,
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.3)',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 22 22" fill="none" aria-hidden>
            <rect x="8" y="2" width="6" height="18" rx="2" fill="white" />
            <rect x="2" y="8" width="18" height="6" rx="2" fill="white" />
          </svg>
        </div>
        <div>
          <p
            className="font-bold text-white tracking-widest text-lg leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.15em' }}
          >
            SANTÉ SN
          </p>
          <p className="text-xs font-medium tracking-wider" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em' }}>
            CLINIQUE MÉDICALE
          </p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={9} color="rgba(255,255,255,0.6)" />
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              123 Rue Dakar, Dakar, Sénégal
            </p>
          </div>
        </div>
      </div>

      {/* Invoice meta */}
      <div className="text-right">
        <p
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.05em' }}
        >
          FACTURE
        </p>
        <div
          className="mt-2 px-3 py-1.5 rounded-lg text-right"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <p className="text-[10px] font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
            N° Facture :
          </p>
          <p
            className="text-xs font-bold text-white tracking-wide"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {invoiceRef}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Date d'émission :
          </p>
          <p className="text-xs font-semibold text-white">{invoiceDate}</p>
        </div>
      </div>
    </div>

    {/* Subtle wave at the bottom */}
    <svg
      className="absolute bottom-0 left-0 w-full"
      height="20"
      viewBox="0 0 800 20"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <path d="M0 20 Q200 0 400 10 Q600 20 800 5 L800 20 Z" fill="white" />
    </svg>
  </div>
);

/** Paid watermark stamp */
const PayeWatermark: React.FC = () => (
  <div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    style={{ zIndex: 5 }}
    aria-hidden
  >
    <div
      style={{
        transform: 'rotate(-35deg)',
        border: '4px solid rgba(22,163,74,0.18)',
        borderRadius: 8,
        padding: '8px 28px',
        color: 'rgba(22,163,74,0.13)',
        fontSize: 64,
        fontWeight: 900,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        letterSpacing: '0.18em',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      PAYÉ
    </div>
  </div>
);

/** Section heading with left accent bar */
const SectionHeading: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <div className="flex items-center gap-2 mb-3">
    <div
      className="flex-shrink-0 rounded"
      style={{ width: 3, height: 18, background: 'linear-gradient(180deg,#0C7779,#1a9b8e)' }}
    />
    {icon && (
      <span style={{ color: '#0C7779' }}>{icon}</span>
    )}
    <h2
      className="font-bold text-xs tracking-widest"
      style={{
        color: '#0C7779',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        letterSpacing: '0.1em',
      }}
    >
      {children}
    </h2>
  </div>
);

/** Info pill — used in patient/payment detail rows */
const InfoPill: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value?: string | React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    {icon && (
      <span className="mt-0.5 flex-shrink-0" style={{ color: '#0C7779' }}>
        {icon}
      </span>
    )}
    <div>
      <p className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
        {label}
      </p>
      <p className="text-xs font-semibold" style={{ color: '#1f2937' }}>
        {value || '—'}
      </p>
    </div>
  </div>
);

/* ─────────────────────────── Main component ─────────────────────────── */
export const FacturePatient: React.FC<FacturePatientProps> = ({ paiement, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
  const invoiceRef = `FAC-${String(paiement.id).padStart(5, '0')}`;
  const transactionRef = paiement.transactionId ?? invoiceRef;
  const isPaid = paiement.statut === 'paye';

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=820,height=1000');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${invoiceRef} — Santé SN</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @page{size:A4;margin:0}
    @media print{html,body{height:100%;width:210mm}}
  </style>
</head>
<body style="padding:0;margin:0">${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 1800);
  };

  return (
    <AnimatePresence>
      {/* ── Overlay ── */}
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto p-4 md:p-6"
        style={{ background: 'rgba(15,25,40,0.75)', backdropFilter: 'blur(6px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* ── Wrapper ── */}
        <motion.div
          className="mx-auto flex min-h-full w-full max-w-2xl items-start justify-center py-8"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full flex flex-col gap-3">
            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between px-1">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 bg-white/95 text-gray-700 hover:bg-white border border-white/40 shadow-md"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 bg-white/95 text-gray-700 hover:bg-white border border-white/40 shadow-md"
                  onClick={handlePrint}
                >
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                onClick={onClose}
                aria-label="Fermer la facture"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* ── Paper ── */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: '#fff' }}
            >
              {/* Paid watermark */}
              {isPaid && <PayeWatermark />}

              <div ref={printRef} style={{ fontFamily: "'Inter', sans-serif", background: '#fff' }}>
                {/* ── HEADER ── */}
                <InvoiceHeader invoiceRef={invoiceRef} invoiceDate={invoiceDate} />

                {/* ── BODY ── */}
                <div className="relative px-8 pb-8 pt-5 space-y-6">

                  {/* ── Status badge row ── */}
                  <div className="flex items-center justify-between">
                    <h1
                      className="text-base font-bold tracking-wider"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        color: '#1a2e44',
                        letterSpacing: '0.06em',
                      }}
                    >
                      FACTURE DE CONSULTATION
                    </h1>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ color: statut.color, background: statut.bg }}
                    >
                      {statut.icon}
                      {statut.label}
                    </span>
                  </div>

                  {/* ── INFORMATIONS PATIENT ── */}
                  <section>
                    <SectionHeading icon={<User size={13} />}>
                      INFORMATIONS PATIENT
                    </SectionHeading>
                    <div
                      className="grid grid-cols-2 gap-4 p-4 rounded-xl"
                      style={{ background: '#f8fffe', border: '1px solid #d1f0ed' }}
                    >
                      <InfoPill
                        icon={<User size={13} />}
                        label="Nom complet"
                        value={paiement.patientName || '—'}
                      />
                      <InfoPill
                        icon={<Phone size={13} />}
                        label="Téléphone"
                        value={paiement.patientPhone || '—'}
                      />
                      <InfoPill
                        icon={<Mail size={13} />}
                        label="Email"
                        value={paiement.patientEmail || '—'}
                      />
                      <InfoPill
                        icon={<CalendarDays size={13} />}
                        label="Date de naissance"
                        value={paiement.patientDob ? formatDate(paiement.patientDob) : '—'}
                      />
                    </div>
                  </section>

                  {/* ── DÉTAILS DE LA CONSULTATION ── */}
                  <section>
                    <SectionHeading icon={<Stethoscope size={13} />}>
                      DÉTAILS DE LA CONSULTATION
                    </SectionHeading>
                    <div
                      className="grid grid-cols-2 gap-4 p-4 rounded-xl"
                      style={{ background: '#f8fffe', border: '1px solid #d1f0ed' }}
                    >
                      <InfoPill
                        icon={<Stethoscope size={13} />}
                        label="Médecin"
                        value={paiement.rendezVous?.medecin?.user?.name ?? '—'}
                      />
                      <InfoPill
                        icon={<FileText size={13} />}
                        label="Spécialité"
                        value={paiement.rendezVous?.medecin?.specialite ?? '—'}
                      />
                      <InfoPill
                        icon={<CalendarDays size={13} />}
                        label="Date du rendez-vous"
                        value={
                          formatDate(consultDate) +
                          (paiement.rendezVous?.heure ? ` à ${paiement.rendezVous.heure}` : '')
                        }
                      />
                      <InfoPill
                        icon={<FileText size={13} />}
                        label="Motif"
                        value={paiement.rendezVous?.motif ?? '—'}
                      />
                    </div>
                  </section>

                  {/* ── PRESTATIONS / SERVICES ── */}
                  <section>
                    <SectionHeading icon={<FileText size={13} />}>
                      PRESTATIONS / SERVICES
                    </SectionHeading>
                    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #d1f0ed' }}>
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr
                            style={{
                              background: 'linear-gradient(135deg,#0C7779,#1a9b8e)',
                            }}
                          >
                            <th
                              className="text-left px-4 py-2.5 font-semibold text-white"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              Description
                            </th>
                            <th
                              className="text-center px-3 py-2.5 font-semibold text-white w-14"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              Qté
                            </th>
                            <th
                              className="text-right px-4 py-2.5 font-semibold text-white w-36"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              Montant
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ background: '#fff' }}>
                            <td className="px-4 py-3 text-gray-700">
                              Consultation médicale —{' '}
                              <span className="font-medium">
                                {paiement.rendezVous?.medecin?.specialite ?? 'Médecin généraliste'}
                              </span>
                            </td>
                            <td
                              className="px-3 py-3 text-center font-medium"
                              style={{ color: '#374151' }}
                            >
                              1
                            </td>
                            <td
                              className="px-4 py-3 text-right font-bold"
                              style={{ color: '#0C7779' }}
                            >
                              {formatMontant(paiement.montant)}
                            </td>
                          </tr>
                          {/* Empty rows */}
                          {[1, 2].map((i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? '#f8fffe' : '#fff' }}>
                              <td className="px-4 py-2.5 border-t border-gray-100" style={{ minHeight: 32, color: 'transparent' }}>—</td>
                              <td className="px-3 py-2.5 border-t border-gray-100" />
                              <td className="px-4 py-2.5 border-t border-gray-100" />
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* ── RÉCAPITULATIF FINANCIER ── */}
                  <section>
                    <SectionHeading>RÉCAPITULATIF</SectionHeading>
                    <div className="flex justify-end">
                      <div className="w-64 space-y-1">
                        <div className="flex justify-between text-xs py-1.5 px-3">
                          <span style={{ color: '#6b7280' }}>Sous-total</span>
                          <span style={{ color: '#374151', fontWeight: 500 }}>
                            {formatMontant(paiement.montant)}
                          </span>
                        </div>
                        <div
                          className="flex justify-between text-xs py-1.5 px-3"
                          style={{ borderTop: '1px dashed #d1d5db' }}
                        >
                          <span style={{ color: '#6b7280' }}>TVA (0 %)</span>
                          <span style={{ color: '#374151', fontWeight: 500 }}>0 FCFA</span>
                        </div>
                        <div
                          className="flex justify-between px-4 py-3 rounded-xl mt-2"
                          style={{
                            background: 'linear-gradient(135deg,#0C7779,#1a9b8e)',
                          }}
                        >
                          <span
                            className="text-sm font-bold text-white tracking-wide"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            TOTAL DÛ
                          </span>
                          <span
                            className="text-sm font-bold text-white"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {formatMontant(paiement.montant)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── MODE DE PAIEMENT ── */}
                  <section>
                    <SectionHeading icon={<CreditCard size={13} />}>
                      MODE DE PAIEMENT
                    </SectionHeading>
                    <div
                      className="grid grid-cols-2 gap-3 p-4 rounded-xl"
                      style={{ background: '#f8fffe', border: '1px solid #d1f0ed' }}
                    >
                      <InfoPill
                        icon={<CreditCard size={13} />}
                        label="Méthode"
                        value={METHODE_LABELS[paiement.methode] ?? paiement.methode}
                      />
                      <InfoPill
                        icon={<CalendarDays size={13} />}
                        label="Date du paiement"
                        value={formatDate(paiement.date_paiement)}
                      />
                      <InfoPill
                        icon={<Hash size={13} />}
                        label="Référence transaction"
                        value={transactionRef}
                      />
                      <InfoPill
                        icon={<CheckCircle2 size={13} />}
                        label="Statut"
                        value={
                          <span
                            className="inline-flex items-center gap-1"
                            style={{ color: statut.color }}
                          >
                            {statut.icon}
                            {statut.label}
                          </span>
                        }
                      />
                    </div>
                  </section>

                  {/* ── NOTES / OBSERVATIONS ── */}
                  <section>
                    <SectionHeading icon={<FileText size={13} />}>
                      NOTES / OBSERVATIONS
                    </SectionHeading>
                    <div
                      className="space-y-2 p-4 rounded-xl"
                      style={{ background: '#f8fffe', border: '1px solid #d1f0ed' }}
                    >
                      {['Évaluation initiale :', 'Traitements recommandés :'].map((label) => (
                        <div key={label} className="flex items-end gap-3 text-xs text-gray-500">
                          <span className="whitespace-nowrap font-medium">• {label}</span>
                          <div
                            className="flex-1"
                            style={{ borderBottom: '1px dashed #d1d5db', marginBottom: 2 }}
                          />
                        </div>
                      ))}
                      <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                        <span className="whitespace-nowrap font-medium">• Prochain rendez-vous :</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <span
                            className="inline-block w-3 h-3 rounded-sm border border-gray-400"
                          />
                          <span>Oui</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <span
                            className="inline-block w-3 h-3 rounded-sm border border-gray-400"
                          />
                          <span>Non</span>
                        </label>
                        <span>Date :</span>
                        <div
                          className="flex-1"
                          style={{ borderBottom: '1px dashed #d1d5db', marginBottom: 2 }}
                        />
                      </div>
                    </div>
                  </section>

                  {/* ── Signature area ── */}
                  <div className="flex justify-between items-end pt-2">
                    <div className="text-center">
                      <div
                        className="w-36 mb-1"
                        style={{ borderBottom: '1.5px solid #d1d5db' }}
                      />
                      <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                        Signature du patient
                      </p>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-36 mb-1"
                        style={{ borderBottom: '1.5px solid #d1d5db' }}
                      />
                      <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                        Cachet & signature médecin
                      </p>
                    </div>
                  </div>

                  {/* ── Footer ── */}
                  <footer
                    className="pt-4 text-center"
                    style={{ borderTop: '1px solid #e6f7f5' }}
                  >
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
                      style={{ background: '#e6f7f5' }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: 16,
                          height: 16,
                          background: 'linear-gradient(135deg,#0C7779,#1a9b8e)',
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 22 22" fill="none" aria-hidden>
                          <rect x="8" y="2" width="6" height="18" rx="2" fill="white" />
                          <rect x="2" y="8" width="18" height="6" rx="2" fill="white" />
                        </svg>
                      </div>
                      <p
                        className="text-[10px] font-bold tracking-widest"
                        style={{ color: '#0C7779' }}
                      >
                        SANTÉ SN
                      </p>
                    </div>
                    <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                      Ce document est une facture officielle émise par Santé SN — Clinique Médicale.
                    </p>
                    <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                      Pour toute question, contactez-nous au <span className="font-medium">+221 33 000 0000</span> · www.sante-sn.com
                    </p>
                    <p className="text-[10px] mt-1.5 font-medium" style={{ color: '#b5ccd0' }}>
                      © {new Date().getFullYear()} Santé SN. Tous droits réservés.
                    </p>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
