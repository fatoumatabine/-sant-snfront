import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

type ViewMode = 'month' | 'week' | 'day';

type EventStatus = 'confirme' | 'en_attente' | 'termine' | 'annule';

interface ApiEnvelope<T> {
  data?: T;
}

interface ApiNameRef {
  prenom?: string;
  nom?: string;
  user?: {
    name?: string;
  };
}

interface ApiRendezVous {
  id: number;
  date?: string;
  heure?: string;
  motif?: string | null;
  statut?: string;
  patient?: ApiNameRef;
  medecin?: ApiNameRef;
}

interface DashboardStats {
  totalRendezVous: number;
  rendezVousAujourdhui: number;
  demandesEnAttente: number;
  totalPatients: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'default';
  patient: string;
  medecin: string;
  motif: string;
  statut: EventStatus;
}

interface PendingDemande {
  id: string;
  patientName: string;
  medecinName: string;
  motif: string;
  datePreferee: string;
  heurePreferee: string;
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-orange-50 text-orange-700 border-orange-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  default: 'bg-gray-50 text-gray-700 border-gray-200',
};

const statusLabels: Record<EventStatus, string> = {
  confirme: 'Confirmé',
  en_attente: 'En attente',
  termine: 'Terminé',
  annule: 'Annulé',
};

const emptyStats: DashboardStats = {
  totalRendezVous: 0,
  rendezVousAujourdhui: 0,
  demandesEnAttente: 0,
  totalPatients: 0,
};

const normalizeStatus = (status?: string): EventStatus => {
  const current = (status || '').toLowerCase();
  if (current === 'confirme' || current === 'confirmed') return 'confirme';
  if (current === 'termine' || current === 'completed') return 'termine';
  if (current === 'annule' || current === 'cancelled') return 'annule';
  return 'en_attente';
};

const formatFullName = (value?: ApiNameRef, fallback = 'Patient'): string => {
  const explicit = (value?.user?.name || '').trim();
  if (explicit) return explicit;

  const prenom = (value?.prenom || '').trim();
  const nom = (value?.nom || '').trim();
  const full = `${prenom} ${nom}`.trim();
  return full || fallback;
};

const addThirtyMinutes = (heure?: string): string => {
  if (!heure || !/^\d{2}:\d{2}$/.test(heure)) return '00:30';
  const [hours, minutes] = heure.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + 30;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
};

const unwrapAppointments = (payload: unknown): ApiRendezVous[] => {
  if (Array.isArray(payload)) return payload as ApiRendezVous[];

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const maybeData = (payload as ApiEnvelope<ApiRendezVous[]>).data;
    if (Array.isArray(maybeData)) return maybeData;
  }

  return [];
};

const unwrapStats = (payload: unknown): DashboardStats => {
  let current: unknown = payload;

  for (let index = 0; index < 3; index += 1) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      if ('data' in current) {
        current = (current as ApiEnvelope<DashboardStats>).data;
        continue;
      }
      return {
        totalRendezVous: Number((current as Partial<DashboardStats>).totalRendezVous || 0),
        rendezVousAujourdhui: Number((current as Partial<DashboardStats>).rendezVousAujourdhui || 0),
        demandesEnAttente: Number((current as Partial<DashboardStats>).demandesEnAttente || 0),
        totalPatients: Number((current as Partial<DashboardStats>).totalPatients || 0),
      };
    }
    return emptyStats;
  }

  return emptyStats;
};

const toCalendarEvent = (rdv: ApiRendezVous): CalendarEvent | null => {
  if (!rdv.date) return null;
  const date = new Date(rdv.date);
  if (Number.isNaN(date.getTime())) return null;

  const statut = normalizeStatus(rdv.statut);
  const patientName = formatFullName(rdv.patient, 'Patient');
  const medecinName = `Dr. ${formatFullName(rdv.medecin, 'Médecin')}`;

  let color: CalendarEvent['color'] = 'default';
  if (statut === 'confirme') color = 'primary';
  if (statut === 'en_attente') color = 'warning';
  if (statut === 'termine') color = 'success';

  const startTime = rdv.heure || '00:00';

  return {
    id: String(rdv.id),
    title: patientName,
    date,
    startTime,
    endTime: addThirtyMinutes(startTime),
    color,
    patient: patientName,
    medecin: medecinName,
    motif: rdv.motif || 'Consultation',
    statut,
  };
};

