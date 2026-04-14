import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Phone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { slideLeft, slideRight, viewport } from '@/lib/animations';

export const AppointmentSection: React.FC = () => {
  return (
    <section className="py-20 bg-[#0C7779] relative overflow-hidden">
      {/* Decorative animated shapes */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-[#249E94]/30 rounded-full translate-x-1/3 -translate-y-1/2 pointer-events-none"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-64 h-64 bg-[#005461]/50 rounded-full -translate-x-1/3 translate-y-1/2 pointer-events-none"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Text */}
          <motion.div
            className="text-white text-center lg:text-left"
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <p className="text-teal-100 text-sm font-semibold uppercase tracking-widest mb-3">
              Planifier votre consultation
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-display leading-tight">
              Obtenez le Meilleur
              <br />
              Service Médical
            </h2>
            <p className="text-teal-100/80 mt-4 max-w-md text-sm leading-relaxed">
              Nos médecins qualifiés sont prêts à vous recevoir. Prenez rendez-vous dès maintenant
              et bénéficiez de soins de qualité depuis chez vous.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <motion.a
              href="tel:+221331234567"
              className="inline-flex items-center justify-center gap-3 bg-white text-[#0C7779] font-semibold px-8 py-4 rounded-full text-sm shadow-lg"
              whileHover={{ scale: 1.06, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              <Phone className="h-5 w-5" />
              +221 33 123 45 67
            </motion.a>
            <motion.div
              whileHover={{ scale: 1.06, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center gap-3 bg-[#005461] hover:bg-[#004050] text-white font-semibold px-8 py-4 rounded-full shadow-xl transition-colors duration-300 text-sm"
              >
                <Calendar className="h-5 w-5" />
                Prendre Rendez-vous
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
