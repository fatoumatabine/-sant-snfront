import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem, viewport } from '@/lib/animations';
import { marketingImages } from '@/lib/marketingImages';

const services = [
  {
    Icon: Activity,
    title: 'Laboratoire Moderne',
    description:
      'Analyses médicales précises avec des équipements de pointe pour des résultats fiables et rapides.',
    image: marketingImages.homeServiceLab,
    href: '/services',
  },
  {
    Icon: Users,
    title: 'Médecins Expérimentés',
    description:
      'Une équipe de spécialistes qualifiés et dévoués pour vous accompagner dans tous vos besoins de santé.',
    image: marketingImages.homeServiceDoctors,
    href: '/services',
  },
];

export const ServicesSection: React.FC = () => {
  return (
    <section id="services" className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <p className="text-[#3BC1A8] font-semibold text-sm uppercase tracking-widest mb-3">
            Nos Services
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-[#005461]">
            Traitement de{' '}
            <span className="text-[#3BC1A8]">Haute Qualité</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-sm">
            Nous mettons à votre disposition une gamme complète de services médicaux pour prendre
            soin de votre santé au quotidien.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {services.map(({ Icon, title, description, image, href }, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group relative rounded-3xl overflow-hidden shadow-lg cursor-pointer"
              whileHover={{ scale: 1.02, boxShadow: '0 30px 60px -15px rgba(0,84,97,0.25)' }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
            >
              <div className="h-[380px] overflow-hidden">
                <motion.img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#005461]/95 via-[#005461]/50 to-transparent" />
              </div>

              {/* Icon badge */}
              <motion.div
                className="absolute top-6 left-6 w-14 h-14 bg-[#3BC1A8] rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 8, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon className="h-7 w-7 text-white" />
              </motion.div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                <p className="text-teal-100/80 text-sm mb-5 leading-relaxed">{description}</p>
                <Link
                  to={href}
                  className="inline-flex items-center gap-2 text-white font-semibold text-sm bg-white/10 hover:bg-[#249E94] backdrop-blur-sm border border-white/20 px-5 py-2.5 rounded-full transition-all duration-300"
                >
                  En savoir plus <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
