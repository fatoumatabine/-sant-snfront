import React, { useEffect, useState } from 'react';
import {
  Settings,
  Palette,
  RefreshCw,
  Check,
  Moon,
  Sun
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore, presetThemes } from '@/store/settingsStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';

const themeColors = [
  { name: 'turquoise', color: '#14b8a6', hsl: presetThemes.turquoise },
  { name: 'blue', color: '#3b82f6', hsl: presetThemes.blue },
  { name: 'purple', color: '#a855f7', hsl: presetThemes.purple },
  { name: 'green', color: '#22c55e', hsl: presetThemes.green },
  { name: 'orange', color: '#f97316', hsl: presetThemes.orange },
  { name: 'pink', color: '#ec4899', hsl: presetThemes.pink },
  { name: 'gray', color: '#6b7280', hsl: presetThemes.gray },
  { name: 'lightgray', color: '#9ca3af', hsl: presetThemes.lightgray }
];

export const SecretaireParametres: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme, resetTheme, language, setLanguage, isDarkMode, toggleDarkMode } = useSettingsStore();
  const [selectedTheme, setSelectedTheme] = useState<string>('turquoise');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response: any = await apiService.get(API_ENDPOINTS.settings.me);
        const data = response?.data || response;

        if (typeof data.language === 'string') {
          setLanguage(data.language);
        }
        if (typeof data.selectedTheme === 'string') {
          setSelectedTheme(data.selectedTheme);
        }
        if (data.theme && typeof data.theme === 'object') {
          setTheme(data.theme);
        }
        if (typeof data.isDarkMode === 'boolean' && data.isDarkMode !== isDarkMode) {
          toggleDarkMode();
        }
      } catch {
        // Préférences non disponibles, fallback local
      }
    };

    loadSettings();
  }, []);

  const handleApplyTheme = async (themeKey: string) => {
    const themeData = themeColors.find(t => t.name === themeKey);
    if (themeData) {
      setTheme(themeData.hsl);
      setSelectedTheme(themeKey);
      try {
        await apiService.put(API_ENDPOINTS.settings.me, {
          selectedTheme: themeKey,
          theme: themeData.hsl,
        });
        toast.success(t('messages.updateSuccess'));
      } catch {
        toast.error('Impossible de sauvegarder les préférences');
      }
    }
  };

  const handleResetTheme = async () => {
    resetTheme();
    setSelectedTheme('turquoise');
    try {
      await apiService.put(API_ENDPOINTS.settings.me, {
        selectedTheme: 'turquoise',
        theme: presetThemes.turquoise,
      });
      toast.success(t('secretary.settings.resetTheme') + ' ✓');
    } catch {
      toast.error('Impossible de sauvegarder les préférences');
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    try {
      await apiService.put(API_ENDPOINTS.settings.me, { language: lang });
      toast.success(t('messages.updateSuccess'));
    } catch {
      toast.error('Impossible de sauvegarder la langue');
    }
  };

  const handleDarkModeToggle = async () => {
    const nextValue = !isDarkMode;
    toggleDarkMode();
    try {
      await apiService.put(API_ENDPOINTS.settings.me, { isDarkMode: nextValue });
      toast.success(nextValue ? 'Mode sombre activé' : 'Mode clair activé');
    } catch {
      toast.error('Impossible de sauvegarder le mode d’affichage');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="bg-primary rounded-2xl p-6 md:p-8 text-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display mb-2 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Settings className="h-7 w-7" />
            </div>
            {t('secretary.settings.title')}
          </h1>
          <p className="text-white/80">
            {t('secretary.settings.themeCustomization')}
          </p>
        </div>
      </div>

      {/* Language Selection */}
      <Card className="card-health p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('patient.profile.language')}</h2>
            <p className="text-sm text-muted-foreground">
              Choisissez la langue de l'application
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleLanguageChange('fr')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all hover:scale-105",
              language === 'fr'
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-semibold">Français</p>
                <p className="text-xs text-muted-foreground">France / Sénégal</p>
              </div>
              {language === 'fr' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </button>

          <button
            onClick={() => handleLanguageChange('en')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all hover:scale-105",
              language === 'en'
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-semibold">English</p>
                <p className="text-xs text-muted-foreground">International</p>
              </div>
              {language === 'en' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </button>

          <button
            onClick={() => handleLanguageChange('wo')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all hover:scale-105",
              language === 'wo'
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-semibold">Wolof</p>
                <p className="text-xs text-muted-foreground">Sénégal</p>
              </div>
              {language === 'wo' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </button>
        </div>
      </Card>

      {/* Dark Mode Toggle */}
      <Card className="card-health p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {isDarkMode ? 'Mode sombre' : 'Mode clair'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Choisissez l'apparence de l'interface
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {isDarkMode ? 'Sombre' : 'Clair'}
            </span>
            <Switch
              checked={isDarkMode}
              onCheckedChange={handleDarkModeToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </Card>

      {/* Theme Customization */}
      <Card className="card-health p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('secretary.settings.themeCustomization')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('secretary.settings.chooseColor')}
            </p>
          </div>
        </div>

        {/* Preset Colors */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              {t('secretary.settings.presetColors')}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {themeColors.map((themeOption) => (
                <button
                  key={themeOption.name}
                  onClick={() => handleApplyTheme(themeOption.name)}
                  className={cn(
                    "group relative p-4 rounded-xl border-2 transition-all hover:scale-105",
                    selectedTheme === themeOption.name
                      ? "border-primary shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                   <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-full shadow-md transition-transform group-hover:scale-110"
                      style={{ backgroundColor: themeOption.color }}
                    />
                    <p className="text-sm font-medium">{t(`secretary.settings.${themeOption.name}`)}</p>
                    {selectedTheme === themeOption.name && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8 p-6 bg-muted/30 rounded-xl border-2 border-dashed">
            <Label className="text-sm font-medium mb-3 block">
              {t('secretary.settings.preview')}
            </Label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button size="sm" className="gap-2">
                  <Check className="h-4 w-4" />
                  Bouton Principal
                </Button>
                <Button size="sm" variant="outline">
                  Bouton Secondaire
                </Button>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm">
                  <span className="font-semibold text-primary">Aperçu:</span> Voici comment apparaîtront les éléments avec la couleur sélectionnée.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleResetTheme}
              variant="outline"
              className="gap-2 flex-1"
            >
              <RefreshCw className="h-4 w-4" />
              {t('secretary.settings.resetTheme')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Information */}
      <Card className="card-health p-6 border-primary/20 bg-primary/5">
        <div className="flex gap-3">
          <div className="p-2 bg-primary/10 rounded-lg h-fit">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Information</h3>
            <p className="text-sm text-muted-foreground">
              Les modifications de thème s'appliqueront immédiatement à toute l'application.
              La langue changera également dans toute l'interface.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
