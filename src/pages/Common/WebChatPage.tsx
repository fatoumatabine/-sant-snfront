import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, MessageSquare, RefreshCcw, Search, Send } from 'lucide-react';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      detail: "Le module chat du backend n'est pas initialisé. Exécutez `npx prisma generate` puis redémarrez l'API.",
      unavailable: true,
    };
  }

  if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('network')) {
    return {
      title: 'Connexion au chat impossible',
      detail: "L'API de messagerie est inaccessible pour le moment. Vérifiez que le backend est démarré.",
    };
  }

  return {
    title: 'Erreur de messagerie',
    detail: message,
  };
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
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<ChatUiError | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const threadByUserId = useMemo(() => {
    const map = new Map<number, ChatThread>();
    threads.forEach((thread) => {
      map.set(thread.otherUser.id, thread);
    });
    return map;
  }, [threads]);

  const filteredContacts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(term) ||
        contact.email.toLowerCase().includes(term) ||
        contact.role.toLowerCase().includes(term)
      );
    });
  }, [contacts, searchTerm]);

  const refreshThreads = useCallback(async () => {
    const response = await apiService.get(API_ENDPOINTS.chat.threads);
    setThreads(unwrapData<ChatThread[]>(response) || []);
  }, []);

  const refreshContacts = useCallback(async () => {
    const response = await apiService.get(API_ENDPOINTS.chat.contacts);
    setContacts(unwrapData<ChatContact[]>(response) || []);
  }, []);

  const loadMessages = useCallback(async (threadId: number) => {
    const response = await apiService.get(API_ENDPOINTS.chat.messages(String(threadId)));
    const payload = unwrapData<{ messages: ChatMessage[] }>(response);
    setMessages(payload?.messages || []);
  }, []);

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
    async (otherUserId: number) => {
      try {
        setError(null);
        const response = await apiService.post(API_ENDPOINTS.chat.openDirect(String(otherUserId)), {});
        const payload = unwrapData<{ thread: ChatThread; messages: ChatMessage[] }>(response);
        if (!payload?.thread) return;

        setSelectedThread(payload.thread);
        setMessages(payload.messages || []);
        await refreshThreads();
      } catch (err) {
        setError(normalizeChatError(err));
      }
    },
    [refreshThreads]
  );

  useEffect(() => {
    void initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    if (!selectedThread) return;

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          await loadMessages(selectedThread.threadId);
          await refreshThreads();
        } catch (err) {
          setError(normalizeChatError(err));
        }
      })();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [selectedThread, loadMessages, refreshThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      await loadMessages(selectedThread.threadId);
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
    <div className="space-y-4 animate-fade-in">
      <div className="card-health border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MessageSquare className="h-6 w-6" />
          Chat interne
        </h1>
        <p className="text-sm text-muted-foreground">
          Messagerie interne sécurisée entre utilisateurs de la plateforme
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
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

      <div className="grid min-h-[620px] grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-health flex flex-col lg:col-span-1">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher un contact..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2 overflow-y-auto pr-1">
            {filteredContacts.map((contact) => {
              const thread = threadByUserId.get(contact.userId);
              const isActive = selectedThread?.otherUser.id === contact.userId;
              const unread = thread?.unreadCount || 0;

              return (
                <button
                  key={contact.userId}
                  type="button"
                  onClick={() => void openConversation(contact.userId)}
                  disabled={isChatUnavailable}
                  className={cn(
                    'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                    'hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60',
                    isActive ? 'border-primary bg-primary/5' : 'border-border bg-background'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{contact.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {contact.role} • {contact.email}
                      </p>
                      {thread?.lastMessage && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {thread.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {unread > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                        {unread}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredContacts.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucun contact disponible</p>
            )}
          </div>
        </div>

        <div className="card-health flex flex-col lg:col-span-2">
          {!selectedThread ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Sélectionnez un contact pour commencer la conversation.
            </div>
          ) : (
            <>
              <div className="mb-3 border-b border-border pb-3">
                <p className="font-semibold">{selectedThread.otherUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedThread.otherUser.role} • {selectedThread.otherUser.email}
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => {
                  const mine = message.senderUserId === currentUserId;
                  return (
                    <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                          mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p
                          className={cn(
                            'mt-1 text-[11px]',
                            mine ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          )}
                        >
                          {new Date(message.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Écrire un message..."
                  disabled={isChatUnavailable}
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={!draft.trim() || isSending || isChatUnavailable}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
