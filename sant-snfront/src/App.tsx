import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout, AuthLayout } from "@/components/Common/Layout";
import { useAuthStore } from "@/store/authStore";
import { apiService } from "@/services/api";
import { ThemeProvider } from "@/components/ThemeProvider";
import { readAdminSettings, writeAdminSettings } from "@/lib/adminSettings";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import i18n from "@/i18n/config";
import '@/i18n/config';

// Pages publiques
import HomePage from "./pages/HomePage";
import { MarketingLayout } from "./components/Home/MarketingLayout";
import ServicesPage from "./pages/Public/ServicesPage";
import DoctorsPage from "./pages/Public/DoctorsPage";
import AboutPage from "./pages/Public/AboutPage";
import ContactPage from "./pages/Public/ContactPage";
import { LoginPage } from "./pages/Auth/LoginPage";
import { RegisterPage } from "./pages/Auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/Auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/Auth/ResetPasswordPage";

// Pages Patient
import { PatientDashboard } from "./pages/Patient/PatientDashboard";
import { PatientRendezVous } from "./pages/Patient/PatientRendezVous";
import { PatientDemanderRDV } from "./pages/Patient/PatientDemanderRDV";
import { PatientConsultations } from "./pages/Patient/PatientConsultations";
import { PatientPaiements } from "./pages/Patient/PatientPaiements";
import { PatientPaiementCheckout } from "./pages/Patient/PatientPaiementCheckout";
import { PatientProfile } from "./pages/Patient/PatientProfile";
import { PatientMedicalRecord } from "./pages/Patient/PatientMedicalRecord";
import { VideoCall } from "./pages/Patient/VideoCall";
import { IAEvaluation } from "./pages/Patient/IAEvaluation";

// Pages Médecin
import { MedecinDashboardNew as MedecinDashboard } from "./pages/Medecin/MedecinDashboardNew";
import { MedecinRendezVous } from "./pages/Medecin/MedecinRendezVous";
import { MedecinConsultations } from "./pages/Medecin/MedecinConsultations";
import { MedecinOrdonnances } from "./pages/Medecin/MedecinOrdonnances";
import { MedecinPatients } from "./pages/Medecin/MedecinPatients";
import { MedecinCreateConsultation } from "./pages/Medecin/MedecinCreateConsultation";
import { MedecinConsultationDetail } from "./pages/Medecin/MedecinConsultationDetail";
import { MedecinEditConsultation } from "./pages/Medecin/MedecinEditConsultation";
import { MedecinDisponibilites } from "./pages/Medecin/MedecinDisponibilites";
import { MedecinProfile } from "./pages/Medecin/MedecinProfile";

// Pages Admin
import { AdminDashboard } from "./pages/Admin/AdminDashboard";
import { AdminMedecinsCRUD } from "./pages/Admin/AdminMedecinsCRUD";
import { AdminSecretairesCRUD } from "./pages/Admin/AdminSecretairesCRUD";
import { AdminPatientsCRUD } from "./pages/Admin/AdminPatientsCRUD";
import { AdminParametres } from "./pages/Admin/AdminParametres";
import { AdminProfile } from "./pages/Admin/AdminProfile";
import { AdminArchives } from "./pages/Admin/AdminArchives";
import { AdminStatistiques } from "./pages/Admin/AdminStatistiques";

