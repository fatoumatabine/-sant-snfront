import React, { useEffect, useRef, useState } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  Clock,
  Globe,
  Lock,
  Server,
  HardDrive,
  Activity,
  AlertCircle,
  Save,
  RefreshCw,
  Download,
  Upload,
  Phone,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSettingsStore } from '@/store/settingsStore';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { readAdminSettings, writeAdminSettings } from '@/lib/adminSettings';

type GeneralSettings = {
  appName: string;
  appDescription: string;
  timezone: string;
  language: string;
  itemsPerPage: string;
};

type NotificationSettings = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  systemAlerts: boolean;
  reminderTime: string;
};

type SecuritySettings = {
  twoFactorAuth: boolean;
  sessionTimeout: string;
  passwordExpiry: string;
  maxLoginAttempts: string;
  requireStrongPassword: boolean;
};

type SystemSettings = {
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  logRetention: string;
  debugMode: boolean;
};

type MarketingAboutSettings = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroBadge: string;
  missionTitle: string;
  missionDescription: string;
  missionPoint1: string;
  missionPoint2: string;
  missionPoint3: string;
  missionPoint4: string;
  humanityDescription: string;
  trustDescription: string;
  simplicityDescription: string;
};

type MarketingContactSettings = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroBadge: string;
  phone: string;
  email: string;
  location: string;
  hours: string;
  formIntro: string;
  responseTime: string;
};

type MarketingSettings = {
  about: MarketingAboutSettings;
  contact: MarketingContactSettings;
};

const defaultGeneralSettings: GeneralSettings = {
  appName: 'Santé SN',
  appDescription: 'Plateforme de gestion des rendez-vous médicaux',
  timezone: 'Africa/Dakar',
  language: 'fr',
  itemsPerPage: '20'
};

const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: true,
  appointmentReminders: true,
  systemAlerts: true,
  reminderTime: '24'
};

const defaultSecuritySettings: SecuritySettings = {
  twoFactorAuth: false,
  sessionTimeout: '60',
  passwordExpiry: '90',
  maxLoginAttempts: '5',
  requireStrongPassword: true
};

const defaultSystemSettings: SystemSettings = {
  maintenanceMode: false,
  autoBackup: true,
  backupFrequency: 'daily',
  logRetention: '30',
  debugMode: false
};

const defaultMarketingSettings: MarketingSettings = {
  about: {
    heroEyebrow: 'À propos de Santé SN',
    heroTitle: 'Une plateforme pensée pour moderniser le soin sans perdre sa dimension humaine.',
    heroDescription:
      'Notre ambition est simple : construire un environnement de santé numérique crédible, élégant et utile pour les patients comme pour les professionnels.',
    heroBadge: 'Santé numérique, mais toujours profondément humaine',
    missionTitle: 'Concevoir une expérience de santé qui inspire immédiatement confiance.',
    missionDescription:
      'Nous voulons qu’un patient comprenne rapidement où aller, comment être aidé et ce qu’il se passera ensuite. Cette clarté change profondément la perception du service.',
    missionPoint1: 'Rendre la consultation accessible depuis n’importe où',
    missionPoint2: 'Réduire les zones de flou entre prise de rendez-vous et suivi',
    missionPoint3: 'Mieux préparer les médecins grâce à un contexte structuré',
    missionPoint4: 'Créer une interface moderne sans perdre la chaleur humaine',
    humanityDescription:
      'Nous cherchons à rendre la relation de soin plus proche, plus douce et plus claire à chaque étape.',
    trustDescription:
      'La plateforme doit inspirer le sérieux, protéger les données et clarifier les décisions médicales.',
    simplicityDescription:
      'Nous simplifions les parcours complexes pour que l’utilisateur sache toujours où cliquer et quoi faire.',
  },
  contact: {
    heroEyebrow: 'Contact Santé SN',
    heroTitle: 'Une page de contact complète, claire et immédiatement exploitable.',
    heroDescription:
      'Que vous vouliez réserver, poser une question ou parler d’un partenariat, nous avons structuré cette page pour rendre le premier échange simple et rassurant.',
    heroBadge: 'Contact pensé pour rassurer avant même le premier échange',
    phone: '+221 33 123 45 67',
    email: 'contact@santesn.sn',
    location: 'Dakar, Sénégal',
    hours: 'Lun - Ven / 8h00 - 18h00',
    formIntro:
      'Ce formulaire ouvre votre application email avec un message déjà préparé. C’est simple, rapide et suffisant pour une première prise de contact.',
    responseTime: '< 24h',
  },
};

