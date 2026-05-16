import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import Sidebar, { Channel } from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Tv, Clock, PlusCircle, LayoutGrid, Shield, User } from 'lucide-react';
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
  category: r.category || 'General',
});

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        toast({ description: error.message, variant: 'destructive' });
        return;
      }
      const mapped = (data || []).map(mapRow);
      setChannels(mapped);
      if (mapped.length) setSelectedChannel(mapped[0]);
    })();
  }, []);

  const handleAdminClick = () => {
    if (user) {
      navigate('/admin');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="h-screen w-full bg-black text-white p-2 md:p-4 lg:p-6 overflow-hidden">
      
      {/* TUNEX MASTER CONTAINER */}
      <div className="h-full w-full flex flex-col bg-[#0a0a0a] tunex-glow rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/5 relative">

        
        {/* HEADER */}
        <header className="h-16 md:h-20 px-6 md:px-10 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#0f0f0f]">


          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-lg bg-primary shadow-[0_0_20px_rgba(0,255,0,0.4)] flex items-center justify-center">
                <Tv className="w-5 h-5 text-black" />
             </div>
             <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic">Flame<span className="text-primary not-italic">X</span> Space</h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">

             <div 
               onClick={handleAdminClick}
               className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-primary transition-colors cursor-pointer group"
               title={user ? 'Admin Panel' : 'Login'}
             >
                {user ? <Shield className="w-5 h-5 group-hover:text-primary" /> : <User className="w-5 h-5 group-hover:text-primary" />}
             </div>

          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* PLAYER ZONE (70%) */}
          <div className="flex-1 p-4 md:p-8 flex items-center justify-center bg-[#050505] relative">


            {selectedChannel ? (
              <div className="w-full h-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/5 relative group">
                <VideoPlayer key={selectedChannel.id} channel={selectedChannel} />

              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center shadow-[0_0_50px_rgba(0,255,0,0.1)]">
                   <Tv className="w-12 h-12 text-primary" />
                </div>
                <span className="text-zinc-600 font-bold uppercase tracking-widest text-sm">Waiting for Selection</span>
              </div>
            )}
          </div>

          {/* CONTROL PANEL (30%) */}
          <Sidebar
            channels={channels}
            onChannelSelect={(c) => setSelectedChannel(c)}
            selectedChannel={selectedChannel}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAdminClick={handleAdminClick}
          />
        </div>

      </div>

      <style>{`
        .tunex-glow {
          box-shadow: 0 0 50px rgba(0, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};

export default Index;
