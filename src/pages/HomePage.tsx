import React from 'react';

import { HeroSection } from '@/components/Home/HeroSection';
import { FeaturesSection } from '@/components/Home/FeaturesSection';
import { HowItWorksSection } from '@/components/Home/HowItWorksSection';
import { AboutSection } from '@/components/Home/AboutSection';
import { ServicesSection } from '@/components/Home/ServicesSection';
import { StatsSection } from '@/components/Home/StatsSection';
import { DoctorsSection } from '@/components/Home/DoctorsSection';
import { AppointmentSection } from '@/components/Home/AppointmentSection';
import { TestimonialsSection } from '@/components/Home/TestimonialsSection';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AboutSection />
        <ServicesSection />
        <StatsSection />
        <DoctorsSection />
        <AppointmentSection />
        <TestimonialsSection />
      </main>
    </div>
  );
};

export default HomePage;
