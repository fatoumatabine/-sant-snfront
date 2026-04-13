import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Heart, ChevronDown, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { marketingNavLinks } from './marketingNavigation';

export const HomeNavbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-40 bg-white transition-all duration-300',
        scrolled ? 'shadow-lg' : 'shadow-sm border-b border-gray-100',
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-11 h-11 bg-[#3BC1A8] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3BC1A8]/30 group-hover:scale-110 transition-transform duration-300">
              <Heart className="h-6 w-6 text-white fill-white" />
            </div>
            <span className="font-bold text-2xl font-display tracking-tight">
              <span className="text-[#005461]">SANTÉ</span>
              <span className="text-[#3BC1A8]"> SN</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {marketingNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-[#e6f7f4] text-[#005461]'
                      : 'text-gray-600 hover:text-[#005461] hover:bg-[#e6f7f4]',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to={`/${user.role}/dashboard`}
                  className="text-sm font-medium text-[#005461] hover:text-[#005461]/80 transition-colors px-4 py-2"
                >
                  Tableau de bord
                </Link>
                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#005461] rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.prenom?.[0]}{user.nom?.[0]}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.prenom}</span>
                    <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', profileOpen && 'rotate-180')} />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                      <Link
                        to={`/${user.role}/profile`}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        Mon profil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/auth/login"
                  className="text-sm font-medium text-gray-600 hover:text-[#005461] transition-colors px-4 py-2"
                >
                  Connexion
                </Link>
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-2 bg-[#005461] hover:bg-[#004050] text-white text-sm font-semibold px-6 py-3 rounded-full transition-all duration-300 shadow-lg shadow-[#005461]/20 hover:shadow-xl hover:scale-105"
                >
                  Prendre Rendez-vous
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 bg-[#005461] text-white rounded-xl flex items-center justify-center"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-5 border-t border-gray-100">
            <div className="flex flex-col gap-1 pt-4">
              {marketingNavLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'py-2.5 px-3 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-[#e6f7f4] text-[#005461]'
                        : 'text-gray-600 hover:text-[#005461] hover:bg-[#e6f7f4]',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-gray-100">
                {isAuthenticated && user ? (
                  <>
                    <Link
                      to={`/${user.role}/dashboard`}
                      className="text-center py-3 text-sm font-semibold text-[#005461] border-2 border-[#005461] rounded-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      Tableau de bord
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-center py-3 text-sm font-semibold text-red-500 border-2 border-red-500 rounded-full"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth/login"
                      className="text-center py-3 text-sm font-semibold text-[#005461] border-2 border-[#005461] rounded-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/auth/register"
                      className="text-center py-3 text-sm font-semibold bg-[#005461] text-white rounded-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      Prendre Rendez-vous
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
