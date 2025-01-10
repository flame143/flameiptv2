import { useState } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import Sidebar, { Channel } from '../components/Sidebar';
import { channels } from '../data/channels';
import { Button } from '../components/ui/button';
import { Menu } from 'lucide-react';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel>(channels[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChannels = channels.filter(channel => 
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      />

      <VideoPlayer channel={selectedChannel} />
    </div>
  );
};

export default Index;