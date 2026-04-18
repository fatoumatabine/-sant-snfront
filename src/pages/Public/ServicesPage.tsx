import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MarketingPageHero } from '@/components/Home/MarketingPageHero';
import { MarketingSectionHeading } from '@/components/Home/MarketingSectionHeading';
import { AppointmentSection } from '@/components/Home/AppointmentSection';
import { TestimonialsSection } from '@/components/Home/TestimonialsSection';
import { useMarketingCatalog } from '@/hooks/useMarketingCatalog';
import { formatMontant } from '@/lib/currency';
import {
  formatMarketingSlot,
  getSpecialtyPresentation,
  marketingCatalogFallback,
} from '@/lib/marketingCatalog';
import { fadeUp, staggerContainer, staggerItem, viewport } from '@/lib/animations';
import { marketingImages } from '@/lib/marketingImages';

const patientJourney = [
  {
    Icon: Activity,
    title: 'Décrire votre besoin',
    description:
      'Vous indiquez votre symptôme, votre spécialité recherchée ou votre besoin de suivi.',
  },
  {
    Icon: CalendarCheck,
    title: 'Réserver le bon créneau',
    description:
      'Nous vous aidons à choisir le professionnel, le type de consultation et la disponibilité adaptée.',
  },
  {
    Icon: ShieldCheck,
    title: 'Recevoir une prise en charge claire',
    description:
      'Consultation, ordonnance, consignes et prochaines étapes restent accessibles depuis votre espace.',
  },
];

const outcomes = [
  {
    title: 'Moins de friction',
    description:
      'Un seul espace pour réserver, consulter, payer et retrouver vos documents de suivi.',
  },
  {
    title: 'Meilleure visibilité',
    description:
      'Le patient sait toujours quoi faire ensuite et le médecin démarre avec plus de contexte.',
  },
  {
    title: 'Décisions plus rapides',
    description:
      'Les urgences sont repérées plus tôt et les cas simples sont traités sans délai inutile.',
  },
];

const ServicesPage: React.FC = () => {
  const { data: catalog, isLoading, isError } = useMarketingCatalog();
  const resolvedCatalog = catalog ?? marketingCatalogFallback;

  const heroStats = [
    { value: `${resolvedCatalog.stats.totalSpecialities}`, label: 'Spécialités réellement publiées' },
    { value: `${resolvedCatalog.stats.totalDoctors}+`, label: 'Médecins disponibles dans le catalogue' },
    { value: `${resolvedCatalog.stats.totalActiveSlots}+`, label: 'Créneaux actifs pour la prise de RDV' },
  ];

  return (
    <div className="bg-[#f7fbfa]">
      <MarketingPageHero
        eyebrow="Services Santé SN"
        title="Des parcours de soins complets, lisibles et réellement utiles."
        description="Santé SN réunit la téléconsultation, l'orientation médicale, le suivi et la coordination de soins dans une expérience claire, humaine et moderne."
        highlights={['Consultation en ligne', 'Orientation intelligente', 'Suivi centralisé']}
        stats={heroStats}
        primaryAction={{ label: 'Prendre rendez-vous', to: '/auth/register' }}
        secondaryAction={{ label: 'Voir nos médecins', to: '/medecins' }}
        image={marketingImages.publicServicesHero}
        imageAlt="Mere et enfant noirs en teleconsultation avec un medecin"
        badge="Organisation fluide du premier contact au suivi"
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <MarketingSectionHeading
            eyebrow="Notre offre"
            title="Chaque service a été pensé pour enlever une vraie difficulté du patient."
            description="Au lieu d'empiler des fonctionnalités, nous avons structuré une offre qui simplifie la prise de décision, accélère l'accès au soin et améliore le suivi."
          />

          <div className="mt-14 space-y-6">
            {isLoading && !catalog ? (
              <div className="rounded-[1.75rem] border border-[#d7ece8] bg-white/80 px-5 py-4 text-sm text-slate-600">
                Chargement du catalogue en direct...
              </div>
            ) : null}

            {isError ? (
              <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                Le catalogue temps réel est momentanément indisponible. Une version de secours reste affichée pour garder la navigation fluide.
              </div>
            ) : null}

            <motion.div
              className="grid gap-7 lg:grid-cols-2"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              {resolvedCatalog.services.map((service) => {
                const presentation = getSpecialtyPresentation(service.specialite);
                const bullets = [
                  `${service.doctorCount} médecin(s) disponible(s)`,
                  `${service.activeSlotCount} créneau(x) actif(s)`,
                  `Tarif moyen ${formatMontant(service.averageTarifConsultation)}`,
                ];

                return (
                  <motion.article
                    key={service.slug}
                    variants={staggerItem}
                    className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_24px_70px_-32px_rgba(0,84,97,0.25)]"
                  >
                    <div className="grid md:grid-cols-[1.05fr_0.95fr]">
                      <div className="relative h-72 md:h-full">
                        <img
                          src={presentation.image}
                          alt={service.specialite}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[#002F3A]/50" />
                        <div className="absolute left-6 top-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3BC1A8] shadow-lg">
                          <presentation.Icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="absolute bottom-6 left-6 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#005461]">
                          {formatMarketingSlot(service.nextAvailableSlot)}
                        </div>
                      </div>

                      <div className="p-8">
                        <h3 className="text-2xl font-bold font-display text-[#005461]">
                          {service.specialite}
                        </h3>
                        <p className="mt-4 text-sm leading-7 text-slate-500">
                          {presentation.description}
                        </p>

                        <ul className="mt-6 space-y-3">
                          {bullets.map((bullet) => (
                            <li key={bullet} className="flex items-center gap-3 text-sm text-slate-700">
                              <CheckCircle2 className="h-4 w-4 text-[#249E94]" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-6 rounded-2xl bg-[#f7fbfa] p-4 text-sm text-slate-600">
                          <p className="font-semibold text-[#005461]">Médecins repères</p>
                          <p className="mt-2">
                            {service.sampleDoctors.length > 0
                              ? service.sampleDoctors.join(', ')
                              : 'Catalogues en cours de mise à jour'}
                          </p>
                        </div>

                        <Link
                          to={`/medecins?specialite=${encodeURIComponent(service.specialite)}`}
                          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#005461] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004050]"
                        >
                          Voir les médecins
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              <MarketingSectionHeading
                eyebrow="Parcours fluide"
                title="Le service ne s'arrête pas à la consultation."
                description="Nous avons travaillé le chemin complet pour que le patient sache quoi faire avant, pendant et après l'échange médical."
                centered={false}
              />
            </motion.div>

            <motion.div
              className="grid gap-5"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              {patientJourney.map(({ Icon, title, description }, index) => (
                <motion.div
                  key={title}
                  variants={staggerItem}
                  className="rounded-[1.75rem] border border-[#d7ece8] bg-[#f7fbfa] p-6 shadow-sm"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#005461] text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#3BC1A8]">
                        Étape {index + 1}
                      </div>
                      <h3 className="text-xl font-bold font-display text-[#005461]">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <MarketingSectionHeading
            eyebrow="Impact concret"
            title="Une plateforme pensée pour faire gagner du temps sans perdre la qualité humaine."
            description="Le design du service doit rassurer, orienter et clarifier. C'est ce que nous cherchons à chaque interaction."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {outcomes.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] bg-[#005461] p-8 text-white shadow-[0_24px_70px_-35px_rgba(0,84,97,0.65)]"
              >
                <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8af6e8]">
                  Santé SN
                </div>
                <h3 className="mt-5 text-2xl font-bold font-display">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-teal-100/85">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <AppointmentSection />
    </div>
  );
};

export default ServicesPage;
