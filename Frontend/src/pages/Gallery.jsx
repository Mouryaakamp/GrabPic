import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download, Image as ImageIcon } from 'lucide-react';

export default function Gallery() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const location = useLocation();
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (location.state?.matches) {
       setPhotos(location.state.matches.map(m => ({
         id: m.photo_id,
         url: m.thumbnail_url
       })));
    }
    setLoading(false);
  }, [location.state]);

  const handleDownload = async (photoId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/events/${id}/photos/${photoId}/download`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && data.data?.url) {
        // Trigger browser download by creating an anchor tag
        const a = document.createElement('a');
        a.href = data.data.url;
        a.download = `photo-${photoId}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.message || 'Download failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during download');
    }
  };

  const handleDownloadAll = async () => {
    // In a real app this would zip them on the server.
    // Here we'll sequentially trigger downloads safely.
    for (const photo of photos) {
       await handleDownload(photo.id);
       // Small delay to prevent browser from blocking multiple popups/downloads
       await new Promise(r => setTimeout(r, 500));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in min-h-[calc(100vh-4rem)]">
      
      {/* Header Sticky */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border sticky top-16 bg-background/80 backdrop-blur z-20">
        <div className="flex items-center space-x-4">
          <Link to={`/join`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Photos</h1>
            <p className="text-sm text-muted-foreground flex items-center mt-0.5">
              <ImageIcon className="w-4 h-4 mr-1.5" />
              Event: {id}
            </p>
          </div>
        </div>
        
        {!loading && photos.length > 0 && (
          <Button variant="outline" className="hidden sm:flex glass shadow-sm" onClick={handleDownloadAll}>
            <Download className="w-4 h-4 mr-2" />
            Download All ({photos.length})
          </Button>
        )}
      </div>

      {loading ? (
        // Skeleton Loaders mimicking Masonry layout
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="bg-muted animate-pulse rounded-2xl w-full break-inside-avoid shadow-inner"
              style={{ height: `${Math.random() * 200 + 150}px` }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Status Bar */}
          <div className="mb-6 flex items-center text-sm font-medium animate-slide-up text-primary bg-primary/10 w-fit px-4 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
            Found {photos.length} matches in 1.2s
          </div>

          {/* Masonry Layout */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {photos.map((photo, index) => (
              <div 
                key={photo.id} 
                className="relative group break-inside-avoid rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`, opacity: 0 }}
              >
                <img 
                  src={photo.url} 
                  alt={`Match ${photo.id}`} 
                  className="w-full h-auto object-cover rounded-2xl"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                  <span className="text-white text-xs font-medium bg-white/20 backdrop-blur-md px-2 py-1 rounded-md">
                    High Confidence
                  </span>
                  <Button 
                    size="icon" 
                    variant="glass" 
                    className="h-8 w-8 rounded-full border-none z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(photo.id);
                    }}
                  >
                    <Download className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Download All CTA */}
          {photos.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:hidden z-50">
              <Button className="shadow-2xl shadow-primary/40 rounded-full px-8 h-14" onClick={handleDownloadAll}>
                <Download className="w-5 h-5 mr-2" />
                Download All
              </Button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
