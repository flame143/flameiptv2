import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { Search, ChevronDown, Monitor, Shield, LogIn } from 'lucide-react';
import { useState } from 'react';

export interface Channel {
  id: string;
  name: string;
  manifestUri?: string;
  type: string;
  clearKey?: { [key: string]: string };
  embedUrl?: string;
  logo: string;
  proxyUrl?: string;
  userAgent?: string;
  referrer?: string;
  category?: string;
}

interface SidebarProps {
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
  selectedChannel: Channel | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAdminClick: () => void;
}

const Sidebar = ({
  channels,
  onChannelSelect,
  selectedChannel,
  searchQuery,
  onSearchChange,
  onAdminClick,
}: SidebarProps) => {
  const categories = Array.from(new Set(channels.map(c => c.category || 'General')));
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filtered = channels.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full bg-[#121418] border-l border-white/5 flex flex-col shrink-0 overflow-hidden">
      {/* Category Dropdown */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <select 
            className="w-full bg-[#1a1c22] border-none text-white text-sm font-bold h-12 px-4 rounded-xl appearance-none cursor-pointer focus:ring-1 focus:ring-primary/50"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search channel..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-[#1a1c22] border-none text-white h-12 pl-12 rounded-xl placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
      </div>

      {/* Channel List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filtered.map((channel) => {
            const isSelected = selectedChannel?.id === channel.id;
            return (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={cn(
                  "flex items-center justify-between px-6 py-4 transition-all border-b border-white/5 group text-left",
                  isSelected 
                    ? "bg-primary text-black font-black" 
                    : "hover:bg-white/5 text-zinc-400"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Monitor className={cn("w-4 h-4 shrink-0", isSelected ? "text-black" : "text-zinc-600")} />
                  <span className="truncate text-sm uppercase tracking-wide">{channel.name}</span>
                </div>
                
                <div className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                  isSelected ? "bg-black/20 text-black" : "bg-white/5 text-zinc-600 group-hover:text-zinc-400"
                )}>
                  {channel.type === 'dash' ? 'DASH' : 'M3U8'}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Branding with Login/Admin Button */}
      <div 
        onClick={onAdminClick}
        className="p-4 bg-[#0a0b0e] border-t border-white/5 flex items-center justify-between cursor-pointer group hover:bg-[#1a1c22] transition-colors"
      >
        <div className="flex items-center gap-2">
           <Shield className="w-4 h-4 text-zinc-700 group-hover:text-primary transition-colors" />
           <span className="text-[10px] font-black text-zinc-700 group-hover:text-primary uppercase tracking-widest transition-colors">Admin Dashboard</span>
        </div>
        <LogIn className="w-4 h-4 text-zinc-700 group-hover:text-primary transition-colors" />
      </div>
    </aside>
  );
};

export default Sidebar;