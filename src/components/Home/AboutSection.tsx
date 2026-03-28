import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Activity, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, slideLeft, slideRight, staggerContainer, staggerItem, viewport } from '@/lib/animations';

const checkItems = [
  'Services Ambulanciers',
  'Médecin de Garde 24/7',
  'Pharmacie en Ligne',
  'Consultation en Ligne',
  'Urgences Médicales',
];

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-[#f0fafa] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Image column */}
          <motion.div
            className="relative order-2 lg:order-1"
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.pexels.com/photos/7195087/pexels-photo-7195087.jpeg?auto=compress&cs=tinysrgb&w=900"
                alt="Services médicaux Santé SN"
                className="w-full h-[500px] object-cover"
              />
            </div>

            {/* Doctor name card */}
            <motion.div
              className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-14 h-14 bg-[#005461] rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#005461] text-sm">Dr. Fatou Ndiaye</p>
                <p className="text-[#249E94] text-xs font-medium">Médecin Assistante</p>
              </div>
            </motion.div>

            {/* Accent card */}
            <motion.div
              className="absolute -top-5 -right-5 w-24 h-24 bg-[#3BC1A8] rounded-2xl flex items-center justify-center shadow-xl"
              animate={{ rotate: [0, 4, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-4xl">🩺</span>
            </motion.div>
          </motion.div>

          {/* Content column */}
          <motion.div
            className="order-1 lg:order-2"
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <p className="text-[#3BC1A8] font-semibold text-sm uppercase tracking-widest mb-3">
              À Propos de Nous
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#005461] font-display leading-tight mb-4">
              Services Médicaux &amp; Diagnostics
            </h2>
            <p className="text-gray-700 font-medium mb-3">
              Engagés à fournir des services médicaux et de diagnostic de haute qualité au Sénégal !
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              Santé SN est une plateforme de télémédecine qui connecte les patients avec des
              médecins qualifiés depuis le confort de leur domicile. Notre mission est de rendre les
              soins de santé accessibles, abordables et efficaces pour tous les Sénégalais.
            </p>

            {/* Checklist with stagger */}
            <motion.ul
              className="space-y-3 mb-10"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              {checkItems.map((item) => (
                <motion.li key={item} variants={staggerItem} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[#e6f7f4] rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-[#249E94]" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm">{item}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div whileHover={{ scale: 1.04 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 bg-[#005461] hover:bg-[#004050] text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg shadow-[#005461]/20 hover:shadow-xl"
              >
                Découvrir Plus
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
