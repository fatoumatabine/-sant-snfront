import React from 'react';

import { TopBar } from '@/components/Home/TopBar';
import { HomeNavbar } from '@/components/Home/HomeNavbar';
import { HeroSection } from '@/components/Home/HeroSection';
import { FeaturesSection } from '@/components/Home/FeaturesSection';
import { HowItWorksSection } from '@/components/Home/HowItWorksSection';
import { AboutSection } from '@/components/Home/AboutSection';
import { ServicesSection } from '@/components/Home/ServicesSection';
import { StatsSection } from '@/components/Home/StatsSection';
import { DoctorsSection } from '@/components/Home/DoctorsSection';
import { AppointmentSection } from '@/components/Home/AppointmentSection';
import { TestimonialsSection } from '@/components/Home/TestimonialsSection';
import { HomeFooter } from '@/components/Home/HomeFooter';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Top info bar (scrolls away) */}
      <TopBar />

      {/* Sticky navigation */}
      <HomeNavbar />

      {/* Page sections */}
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

      <HomeFooter />
    </div>
  );
};

export default HomePage;
