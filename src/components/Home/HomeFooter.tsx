import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  ArrowRight,
} from 'lucide-react';

export const HomeFooter: React.FC = () => {
  return (
    <footer id="contact" className="bg-[#002F3A] text-white">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 bg-[#3BC1A8] rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="font-bold text-xl font-display">
                SANTÉ <span className="text-[#3BC1A8]">SN</span>
              </span>
            </div>
            <p className="text-teal-200 text-sm leading-relaxed mb-6">
              Votre plateforme de télémédecine au Sénégal. Des soins de santé de qualité
              accessibles à tous, partout et à tout moment.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: '#' },
                { Icon: Twitter, href: '#' },
                { Icon: Linkedin, href: '#' },
                { Icon: Facebook, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#249E94] transition-colors duration-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-white mb-5 text-base">Services</h4>
            <ul className="space-y-3">
              {[
                'Consultation 24/7',
                'Santé Mentale',
                'Médecine Familiale',
                'Soins Primaires',
                'Urgences Médicales',
              ].map((item) => (
                <li key={item}>
                  <Link
                    to="#services"
                    className="flex items-center gap-2 text-teal-200 text-sm hover:text-[#3BC1A8] transition-colors group"
                  >
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-white mb-5 text-base">Liens Rapides</h4>
            <ul className="space-y-3">
              {[
                { label: 'À Propos', to: '#about' },
                { label: 'Notre Équipe', to: '#medecins' },
                { label: 'Se Connecter', to: '/auth/login' },
                { label: "S'inscrire", to: '/auth/register' },
                { label: 'Contact', to: '#contact' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-teal-200 text-sm hover:text-[#3BC1A8] transition-colors group"
                  >
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-5 text-base">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-teal-200 text-sm">
                <Phone className="h-4 w-4 mt-0.5 text-[#3BC1A8] flex-shrink-0" />
                <span>+221 33 123 45 67</span>
              </li>
              <li className="flex items-start gap-3 text-teal-200 text-sm">
                <Mail className="h-4 w-4 mt-0.5 text-[#3BC1A8] flex-shrink-0" />
                <span>contact@santesn.sn</span>
              </li>
              <li className="flex items-start gap-3 text-teal-200 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-[#3BC1A8] flex-shrink-0" />
                <span>Dakar, Sénégal</span>
              </li>
            </ul>

            {/* Newsletter mini */}
            <div className="mt-6">
              <p className="text-sm text-white font-medium mb-2">Newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-teal-300 focus:outline-none focus:border-[#3BC1A8]"
                />
                <button className="w-10 h-10 bg-[#3BC1A8] hover:bg-[#249E94] rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  <ArrowRight className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-teal-300">
            <p>© 2024 Santé SN. Tous droits réservés.</p>
            <div className="flex gap-6">
              <Link to="#" className="hover:text-[#3BC1A8] transition-colors">
                Confidentialité
              </Link>
              <Link to="#" className="hover:text-[#3BC1A8] transition-colors">
                Conditions
              </Link>
              <Link to="#" className="hover:text-[#3BC1A8] transition-colors">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
