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
            {channels.map((channel, index) => (
              <button
                key={channel.name}
                onClick={() => onChannelSelect(channel)}
                className={cn(
                  "flex items-center gap-4 p-3 w-full text-left transition-colors",
                  "hover:bg-orange-500/20",
                  selectedChannel.name === channel.name ? "bg-orange-500/20" : "bg-transparent"
                )}
              >
                <span className="text-orange-500 font-bold min-w-[2rem]">{index + 1}</span>
                <span className="text-white text-sm font-medium uppercase">{channel.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default Sidebar;