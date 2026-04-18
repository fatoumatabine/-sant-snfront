import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  MessageSquare,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';
import { useTablePagination } from '@/hooks/useTablePagination';
import { cn } from '@/lib/utils';

interface ChatContact {
  userId: number;
  name: string;
  email: string;
  role: string;
}

interface ChatMessage {
  id: number;
  threadId: number;
  senderUserId: number;
  content: string;
  createdAt: string;
}

interface ChatMessagesPagePayload {
  messages: ChatMessage[];
  pageInfo?: {
    hasMore: boolean;
    nextBeforeMessageId: number | null;
  };
}

interface ChatThread {
  threadId: number;
  otherUser: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  unreadCount: number;
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    senderUserId: number;
  } | null;
  updatedAt: string;
}

interface ChatUiError {
  title: string;
  detail: string;
  unavailable?: boolean;
}

interface ConversationListItem {
  userId: number;
  name: string;
  email: string;
  role: string;
  threadId: number | null;
  unreadCount: number;
  lastMessage: ChatThread['lastMessage'];
  updatedAt: string | null;
  isExistingThread: boolean;
}

const roleLabels: Record<string, string> = {
  patient: 'Patient',
  medecin: 'Médecin',
  secretaire: 'Secrétaire',
  admin: 'Admin',
};

const CONVERSATIONS_PER_PAGE = 8;
const CHAT_MESSAGES_PAGE_SIZE = 20;

const unwrapData = <T,>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const normalizeChatError = (error: unknown): ChatUiError => {
  const message = error instanceof Error ? error.message : 'Impossible de charger le chat';
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('prisma') || lowerMessage.includes("chat n'est pas généré")) {
    return {
      title: 'Messagerie temporairement indisponible',
      detail:
        "Le module chat du backend n'est pas initialisé. Exécutez `npx prisma generate` puis redémarrez l'API.",
      unavailable: true,
    };
  }

  if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('network')) {
    return {
      title: 'Connexion au chat impossible',
      detail:
        "L'API de messagerie est inaccessible pour le moment. Vérifiez que le backend est démarré.",
    };
  }

  return {
    title: 'Erreur de messagerie',
    detail: message,
  };
};

const getRoleLabel = (role: string): string => roleLabels[role] || role;

const buildInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

const formatListTime = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const formatMessageTime = (value: string): string =>
  new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const mergeMessages = (existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
  const merged = new Map<number, ChatMessage>();

  [...existing, ...incoming].forEach((message) => {
    merged.set(message.id, message);
  });

  return Array.from(merged.values()).sort((a, b) => a.id - b.id);
};

