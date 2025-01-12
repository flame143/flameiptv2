import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { Star } from 'lucide-react';
import type { Channel } from './Sidebar';

interface FavoritesMenuProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  selectedChannel: Channel;
  onChannelSelect: (channel: Channel) => void;
  onToggleFavorite: (channelName: string) => void;
  favorites?: string[];
}

const FavoritesMenu = ({
  isOpen,
  onClose,
  channels,
  selectedChannel,
  onChannelSelect,
  onToggleFavorite,
  favorites = [], // Add default empty array
}: FavoritesMenuProps) => {
  // Only show channels that are in favorites
  const favoriteChannels = channels.filter(channel => favorites.includes(channel.name));

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Favorites Menu */}
      <div
        className={cn(
          "fixed top-0 right-0 w-1/2 md:w-80 h-[70vh] md:h-full bg-[#141414]/90 backdrop-blur-sm z-50 transform transition-transform duration-300 ease-in-out rounded-b-xl md:rounded-none",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4">
          <h2 className="text-white text-lg font-bold">Favorite Channels</h2>
        </div>

        <ScrollArea className="h-[calc(100%-5rem)] channel-list">
          <div className="grid gap-0.5 p-2">
            {favoriteChannels.map((channel, index) => (
              <button
                key={channel.name}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(channel.name);
                  }}
                  className="absolute right-3 text-orange-500"
                >
                  <Star className="w-4 h-4 fill-orange-500" />
                </button>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default FavoritesMenu;