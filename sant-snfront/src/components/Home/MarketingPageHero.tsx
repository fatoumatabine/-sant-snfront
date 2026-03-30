import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface HeroAction {
  label: string;
  to: string;
}

interface HeroStat {
  value: string;
  label: string;
}

interface MarketingPageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  stats: HeroStat[];
  primaryAction: HeroAction;
  secondaryAction?: HeroAction;
  image: string;
  imageAlt: string;
  badge?: string;
}

export const MarketingPageHero: React.FC<MarketingPageHeroProps> = ({
  eyebrow,
  title,
  description,
  highlights,
  stats,
  primaryAction,
  secondaryAction,
  image,
  imageAlt,
  badge,
}) => {
  return (
    <section className="relative overflow-hidden bg-[#005461] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,193,168,0.28),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(255,255,255,0.12),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(12,119,121,0.35),_transparent_30%)]" />
      <motion.div
        className="absolute -top-24 right-[-120px] h-80 w-80 rounded-full bg-[#0C7779]/50 blur-3xl"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#3BC1A8]/20 blur-3xl"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />

      <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            className="max-w-2xl"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-teal-100 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-[#3BC1A8]" />
                {eyebrow}
              </div>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="mt-6 text-4xl font-bold font-display leading-tight md:text-5xl lg:text-6xl"
            >
              {title}
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mt-5 max-w-xl text-base leading-8 text-teal-50/85 md:text-lg"
            >
              {description}
            </motion.p>

            <motion.div variants={staggerItem} className="mt-8 flex flex-wrap gap-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/90"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#74ead3]" />
                  <span>{highlight}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={staggerItem} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to={primaryAction.to}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3BC1A8] px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-[#3BC1A8]/25 transition-all duration-300 hover:scale-[1.02] hover:bg-[#249E94]"
              >
                {primaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </Link>

              {secondaryAction && (
                <Link
                  to={secondaryAction.to}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  {secondaryAction.label}
                </Link>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          >
            <div className="absolute inset-0 translate-x-6 translate-y-6 rounded-[2rem] bg-[#3BC1A8]/20 blur-xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
              <div className="relative overflow-hidden rounded-[1.5rem]">
                <img
                  src={image}
                  alt={imageAlt}
                  className="h-[420px] w-full object-cover md:h-[520px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#002F3A]/70 via-[#002F3A]/5 to-transparent" />
              </div>

              {badge && (
                <div className="absolute left-8 top-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#005461] shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-[#3BC1A8]" />
                  {badge}
                </div>
              )}

              {stats[0] && (
                <motion.div
                  className="absolute -bottom-6 left-8 rounded-3xl bg-white px-5 py-4 text-[#005461] shadow-2xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <p className="text-2xl font-bold font-display">{stats[0].value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stats[0].label}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 grid gap-4 md:grid-cols-3"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm"
            >
              <p className="text-3xl font-bold font-display">{stat.value}</p>
              <p className="mt-2 text-sm text-teal-100/85">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

