import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { staggerContainer, staggerItem, viewport } from '@/lib/animations';

const stats = [
  { number: 500, suffix: '+', label: 'Patients Satisfaits' },
  { number: 50,  suffix: '+', label: 'Médecins Qualifiés' },
  { number: 15,  suffix: '+', label: 'Spécialités Médicales' },
  { number: 24,  suffix: '/7', label: 'Disponibilité' },
];

/** Animated counter that counts up from 0 to `end` */
const Counter: React.FC<{ end: number; suffix: string; started: boolean }> = ({ end, suffix, started }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, end]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

export const StatsSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 bg-[#005461] relative overflow-hidden">
      {/* Background decoration */}
      <motion.div
        className="absolute top-0 right-0 w-80 h-80 bg-[#0C7779]/50 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-64 h-64 bg-[#003A48]/60 rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={staggerItem} className="text-center group">
              <div className="inline-flex flex-col items-center">
                <p className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-[#3BC1A8] transition-colors duration-300">
                  <Counter end={stat.number} suffix={stat.suffix} started={inView} />
                </p>
                <motion.div
                  className="h-1 bg-[#3BC1A8] rounded-full mb-3"
                  initial={{ width: 32 }}
                  whileInView={{ width: 32 }}
                  whileHover={{ width: 64 }}
                  transition={{ duration: 0.3 }}
                />
                <p className="text-teal-200 text-sm font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
