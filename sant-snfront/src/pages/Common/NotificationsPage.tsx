import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  Trash2,
  Calendar,
  Filter,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useNotificationStore } from '@/store/notificationStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApiMutationRefresh } from '@/hooks/useApiMutationRefresh';

type ReadFilter = 'all' | 'unread' | 'read';
type DateFilter = 'all' | 'today' | '7d' | '30d';

const ITEMS_PER_PAGE = 8;

const isDateInRange = (dateValue: string, range: DateFilter) => {
  if (range === 'all') return true;

  const itemDate = new Date(dateValue);
  if (Number.isNaN(itemDate.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === 'today') {
    return itemDate >= startOfToday;
  }

  const days = range === '7d' ? 7 : 30;
  const threshold = new Date(startOfToday);
  threshold.setDate(threshold.getDate() - days);
  return itemDate >= threshold;
};

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications().catch(() => {});
    fetchUnreadCount().catch(() => {});
  }, [fetchNotifications, fetchUnreadCount]);

  useApiMutationRefresh(refreshNotifications, 250);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, readFilter, dateFilter]);

  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        query.length === 0 ||
        notification.titre.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query);

      const matchesRead =
        readFilter === 'all' ||
        (readFilter === 'read' && notification.lu) ||
        (readFilter === 'unread' && !notification.lu);

      const matchesDate = isDateInRange(notification.date, dateFilter);

      return matchesSearch && matchesRead && matchesDate;
    });
  }, [notifications, searchTerm, readFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  const readCount = notifications.length - unreadCount;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t('notifications.title')}</h1>
            <p className="text-white/90 mt-2">{t('notifications.subtitle')}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full md:w-auto"
            onClick={async () => {
              await markAllAsRead();
              await fetchUnreadCount();
            }}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {t('notifications.markAllRead')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-health p-4 border border-primary/10">
          <p className="text-sm text-muted-foreground">{t('notifications.total')}</p>
          <p className="text-2xl font-bold mt-1">{notifications.length}</p>
        </div>
        <div className="card-health p-4 border border-green-200 bg-green-50/80">
          <p className="text-sm text-green-700">{t('notifications.read')}</p>
          <p className="text-2xl font-bold mt-1 text-green-700">{readCount}</p>
        </div>
        <div className="card-health p-4 border border-orange-200 bg-orange-50/80">
          <p className="text-sm text-orange-700">{t('notifications.unread')}</p>
          <p className="text-2xl font-bold mt-1 text-orange-700">{unreadCount}</p>
        </div>
      </div>

      <div className="card-health p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Filter className="h-4 w-4" />
          <span>{t('common.filter')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
              className="pl-10"
            />
          </div>

          <Select value={readFilter} onValueChange={(value) => setReadFilter(value as ReadFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('notifications.all')}</SelectItem>
              <SelectItem value="unread">{t('notifications.unread')}</SelectItem>
              <SelectItem value="read">{t('notifications.read')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('notifications.allDates')}</SelectItem>
              <SelectItem value="today">{t('notifications.today')}</SelectItem>
              <SelectItem value="7d">{t('notifications.last7Days')}</SelectItem>
              <SelectItem value="30d">{t('notifications.last30Days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {t('notifications.itemsFound', { count: filteredNotifications.length })}
        </div>
      </div>

      <div className="card-health overflow-hidden">
        {isLoading ? (
          <div className="py-14 text-center text-muted-foreground">{t('notifications.loading')}</div>
        ) : paginatedNotifications.length === 0 ? (
          <div className="py-14 text-center px-6">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 font-medium">{t('notifications.empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 md:p-5 transition-colors hover:bg-muted/30 ${notification.lu ? '' : 'bg-primary/5'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-base">{notification.titre}</h3>
                      <Badge variant={notification.lu ? 'outline' : 'default'}>
                        {notification.lu ? t('notifications.read') : t('notifications.unread')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {notification.date}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!notification.lu && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await markAsRead(notification.id);
                          await fetchUnreadCount();
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t('notifications.markRead')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        await deleteNotification(notification.id);
                        await fetchUnreadCount();
                      }}
                      title={t('notifications.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          {t('notifications.pageInfo', { page: currentPage, total: totalPages })}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            {t('common.previous')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  );
};
