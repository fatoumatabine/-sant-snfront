import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react';
import { MarketingPageHero } from '@/components/Home/MarketingPageHero';
import { MarketingSectionHeading } from '@/components/Home/MarketingSectionHeading';
import { AppointmentSection } from '@/components/Home/AppointmentSection';
import { usePublicSiteSettings } from '@/hooks/usePublicSiteSettings';
import { marketingImages } from '@/lib/marketingImages';

const faq = [
  {
    question: 'Comment prendre un rendez-vous rapidement ?',
    answer:
      'En créant votre compte puis en choisissant un médecin ou un service adapté à votre besoin.',
  },
  {
    question: 'Puis-je consulter sans me déplacer ?',
    answer:
      'Oui, la plateforme propose un parcours de téléconsultation avec suivi et documentation.',
  },
  {
    question: 'Comment envoyer une demande précise ?',
    answer:
      "Le formulaire ci-dessous prépare un email structuré afin de simplifier l'échange avec l'équipe.",
  },
];

const ContactPage: React.FC = () => {
  const { data: siteSettings } = usePublicSiteSettings();
  const contact = siteSettings?.marketingSettings.contact;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const contactCards = [
    {
      Icon: Phone,
      title: 'Téléphone',
      value: contact?.phone || '+221 33 123 45 67',
      description: 'Pour une prise de contact rapide ou une assistance immédiate.',
      href: `tel:${(contact?.phone || '+221331234567').replace(/\s+/g, '')}`,
    },
    {
      Icon: Mail,
      title: 'Email',
      value: contact?.email || 'contact@santesn.sn',
      description: 'Pour les demandes détaillées, partenariats ou retours produit.',
      href: `mailto:${contact?.email || 'contact@santesn.sn'}`,
    },
    {
      Icon: MapPin,
      title: 'Adresse',
      value: contact?.location || 'Dakar, Sénégal',
      description: 'Point de référence de la coordination et des échanges locaux.',
      href: `https://maps.google.com/?q=${encodeURIComponent(contact?.location || 'Dakar, Sénégal')}`,
    },
    {
      Icon: Clock3,
      title: 'Horaires',
      value: contact?.hours || 'Lun - Ven / 8h00 - 18h00',
      description: 'Support renforcé en journée, suivi continu pour les demandes planifiées.',
      href: '/services',
    },
  ];

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = formData.subject || 'Demande de contact Santé SN';
    const targetEmail = contact?.email || 'contact@santesn.sn';
    const body = [
      `Nom: ${formData.name}`,
      `Email: ${formData.email}`,
      '',
      formData.message,
    ].join('\n');

    window.location.href = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-[#f7fbfa]">
      <MarketingPageHero
        eyebrow={contact?.heroEyebrow || 'Contact Santé SN'}
        title={contact?.heroTitle || 'Une page de contact complète, claire et immédiatement exploitable.'}
        description={contact?.heroDescription || "Que vous vouliez réserver, poser une question ou parler d'un partenariat, nous avons structuré cette page pour rendre le premier échange simple et rassurant."}
        highlights={['Support clair', 'Canaux visibles', 'Prise de contact rapide']}
        stats={[
          { value: '4', label: 'Façons rapides de nous joindre' },
          { value: contact?.responseTime || '< 24h', label: 'Délai de réponse cible pour les demandes qualifiées' },
          { value: '1', label: 'Formulaire simple pour préparer votre message' },
        ]}
        primaryAction={{ label: 'Prendre rendez-vous', to: '/auth/register' }}
        secondaryAction={{ label: 'Découvrir les services', to: '/services' }}
        image={marketingImages.publicContactHero}
        imageAlt="Medecin noire en teleconsultation sur smartphone"
        badge={contact?.heroBadge || 'Contact pensé pour rassurer avant même le premier échange'}
      />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <MarketingSectionHeading
            eyebrow="Canaux disponibles"
            title="Tous les points d'entrée importants sont visibles sans effort."
            description="Cette page évite les contacts cachés et les chemins compliqués. Le visiteur comprend rapidement comment nous joindre."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {contactCards.map(({ Icon, title, value, description, href }) => (
              <a
                key={title}
                href={href}
                className="rounded-[1.75rem] bg-white p-7 shadow-[0_18px_50px_-34px_rgba(0,84,97,0.28)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f7f4]">
                  <Icon className="h-7 w-7 text-[#249E94]" />
                </div>
                <h3 className="mt-6 text-xl font-bold font-display text-[#005461]">{title}</h3>
                <p className="mt-3 text-sm font-semibold text-slate-700">{value}</p>
                <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] bg-[#005461] p-8 text-white md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-teal-100">
                <MessageSquare className="h-4 w-4 text-[#8af6e8]" />
                Préparer un message utile
              </div>
              <h2 className="mt-6 text-3xl font-bold font-display">
                Envoyez-nous un message structuré.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-teal-100/85">
                {contact?.formIntro || 'Ce formulaire ouvre votre application email avec un message déjà préparé. C’est simple, rapide et suffisant pour une première prise de contact.'}
              </p>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm text-white placeholder:text-teal-100/60 focus:outline-none focus:ring-2 focus:ring-[#74ead3]"
                />
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Votre email"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm text-white placeholder:text-teal-100/60 focus:outline-none focus:ring-2 focus:ring-[#74ead3]"
                />
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Objet"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm text-white placeholder:text-teal-100/60 focus:outline-none focus:ring-2 focus:ring-[#74ead3]"
                />
                <textarea
                  required
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Décrivez votre besoin"
                  rows={6}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm text-white placeholder:text-teal-100/60 focus:outline-none focus:ring-2 focus:ring-[#74ead3]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[#3BC1A8] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#249E94]"
                >
                  Ouvrir mon email
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div>
              <MarketingSectionHeading
                eyebrow="Questions fréquentes"
                title="Les réponses importantes sont visibles avant même la prise de contact."
                description="Cela réduit les hésitations et améliore la qualité des demandes entrantes."
                centered={false}
              />

              <div className="mt-8 space-y-4">
                {faq.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-[1.5rem] border border-[#d7ece8] bg-[#f7fbfa] p-6"
                  >
                    <h3 className="text-lg font-bold font-display text-[#005461]">
                      {item.question}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{item.answer}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-[#d7ece8] bg-white p-7 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#3BC1A8]">
                  Besoin immédiat
                </p>
                <h3 className="mt-4 text-2xl font-bold font-display text-[#005461]">
                  Passez directement à la réservation.
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Si votre objectif est surtout de consulter rapidement, le chemin le plus court
                  reste la réservation sur la plateforme.
                </p>
                <Link
                  to="/auth/register"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#005461] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004050]"
                >
                  Réserver maintenant
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AppointmentSection />
    </div>
  );
};

export default ContactPage;