export const SecretaireAgenda: React.FC = () => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [demandesEnAttente, setDemandesEnAttente] = useState<PendingDemande[]>([]);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgendaData = async () => {
      setIsLoading(true);

      try {
        const [appointmentsResponse, demandesResponse, statsResponse] = await Promise.all([
          apiService.get('/secretaire/dashboard/appointments/all'),
          apiService.get('/secretaire/dashboard/demandes'),
          apiService.get('/secretaire/dashboard/stats'),
        ]);

        const appointments = unwrapAppointments(appointmentsResponse)
          .map(toCalendarEvent)
          .filter((event): event is CalendarEvent => event !== null);

        const demandes = unwrapAppointments(demandesResponse).map((rdv) => ({
          id: String(rdv.id),
          patientName: formatFullName(rdv.patient, 'Patient'),
          medecinName: `Dr. ${formatFullName(rdv.medecin, 'Médecin')}`,
          motif: rdv.motif || 'Consultation',
          datePreferee: rdv.date || new Date().toISOString(),
          heurePreferee: rdv.heure || '--:--',
        }));

        setEvents(appointments);
        setDemandesEnAttente(demandes);
        setStats(unwrapStats(statsResponse));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Impossible de charger l\'agenda';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAgendaData();
  }, []);

  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const todayEvents = useMemo(() => {
    const today = new Date();
    return events.filter((event) =>
      event.date.getDate() === today.getDate() &&
      event.date.getMonth() === today.getMonth() &&
      event.date.getFullYear() === today.getFullYear(),
    );
  }, [events]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => event.date >= new Date() && event.statut !== 'termine' && event.statut !== 'annule')
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 1),
    [events],
  );

  const confirmedCount = useMemo(() => events.filter((event) => event.statut === 'confirme').length, [events]);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays: number[] = [];

  const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  for (let i = firstDay - 1; i >= 0; i -= 1) {
    calendarDays.push(-(prevMonthDays - i));
  }

  for (let i = 1; i <= daysInMonth; i += 1) {
    calendarDays.push(i);
  }

  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i += 1) {
    calendarDays.push(-(100 + i));
  }

  const getEventsForDate = (day: number | null) => {
    if (!day || day < 0) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear(),
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">
              Bonjour, <span className="font-display">{user?.prenom || 'Secrétaire'}</span> 👋
            </h1>
            <p className="text-white/80">Gérez l'agenda et les rendez-vous des patients</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.email}`} />
              <AvatarFallback className="bg-white/20 text-white text-lg">
                {user?.prenom?.[0]}
                {user?.nom?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-health p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rendezVousAujourdhui}</p>
              <p className="text-sm text-muted-foreground">RDV aujourd'hui</p>
            </div>
          </div>
        </div>
        <div className="card-health p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.demandesEnAttente}</p>
              <p className="text-sm text-muted-foreground">Demandes</p>
            </div>
          </div>
        </div>
        <div className="card-health p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPatients}</p>
              <p className="text-sm text-muted-foreground">Patients</p>
            </div>
          </div>
        </div>
        <div className="card-health p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{confirmedCount}</p>
              <p className="text-sm text-muted-foreground">Confirmés</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <Card className="card-health shadow-lg">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 bg-muted rounded-xl p-1">
                {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                      viewMode === mode ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100',
                    )}
                  >
                    {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex gap-2">
                  <button onClick={previousMonth} className="p-2 hover:bg-primary/10 rounded-full transition-colors text-primary">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextMonth} className="p-2 hover:bg-primary/10 rounded-full transition-colors text-primary">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <Button
                onClick={() => toast.info('Utilisez l\'écran Demandes RDV pour créer ou valider un rendez-vous.')}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 shadow-md"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const absDay = day > 0 ? day : Math.abs(day);
                  const eventsForDay = getEventsForDate(day > 0 ? day : null);
                  const isCurrentMonth = day > 0;
                  const isToday =
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'min-h-[100px] p-2 rounded-xl border transition-all',
                        isCurrentMonth ? 'bg-white border-gray-100 hover:border-primary/30 hover:shadow-md' : 'bg-gray-50/50 border-transparent',
                        isToday && 'ring-2 ring-primary ring-offset-2',
                      )}
                    >
                      <div className={cn('text-sm font-medium mb-1', !isCurrentMonth && 'text-gray-400', isToday && 'text-primary font-bold')}>
                        {absDay}
                      </div>
                      <div className="space-y-1">
                        {eventsForDay.slice(0, 2).map((event) => (
                          <div key={event.id} className={cn('text-xs px-2 py-1 rounded-md border font-medium truncate', colorClasses[event.color])}>
                            {event.title}
                            <div className="text-[10px] opacity-75 mt-0.5">{event.startTime}</div>
                          </div>
                        ))}
                        {eventsForDay.length > 2 && <div className="text-xs text-gray-500 px-2">+{eventsForDay.length - 2} autres</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {upcomingEvents.length > 0 && (
            <Card className="bg-gradient-primary text-white shadow-lg rounded-2xl border-0 p-6 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">Prochain rendez-vous</h3>
                  <Badge className="bg-white/20 text-white border-0">{statusLabels[upcomingEvents[0].statut]}</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{upcomingEvents[0].patient}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Stethoscope className="h-4 w-4" />
                    <span>{upcomingEvents[0].medecin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {upcomingEvents[0].startTime} - {upcomingEvents[0].endTime}
                    </span>
                  </div>
                  <div className="text-sm">
                    {upcomingEvents[0].date.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-sm bg-white/10 rounded-lg p-2 mt-2">
                    <span className="font-medium">Motif:</span> {upcomingEvents[0].motif}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="card-health shadow-lg rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">RDV d'aujourd'hui</h3>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {todayEvents.length}
                </Badge>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {todayEvents.length > 0 ? (
                  todayEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {event.patient
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{event.patient}</p>
                            <p className="text-xs text-muted-foreground">{event.medecin}</p>
                          </div>
                        </div>
                        <Badge className={cn('text-xs', colorClasses[event.color])}>{event.startTime}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground pl-10">{event.motif}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-8">Aucun rendez-vous aujourd'hui</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="card-health shadow-lg rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Demandes en attente</h3>
                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                  {demandesEnAttente.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {demandesEnAttente.slice(0, 3).map((demande) => (
                  <div key={demande.id} className="p-3 border border-orange-100 bg-orange-50/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-orange-600" />
                      <p className="text-sm font-medium">{demande.patientName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {demande.medecinName} - {demande.motif}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(demande.datePreferee).toLocaleDateString('fr-FR')} à {demande.heurePreferee}
                    </div>
                  </div>
                ))}
                {demandesEnAttente.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">Aucune demande en attente</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {isLoading && (
        <Card className="card-health p-4">
          <p className="text-sm text-muted-foreground">Chargement de l'agenda...</p>
        </Card>
      )}
    </div>
  );
};
