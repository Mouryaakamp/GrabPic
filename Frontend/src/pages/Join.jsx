import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, QrCode } from 'lucide-react';
const baseUrl = import.meta.env.VITE_API_BASE_URL;

export default function Join() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (code.length < 3) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${baseUrl}/events/join`, {
        method: "POST",
        headers,
        body: JSON.stringify({ join_code: code })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Join failed:', data);
        alert(data.error?.message || data.message || 'Invalid join code');
        setLoading(false);
        return;
      }

      // Save token (it will be a new guest token or the same user token)
      if (data.data && data.data.access_token) {
        localStorage.setItem('token', data.data.access_token);
      }

      // We need the event ID to pass things along to the scanner
      navigate(`/event/${data.data?.event?.id}/scanner`);
      
    } catch (err) {
      console.error(err);
      alert('Network error while joining event');
    } finally {
      if (window.location.pathname === '/join') {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 animate-fade-in">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Join Event</h1>
          <p className="text-muted-foreground text-lg">
            Enter the join code provided by the organizer to find your photos.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6 mt-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g. IO2026"
              className="h-16 text-center text-2xl tracking-[0.2em] font-mono font-bold uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>
          
          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 text-lg shadow-lg shadow-primary/25"
            isLoading={loading}
            disabled={code.length < 3}
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
