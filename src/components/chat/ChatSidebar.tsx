import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Sparkles,
  Search,
  Pin,
  Folder,
  Users,
  Archive,
  Image as ImageIcon,
  FileText,
  Bot,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';
import { ConversationSearch } from './ConversationSearch';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSearchTrigger?: (fn: () => void) => void;
}

type SectionKey = 'pinned' | 'recent' | 'tools';

export function ChatSidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onSearchTrigger,
}: ChatSidebarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    pinned: true,
    recent: true,
    tools: true,
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    onSearchTrigger?.(() => setShowSearch(true));
  }, [onSearchTrigger]);

  const { pinned, recent } = useMemo(() => {
    // Pinned metadata isn't in Conversation type; treat first 2 as pinned-visual placeholder only if none marked
    const pin = conversations.filter((c) => (c as unknown as { pinned?: boolean }).pinned);
    const rest = conversations.filter((c) => !(c as unknown as { pinned?: boolean }).pinned);
    return { pinned: pin, recent: rest };
  }, [conversations]);

  const toggle = (k: SectionKey) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  const initials =
    (user?.email?.[0] || 'E').toUpperCase();

  const tools = [
    { icon: ImageIcon, label: 'Images', onClick: () => {} },
    { icon: FileText,  label: 'Files',  onClick: () => navigate('/knowledge') },
    { icon: Bot,       label: 'Agents', onClick: () => {} },
    { icon: History,   label: 'History', onClick: () => setShowSearch(true) },
  ];

  return (
    <aside className="w-72 h-full flex flex-col glass border-r border-border/50 relative">
      {showSearch && (
        <ConversationSearch
          conversations={conversations}
          onSelectConversation={(id) => {
            onSelectConversation(id);
            setShowSearch(false);
          }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Brand */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-emerald-400 to-teal-400 flex items-center justify-center glow-sm">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-base gradient-text truncate">EGreedAI</h1>
            <p className="text-[11px] text-muted-foreground truncate">Assistant · Ready</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 h-10 rounded-xl bg-primary/10 hover:bg-primary/15 text-foreground border border-primary/25 hover:border-primary/50 transition-all"
          variant="outline"
        >
          <Plus className="w-4 h-4 text-primary" />
          <span>New chat</span>
          <span className="ml-auto text-[10px] text-muted-foreground opacity-70">⌘⇧N</span>
        </Button>

        <button
          onClick={() => setShowSearch(true)}
          className="w-full h-9 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/50 flex items-center gap-2 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search conversations</span>
          <span className="ml-auto text-[10px] opacity-70">⌘K</span>
        </button>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3 space-y-4">
        {pinned.length > 0 && (
          <Section
            label="Pinned"
            icon={Pin}
            openState={open.pinned}
            onToggle={() => toggle('pinned')}
          >
            {pinned.map((conv) => (
              <ConvRow
                key={conv.id}
                conv={conv}
                active={activeConversationId === conv.id}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
              />
            ))}
          </Section>
        )}

        <Section
          label="Recent"
          icon={MessageSquare}
          openState={open.recent}
          onToggle={() => toggle('recent')}
        >
          {recent.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p>No conversations yet</p>
            </div>
          ) : (
            recent.map((conv) => (
              <ConvRow
                key={conv.id}
                conv={conv}
                active={activeConversationId === conv.id}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
              />
            ))
          )}
        </Section>

        <Section
          label="Workspace"
          icon={Folder}
          openState={open.tools}
          onToggle={() => toggle('tools')}
        >
          <div className="grid grid-cols-2 gap-1.5 px-1">
            {tools.map((t) => (
              <button
                key={t.label}
                onClick={t.onClick}
                className="group flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/60 border border-transparent hover:border-border/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-2 px-1 space-y-0.5">
            <MiniRow icon={Users} label="Shared" />
            <MiniRow icon={Archive} label="Archive" />
            <MiniRow icon={Trash2} label="Trash" />
          </div>
        </Section>
      </div>

      {/* Bottom profile */}
      <div className="p-3 border-t border-border/50 space-y-2">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 border border-transparent hover:border-border/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-primary-foreground text-sm font-semibold">
            {user ? initials : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-foreground truncate">
              {user?.email ?? 'Guest'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Free plan · 240 MB
            </p>
          </div>
          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {/* Storage bar */}
        <div className="px-2">
          <div className="h-1 rounded-full bg-secondary overflow-hidden">
            <div className="h-full w-[24%] bg-gradient-to-r from-primary to-teal-400" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Powered by Egreed Technology
          </p>
        </div>
      </div>
    </aside>
  );
}

function Section({
  label,
  icon: Icon,
  openState,
  onToggle,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  openState: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        {openState ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Icon className="w-3 h-3" />
        {label}
      </button>
      {openState && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

function ConvRow({
  conv,
  active,
  onSelect,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onSelect(conv.id)}
      className={cn(
        'group relative flex items-center gap-2 pl-3 pr-1.5 py-2 rounded-lg cursor-pointer transition-all duration-200',
        active
          ? 'bg-primary/12 border border-primary/25 shadow-sm shadow-primary/5'
          : 'hover:bg-secondary/60 border border-transparent'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
      )}
      <MessageSquare className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
      <span className={cn('flex-1 truncate text-sm', active ? 'text-foreground' : 'text-foreground/85')}>
        {conv.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conv.id);
        }}
        className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/15 hover:text-destructive text-muted-foreground"
        aria-label="Delete conversation"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function MiniRow({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/60 text-xs text-muted-foreground hover:text-foreground transition-colors">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
