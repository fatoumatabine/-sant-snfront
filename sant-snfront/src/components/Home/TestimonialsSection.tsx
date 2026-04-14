import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, viewport } from '@/lib/animations';

const testimonials = [
  {
    name: 'Aminata Diallo',
    role: 'Patiente',
    content:
      "Santé SN a révolutionné ma façon de consulter. Plus besoin de se déplacer, je peux voir mon médecin depuis chez moi. Service exceptionnel et médecins très compétents !",
    rating: 5,
    avatar: 'AD',
  },
  {
    name: 'Dr. Moussa Koné',
    role: 'Médecin Généraliste',
    content:
      "Une plateforme intuitive qui me permet de mieux gérer mes consultations. La télémédecine est vraiment l'avenir de la santé au Sénégal. Je recommande vivement !",
    rating: 5,
    avatar: 'MK',
  },
  {
    name: 'Fatou Samba',
    role: 'Patiente',
    content:
      "Je peux prendre rendez-vous en quelques clics et consulter mon dossier médical à tout moment. Tellement pratique pour le suivi médical de mes enfants.",
    rating: 5,
    avatar: 'FS',
  },
  {
    name: 'Omar Ba',
    role: 'Patient',
    content:
      "L'évaluation IA m'a aidé à mieux préparer ma consultation. Le médecin était déjà informé de mes symptômes. Un gain de temps énorme et une qualité de soin remarquable !",
    rating: 5,
    avatar: 'OB',
  },
];

const cardVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.3 } }),
};

export const TestimonialsSection: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  };
  const next = () => {
    setDirection(1);
    setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));
  };

  const visible = [
    testimonials[current % testimonials.length],
    testimonials[(current + 1) % testimonials.length],
    testimonials[(current + 2) % testimonials.length],
  ];

  return (
    <section className="py-20 bg-white overflow-hidden">
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
            Témoignages
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-[#005461]">
            Ce que disent nos{' '}
            <span className="text-[#3BC1A8]">Patients</span>
          </h2>
        </motion.div>

        {/* Cards with AnimatePresence for smooth transition */}
        <div className="grid md:grid-cols-3 gap-6 mb-10 overflow-hidden">
          <AnimatePresence mode="popLayout" custom={direction}>
            {visible.map((t, index) => (
              <motion.div
                key={`${current}-${index}`}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className={`bg-[#f0fafa] rounded-3xl p-8 border border-gray-100 transition-all duration-300 ${
                  index === 0 ? 'shadow-xl scale-[1.02]' : 'shadow-md opacity-90'
                }`}
                whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(0,84,97,0.15)' }}
              >
                {/* Quote icon */}
                <div className="w-10 h-10 bg-[#249E94] rounded-xl flex items-center justify-center mb-6">
                  <Quote className="h-5 w-5 text-white" />
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07, duration: 0.25 }}
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                  "{t.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-10 h-10 bg-[#005461] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#005461] text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            onClick={prev}
            className="w-11 h-11 rounded-full border-2 border-[#005461] text-[#005461] hover:bg-[#005461] hover:text-white transition-all duration-300 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>

          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'bg-[#3BC1A8]' : 'bg-gray-200 hover:bg-gray-300'
                }`}
                animate={{ width: i === current ? 32 : 12, height: 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            ))}
          </div>

          <motion.button
            onClick={next}
            className="w-11 h-11 rounded-full bg-[#005461] text-white hover:bg-[#3BC1A8] transition-all duration-300 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </section>
  );
};