export const AdminParametres: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { setLanguage } = useSettingsStore();
  
  // États pour les différents paramètres
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(defaultGeneralSettings);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);

  const [marketingSettings, setMarketingSettings] = useState<MarketingSettings>(defaultMarketingSettings);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response: any = await apiService.get(API_ENDPOINTS.settings.admin);
        const payload = response?.data || response;
        const normalized = writeAdminSettings(payload);
        setGeneralSettings({ ...defaultGeneralSettings, ...normalized.generalSettings });
        setNotificationSettings({ ...defaultNotificationSettings, ...normalized.notificationSettings });
        setSecuritySettings({ ...defaultSecuritySettings, ...normalized.securitySettings });
        setSystemSettings({ ...defaultSystemSettings, ...normalized.systemSettings });
        setMarketingSettings({
          about: { ...defaultMarketingSettings.about, ...normalized.marketingSettings.about },
          contact: { ...defaultMarketingSettings.contact, ...normalized.marketingSettings.contact },
        });
      } catch {
        const fallback = readAdminSettings();
        setGeneralSettings({ ...defaultGeneralSettings, ...fallback.generalSettings });
        setNotificationSettings({ ...defaultNotificationSettings, ...fallback.notificationSettings });
        setSecuritySettings({ ...defaultSecuritySettings, ...fallback.securitySettings });
        setSystemSettings({ ...defaultSystemSettings, ...fallback.systemSettings });
        setMarketingSettings({
          about: { ...defaultMarketingSettings.about, ...fallback.marketingSettings.about },
          contact: { ...defaultMarketingSettings.contact, ...fallback.marketingSettings.contact },
        });
        toast.error('Impossible de charger les paramètres depuis le serveur');
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const numericFields = [
        { key: 'itemsPerPage', value: Number(generalSettings.itemsPerPage) },
        { key: 'reminderTime', value: Number(notificationSettings.reminderTime) },
        { key: 'sessionTimeout', value: Number(securitySettings.sessionTimeout) },
        { key: 'passwordExpiry', value: Number(securitySettings.passwordExpiry) },
        { key: 'maxLoginAttempts', value: Number(securitySettings.maxLoginAttempts) },
        { key: 'logRetention', value: Number(systemSettings.logRetention) }
      ];

      const invalidField = numericFields.find((field) => Number.isNaN(field.value) || field.value <= 0);
      if (invalidField) {
        toast.error(`Valeur invalide pour ${invalidField.key}`);
        return;
      }

      const payload = {
        generalSettings,
        notificationSettings,
        securitySettings,
        systemSettings,
        marketingSettings,
        updatedAt: new Date().toISOString()
      };

      const response: any = await apiService.put(API_ENDPOINTS.settings.admin, payload);
      const saved = writeAdminSettings(response?.data || response);
      setLanguage(saved.generalSettings.language);
      document.title = saved.generalSettings.appName;
      toast.success('Paramètres enregistrés avec succès');
    } catch {
      toast.error('Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const payload = {
        generalSettings,
        notificationSettings,
        securitySettings,
        systemSettings,
        marketingSettings,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sante-sn-parametres-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export des paramètres terminé');
    } catch {
      toast.error('Erreur lors de l’export');
    }
  };

  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.generalSettings || !parsed.notificationSettings || !parsed.securitySettings || !parsed.systemSettings) {
        toast.error('Fichier de paramètres invalide');
        return;
      }

      setGeneralSettings({ ...defaultGeneralSettings, ...parsed.generalSettings });
      setNotificationSettings({ ...defaultNotificationSettings, ...parsed.notificationSettings });
      setSecuritySettings({ ...defaultSecuritySettings, ...parsed.securitySettings });
      setSystemSettings({ ...defaultSystemSettings, ...parsed.systemSettings });
      setMarketingSettings({
        about: { ...defaultMarketingSettings.about, ...(parsed.marketingSettings?.about || {}) },
        contact: { ...defaultMarketingSettings.contact, ...(parsed.marketingSettings?.contact || {}) },
      });
      toast.success('Paramètres importés. Cliquez sur Enregistrer pour appliquer.');
    } catch {
      toast.error('Impossible de lire ce fichier');
    } finally {
      event.target.value = '';
    }
  };

  const handleReset = async () => {
    try {
      const response: any = await apiService.delete(API_ENDPOINTS.settings.admin);
      const payload = writeAdminSettings(response?.data || response);
      setGeneralSettings({ ...defaultGeneralSettings, ...payload.generalSettings });
      setNotificationSettings({ ...defaultNotificationSettings, ...payload.notificationSettings });
      setSecuritySettings({ ...defaultSecuritySettings, ...payload.securitySettings });
      setSystemSettings({ ...defaultSystemSettings, ...payload.systemSettings });
      setMarketingSettings({
        about: { ...defaultMarketingSettings.about, ...payload.marketingSettings.about },
        contact: { ...defaultMarketingSettings.contact, ...payload.marketingSettings.contact },
      });
      setLanguage(payload.generalSettings.language);
      document.title = payload.generalSettings.appName;
      toast.success('Paramètres réinitialisés');
    } catch {
      toast.error('Erreur lors de la réinitialisation des paramètres');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-7 w-7 text-primary" />
            </div>
            Paramètres du système
          </h1>
          <p className="text-muted-foreground mt-2">
            Configurez et gérez les paramètres de votre plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alert Info */}
      <Alert className="border-primary/20 bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          Les modifications apportées ici affecteront l'ensemble du système. 
          Assurez-vous de bien comprendre chaque paramètre avant de le modifier.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Système</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <Card className="card-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Informations générales
              </CardTitle>
              <CardDescription>
                Configuration de base de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appName">Nom de l'application</Label>
                  <Input
                    id="appName"
                    value={generalSettings.appName}
                    onChange={(e) => setGeneralSettings({...generalSettings, appName: e.target.value})}
                    placeholder="Santé SN"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select 
                    value={generalSettings.language}
                    onValueChange={(value) => {
                      setGeneralSettings({ ...generalSettings, language: value });
                    }}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="wo">Wolof</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="appDescription">Description</Label>
                  <Input
                    id="appDescription"
                    value={generalSettings.appDescription}
                    onChange={(e) => setGeneralSettings({...generalSettings, appDescription: e.target.value})}
                    placeholder="Description de votre application"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select 
                    value={generalSettings.timezone}
                    onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Dakar">Africa/Dakar (GMT+0)</SelectItem>
                      <SelectItem value="Africa/Abidjan">Africa/Abidjan (GMT+0)</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemsPerPage">Éléments par page</Label>
                  <Select 
                    value={generalSettings.itemsPerPage}
                    onValueChange={(value) => setGeneralSettings({...generalSettings, itemsPerPage: value})}
                  >
                    <SelectTrigger id="itemsPerPage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <Card className="card-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Contenu À Propos
              </CardTitle>
              <CardDescription>
                Les champs ci-dessous alimentent directement la page publique À Propos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Eyebrow</Label>
                  <Input
                    value={marketingSettings.about.heroEyebrow}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        about: { ...marketingSettings.about, heroEyebrow: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Badge</Label>
                  <Input
                    value={marketingSettings.about.heroBadge}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        about: { ...marketingSettings.about, heroBadge: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Titre héros</Label>
                  <Textarea
                    rows={2}
                    value={marketingSettings.about.heroTitle}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        about: { ...marketingSettings.about, heroTitle: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description héros</Label>
                  <Textarea
                    rows={3}
                    value={marketingSettings.about.heroDescription}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        about: { ...marketingSettings.about, heroDescription: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Titre mission</Label>
                  <Textarea
                    rows={2}
                    value={marketingSettings.about.missionTitle}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        about: { ...marketingSettings.about, missionTitle: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description mission</Label>
                  <Textarea
                    rows={3}
                    value={marketingSettings.about.missionDescription}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        about: { ...marketingSettings.about, missionDescription: e.target.value }
                      })
                    }
                  />
                </div>
                {(['missionPoint1', 'missionPoint2', 'missionPoint3', 'missionPoint4'] as const).map((key, index) => (
                  <div className="space-y-2 md:col-span-2" key={key}>
                    <Label>Point mission {index + 1}</Label>
                    <Input
                      value={marketingSettings.about[key]}
                      onChange={(e) =>
                        setMarketingSettings({
                          ...marketingSettings,
                          about: { ...marketingSettings.about, [key]: e.target.value }
                        })
                      }
                    />
                  </div>
                ))}
                <div className="space-y-2 md:col-span-2">
                  <Label>Description Humanité</Label>
                  <Textarea
                    rows={3}
                    value={marketingSettings.about.humanityDescription}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        about: { ...marketingSettings.about, humanityDescription: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description Confiance</Label>
                  <Textarea
                    rows={4}
                    value={marketingSettings.about.trustDescription}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        about: { ...marketingSettings.about, trustDescription: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description Simplicité</Label>
                  <Textarea
                    rows={4}
                    value={marketingSettings.about.simplicityDescription}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        about: { ...marketingSettings.about, simplicityDescription: e.target.value }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contenu Contact
              </CardTitle>
              <CardDescription>
                Ces informations sont réutilisées sur la page publique Contact.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Eyebrow</Label>
                  <Input
                    value={marketingSettings.contact.heroEyebrow}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, heroEyebrow: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Badge</Label>
                  <Input
                    value={marketingSettings.contact.heroBadge}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, heroBadge: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Titre héros</Label>
                  <Textarea
                    rows={2}
                    value={marketingSettings.contact.heroTitle}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, heroTitle: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description héros</Label>
                  <Textarea
                    rows={3}
                    value={marketingSettings.contact.heroDescription}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, heroDescription: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={marketingSettings.contact.phone}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, phone: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={marketingSettings.contact.email}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, email: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Localisation</Label>
                  <Input
                    value={marketingSettings.contact.location}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, location: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horaires</Label>
                  <Input
                    value={marketingSettings.contact.hours}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, hours: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Délai de réponse affiché</Label>
                  <Input
                    value={marketingSettings.contact.responseTime}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, responseTime: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Introduction du formulaire</Label>
                  <Textarea
                    rows={4}
                    value={marketingSettings.contact.formIntro}
                    onChange={(e) =>
                      setMarketingSettings({
                        ...marketingSettings,
                        contact: { ...marketingSettings.contact, formIntro: e.target.value }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Préférences de notification
              </CardTitle>
              <CardDescription>
                Gérez les notifications envoyées aux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <Label htmlFor="emailNotifications" className="font-medium cursor-pointer">
                        Notifications par email
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Envoyer des emails pour les événements importants
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, emailNotifications: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <Label htmlFor="smsNotifications" className="font-medium cursor-pointer">
                        Notifications SMS
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Envoyer des SMS pour les rendez-vous
                    </p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, smsNotifications: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <Label htmlFor="appointmentReminders" className="font-medium cursor-pointer">
                        Rappels de rendez-vous
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Rappeler aux patients leurs rendez-vous à venir
                    </p>
                  </div>
                  <Switch
                    id="appointmentReminders"
                    checked={notificationSettings.appointmentReminders}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, appointmentReminders: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <Label htmlFor="systemAlerts" className="font-medium cursor-pointer">
                        Alertes système
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Notifier les administrateurs des problèmes système
                    </p>
                  </div>
                  <Switch
                    id="systemAlerts"
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, systemAlerts: checked})
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="reminderTime">Délai de rappel (heures avant le RDV)</Label>
                <Select 
                  value={notificationSettings.reminderTime}
                  onValueChange={(value) => setNotificationSettings({...notificationSettings, reminderTime: value})}
                >
                  <SelectTrigger id="reminderTime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 heures</SelectItem>
                    <SelectItem value="6">6 heures</SelectItem>
                    <SelectItem value="12">12 heures</SelectItem>
                    <SelectItem value="24">24 heures</SelectItem>
                    <SelectItem value="48">48 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <Card className="card-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Paramètres de sécurité
              </CardTitle>
              <CardDescription>
                Renforcez la sécurité de votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <Label htmlFor="twoFactorAuth" className="font-medium cursor-pointer">
                        Authentification à deux facteurs
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Exiger une double authentification pour les administrateurs
                    </p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({...securitySettings, twoFactorAuth: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <Label htmlFor="requireStrongPassword" className="font-medium cursor-pointer">
                        Mots de passe forts
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Exiger des mots de passe complexes (min 8 caractères, majuscules, chiffres)
                    </p>
                  </div>
                  <Switch
                    id="requireStrongPassword"
                    checked={securitySettings.requireStrongPassword}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({...securitySettings, requireStrongPassword: checked})
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de session (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
                    placeholder="60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Déconnexion automatique après inactivité
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Tentatives de connexion max</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: e.target.value})}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Bloquer après X tentatives échouées
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Expiration mot de passe (jours)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={securitySettings.passwordExpiry}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: e.target.value})}
                    placeholder="90"
                  />
                  <p className="text-xs text-muted-foreground">
                    Forcer le changement de mot de passe
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Système */}
        <TabsContent value="system" className="space-y-6">
          <Card className="card-health">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Configuration système
              </CardTitle>
              <CardDescription>
                Gérez les paramètres techniques et la maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <Label htmlFor="maintenanceMode" className="font-medium cursor-pointer">
                        Mode maintenance
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Désactiver l'accès public pour effectuer des opérations
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => 
                      setSystemSettings({...systemSettings, maintenanceMode: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-primary" />
                      <Label htmlFor="autoBackup" className="font-medium cursor-pointer">
                        Sauvegarde automatique
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Créer des sauvegardes automatiques de la base de données
                    </p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(checked) => 
                      setSystemSettings({...systemSettings, autoBackup: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <Label htmlFor="debugMode" className="font-medium cursor-pointer">
                        Mode debug
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Afficher les erreurs détaillées (développement uniquement)
                    </p>
                  </div>
                  <Switch
                    id="debugMode"
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) => 
                      setSystemSettings({...systemSettings, debugMode: checked})
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Fréquence de sauvegarde</Label>
                  <Select 
                    value={systemSettings.backupFrequency}
                    onValueChange={(value) => setSystemSettings({...systemSettings, backupFrequency: value})}
                  >
                    <SelectTrigger id="backupFrequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logRetention">Rétention des logs (jours)</Label>
                  <Input
                    id="logRetention"
                    type="number"
                    value={systemSettings.logRetention}
                    onChange={(e) => setSystemSettings({...systemSettings, logRetention: e.target.value})}
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Durée de conservation des fichiers de log
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Gestion des sauvegardes
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleExportBackup} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exporter la base de données
                  </Button>
                  <Button variant="outline" onClick={handleImportBackup} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importer une sauvegarde
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations système */}
          <Card className="card-health border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Activity className="h-5 w-5" />
                Informations système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-semibold">1.0.0</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Base de données</p>
                  <p className="font-semibold">PostgreSQL 14.5</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Serveur</p>
                  <p className="font-semibold">Node.js 20.x</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Dernière sauvegarde</p>
                  <p className="font-semibold">Il y a 2 heures</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="font-semibold">15 jours 4h 23min</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Espace disque</p>
                  <p className="font-semibold">234 Go / 500 Go</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
