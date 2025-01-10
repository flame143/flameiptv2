import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { ChevronUp, ChevronDown, Menu } from 'lucide-react';
import { Button } from './ui/button';

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
  const currentIndex = channels.findIndex(channel => channel.name === selectedChannel.name);

  const handlePrevChannel = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : channels.length - 1;
    onChannelSelect(channels[prevIndex]);
  };

  const handleNextChannel = () => {
    const nextIndex = currentIndex < channels.length - 1 ? currentIndex + 1 : 0;
    onChannelSelect(channels[nextIndex]);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* TV Remote Controls - Always visible on mobile */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 md:hidden z-50">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700/80"
          onClick={handlePrevChannel}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700/80"
          onClick={handleNextChannel}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 w-full md:w-80 h-[50vh] md:h-full bg-zinc-900/80 backdrop-blur-sm z-50 transform transition-transform duration-300 ease-in-out rounded-b-xl md:rounded-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4">
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700 text-white"
          />
        </div>

        <ScrollArea className="h-[calc(100%-5rem)]">
          <div className="grid gap-2 p-4">
            {channels.map((channel) => (
              <button
                key={channel.name}
                onClick={() => onChannelSelect(channel)}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  "hover:bg-zinc-800/50",
                  selectedChannel.name === channel.name ? "bg-zinc-800/50" : "bg-transparent"
                )}
              >
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-10 h-10 object-contain rounded"
                />
                <span className="text-white text-sm font-medium">{channel.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default Sidebar;