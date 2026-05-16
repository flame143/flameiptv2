import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Plus, LogOut, ArrowLeft, ArrowUp, ArrowDown, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
  channel_no: string | null;
  epg_id: string | null;
  epg_url: string | null;
  category: string | null;
  drm_type: string | null;
  user_agent: string | null;
  referrer: string | null;
  tvhpp_slug: string | null;
  proxy_provider: string | null;
  proxy_backups: string[] | null;
}

type FormState = Omit<ChannelRow, 'id' | 'clear_key'> & {
  keyId: string;
  keyValue: string;
};

const emptyForm: FormState = {
  name: '',
  manifest_uri: '',
  type: 'mpd',
  embed_url: '',
  logo: '',
  proxy_url: '',
  sort_order: 0,
  channel_no: '',
  epg_id: '',
  epg_url: '',
  category: '',
  drm_type: 'none',
  user_agent: '',
  referrer: '',
  tvhpp_slug: '',
  proxy_provider: 'none',
  proxy_backups: [],
  keyId: '',
  keyValue: '',
};

const PROXY_PROVIDERS = ['none', 'Cloudflare Workers', 'Vercel', 'Custom'];

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, roleLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [editing, setEditing] = useState<ChannelRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) { navigate('/auth'); return; }
    if (!isAdmin) {
      toast({ description: 'You are not an admin.', variant: 'destructive' });
      return;
    }
    load();
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
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: ChannelRow) => {
    setEditing(c);
    setForm({
      name: c.name || '',
      manifest_uri: c.manifest_uri || '',
      type: c.type || 'mpd',
      embed_url: c.embed_url || '',
      logo: c.logo || '',
      proxy_url: c.proxy_url || '',
      sort_order: c.sort_order || 0,
      channel_no: c.channel_no || '',
      epg_id: c.epg_id || '',
      epg_url: c.epg_url || '',
      category: c.category || '',
      drm_type: c.drm_type || 'none',
      user_agent: c.user_agent || '',
      referrer: c.referrer || '',
      tvhpp_slug: c.tvhpp_slug || '',
      proxy_provider: c.proxy_provider || 'none',
      proxy_backups: Array.isArray(c.proxy_backups) ? c.proxy_backups : [],
      keyId: c.clear_key ? Object.keys(c.clear_key)[0] || '' : '',
      keyValue: c.clear_key ? Object.values(c.clear_key)[0] || '' : '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast({ description: 'Channel name is required', variant: 'destructive' });

    let clearKey: Record<string, string> | null = null;
    if (form.drm_type === 'ClearKey' && form.keyId.trim() && form.keyValue.trim()) {
      clearKey = { [form.keyId.trim()]: form.keyValue.trim() };
    }

    const payload = {
      name: form.name,
      type: form.type,
      sort_order: form.sort_order,
      manifest_uri: form.manifest_uri || null,
      embed_url: form.embed_url || null,
      logo: form.logo || null,
      proxy_url: form.proxy_url || null,
      channel_no: form.channel_no || null,
      epg_id: form.epg_id || null,
      epg_url: form.epg_url || null,
      category: form.category || null,
      drm_type: form.drm_type === 'none' ? null : form.drm_type,
      user_agent: form.user_agent || null,
      referrer: form.referrer || null,
      tvhpp_slug: form.tvhpp_slug || null,
      proxy_provider: form.proxy_provider === 'none' ? null : form.proxy_provider,
      proxy_backups: form.proxy_backups,
      clear_key: clearKey,
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

  const updateBackup = (i: number, value: string) => {
    const next = [...form.proxy_backups];
    next[i] = value;
    setForm({ ...form, proxy_backups: next });
  };
  const moveBackup = (i: number, dir: -1 | 1) => {
    const next = [...form.proxy_backups];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setForm({ ...form, proxy_backups: next });
  };
  const removeBackup = (i: number) => {
    setForm({ ...form, proxy_backups: form.proxy_backups.filter((_, idx) => idx !== i) });
  };
  const addBackup = () => setForm({ ...form, proxy_backups: [...form.proxy_backups, ''] });

  const filtered = channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (loading || roleLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  const inputCls = "bg-zinc-800 border-zinc-700 text-white";

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
                  <div className="font-medium truncate">
                    {c.channel_no && <span className="text-zinc-500 mr-2">#{c.channel_no}</span>}
                    {c.name}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {c.type}
                    {c.drm_type && ` • ${c.drm_type}`}
                    {c.proxy_provider && ` • ${c.proxy_provider}`}
                    {c.category && ` • ${c.category}`}
                  </div>
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
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Channel' : 'New Channel'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Channel Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Channel No.</Label>
                <Input value={form.channel_no || ''} onChange={(e) => setForm({ ...form, channel_no: e.target.value })} className={inputCls} />
              </div>
              <div>
                <Label>EPG ID / Name</Label>
                <Input value={form.epg_id || ''} onChange={(e) => setForm({ ...form, epg_id: e.target.value })} className={inputCls} />
              </div>
            </div>

            <div>
              <Label>External EPG XML URL (Optional)</Label>
              <Input
                placeholder="https://example.com/guide.xml"
                value={form.epg_url || ''}
                onChange={(e) => setForm({ ...form, epg_url: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <Label>Stream URL *</Label>
              <Input value={form.manifest_uri || ''} onChange={(e) => setForm({ ...form, manifest_uri: e.target.value })} className={inputCls} />
            </div>

            <div>
              <Label>Stream Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 text-white">
                  <SelectItem value="mpd">DASH (.mpd)</SelectItem>
                  <SelectItem value="hls">HLS (.m3u8)</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === 'youtube' && (
              <div>
                <Label>YouTube Embed URL</Label>
                <Input value={form.embed_url || ''} onChange={(e) => setForm({ ...form, embed_url: e.target.value })} className={inputCls} />
              </div>
            )}

            <div>
              <Label>Logo URL</Label>
              <Input value={form.logo || ''} onChange={(e) => setForm({ ...form, logo: e.target.value })} className={inputCls} />
            </div>

            <div>
              <Label>Category</Label>
              <Input
                placeholder="News, Sports, Movies..."
                value={form.category || ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="border border-zinc-800 rounded p-3 space-y-3">
              <div className="font-semibold text-sm">DRM Configuration (Optional)</div>
              <div>
                <Label>DRM Type</Label>
                <Select value={form.drm_type || 'none'} onValueChange={(v) => setForm({ ...form, drm_type: v })}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ClearKey">ClearKey</SelectItem>
                    <SelectItem value="Widevine">Widevine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.drm_type === 'ClearKey' && (
                <>
                  <div>
                    <Label>Key ID</Label>
                    <Input value={form.keyId} onChange={(e) => setForm({ ...form, keyId: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <Label>Key</Label>
                    <Input value={form.keyValue} onChange={(e) => setForm({ ...form, keyValue: e.target.value })} className={inputCls} />
                  </div>
                </>
              )}
            </div>

            <div>
              <Label>Custom User-Agent</Label>
              <Input value={form.user_agent || ''} onChange={(e) => setForm({ ...form, user_agent: e.target.value })} className={inputCls} />
            </div>

            <div>
              <Label>Custom Referrer</Label>
              <Input value={form.referrer || ''} onChange={(e) => setForm({ ...form, referrer: e.target.value })} className={inputCls} />
            </div>

            <div>
              <Label>Tvhpp Slug (Auto-resolve)</Label>
              <Input value={form.tvhpp_slug || ''} onChange={(e) => setForm({ ...form, tvhpp_slug: e.target.value })} className={inputCls} />
            </div>

            <div>
              <Label>Proxy Provider</Label>
              <Select value={form.proxy_provider || 'none'} onValueChange={(v) => setForm({ ...form, proxy_provider: v })}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 text-white">
                  {PROXY_PROVIDERS.map(p => <SelectItem key={p} value={p}>{p === 'none' ? 'None' : p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="border border-zinc-800 rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">Proxy Priority Order</div>
                <Button size="sm" variant="ghost" onClick={addBackup}><Plus className="w-3 h-3 mr-1" />Add</Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 w-16">Primary</span>
                  <Input
                    placeholder="https://primary-proxy/?url={url}"
                    value={form.proxy_url || ''}
                    onChange={(e) => setForm({ ...form, proxy_url: e.target.value })}
                    className={inputCls}
                  />
                </div>
                {form.proxy_backups.map((u, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 w-16">Backup {i + 1}</span>
                    <Input
                      placeholder="https://backup-proxy/?url={url}"
                      value={u}
                      onChange={(e) => updateBackup(i, e.target.value)}
                      className={inputCls}
                    />
                    <Button size="icon" variant="ghost" onClick={() => moveBackup(i, -1)}><ArrowUp className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => moveBackup(i, 1)}><ArrowDown className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeBackup(i)}><X className="w-3 h-3 text-red-400" /></Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500">Use <code>{'{url}'}</code> as placeholder for the stream URL.</p>
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className={inputCls} />
            </div>
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
