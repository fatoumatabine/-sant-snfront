import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Heart,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { MarketingPageHero } from '@/components/Home/MarketingPageHero';
import { MarketingSectionHeading } from '@/components/Home/MarketingSectionHeading';
import { AppointmentSection } from '@/components/Home/AppointmentSection';
import { TestimonialsSection } from '@/components/Home/TestimonialsSection';
import { usePublicSiteSettings } from '@/hooks/usePublicSiteSettings';
import { staggerContainer, staggerItem, viewport } from '@/lib/animations';
import { marketingImages } from '@/lib/marketingImages';

const timeline = [
  {
    year: 'Vision',
    title: 'Rendre le soin plus accessible',
    description:
      'Santé SN est née de l’idée qu’un parcours médical digital doit réduire la distance, pas créer une nouvelle complexité.',
  },
  {
    year: 'Structure',
    title: 'Relier les bons acteurs',
    description:
      'Patients, médecins, secrétaires et administrateurs travaillent dans une logique commune plutôt qu’en silos.',
  },
  {
    year: 'Qualité',
    title: 'Créer une expérience rassurante',
    description:
      'Le design de chaque page vise la lisibilité, la crédibilité et la capacité à agir rapidement.',
  },
  {
    year: 'Impact',
    title: 'Faire gagner du temps utile',
    description:
      'Moins d’attente, moins de flou et plus de continuité dans le suivi médical du quotidien.',
  },
];

const AboutPage: React.FC = () => {
  const { data: siteSettings } = usePublicSiteSettings();
  const about = siteSettings?.marketingSettings.about;

  const values = [
    {
      Icon: Heart,
      title: 'Humanité',
      description: about?.humanityDescription || '',
    },
    {
      Icon: ShieldCheck,
      title: 'Confiance',
      description: about?.trustDescription || '',
    },
    {
      Icon: Sparkles,
      title: 'Simplicité',
      description: about?.simplicityDescription || '',
    },
  ];

  const missionPoints = [
    about?.missionPoint1,
    about?.missionPoint2,
    about?.missionPoint3,
    about?.missionPoint4,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-[#f7fbfa]">
      <MarketingPageHero
        eyebrow={about?.heroEyebrow || 'À propos de Santé SN'}
        title={about?.heroTitle || 'Une plateforme pensée pour moderniser le soin sans perdre sa dimension humaine.'}
        description={about?.heroDescription || 'Notre ambition est simple : construire un environnement de santé numérique crédible, élégant et utile pour les patients comme pour les professionnels.'}
        highlights={['Mission claire', 'Parcours cohérent', 'Approche centrée patient']}
        stats={[
          { value: '1', label: 'Vision commune pour tout le parcours médical' },
          { value: '4', label: 'Rôles clés reliés dans la plateforme' },
          { value: '360°', label: 'Vue complète du besoin patient' },
        ]}
        primaryAction={{ label: 'Découvrir nos services', to: '/services' }}
        secondaryAction={{ label: 'Nous contacter', to: '/contact' }}
        image={marketingImages.publicAboutHero}
        imageAlt="Medecin noire en portrait professionnel avec stethoscope"
        badge={about?.heroBadge || 'Santé numérique, mais toujours profondément humaine'}
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="relative overflow-hidden rounded-[2rem] shadow-[0_28px_90px_-40px_rgba(0,84,97,0.45)]">
              <img
                src={marketingImages.publicAboutMission}
                alt="Professionnelle de sante avec une mere et son enfant"
                className="h-[520px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#002F3A]/75 via-transparent to-transparent" />
            </div>

            <div>
              <MarketingSectionHeading
                eyebrow="Notre mission"
                title={about?.missionTitle || 'Concevoir une expérience de santé qui inspire immédiatement confiance.'}
                description={about?.missionDescription || 'Nous voulons qu’un patient comprenne rapidement où aller, comment être aidé et ce qu’il se passera ensuite. Cette clarté change profondément la perception du service.'}
                centered={false}
              />

              <ul className="mt-8 space-y-4">
                {missionPoints.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-[#249E94]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <MarketingSectionHeading
            eyebrow="Ce qui nous guide"
            title="Des principes forts pour rendre la plateforme plus fiable et plus agréable."
            description="Nous avons structuré l'identité du produit autour de quelques valeurs simples mais exigeantes."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {values.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="rounded-[1.75rem] bg-[#f7fbfa] p-8 shadow-[0_18px_50px_-34px_rgba(0,84,97,0.28)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#005461] text-white">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-2xl font-bold font-display text-[#005461]">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <MarketingSectionHeading
            eyebrow="Construction du projet"
            title="Une trajectoire claire, du besoin de départ à l’impact attendu."
            description="La cohérence du produit passe aussi par la cohérence de son histoire et de ses objectifs."
          />

          <motion.div
            className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            {timeline.map((item) => (
              <motion.div
                key={item.title}
                variants={staggerItem}
                className="rounded-[1.75rem] border border-[#d7ece8] bg-white p-7 shadow-sm"
              >
                <div className="inline-flex rounded-full bg-[#e6f7f4] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#249E94]">
                  {item.year}
                </div>
                <h3 className="mt-5 text-xl font-bold font-display text-[#005461]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-14 rounded-[2rem] bg-[#005461] p-8 text-white md:p-10">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { Icon: Users, title: 'Patients mieux accompagnés' },
                { Icon: Stethoscope, title: 'Médecins mieux préparés' },
                { Icon: ShieldCheck, title: 'Décisions mieux cadrées' },
              ].map(({ Icon, title }) => (
                <div key={title} className="rounded-3xl bg-white/8 p-6">
                  <Icon className="h-7 w-7 text-[#8af6e8]" />
                  <p className="mt-4 text-lg font-semibold">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <AppointmentSection />
    </div>
  );
};

export default AboutPage;
