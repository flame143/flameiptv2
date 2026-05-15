import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import Sidebar, { Channel } from '../components/Sidebar';
import FavoritesMenu from '../components/FavoritesMenu';
import { Button } from '../components/ui/button';
import { Menu, Shield, Star } from 'lucide-react';
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
});

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    <div className="h-screen w-full bg-black relative">
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}>
          <Star className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => navigate(isAdmin ? '/admin' : '/auth')}
          title={isAdmin ? 'Admin Panel' : 'Sign In'}
        >
          <Shield className="h-6 w-6" />
        </Button>
      </div>

      {selectedChannel && (
        <>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            channels={filteredChannels}
            onChannelSelect={(channel) => { setSelectedChannel(channel); setIsSidebarOpen(false); }}
            selectedChannel={selectedChannel}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
          <FavoritesMenu
            isOpen={isFavoritesOpen}
            onClose={() => setIsFavoritesOpen(false)}
            channels={channels.filter(channel => favorites.includes(channel.name))}
            selectedChannel={selectedChannel}
            onChannelSelect={(channel) => { setSelectedChannel(channel); setIsFavoritesOpen(false); }}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
          />
          <VideoPlayer channel={selectedChannel} />
        </>
      )}
      {!selectedChannel && (
        <div className="h-full flex items-center justify-center text-white">Loading channels...</div>
      )}
    </div>
  );
};

export default Index;
