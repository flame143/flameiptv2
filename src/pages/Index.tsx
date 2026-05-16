import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import Sidebar, { Channel } from '../components/Sidebar';
import FavoritesMenu from '../components/FavoritesMenu';
import { Button } from '../components/ui/button';
import { Menu, Shield, Star, Tv } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const mapRow = (r: any): Channel => ({
  id: r.id,
  name: r.name,
  manifestUri: r.manifest_uri || undefined,
  type: r.type,
  clearKey: r.clear_key || undefined,
  embedUrl: r.embed_url || undefined,
  logo: r.logo || '',
  proxyUrl: r.proxy_url || undefined,
  userAgent: r.user_agent || undefined,
  referrer: r.referrer || undefined,
});

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  // GINAWANG TRUE ANG DEFAULT: Naka-open at docked agad ang playlist sa desktop setup
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteChannels');
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('sort_order', { ascending: true })
        .limit(1000);
      if (error) {
        toast({ description: error.message, variant: 'destructive' });
        return;
      }
      const mapped = (data || []).map(mapRow);
      setChannels(mapped);
      if (mapped.length) setSelectedChannel(mapped[0]);
    })();
  }, []);

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChannelChange = (direction: 'up' | 'down') => {
    if (!selectedChannel || !channels.length) return;
    const currentIndex = channels.findIndex(c => c.name === selectedChannel.name);
    const newIndex = direction === 'up'
      ? (currentIndex > 0 ? currentIndex - 1 : channels.length - 1)
      : (currentIndex < channels.length - 1 ? currentIndex + 1 : 0);
    setSelectedChannel(channels[newIndex]);
    toast({ description: `Switched to ${channels[newIndex].name}`, duration: 2000 });
  };

  const toggleFavorite = (channelName: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(channelName)
        ? prev.filter(name => name !== channelName)
        : [...prev, channelName];
      localStorage.setItem('favoriteChannels', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp': handleChannelChange('up'); break;
        case 'ArrowDown': handleChannelChange('down'); break;
        case 'Enter': setIsSidebarOpen(v => !v); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChannel, channels]);

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex overflow-hidden font-sans">
      
      {/* 1. SIDEBAR DOCKING LAYER */}
      {selectedChannel && (
        <div 
          className={`transition-all duration-300 ease-in-out shrink-0 relative overflow-hidden h-full z-40 border-r border-zinc-900 bg-zinc-950
            ${isSidebarOpen ? 'w-full md:w-80' : 'w-0 border-r-0'}`}
        >
          {/* Nilagyan ng inner container na fixed-width para hindi umuurong ang text habang nagre-resize ang sidebar wrapper */}
          <div className="w-full md:w-80 h-full">
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              channels={filteredChannels}
              onChannelSelect={(channel) => setSelectedChannel(channel)}
              selectedChannel={selectedChannel}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </div>
      )}

      {/* 2. MAIN EXPERIENCE ZONE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
        
        {/* FLOATING ACTION GLASS CONTROLS */}
        <div className="absolute top-4 left-4 z-50 flex gap-2 pointer-events-auto">
          <Button 
            variant="secondary" 
            size="icon" 
            className="bg-zinc-900/80 text-white border border-zinc-800 backdrop-blur hover:bg-zinc-800" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute top-4 right-4 z-50 flex gap-2 pointer-events-auto">
          <Button 
            variant="secondary" 
            size="icon" 
            className="bg-zinc-900/80 text-white border border-zinc-800 backdrop-blur hover:bg-zinc-800" 
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
          >
            <Star className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-zinc-900/80 text-white border border-zinc-800 backdrop-blur hover:bg-zinc-800"
            onClick={() => navigate(isAdmin ? '/admin' : '/auth')}
            title={isAdmin ? 'Admin Panel' : 'Sign In'}
          >
            <Shield className="h-5 w-5" />
          </Button>
        </div>

        {/* APPLICATION MAIN CONTENT VIEW */}
        {selectedChannel ? (
          <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">
            
            {/* VIDEO CONTAINER GRID (Naka-lock sa maximum 75% o 80% ng view screen height) */}
            <div className="w-full flex-1 flex items-center justify-center bg-black overflow-hidden max-h-[75vh] md:max-h-[80vh] border-b border-zinc-900 shadow-2xl">
              <VideoPlayer channel={selectedChannel} />
            </div>

            {/* CHANNEL METADATA INFOR ZONE (Ang dashboard space sa ilalim ng screen) */}
            <div className="w-full h-[25vh] md:h-[20vh] bg-zinc-950 p-6 flex flex-col justify-start border-t border-zinc-900 overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/20">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-orange-500 font-extrabold block mb-0.5">Kasalukuyang Palabas</span>
                  <h1 className="text-lg md:text-xl font-bold uppercase text-white tracking-wide">{selectedChannel.name}</h1>
                </div>
              </div>
              <div className="text-zinc-500 text-xs mt-3 pl-14 flex flex-wrap gap-x-4 gap-y-1 items-center">
                <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400 uppercase text-[10px] font-mono">
                  Format: {selectedChannel.type}
                </span>
                <span>•</span>
                <span className="text-zinc-400">Status: <span className="text-emerald-500">Connected</span></span>
                {selectedChannel.proxyUrl && (
                  <>
                    <span>•</span>
                    <span className="text-zinc-500 italic">Routed via Data Proxy Gateway</span>
                  </>
                )}
              </div>
            </div>

            {/* FAVORITES MODAL */}
            <FavoritesMenu
              isOpen={isFavoritesOpen}
              onClose={() => setIsFavoritesOpen(false)}
              channels={channels.filter(channel => favorites.includes(channel.name))}
              selectedChannel={selectedChannel}
              onChannelSelect={(channel) => { setSelectedChannel(channel); setIsFavoritesOpen(false); }}
              onToggleFavorite={toggleFavorite}
              favorites={favorites}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col gap-3 items-center justify-center text-zinc-400 bg-zinc-950">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium tracking-wide">Iniloload ang mga channels...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
