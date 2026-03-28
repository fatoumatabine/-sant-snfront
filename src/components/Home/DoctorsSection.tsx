import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem, viewport } from '@/lib/animations';

const doctors = [
  {
    name: 'Dr. Aminata Diallo',
    role: 'Médecin Généraliste',
    image:
      'https://images.pexels.com/photos/5452291/pexels-photo-5452291.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Dr. Moussa Koné',
    role: 'Cardiologue',
    image:
      'https://images.pexels.com/photos/4031820/pexels-photo-4031820.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Dr. Fatou Sow',
    role: 'Pédiatre',
    image:
      'https://images.pexels.com/photos/8376212/pexels-photo-8376212.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Dr. Omar Ba',
    role: 'Chirurgien',
    image:
      'https://images.pexels.com/photos/19957213/pexels-photo-19957213.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

export const DoctorsSection: React.FC = () => {
  return (
    <section id="medecins" className="py-20 bg-[#f0fafa] overflow-hidden">
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
            Notre Équipe
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-[#005461]">
            Médecins <span className="text-[#3BC1A8]">Experts</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm">
            Des professionnels de santé qualifiés et dévoués pour vous accompagner dans votre
            parcours de soin.
          </p>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {doctors.map((doctor, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group bg-white rounded-3xl overflow-hidden shadow-lg"
              whileHover={{ y: -10, boxShadow: '0 30px 60px -15px rgba(0,84,97,0.2)' }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            >
              {/* Photo */}
              <div className="relative h-64 overflow-hidden bg-gray-100">
                <motion.img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-full h-full object-cover object-top"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* Hover overlay */}
                <motion.div
                  className="absolute inset-0 bg-[#005461]/0 flex items-center justify-center"
                  whileHover={{ backgroundColor: 'rgba(0,84,97,0.3)' }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Link
                      to="/auth/register"
                      className="bg-[#3BC1A8] text-white text-sm font-semibold px-5 py-2.5 rounded-full block"
                    >
                      Consulter
                    </Link>
                  </motion.div>
                </motion.div>
              </div>

              {/* Info */}
              <div className="p-5 text-center border-t-4 border-transparent group-hover:border-[#3BC1A8] transition-colors duration-300">
                <h4 className="font-bold text-[#005461] text-base mb-1">{doctor.name}</h4>
                <p className="text-gray-500 text-sm">{doctor.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          custom={0.2}
        >
          <motion.div whileHover={{ scale: 1.04 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 text-[#005461] font-semibold text-sm border-2 border-[#005461] px-8 py-3.5 rounded-full hover:bg-[#005461] hover:text-white transition-all duration-300"
            >
              Voir tous nos médecins
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
