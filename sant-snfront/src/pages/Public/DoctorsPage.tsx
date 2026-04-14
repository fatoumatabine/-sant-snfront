import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  Heart,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MarketingPageHero } from '@/components/Home/MarketingPageHero';
import { MarketingSectionHeading } from '@/components/Home/MarketingSectionHeading';
import { AppointmentSection } from '@/components/Home/AppointmentSection';
import { useMarketingCatalog } from '@/hooks/useMarketingCatalog';
import { formatMontant } from '@/lib/currency';
import {
  buildDoctorInitials,
  formatMarketingSlot,
  marketingCatalogFallback,
} from '@/lib/marketingCatalog';
import { staggerContainer, staggerItem, viewport } from '@/lib/animations';
import { marketingImages } from '@/lib/marketingImages';

const trustPoints = [
  {
    Icon: UserCheck,
    title: 'Profils rigoureusement sélectionnés',
    description:
      'Chaque médecin visible dans la plateforme contribue à une prise en charge claire et sérieuse.',
  },
  {
    Icon: ShieldCheck,
    title: 'Pratique cadrée et confidentielle',
    description:
      'Les échanges, les documents et les rendez-vous sont organisés dans un espace pensé pour la confiance.',
  },
  {
    Icon: CalendarCheck,
    title: 'Disponibilités réellement exploitables',
    description:
      'Les créneaux affichés aident les patients à réserver plus vite sans multiplier les allers-retours.',
  },
];

