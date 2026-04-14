import React from 'react';
import { Clock, Phone, MapPin, Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <div className="hidden md:block border-b border-gray-100 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2.5 text-sm text-gray-500">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              Lun-Ven 8h00 - 18h00 / Dim 8h00 - 14h00
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              +221 33 123 45 67
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              Dakar, Sénégal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="text-[#0C7779] hover:text-[#005461] transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="text-[#0C7779] hover:text-[#005461] transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="text-[#0C7779] hover:text-[#005461] transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="text-[#0C7779] hover:text-[#005461] transition-colors"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
