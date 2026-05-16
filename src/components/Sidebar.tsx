import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { Star, StarOff, X } from 'lucide-react';
import { Button } from './ui/button';

export interface Channel {
  id?: string;
  name: string;
  manifestUri?: string;
  type: string;
  clearKey?: {
    [key: string]: string;
  };
  embedUrl?: string;
  logo: string;
  proxyUrl?: string;
  userAgent?: string;
  referrer?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
  selectedChannel: Channel;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favorites?: string[];
  onToggleFavorite: (channelName: string) => void;
}

const Sidebar = ({
  isOpen,
  onClose,
  channels,
  onChannelSelect,
  selectedChannel,
  searchQuery,
  onSearchChange,
  favorites = [],
  onToggleFavorite,
}: SidebarProps) => {
  return (
    <>
      {/* Backdrop (Para sa Mobile Overlay mode kapag naka-open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full bg-zinc-950/95 md:bg-zinc-950 border-r border-zinc-900 z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          // MOBILE: w-full (buong screen). DESKTOP: w-80 (docked fixed layout)
          "w-full md:w-80", 
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header ng Sidebar - May 'Close' button kapag nasa Mobile view */}
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between gap-2 shrink-0">
          <div className="flex flex-col">
            <span className="text-orange-500 font-extrabold tracking-wider text-sm uppercase">FlameIPTV</span>
            <span className="text-zinc-500 text-[10px]">Channel Guide Panel</span>
          </div>
          
          {/* Sasarado lang 'to sa mobile view kapag pinindot ang X */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-zinc-400 hover:text-white" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar Wrapper */}
        <div className="p-4 border-b border-zinc-900 shrink-0">
          <Input
            placeholder="Maghanap ng channel..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 text-sm h-10 focus-visible:ring-orange-500/50"
          />
        </div>

        {/* Channel Scroll List */}
        <ScrollArea className="flex-1 channel-list">
          <div className="grid gap-1 p-2">
            {channels.map((channel, index) => {
              const isSelected = selectedChannel?.name === channel.name;
              return (
                <button
                  key={channel.name}
                  id={`channel-${channel.name}`}
                  onClick={() => {
                    onChannelSelect(channel);
                    // Awtomatikong isasara ang drawer sa mobile view pagkapili ng channel
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={cn(
                    "flex items-center gap-4 p-3.5 w-full text-left transition-all rounded-lg relative group overflow-hidden border",
                    isSelected 
                      ? "bg-orange-500/10 border-orange-500/30 text-white shadow-lg" 
                      : "bg-transparent border-transparent hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {/* Left Accent indicator for active channel */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
                  )}

                  <span className={cn(
                    "font-mono font-bold text-xs min-w-[1.5rem] text-center",
                    isSelected ? "text-orange-500" : "text-zinc-600"
                  )}>
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="text-sm font-semibold uppercase tracking-wide truncate pr-8">
                    {channel.name}
                  </span>

                  {/* Favorite Trigger Icon Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(channel.name);
                    }}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all",
                      favorites.includes(channel.name)
                        ? "text-orange-500 opacity-100"
                        : "text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-400"
                    )}
                  >
                    {favorites.includes(channel.name) ? (
                      <Star className="w-4 h-4 fill-orange-500" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </button>
                </button>
              );
            })}

            {channels.length === 0 && (
              <div className="text-center py-8 text-zinc-600 text-xs">
                Walang nahanap na channel...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default Sidebar;