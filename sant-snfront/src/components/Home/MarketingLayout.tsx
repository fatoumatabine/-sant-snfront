import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { HomeNavbar } from './HomeNavbar';
import { HomeFooter } from './HomeFooter';

export const MarketingLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <HomeNavbar />
      <main className="bg-[#f7fbfa]">
        <Outlet />
      </main>
      <HomeFooter />
    </div>
  );
};

