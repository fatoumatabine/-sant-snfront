import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Search, CalendarCheck, Video, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem, viewport } from '@/lib/animations';

const steps = [
  {
    number: '01',
    Icon: UserPlus,
    title: 'Créez votre compte',
    description:
      'Inscrivez-vous gratuitement en quelques minutes. Renseignez vos informations personnelles et créez votre dossier médical sécurisé.',
    color: '#005461',
    bgLight: '#e6f7f4',
  },
  {
    number: '02',
    Icon: Search,
    title: 'Choisissez un médecin',
    description:
      'Parcourez notre liste de médecins qualifiés, filtrez par spécialité, disponibilité ou localisation et consultez leurs profils.',
    color: '#0C7779',
    bgLight: '#e0f5f5',
  },
  {
    number: '03',
    Icon: CalendarCheck,
    title: 'Prenez rendez-vous',
    description:
      'Sélectionnez un créneau disponible et réservez votre consultation en ligne ou en présentiel en quelques clics.',
    color: '#249E94',
    bgLight: '#daf4f0',
  },
  {
    number: '04',
    Icon: Video,
    title: 'Consultez en ligne',
    description:
      "Rejoignez votre consultation vidéo sécurisée à l'heure convenue. Recevez votre ordonnance et votre suivi directement sur la plateforme.",
    color: '#3BC1A8',
    bgLight: '#d4f1ea',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#005461] via-[#249E94] to-[#3BC1A8]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#e6f7f4] rounded-full opacity-50 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#e6f7f4] rounded-full opacity-40 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <p className="text-[#3BC1A8] font-semibold text-sm uppercase tracking-widest mb-3">
            Simple &amp; Rapide
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-[#005461] mb-4">
            Comment ça{' '}
            <span className="relative inline-block">
              fonctionne
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#3BC1A8] rounded-full" />
            </span>{' '}
            ?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed mt-4">
            En seulement quatre étapes simples, accédez à des soins médicaux de qualité depuis
            chez vous, en toute sécurité et confidentialité.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <motion.div
            className="hidden lg:block absolute top-[72px] left-[calc(12.5%+32px)] right-[calc(12.5%+32px)] h-0.5 bg-gradient-to-r from-[#005461] via-[#249E94] to-[#3BC1A8] z-0"
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={viewport}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="flex flex-col items-center text-center group"
              >
                {/* Step circle */}
                <motion.div
                  className="relative mb-6"
                  whileHover={{ scale: 1.12 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                >
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-4 border-white shadow-xl"
                    style={{ backgroundColor: step.color }}
                  >
                    <step.Icon className="h-7 w-7 text-white" />
                  </div>
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
                    style={{ backgroundColor: step.color }}
                  >
                    {index + 1}
                  </div>
                </motion.div>

                {/* Card */}
                <motion.div
                  className="w-full rounded-2xl p-6 border border-gray-100 shadow-md bg-white"
                  whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(0,84,97,0.15)' }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                >
                  <span
                    className="inline-block text-4xl font-extrabold mb-3 leading-none"
                    style={{ color: `${step.color}20` }}
                  >
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold mb-2" style={{ color: step.color }}>
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </motion.div>

                {index < steps.length - 1 && (
                  <div className="lg:hidden mt-4 flex justify-center">
                    <ChevronRight className="h-6 w-6 rotate-90" style={{ color: step.color }} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          className="mt-16 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          custom={0.2}
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-[#f0fafa] rounded-2xl px-8 py-6 border border-[#3BC1A8]/20">
            <div className="text-left">
              <p className="font-bold text-[#005461] text-base">Prêt à commencer ?</p>
              <p className="text-gray-500 text-sm">Rejoignez des milliers de patients satisfaits au Sénégal.</p>
            </div>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 bg-[#005461] hover:bg-[#004050] text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-300 shadow-lg shadow-[#005461]/20 hover:shadow-xl hover:scale-105 whitespace-nowrap"
            >
              Commencer maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
