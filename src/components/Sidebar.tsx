import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';

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
          "fixed top-0 left-0 w-full md:w-80 h-[70vh] md:h-full bg-zinc-900/80 backdrop-blur-sm z-50 transform transition-transform duration-300 ease-in-out rounded-b-xl md:rounded-none",
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