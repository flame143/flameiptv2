import { useState, useEffect } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import Sidebar, { Channel } from '../components/Sidebar';
import FavoritesMenu from '../components/FavoritesMenu';
import { channels } from '../data/channels';
import { Button } from '../components/ui/button';
import { Menu } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel>(channels[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteChannels');
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();

  const filteredChannels = channels.filter(channel => 
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChannelChange = (direction: 'up' | 'down') => {
    const currentIndex = channels.findIndex(channel => channel.name === selectedChannel.name);
    let newIndex;

    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : channels.length - 1;
    } else {
      newIndex = currentIndex < channels.length - 1 ? currentIndex + 1 : 0;
    }

    setSelectedChannel(channels[newIndex]);
    toast({
      description: `Switched to ${channels[newIndex].name}`,
      duration: 2000,
    });
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
        case 'ArrowUp':
          handleChannelChange('up');
          break;
        case 'ArrowDown':
          handleChannelChange('down');
          break;
        case 'Enter':
          setIsSidebarOpen(!isSidebarOpen);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChannel, isSidebarOpen]);

  return (
    <div className="h-screen w-full bg-black relative">
      <div className="absolute top-4 left-4 z-50">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        channels={filteredChannels}
        onChannelSelect={(channel) => {
          setSelectedChannel(channel);
          setIsSidebarOpen(false);
        }}
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
        onChannelSelect={(channel) => {
          setSelectedChannel(channel);
          setIsFavoritesOpen(false);
        }}
        onToggleFavorite={toggleFavorite}
      />

      <VideoPlayer channel={selectedChannel} />
    </div>
  );
};

export default Index;