const DoctorsPage: React.FC = () => {
  const { data: catalog, isLoading, isError } = useMarketingCatalog();
  const resolvedCatalog = catalog ?? marketingCatalogFallback;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSpecialite = searchParams.get('specialite') || '';

  const specialties = useMemo(
    () => resolvedCatalog.services.map((service) => service.specialite),
    [resolvedCatalog],
  );

  const doctors = useMemo(() => {
    if (!selectedSpecialite) return resolvedCatalog.doctors;
    return resolvedCatalog.doctors.filter((doctor) => doctor.specialite === selectedSpecialite);
  }, [resolvedCatalog, selectedSpecialite]);

  const heroStats = [
    { value: `${resolvedCatalog.stats.totalDoctors}+`, label: 'Médecins mobilisables' },
    { value: `${resolvedCatalog.stats.totalSpecialities}`, label: 'Spécialités visibles' },
    { value: `${resolvedCatalog.stats.totalActiveSlots}+`, label: 'Créneaux actifs' },
  ];

  const updateSpecialite = (value: string) => {
    if (!value) {
      setSearchParams({});
      return;
    }

    setSearchParams({ specialite: value });
  };

  return (
    <div className="bg-[#f7fbfa]">
      <MarketingPageHero
        eyebrow="Équipe médicale"
        title="Une équipe visible, crédible et facile à consulter."
        description="Nous mettons en avant des profils médicaux rassurants, bien présentés et orientés vers l'action pour que le patient trouve rapidement le bon interlocuteur."
        highlights={['Profils détaillés', 'Spécialités variées', 'Réservation simplifiée']}
        stats={heroStats}
        primaryAction={{ label: 'Réserver un médecin', to: '/auth/register' }}
        secondaryAction={{ label: 'Voir les services', to: '/services' }}
        image={marketingImages.publicDoctorsHero}
        imageAlt="Medecin noire presentant son expertise medicale"
        badge="Des profils qui inspirent immédiatement confiance"
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <MarketingSectionHeading
            eyebrow="Spécialités"
            title="Les patients doivent reconnaître d'un coup d'œil où ils peuvent être pris en charge."
            description="Nous avons organisé la découverte de l'équipe autour de besoins concrets plutôt que d'un simple annuaire."
          />

          <div className="mt-12 space-y-4">
            {isLoading && !catalog ? (
              <div className="rounded-[1.75rem] border border-[#d7ece8] bg-white/80 px-5 py-4 text-sm text-slate-600">
                Chargement du catalogue en direct...
              </div>
            ) : null}

            {isError ? (
              <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                Les disponibilités temps réel sont momentanément indisponibles. Une version de secours reste affichée pour permettre aux patients de continuer leur parcours.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateSpecialite('')}
                className={`rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
                  !selectedSpecialite
                    ? 'border-[#005461] bg-[#005461] text-white'
                    : 'border-[#d7ece8] bg-white text-[#005461] hover:border-[#249E94]'
                }`}
              >
                Toutes les spécialités
              </button>
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => updateSpecialite(specialty)}
                  className={`rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
                    selectedSpecialite === specialty
                      ? 'border-[#005461] bg-[#005461] text-white'
                      : 'border-[#d7ece8] bg-white text-[#005461] hover:border-[#249E94]'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <MarketingSectionHeading
            eyebrow="Nos médecins"
            title="Des fiches praticiens plus riches, plus claires et plus engageantes."
            description="Chaque carte présente le rôle, l'expérience, le champ d'intervention et la disponibilité afin d'aider le patient à se décider plus vite."
          />

          {doctors.length === 0 ? (
            <div className="mt-14 rounded-[2rem] border border-[#d7ece8] bg-[#f7fbfa] p-10 text-center">
              <Search className="mx-auto h-10 w-10 text-[#249E94]" />
              <h3 className="mt-5 text-2xl font-bold font-display text-[#005461]">
                Aucun médecin trouvé pour cette spécialité
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Essaie une autre spécialité ou reviens à la liste complète.
              </p>
              <button
                type="button"
                onClick={() => updateSpecialite('')}
                className="mt-6 rounded-full bg-[#005461] px-5 py-3 text-sm font-semibold text-white"
              >
                Voir tous les médecins
              </button>
            </div>
          ) : (
            <motion.div
              className="mt-14 grid gap-7 md:grid-cols-2 xl:grid-cols-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              {doctors.map((doctor) => (
                <motion.article
                  key={doctor.id}
                  variants={staggerItem}
                  className="overflow-hidden rounded-[2rem] bg-[#f7fbfa] shadow-[0_24px_70px_-38px_rgba(0,84,97,0.35)]"
                >
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#005461] via-[#0C7779] to-[#3BC1A8] px-6 pb-8 pt-6 text-white">
                    <div className="absolute right-[-34px] top-[-34px] h-24 w-24 rounded-full bg-white/10" />
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur-sm">
                        {buildDoctorInitials(doctor.nomComplet)}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#005461]">
                        <Clock3 className="h-3.5 w-3.5 text-[#249E94]" />
                        {formatMarketingSlot(doctor.nextAvailableSlot)}
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-bold font-display">{doctor.nomComplet}</h3>
                    <p className="mt-1 text-sm text-teal-50/90">{doctor.specialite}</p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-[#d7ece8] bg-white p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Tarif
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#005461]">
                          {formatMontant(doctor.tarifConsultation)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#d7ece8] bg-white p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Créneaux
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#005461]">
                          {doctor.activeSlotCount} actifs
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-3">
                        <Stethoscope className="h-4 w-4 text-[#249E94]" />
                        <span>{doctor.specialite}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-[#249E94]" />
                        <span>{doctor.consultationCount} consultation(s) déjà enregistrée(s)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-[#249E94]" />
                        <span>Approche centrée patient</span>
                      </div>
                    </div>

                    <Link
                      to="/auth/register"
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#005461] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004050]"
                    >
                      Consulter ce médecin
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <MarketingSectionHeading
            eyebrow="Pourquoi ça rassure"
            title="La confiance ne vient pas seulement du diplôme, elle vient aussi de la façon dont on présente le soin."
            description="Nous travaillons l'expérience de découverte pour que le patient se sente orienté, compris et capable de réserver sans hésitation."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {trustPoints.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="rounded-[1.75rem] border border-[#d7ece8] bg-white p-8 shadow-[0_18px_50px_-32px_rgba(0,84,97,0.25)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f7f4]">
                  <Icon className="h-7 w-7 text-[#249E94]" />
                </div>
                <h3 className="mt-6 text-xl font-bold font-display text-[#005461]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] bg-[#005461] p-8 text-white md:p-10">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  value: catalog ? `${catalog.stats.totalDoctors}+` : '...',
                  label: 'Profils médicaux réellement publiés',
                },
                {
                  value: catalog ? `${catalog.stats.totalActiveSlots}+` : '...',
                  label: 'Créneaux hebdomadaires actifs',
                },
                { value: '100%', label: 'Parcours relié à la réservation' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-3xl font-bold font-display">{item.value}</p>
                  <p className="mt-2 text-sm text-teal-100/85">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AppointmentSection />
    </div>
  );
};

export default DoctorsPage;