export const WebChatPage = () => {
  const { user } = useAuthStore();
  const currentUserId = Number(user?.id || 0);

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasLoadedOlderMessages, setHasLoadedOlderMessages] = useState(false);
  const [messagesPageInfo, setMessagesPageInfo] = useState({
    hasMore: false,
    nextBeforeMessageId: null as number | null,
  });
  const [error, setError] = useState<ChatUiError | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollIntentRef = useRef<'bottom' | 'preserve' | null>(null);
  const prependSnapshotRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);

  const unreadCountTotal = useMemo(
    () => threads.reduce((total, thread) => total + thread.unreadCount, 0),
    [threads]
  );

  const conversationItems = useMemo(() => {
    const items = new Map<number, ConversationListItem>();

    threads.forEach((thread) => {
      items.set(thread.otherUser.id, {
        userId: thread.otherUser.id,
        name: thread.otherUser.name,
        email: thread.otherUser.email,
        role: thread.otherUser.role,
        threadId: thread.threadId,
        unreadCount: thread.unreadCount,
        lastMessage: thread.lastMessage,
        updatedAt: thread.lastMessage?.createdAt || thread.updatedAt,
        isExistingThread: true,
      });
    });

    contacts.forEach((contact) => {
      const current = items.get(contact.userId);
      items.set(contact.userId, {
        userId: contact.userId,
        name: contact.name,
        email: contact.email,
        role: contact.role,
        threadId: current?.threadId || null,
        unreadCount: current?.unreadCount || 0,
        lastMessage: current?.lastMessage || null,
        updatedAt: current?.updatedAt || null,
        isExistingThread: current?.isExistingThread || false,
      });
    });

    return Array.from(items.values()).sort((a, b) => {
      if (a.isExistingThread !== b.isExistingThread) {
        return a.isExistingThread ? -1 : 1;
      }

      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (aTime !== bTime) {
        return bTime - aTime;
      }

      return a.name.localeCompare(b.name, 'fr');
    });
  }, [contacts, threads]);

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversationItems;

    return conversationItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.role.toLowerCase().includes(term)
      );
    });
  }, [conversationItems, searchTerm]);

  const {
    currentPage: conversationPage,
    totalPages: conversationTotalPages,
    totalItems: conversationTotalItems,
    startItem: conversationStartItem,
    endItem: conversationEndItem,
    paginatedData: paginatedConversations,
    setCurrentPage: setConversationPage,
  } = useTablePagination(filteredConversations, { itemsPerPage: CONVERSATIONS_PER_PAGE });

  const refreshThreads = useCallback(async () => {
    const response = await apiService.get(API_ENDPOINTS.chat.threads);
    setThreads(unwrapData<ChatThread[]>(response) || []);
  }, []);

  const refreshContacts = useCallback(async () => {
    const response = await apiService.get(API_ENDPOINTS.chat.contacts);
    setContacts(unwrapData<ChatContact[]>(response) || []);
  }, []);

  const fetchMessagesPage = useCallback(async (threadId: number, beforeMessageId?: number | null) => {
    const query = new URLSearchParams({
      limit: String(CHAT_MESSAGES_PAGE_SIZE),
    });

    if (beforeMessageId) {
      query.set('beforeMessageId', String(beforeMessageId));
    }

    const response = await apiService.get(
      `${API_ENDPOINTS.chat.messages(String(threadId))}?${query.toString()}`
    );

    return (
      unwrapData<ChatMessagesPagePayload>(response) || {
        messages: [],
        pageInfo: { hasMore: false, nextBeforeMessageId: null },
      }
    );
  }, []);

  const loadMessages = useCallback(
    async (threadId: number) => {
      setIsLoadingMessages(true);
      try {
        const payload = await fetchMessagesPage(threadId);
        setMessages(payload.messages || []);
        setMessagesPageInfo({
          hasMore: payload.pageInfo?.hasMore ?? false,
          nextBeforeMessageId: payload.pageInfo?.nextBeforeMessageId ?? null,
        });
        setHasLoadedOlderMessages(false);
        scrollIntentRef.current = 'bottom';
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [fetchMessagesPage]
  );

  const loadOlderMessages = useCallback(async () => {
    if (!selectedThread || !messagesPageInfo.nextBeforeMessageId || isLoadingOlderMessages) return;

    const container = messagesContainerRef.current;
    if (container) {
      prependSnapshotRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      };
      scrollIntentRef.current = 'preserve';
    }

    setIsLoadingOlderMessages(true);

    try {
      const payload = await fetchMessagesPage(selectedThread.threadId, messagesPageInfo.nextBeforeMessageId);
      setMessages((current) => mergeMessages(payload.messages || [], current));
      setMessagesPageInfo({
        hasMore: payload.pageInfo?.hasMore ?? false,
        nextBeforeMessageId: payload.pageInfo?.nextBeforeMessageId ?? null,
      });
      setHasLoadedOlderMessages(true);
    } catch (err) {
      setError(normalizeChatError(err));
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [fetchMessagesPage, isLoadingOlderMessages, messagesPageInfo.nextBeforeMessageId, selectedThread]);

  const refreshSelectedThreadMessages = useCallback(
    async (threadId: number) => {
      const payload = await fetchMessagesPage(threadId);

      if (hasLoadedOlderMessages) {
        setMessages((current) => mergeMessages(current, payload.messages || []));
        return;
      }

      setMessages(payload.messages || []);
      setMessagesPageInfo({
        hasMore: payload.pageInfo?.hasMore ?? false,
        nextBeforeMessageId: payload.pageInfo?.nextBeforeMessageId ?? null,
      });
    },
    [fetchMessagesPage, hasLoadedOlderMessages]
  );

  const initializeChat = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const results = await Promise.allSettled([refreshContacts(), refreshThreads()]);
      const rejected = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected'
      );

      if (rejected) {
        setError(normalizeChatError(rejected.reason));
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshContacts, refreshThreads]);

  const openConversation = useCallback(
    async (item: ConversationListItem) => {
      try {
        setError(null);
        setDraft('');

        if (item.threadId) {
          const existingThread = threads.find((thread) => thread.threadId === item.threadId);
          if (existingThread) {
            setSelectedThread(existingThread);
            await loadMessages(existingThread.threadId);
            return;
          }
        }

        const response = await apiService.post(API_ENDPOINTS.chat.openDirect(String(item.userId)), {});
        const payload = unwrapData<{
          thread: ChatThread;
          messages: ChatMessage[];
          pageInfo?: ChatMessagesPagePayload['pageInfo'];
        }>(response);
        if (!payload?.thread) return;

        setSelectedThread(payload.thread);
        setMessages(payload.messages || []);
        setMessagesPageInfo({
          hasMore: payload.pageInfo?.hasMore ?? false,
          nextBeforeMessageId: payload.pageInfo?.nextBeforeMessageId ?? null,
        });
        setHasLoadedOlderMessages(false);
        scrollIntentRef.current = 'bottom';
        await refreshThreads();
      } catch (err) {
        setError(normalizeChatError(err));
      }
    },
    [loadMessages, refreshThreads, threads]
  );

  useEffect(() => {
    void initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    if (!selectedThread && threads.length > 0) {
      const firstThread = threads[0];
      setSelectedThread(firstThread);
      void loadMessages(firstThread.threadId);
      return;
    }

    if (!selectedThread) return;

    const refreshedThread = threads.find((thread) => thread.threadId === selectedThread.threadId);
    if (refreshedThread) {
      setSelectedThread((current) =>
        current?.threadId === refreshedThread.threadId ? refreshedThread : current
      );
    }
  }, [threads, selectedThread, loadMessages]);

  useEffect(() => {
    if (!selectedThread) return;

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          await refreshSelectedThreadMessages(selectedThread.threadId);
          await refreshThreads();
        } catch (err) {
          setError(normalizeChatError(err));
        }
      })();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [selectedThread, refreshSelectedThreadMessages, refreshThreads]);

  useEffect(() => {
    if (scrollIntentRef.current === 'bottom') {
      const animationFrameId = window.requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        scrollIntentRef.current = null;
      });

      return () => window.cancelAnimationFrame(animationFrameId);
    }

    if (scrollIntentRef.current === 'preserve' && prependSnapshotRef.current && messagesContainerRef.current) {
      const snapshot = prependSnapshotRef.current;
      const container = messagesContainerRef.current;
      const animationFrameId = window.requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - snapshot.scrollHeight + snapshot.scrollTop;
        scrollIntentRef.current = null;
        prependSnapshotRef.current = null;
      });

      return () => window.cancelAnimationFrame(animationFrameId);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedThread || !draft.trim() || isSending) return;

    try {
      setIsSending(true);
      setError(null);
      await apiService.post(API_ENDPOINTS.chat.messages(String(selectedThread.threadId)), {
        content: draft.trim(),
      });
      setDraft('');
      scrollIntentRef.current = 'bottom';
      await refreshSelectedThreadMessages(selectedThread.threadId);
      await refreshThreads();
    } catch (err) {
      setError(normalizeChatError(err));
    } finally {
      setIsSending(false);
    }
  };

  const isChatUnavailable = Boolean(error?.unavailable);

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Chargement du chat...</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card-health border border-primary/20 bg-primary/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <MessageSquare className="h-6 w-6 text-primary" />
              Chat interne
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Une messagerie plus claire pour retrouver vos conversations, vos contacts et vos
              réponses au même endroit.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {threads.length} conversation(s)
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {contacts.length} contact(s)
            </Badge>
            <Badge className="rounded-full px-3 py-1">{unreadCountTotal} non lu(s)</Badge>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">{error.title}</p>
                <p className="mt-1 text-destructive/90">{error.detail}</p>
              </div>
            </div>
            <Button onClick={() => void initializeChat()} variant="outline" className="gap-2 self-start">
              <RefreshCcw className="h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </div>
      )}

      <div className="grid min-h-[620px] grid-cols-1 gap-5 xl:h-[calc(100vh-15rem)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="card-health flex h-full min-h-0 flex-col overflow-hidden p-0">
          <div className="border-b border-border/80 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
                <p className="text-sm text-muted-foreground">
                  Fils actifs d&apos;abord, puis les autres contacts disponibles.
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setConversationPage(1);
                }}
                placeholder="Rechercher un nom, un rôle ou un email..."
                className="h-12 rounded-2xl border-border/80 pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <div className="space-y-2">
              {paginatedConversations.map((item) => {
                const isActive = selectedThread?.otherUser.id === item.userId;

                return (
                  <button
                    key={item.userId}
                    type="button"
                    onClick={() => void openConversation(item)}
                    disabled={isChatUnavailable}
                    className={cn(
                      'w-full rounded-2xl border px-4 py-4 text-left transition-all',
                      'hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60',
                      isActive
                        ? 'border-primary/40 bg-primary/8 shadow-[0_16px_36px_-24px_rgba(7,172,160,0.45)]'
                        : 'border-border/80 bg-background'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">
                        {buildInitials(item.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{item.name}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {getRoleLabel(item.role)} • {item.email}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {item.updatedAt ? (
                              <span className="text-[11px] text-muted-foreground">
                                {formatListTime(item.updatedAt)}
                              </span>
                            ) : null}
                            {item.unreadCount > 0 ? (
                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
                                {item.unreadCount}
                              </span>
                            ) : !item.isExistingThread ? (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                Nouveau
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <p className="mt-2 truncate text-sm text-muted-foreground">
                          {item.lastMessage?.content || 'Aucune conversation démarrée pour le moment.'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredConversations.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-5 py-10 text-center">
                  <p className="font-medium text-foreground">Aucun résultat</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Essaie un autre nom, rôle ou email.
                  </p>
                </div>
              )}
            </div>
          </div>

          {conversationTotalPages > 1 ? (
            <div className="border-t border-border/80 px-4 py-3">
              <TablePaginationControls
                currentPage={conversationPage}
                totalPages={conversationTotalPages}
                totalItems={conversationTotalItems}
                startItem={conversationStartItem}
                endItem={conversationEndItem}
                onPageChange={setConversationPage}
                className="mt-0"
              />
            </div>
          ) : null}
        </div>

        <div className="card-health flex h-full min-h-0 flex-col overflow-hidden p-0">
          {!selectedThread ? (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(12,119,121,0.10),transparent_45%)] px-6 py-10">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-foreground">
                  Choisissez une conversation
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  La colonne de gauche regroupe vos fils déjà actifs et les autres contacts que vous
                  pouvez joindre. Ouvrez un contact pour afficher l&apos;historique et envoyer un message.
                </p>
                <div className="mt-6 grid gap-3 text-left">
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
                    <p className="font-medium text-foreground">1. Repérez le bon contact</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Recherchez un patient, un médecin, une secrétaire ou un administrateur.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
                    <p className="font-medium text-foreground">2. Ouvrez le fil</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Les conversations existantes remontent en premier pour éviter de repartir de zéro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-border/80 bg-background/95 px-5 py-4 backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">
                      {buildInitials(selectedThread.otherUser.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedThread.otherUser.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedThread.otherUser.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {getRoleLabel(selectedThread.otherUser.role)}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {messages.length} message(s)
                    </Badge>
                  </div>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(7,172,160,0.05),transparent_22%),linear-gradient(0deg,rgba(15,23,42,0.02),rgba(15,23,42,0.02))] px-4 py-5 md:px-6"
              >
                <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-border/70 bg-background/85 px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Historique paginé</p>
                    <p className="text-xs text-muted-foreground">
                      {messages.length} message(s) chargé(s)
                      {messagesPageInfo.hasMore
                        ? ' • les plus anciens peuvent être chargés à la demande'
                        : ' • début de la conversation atteint'}
                    </p>
                  </div>

                  {messagesPageInfo.hasMore ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void loadOlderMessages()}
                      disabled={isLoadingOlderMessages}
                      className="rounded-2xl"
                    >
                      {isLoadingOlderMessages ? 'Chargement...' : 'Afficher les messages précédents'}
                    </Button>
                  ) : null}
                </div>

                {isLoadingMessages ? (
                  <div className="flex h-full min-h-[320px] items-center justify-center">
                    <div className="max-w-sm rounded-3xl border border-dashed border-border/80 bg-background/85 p-8 text-center">
                      <p className="text-lg font-semibold text-foreground">Chargement de la conversation</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        Nous préparons les derniers messages pour un affichage plus clair.
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full min-h-[320px] items-center justify-center">
                    <div className="max-w-sm rounded-3xl border border-dashed border-border/80 bg-background/85 p-8 text-center">
                      <p className="text-lg font-semibold text-foreground">
                        Conversation prête à démarrer
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        Envoie un premier message à {selectedThread.otherUser.name} pour lancer
                        l&apos;échange.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const mine = message.senderUserId === currentUserId;

                      return (
                        <div
                          key={message.id}
                          className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[82%] rounded-[1.5rem] px-4 py-3 shadow-sm',
                              mine
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border/70 bg-white text-foreground'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.content}
                            </p>
                            <p
                              className={cn(
                                'mt-2 text-[11px]',
                                mine ? 'text-primary-foreground/75' : 'text-muted-foreground'
                              )}
                            >
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-border/80 bg-background px-4 py-4 md:px-5">
                <div className="rounded-[1.75rem] border border-border/80 bg-muted/20 p-2">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                      placeholder={`Écrire à ${selectedThread.otherUser.name}...`}
                      disabled={isChatUnavailable}
                      className="min-h-[64px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />

                    <Button
                      onClick={() => void handleSendMessage()}
                      disabled={!draft.trim() || isSending || isChatUnavailable}
                      className="h-12 rounded-2xl px-5"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
