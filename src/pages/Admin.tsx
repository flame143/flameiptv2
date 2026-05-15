import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Plus, LogOut, ArrowLeft } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface ChannelRow {
  id: string;
  name: string;
  manifest_uri: string | null;
  type: string;
  clear_key: Record<string, string> | null;
  embed_url: string | null;
  logo: string | null;
  proxy_url: string | null;
  sort_order: number;
}

const empty: Omit<ChannelRow, 'id'> = {
  name: '',
  manifest_uri: '',
  type: 'mpd',
  clear_key: null,
  embed_url: '',
  logo: '',
  proxy_url: '',
  sort_order: 0,
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, roleLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [editing, setEditing] = useState<ChannelRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<ChannelRow, 'id'>>(empty);
  const [clearKeyText, setClearKeyText] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) navigate('/auth');
    else if (!isAdmin) {
      toast({ description: 'You are not an admin.', variant: 'destructive' });
      navigate('/');
    } else {
      load();
    }
  }, [user, isAdmin, loading, roleLoading]);

  const load = async () => {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(1000);
    if (error) toast({ description: error.message, variant: 'destructive' });
    else setChannels((data as any) || []);
  };

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setClearKeyText('');
    setOpen(true);
  };

  const openEdit = (c: ChannelRow) => {
    setEditing(c);
    setForm({ ...c });
    setClearKeyText(c.clear_key ? JSON.stringify(c.clear_key, null, 2) : '');
    setOpen(true);
  };

  const save = async () => {
    let clearKeyParsed: any = null;
    if (clearKeyText.trim()) {
      try { clearKeyParsed = JSON.parse(clearKeyText); }
      catch { return toast({ description: 'Invalid clear key JSON', variant: 'destructive' }); }
    }
    const payload = {
      ...form,
      clear_key: clearKeyParsed,
      manifest_uri: form.manifest_uri || null,
      embed_url: form.embed_url || null,
      logo: form.logo || null,
      proxy_url: form.proxy_url || null,
    };
    const res = editing
      ? await supabase.from('channels').update(payload).eq('id', editing.id)
      : await supabase.from('channels').insert(payload);
    if (res.error) return toast({ description: res.error.message, variant: 'destructive' });
    toast({ description: editing ? 'Updated' : 'Created' });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this channel?')) return;
    const { error } = await supabase.from('channels').delete().eq('id', id);
    if (error) return toast({ description: error.message, variant: 'destructive' });
    load();
  };

  const filtered = channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-xl font-bold">Channels Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-1" /> New</Button>
          <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Sign Out</Button>
        </div>
      </header>

      <div className="p-4 max-w-5xl mx-auto">
        <Input
          placeholder="Search channels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 bg-zinc-900 border-zinc-700 text-white"
        />
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded p-3">
              <div className="flex items-center gap-3 min-w-0">
                {c.logo && <img src={c.logo} alt="" className="w-10 h-10 object-contain rounded bg-black flex-shrink-0" />}
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-zinc-400 truncate">{c.type} {c.proxy_url && '• proxy'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Channel' : 'New Channel'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 text-white">
                  <SelectItem value="mpd">MPD (DASH)</SelectItem>
                  <SelectItem value="hls">HLS (m3u8)</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Manifest URI</Label><Input value={form.manifest_uri || ''} onChange={(e) => setForm({ ...form, manifest_uri: e.target.value })} className="bg-zinc-800 border-zinc-700" /></div>
            <div><Label>Embed URL (YouTube)</Label><Input value={form.embed_url || ''} onChange={(e) => setForm({ ...form, embed_url: e.target.value })} className="bg-zinc-800 border-zinc-700" /></div>
            <div><Label>Logo URL</Label><Input value={form.logo || ''} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="bg-zinc-800 border-zinc-700" /></div>
            <div>
              <Label>Custom Proxy URL</Label>
              <Input
                placeholder="https://proxy.example.com/?url={url}"
                value={form.proxy_url || ''}
                onChange={(e) => setForm({ ...form, proxy_url: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Use <code>{'{url}'}</code> as placeholder for the manifest URL. If omitted, the manifest is appended (URL-encoded).
              </p>
            </div>
            <div>
              <Label>Clear Key (JSON)</Label>
              <Textarea
                rows={3}
                placeholder='{"keyId":"key"}'
                value={clearKeyText}
                onChange={(e) => setClearKeyText(e.target.value)}
                className="bg-zinc-800 border-zinc-700 font-mono text-xs"
              />
            </div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-orange-500 hover:bg-orange-600">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
