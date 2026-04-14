import React from 'react';
import { UserCheck, AlertCircle, Stethoscope, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem, viewport } from '@/lib/animations';

const features = [
  {
    Icon: UserCheck,
    title: 'Médecin Qualifié',
    description:
      'Nos médecins sont certifiés et expérimentés pour vous offrir les meilleurs soins médicaux possibles.',
  },
  {
    Icon: AlertCircle,
    title: "Aide d'Urgence",
    description:
      "Service d'urgence disponible 24h/24, 7j/7 pour répondre à vos besoins médicaux les plus urgents.",
  },
  {
    Icon: Stethoscope,
    title: 'Équipement Moderne',
    description:
      'Nous utilisons des équipements médicaux de pointe pour des diagnostics précis et des soins optimaux.',
  },
  {
    Icon: Heart,
    title: 'Médecine Familiale',
    description:
      'Prenez soin de toute votre famille avec nos services complets de médecine familiale et pédiatrique.',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-14"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          custom={0}
        >
          <p className="text-[#3BC1A8] font-semibold text-sm uppercase tracking-widest mb-3">
            Ce que nous offrons
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-[#005461]">
            Nos Services Principaux
          </h2>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {features.map(({ Icon, title, description }, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0,84,97,0.18)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group bg-white rounded-3xl p-8 border border-gray-100 shadow-lg cursor-default"
            >
              {/* Icon circle */}
              <motion.div
                className="w-16 h-16 bg-[#e6f7f4] rounded-2xl flex items-center justify-center mb-6"
                whileHover={{ backgroundColor: '#0C7779', rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
              >
                <Icon className="h-8 w-8 text-[#249E94] group-hover:text-white transition-colors duration-300" />
              </motion.div>

              <h3 className="text-xl font-bold text-[#005461] mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
