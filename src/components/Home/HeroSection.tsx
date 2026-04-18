import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { floatAnimate, floatTransition, staggerContainer, staggerItem, viewport } from '@/lib/animations';
import { marketingImages } from '@/lib/marketingImages';

const heroParticles = [
  { top: '14%', left: '8%', duration: 4.5, delay: 0.2 },
  { top: '22%', left: '42%', duration: 5.4, delay: 0.5 },
  { top: '18%', left: '72%', duration: 4.8, delay: 0.8 },
  { top: '48%', left: '12%', duration: 6.2, delay: 0.4 },
  { top: '62%', left: '35%', duration: 5.1, delay: 1.1 },
  { top: '55%', left: '84%', duration: 6.5, delay: 0.7 },
  { top: '78%', left: '22%', duration: 5.9, delay: 0.3 },
  { top: '82%', left: '68%', duration: 6.8, delay: 1.4 },
];

export const HeroSection: React.FC = () => {
  return (
    <section className="bg-[#005461] relative overflow-hidden min-h-[calc(100vh-120px)] flex items-center">
      {/* Decorative animated circles */}
      <motion.div
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-[#0C7779]/60 -translate-y-1/3 translate-x-1/4 pointer-events-none"
        animate={{ scale: [1, 1.04, 1], opacity: [0.6, 0.75, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#003A48]/80 translate-y-1/3 -translate-x-1/4 pointer-events-none"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0 }}
        animate={{ backgroundPosition: ['0% 0%', '100% 40%', '0% 0%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#0C7779]/30 pointer-events-none" />
      {heroParticles.map((particle, index) => (
        <motion.span
          key={`${particle.top}-${particle.left}-${index}`}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#8af6e8]/80 pointer-events-none"
          style={{ top: particle.top, left: particle.left }}
          animate={{ y: [0, -20, 0], opacity: [0.25, 0.95, 0.25], scale: [0.9, 1.35, 0.9] }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}

      <div className="container mx-auto px-4 relative z-10 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left content ── */}
          <motion.div
            className="text-white"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={staggerItem}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-[#3BC1A8] rounded-full animate-pulse" />
                <span className="text-teal-100 text-sm font-medium">Médecins disponibles 24/7</span>
              </div>
            </motion.div>

            <motion.p variants={staggerItem} className="text-teal-200 text-sm font-semibold uppercase tracking-widest mb-4">
              Le niveau de service le plus élevé
            </motion.p>

            <motion.h1
              variants={staggerItem}
              className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6"
            >
              Prenez{' '}
              <span className="text-[#3BC1A8] underline decoration-wavy decoration-[#3BC1A8]/60">
                Soin de Votre
              </span>{' '}
              Santé Maintenant.
            </motion.h1>

            <motion.p variants={staggerItem} className="text-teal-100/80 text-lg leading-relaxed mb-10 max-w-lg">
              Consultez des médecins qualifiés depuis chez vous. Prenez rendez-vous en quelques clics,
              consultations vidéo sécurisées, suivi médical complet au Sénégal.
            </motion.p>

            <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 bg-[#3BC1A8] hover:bg-[#249E94] text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-[#3BC1A8]/30 hover:shadow-2xl hover:scale-105"
              >
                Explorer Nos Services
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/a-propos"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full border border-white/20 transition-all duration-300"
              >
                <Play className="h-5 w-5 fill-white" />
                À Propos de Santé SN
              </Link>
            </motion.div>

            <motion.div variants={staggerItem} className="flex flex-wrap gap-4">
              {['Consultation en ligne', 'Ordonnances numériques', 'Suivi à distance'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-teal-100">
                  <CheckCircle2 className="h-4 w-4 text-[#3BC1A8] flex-shrink-0" />
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right — Doctor image ── */}
          <motion.div
          className="hidden lg:flex items-center justify-center relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
          >
            <motion.div
              className="absolute w-[560px] h-[560px] rounded-full pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 180deg, rgba(59,193,168,0), rgba(59,193,168,0.55), rgba(12,119,121,0), rgba(59,193,168,0))',
                filter: 'blur(20px)',
                opacity: 0.45,
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            />
            {/* Spinning outer ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[520px] h-[520px] rounded-full border-2 border-dashed border-white/15 animate-[spin_30s_linear_infinite]" />
            </div>

            {/* Doctor image in circle */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.4 }}
            >
              <div className="w-[440px] h-[440px] rounded-full overflow-hidden border-8 border-white/10 shadow-2xl">
                <img
                  src={marketingImages.homeHero}
                  alt="Medecin noire souriante en blouse avec stethoscope"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Doctor badge card — floating */}
              <motion.div
              className="absolute -bottom-2 -left-12 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 min-w-[200px]"
                animate={floatAnimate}
                transition={floatTransition}
              >
                <div className="w-12 h-12 bg-[#005461] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">🩺</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">Dr. Moussa Diallo</p>
                  <p className="text-[#249E94] text-xs font-medium mt-0.5">Médecin Généraliste</p>
                </div>
              </motion.div>

              {/* Stats pill — floating delayed */}
              <motion.div
                className="absolute -top-4 -right-8 bg-[#3BC1A8] rounded-2xl shadow-2xl p-4 text-white text-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              >
                <p className="text-2xl font-bold leading-none">24/7</p>
                <p className="text-teal-50 text-xs mt-1">Disponibilité</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Stats strip ── */}
        <motion.div
          className="mt-16 pt-12 border-t border-white/10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '500+', label: 'Patients Satisfaits' },
              { number: '50+',  label: 'Médecins Qualifiés' },
              { number: '15+',  label: 'Spécialités' },
              { number: '98%',  label: 'Taux de Satisfaction' },
            ].map((stat) => (
              <motion.div key={stat.label} variants={staggerItem} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.number}</p>
                <p className="text-teal-200 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.button
        type="button"
        onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-20 items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-white/90 backdrop-blur-sm hover:bg-white/15 transition-colors"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1, ease: 'easeOut' }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider">Defiler</span>
        <span className="relative h-8 w-5 rounded-full border border-white/40">
          <motion.span
            className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#3BC1A8]"
            animate={{ y: [0, 12, 0], opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
        <ChevronDown className="h-4 w-4 text-[#8af6e8]" />
      </motion.button>
    </section>
  );
};
