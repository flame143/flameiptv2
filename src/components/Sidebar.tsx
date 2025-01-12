import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { Star, StarOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export interface Channel {
  name: string;
  manifestUri?: string;
  type: string;
  clearKey?: {
    [key: string]: string;
  };
  embedUrl?: string;
  logo: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
  selectedChannel: Channel;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Sidebar = ({
  isOpen,
  onClose,
  channels,
  onChannelSelect,
  selectedChannel,
  searchQuery,
  onSearchChange,
}: SidebarProps) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteChannels');
    return saved ? JSON.parse(saved) : [];
  });

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('favoriteChannels', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (channelName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFavorites(prev => {
      if (prev.includes(channelName)) {
        return prev.filter(name => name !== channelName);
      } else {
        return [...prev, channelName];
      }
    });
  };

  // Sort channels to show favorites first
  const sortedChannels = [...channels].sort((a, b) => {
    const aIsFavorite = favorites.includes(a.name);
    const bIsFavorite = favorites.includes(b.name);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  // Filter channels based on search
  const filteredChannels = sortedChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll the selected channel into view
  useEffect(() => {
    const selectedElement = document.getElementById(`channel-${selectedChannel.name}`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedChannel.name]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 w-1/2 md:w-80 h-[70vh] md:h-full bg-[#141414]/90 backdrop-blur-sm z-50 transform transition-transform duration-300 ease-in-out rounded-b-xl md:rounded-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4">
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-400"
          />
        </div>

        <ScrollArea className="h-[calc(100%-5rem)] channel-list">
          <div className="grid gap-0.5 p-2">
            {filteredChannels.map((channel, index) => (
              <button
                key={channel.name}
                id={`channel-${channel.name}`}
                onClick={() => onChannelSelect(channel)}
                className={cn(
                  "flex items-center gap-4 p-3 w-full text-left transition-colors relative group",
                  "hover:bg-orange-500/20",
                  selectedChannel.name === channel.name ? "bg-orange-500/20" : "bg-transparent"
                )}
              >
                <span className="text-orange-500 font-bold min-w-[2rem]">{index + 1}</span>
                <span className="text-white text-sm font-medium uppercase">{channel.name}</span>
                <button
                  onClick={(e) => toggleFavorite(channel.name, e)}
                  className="absolute right-3 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {favorites.includes(channel.name) ? (
                    <Star className="w-4 h-4 fill-orange-500" />
                  ) : (
                    <StarOff className="w-4 h-4" />
                  )}
                </button>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default Sidebar;