// Pages Secrétaire
import { SecretaireDashboard } from "./pages/Secretaire/SecretaireDashboard";
import { SecretaireDemandesRDVComplet } from "./pages/Secretaire/SecretaireDemandesRDVComplet";
import { SecretaireRendezVousEnCours } from "./pages/Secretaire/SecretaireRendezVousEnCours";
import { SecretaireAgenda } from "./pages/Secretaire/SecretaireAgenda";
import { SecretairePaiements } from "./pages/Secretaire/SecretairePaiements";
import { SecretaireParametres } from "./pages/Secretaire/SecretaireParametres";
import { SecretaireProfile } from "./pages/Secretaire/SecretaireProfile";
import { SecretaireRapports } from "./pages/Secretaire/SecretaireRapports";
import { NotificationsPage } from "./pages/Common/NotificationsPage";
import { WebChatPage } from "./pages/Common/WebChatPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const App = () => {
  const { token, setToken } = useAuthStore();

  // Synchroniser le token au démarrage
  useEffect(() => {
    if (token) {
      apiService.setToken(token);
    }
  }, [token, setToken]);

  useEffect(() => {
    const applyRuntimeSettings = () => {
      const settings = readAdminSettings();
      document.title = settings.generalSettings.appName || 'Santé SN';
      const selectedLanguage = settings.generalSettings.language || localStorage.getItem('language') || 'fr';
      i18n.changeLanguage(selectedLanguage);
      document.documentElement.lang = selectedLanguage;
      localStorage.setItem('language', selectedLanguage);
    };

    const hydrateRuntimeSettings = async () => {
      if (token) {
        try {
          const response: any = await apiService.get(API_ENDPOINTS.settings.app);
          const remoteSettings = response?.data || response;
          writeAdminSettings(remoteSettings);
        } catch {
          // Fallback silencieux sur les paramètres locaux
        }
      }
      applyRuntimeSettings();
    };

    hydrateRuntimeSettings();
    window.addEventListener('storage', applyRuntimeSettings);
    return () => {
      window.removeEventListener('storage', applyRuntimeSettings);
    };
  }, [token]);

  useEffect(() => {
    const handleMutationRefresh = () => {
      queryClient.invalidateQueries();
    };

    window.addEventListener('api:mutation-success', handleMutationRefresh as EventListener);
    return () => {
      window.removeEventListener('api:mutation-success', handleMutationRefresh as EventListener);
    };
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
          {/* Routes publiques */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/medecins" element={<DoctorsPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>
          
          {/* Routes Auth */}
           <Route element={<AuthLayout />}>
             <Route path="/auth/login" element={<LoginPage />} />
             <Route path="/auth/register" element={<RegisterPage />} />
             <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
             <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
           </Route>

          {/* Routes Patient */}
          <Route element={<DashboardLayout allowedRoles={['patient']} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/rendez-vous" element={<PatientRendezVous />} />
            <Route path="/patient/demander-rdv" element={<PatientDemanderRDV />} />
            <Route path="/patient/consultations" element={<PatientConsultations />} />
            <Route path="/patient/dossier-medical" element={<PatientMedicalRecord />} />
            <Route path="/patient/paiements" element={<PatientPaiements />} />
            <Route path="/patient/paiements/rendez-vous/:rendezVousId" element={<PatientPaiementCheckout />} />
            <Route path="/patient/notifications" element={<NotificationsPage />} />
            <Route path="/patient/chat" element={<WebChatPage />} />
            <Route path="/patient/ia-evaluation" element={<IAEvaluation />} />
            <Route path="/patient/video-call" element={<VideoCall />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
          </Route>

          {/* Routes Médecin */}
           <Route element={<DashboardLayout allowedRoles={['medecin']} />}>
             <Route path="/medecin/dashboard" element={<MedecinDashboard />} />
             <Route path="/medecin/rendez-vous" element={<MedecinRendezVous />} />
             <Route path="/medecin/consultations" element={<MedecinConsultations />} />
             <Route path="/medecin/consultations/nouvelle" element={<MedecinCreateConsultation />} />
             <Route path="/medecin/consultations/:id" element={<MedecinConsultationDetail />} />
             <Route path="/medecin/consultations/:id/edit" element={<MedecinEditConsultation />} />
             <Route path="/medecin/ordonnances" element={<MedecinOrdonnances />} />
             <Route path="/medecin/disponibilites" element={<MedecinDisponibilites />} />
             <Route path="/medecin/patients" element={<MedecinPatients />} />
             <Route path="/medecin/notifications" element={<NotificationsPage />} />
             <Route path="/medecin/chat" element={<WebChatPage />} />
             <Route path="/medecin/video-call" element={<VideoCall />} />
             <Route path="/medecin/profile" element={<MedecinProfile />} />
           </Route>

          {/* Routes Secrétaire */}
          <Route element={<DashboardLayout allowedRoles={['secretaire']} />}>
            <Route path="/secretaire/dashboard" element={<SecretaireDashboard />} />
            <Route path="/secretaire/demandes-rdv" element={<SecretaireDemandesRDVComplet />} />
            <Route path="/secretaire/rdv-en-cours" element={<SecretaireRendezVousEnCours />} />
            <Route path="/secretaire/agenda" element={<SecretaireAgenda />} />
            <Route path="/secretaire/paiements" element={<SecretairePaiements />} />
            <Route path="/secretaire/notifications" element={<NotificationsPage />} />
            <Route path="/secretaire/chat" element={<WebChatPage />} />
            <Route path="/secretaire/profile" element={<SecretaireProfile />} />
            <Route path="/secretaire/parametres" element={<SecretaireParametres />} />
            <Route path="/secretaire/rapports" element={<SecretaireRapports />} />
          </Route>

          {/* Routes Admin */}
           <Route element={<DashboardLayout allowedRoles={['admin']} />}>
             <Route path="/admin/dashboard" element={<AdminDashboard />} />
             <Route path="/admin/utilisateurs/medecins" element={<AdminMedecinsCRUD />} />
             <Route path="/admin/utilisateurs/secretaires" element={<AdminSecretairesCRUD />} />
             <Route path="/admin/utilisateurs/patients" element={<AdminPatientsCRUD />} />
             <Route path="/admin/archives" element={<AdminArchives />} />
             <Route path="/admin/statistiques" element={<AdminStatistiques />} />
             <Route path="/admin/notifications" element={<NotificationsPage />} />
             <Route path="/admin/chat" element={<WebChatPage />} />
             <Route path="/admin/parametres" element={<AdminParametres />} />
             <Route path="/admin/profile" element={<AdminProfile />} />
           </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
