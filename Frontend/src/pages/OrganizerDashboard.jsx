import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Plus, Image as ImageIcon, Users, Copy, Check, X, MoreVertical, Edit, Trash } from 'lucide-react';
import { Input } from '@/components/ui/Input';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

function AnimatedCounter({ value }) {
  const counterRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: value,
        duration: 1.5,
        ease: 'power3.out',
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.innerText = Math.floor(obj.val).toLocaleString();
          }
        }
      });
    });
    return () => ctx.revert();
  }, [value]);

  return <span ref={counterRef} className="text-xl font-semibold tracking-tight">0</span>;
}

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState(null);
  const [events, setEvents] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const cardsRef = useRef([]);

  useEffect(() => {
    if (events.length > 0) {
      let ctx = gsap.context(() => {
        gsap.fromTo(
          cardsRef.current.filter(Boolean),
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.2)' }
        );
      });
      return () => ctx.revert();
    }
  }, [events]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) setActiveDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDeleteEvent = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter(ev => ev.id !== id));
    }
    setActiveDropdown(null);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };


  useEffect(() => {
    async function fetchEvents() {
      try {
        const accessToken = localStorage.getItem("token");

        if (!accessToken) {
          console.error("No token found");
          return;
        }

        const response = await fetch(`${baseUrl}/events`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        let data = {};
        try {
          data = await response.json();
        } catch { }

        if (!response.ok) {
          console.error('Auth failed:', data);
          return;
        }

        // Map the backend array to the format our UI expects
        const eventsData = data.data?.events || data.events || [];
        const fetchedEvents = await Promise.all(eventsData.map(async ev => {
          let photoCount = 0;
          try {
            const pRes = await fetch(`${baseUrl}/events/${ev.id}/photos`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const pData = await pRes.json();
            if (pRes.ok && pData.data?.photos) {
              photoCount = pData.data.photos.length;
            }
          } catch (e) {
            console.error("Failed to fetch photos count", e);
          }

          return {
            id: ev.id,
            name: ev.name,
            code: ev.join_code,
            date: new Date(ev.created_at).toLocaleDateString(),
            photos: photoCount
          };
        }));

        setEvents(fetchedEvents);

      } catch (err) {
        console.error(err);
      }
    }

    fetchEvents();
  }, []);


  const createEvent = async () => {
    if (!newEventName.trim()) return;
    setIsCreating(true);
    try {
      const accessToken = localStorage.getItem("token");

      const response = await fetch(`${baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name: newEventName })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Creation failed:', data);
        alert(data.error?.message || data.message || 'Creation failed');
        setIsCreating(false);
        return;
      }

      // The API returns { event: { id: ..., name: ..., join_code: ... } } (wrapped in data)
      const eventData = data.data?.event || data.event;
      const newEv = {
        id: eventData.id,
        name: eventData.name,
        code: eventData.join_code,
        date: new Date(eventData.created_at).toLocaleDateString(),
        photos: 0
      };

      setEvents(prev => [...prev, newEv]);

      // Close modal and reset
      setShowModal(false);
      setNewEventName("");
    } catch (e) {
      console.error(e);
      alert('Network error while creating event');
    } finally {
      setIsCreating(false);
    }
  }

  // Reset refs before rendering
  cardsRef.current = [];

  return (
  <div className="container mx-auto px-4 py-8 animate-fade-in relative">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your events and photo uploads</p>
      </div>
      <Button size="lg" className="shadow-lg shadow-primary/20" onClick={() => setShowModal(true)}>
        <Plus className="mr-2 h-5 w-5" />
        Create New Event
      </Button>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((data, index) => (
        <div key={data.id} ref={(el) => (cardsRef.current[index] = el)}>
          <Card glass className="group hover:border-primary/50 transition-colors h-full flex flex-col">
          <div
            onClick={() => navigate(`/event/${data.id}/manage`)}
            className="pb-4 p-6 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{data.name}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">{data.date}</div>
              </div>
              <div className="dropdown-container relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveDropdown(activeDropdown === data.id ? null : data.id); }} 
                  className="h-8 w-8 z-10 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
                {activeDropdown === data.id && (
                  <div className="absolute top-10 -right-2 w-28 bg-background border border-border rounded-md shadow-xl z-50 overflow-hidden text-xs font-medium animate-in fade-in zoom-in-95">
                    <div 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/event/${data.id}/manage`); }} 
                      className="flex items-center px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors"
                    >
                       <Edit className="w-4 h-4 mr-2" /> Edit
                    </div>
                    <div 
                      onClick={(e) => handleDeleteEvent(e, data.id)} 
                      className="flex items-center px-3 py-2.5 text-red-500 hover:bg-red-500/10 cursor-pointer font-medium transition-colors"
                    >
                       <Trash className="w-4 h-4 mr-2" /> Delete
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
              <div>
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Join Code</div>
                <div className="font-mono text-lg font-bold tracking-widest">{data.code}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(data.code)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                {copiedCode === data.code ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col p-3 rounded-lg border border-border/50 bg-background/50">
                <div className="flex items-center text-muted-foreground text-sm mb-1">
                  <ImageIcon className="h-4 w-4 mr-1.5" />
                  Photos
                </div>
                <AnimatedCounter value={data.photos || 0} />
              </div>
              <Link to={`/event/${data.id}/manage`} className="h-full">
                <Button variant="outline" className="h-full w-full bg-background/50 border-border/50 hover:border-primary">
                  Manage / Upload
                </Button>
              </Link>
            </div>
          </CardContent>
          </Card>
        </div>
      ))}
    </div>

    {showModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <Card glass className="w-full max-w-md animate-in zoom-in-95 duration-200 border-white/20 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Create New Event</CardTitle>
              <CardDescription>Enter the details for your new event.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="-mr-2 -mt-2">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Name</label>
                <Input
                  placeholder="e.g. Sarah's Wedding"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={createEvent} isLoading={isCreating} disabled={!newEventName.trim()}>
              Create Event
            </Button>
          </CardFooter>
        </Card>
      </div>
    )}
  </div>
);
}
