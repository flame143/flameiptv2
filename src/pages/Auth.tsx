import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/admin');
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast({ description: 'Account created. You can now sign in.' });
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/admin');
      }
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-zinc-900 p-6 rounded-xl space-y-4 border border-zinc-800">
        <h1 className="text-2xl font-bold text-white text-center">
          {mode === 'signin' ? 'Admin Sign In' : 'Create Admin Account'}
        </h1>
        <p className="text-xs text-zinc-400 text-center">
          The first registered account becomes the admin.
        </p>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">Password</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
        </div>
        <Button type="submit" disabled={busy} className="w-full bg-orange-500 hover:bg-orange-600">
          {busy ? '...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>
        <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="w-full text-sm text-orange-400 hover:underline">
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
        <button type="button" onClick={() => navigate('/')} className="w-full text-xs text-zinc-500 hover:text-zinc-300">
          ← Back to player
        </button>
      </form>
    </div>
  );
};

export default Auth;
