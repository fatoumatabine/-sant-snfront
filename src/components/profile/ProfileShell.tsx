import React, { useRef } from 'react';
import {
  Camera,
  LogOut,
  Sparkles,
  Trash2,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fileToAvatarDataUrl, getAvatarSrc, getRoleLabel, getUserInitials } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

type ProfileStat = {
  label: string;
  value: string;
};

type ProfileSummaryItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

interface ProfileSectionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

interface ProfileShellProps {
  role: UserRole | string;
  title: string;
  description: string;
  name: string;
  email: string;
  avatar?: string | null;
  heroStats?: ProfileStat[];
  summaryItems?: ProfileSummaryItem[];
  personalTab: React.ReactNode;
  securityTab?: React.ReactNode;
  onAvatarChange?: (value: string | null) => void | Promise<void>;
  avatarDisabled?: boolean;
  onLogout?: () => void;
  helperNote?: React.ReactNode;
}

export const ProfileSectionCard: React.FC<ProfileSectionCardProps> = ({
  icon: Icon,
  title,
  description,
  children,
  footer,
  className,
}) => (
  <Card className={cn('card-health overflow-hidden rounded-[28px] p-0', className)}>
    <div className="border-b border-border/70 px-6 py-5 md:px-8">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>

    <div className="px-6 py-6 md:px-8">{children}</div>

    {footer ? <div className="border-t border-border/70 px-6 py-4 md:px-8">{footer}</div> : null}
  </Card>
);

export const ProfileShell: React.FC<ProfileShellProps> = ({
  role,
  title,
  description,
  name,
  email,
  avatar,
  heroStats = [],
  summaryItems = [],
  personalTab,
  securityTab,
  onAvatarChange,
  avatarDisabled = false,
  onLogout,
  helperNote,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasAvatar = Boolean(getAvatarSrc(avatar));
  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  const handleAvatarSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !onAvatarChange) {
      return;
    }

    let nextAvatar: string;

    try {
      nextAvatar = await fileToAvatarDataUrl(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'importer l'image");
      return;
    }

    await onAvatarChange(nextAvatar);
  };

  const handleAvatarRemoval = () => {
    if (!onAvatarChange) {
      return;
    }

    void onAvatarChange(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <section className="relative overflow-hidden rounded-[32px] border border-primary/15 bg-primary text-white shadow-[0_28px_80px_-38px_rgba(6,95,70,0.75)]">

        <div className="absolute -right-16 top-8 h-44 w-44 rounded-full border border-white/15 bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 left-16 h-36 w-36 rounded-full bg-black/10 blur-2xl" />

        <div className="relative space-y-6 p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Badge className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-white/10">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                {getRoleLabel(role)}
              </Badge>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold font-display leading-tight md:text-4xl">{title}</h1>
                <p className="max-w-xl text-sm text-white/82 md:text-base">{description}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Compte actif</p>
              <p className="mt-2 text-xl font-semibold">{name || getRoleLabel(role)}</p>
              <p className="mt-1 text-sm text-white/78">{email || 'Adresse email non disponible'}</p>
            </div>
          </div>

          {heroStats.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {heroStats.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="card-health sticky top-28 h-fit rounded-[28px] p-0">
          <div className="space-y-6 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-32 w-32 rounded-[32px] border-4 border-white shadow-2xl">
                  <AvatarImage src={getAvatarSrc(avatar)} alt={name || email} className="object-cover" />
                  <AvatarFallback className="bg-primary text-3xl font-bold text-white">
                    {getUserInitials(firstName, lastName, email)}
                  </AvatarFallback>
                </Avatar>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarDisabled || !onAvatarChange}
                  className="absolute -bottom-1 -right-1 rounded-2xl border border-white/80 bg-white p-2.5 text-primary shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Changer la photo de profil"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleAvatarSelection}
                className="hidden"
              />

              <div className="mt-5 space-y-2">
                <p className="text-2xl font-bold font-display text-foreground">{name || getRoleLabel(role)}</p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <UserCircle2 className="h-4 w-4" />
                  <span>{getRoleLabel(role)}</span>
                </div>
              </div>

              <div className="mt-5 flex w-full flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-2xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarDisabled || !onAvatarChange}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {hasAvatar ? 'Remplacer la photo' : 'Ajouter une photo'}
                </Button>

                {hasAvatar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleAvatarRemoval}
                    disabled={avatarDisabled || !onAvatarChange}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer la photo
                  </Button>
                ) : null}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                PNG, JPG, WEBP ou GIF. Taille maximale: 1 Mo.
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              {summaryItems.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-muted/55 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-background p-2 text-primary shadow-sm">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                      <p className="mt-1 break-words text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {helperNote ? (
              <div className="rounded-3xl border border-primary/15 bg-primary/5 px-4 py-4 text-sm text-foreground">
                {helperNote}
              </div>
            ) : null}

            {onLogout ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            ) : null}
          </div>
        </Card>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="h-auto w-full justify-start gap-2 rounded-[24px] border border-border/70 bg-card/80 p-2 shadow-sm">
            <TabsTrigger
              value="personal"
              className="min-h-[52px] flex-1 rounded-2xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Informations
            </TabsTrigger>
            {securityTab ? (
              <TabsTrigger
                value="security"
                className="min-h-[52px] flex-1 rounded-2xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Sécurité
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="personal" className="mt-0">
            {personalTab}
          </TabsContent>

          {securityTab ? (
            <TabsContent value="security" className="mt-0">
              {securityTab}
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </div>
  );
};
