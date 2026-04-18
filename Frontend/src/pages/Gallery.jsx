import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function Gallery() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const location = useLocation();
  const [photos, setPhotos] = useState([]);
  const [isZipping, setIsZipping] = useState(false);

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
        try {
          const imgRes = await fetch(data.data.url);
          if (!imgRes.ok) throw new Error('Fetch failed');
          const blob = await imgRes.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobUrl;
          a.download = `photo-${photoId}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (e) {
          console.warn('Blob download failed, using fallback', e);
          const a = document.createElement('a');
          a.href = data.data.url;
          a.target = '_blank';
          a.download = `photo-${photoId}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        alert(data.message || 'Download failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during download');
    }
  };

  const handleDownloadAll = async () => {
    if (isZipping || photos.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const token = localStorage.getItem('token');
      // 
      const downloadTasks = photos.map(async (photo) => {
        try {
          const res = await fetch(`${baseUrl}/events/${id}/photos/${photo.id}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.data?.url) {
            const imgRes = await fetch(data.data.url);
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              zip.file(`photo-${photo.id}.jpg`, blob);
            }
          }
        } catch (e) {
          console.error(`Failed to fetch photo ${photo.id}`, e);
        }
      });

      await Promise.all(downloadTasks);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `grabpic-event-${photos.length} photos.zip`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate zip file');
    } finally {
      setIsZipping(false);
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
          <Button variant="outline" className="hidden sm:flex glass shadow-sm min-w-[140px]" onClick={handleDownloadAll} disabled={isZipping}>
            {isZipping ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isZipping ? 'Zipping...' : `Download All (${photos.length})`}
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
                <div className="absolute top-2 right-2 z-10 opacity-70 hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-black/40 border border-white/20 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(photo.id);
                    }}
                  >
                    <Download className="w-4 h-4 text-white" />
                  </Button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 pointer-events-none">
                  <span className="text-white text-xs font-medium bg-white/20 backdrop-blur-md px-2 py-1 rounded-md">
                    High Confidence
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Download All CTA */}
          {photos.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:hidden z-50">
              <Button className="shadow-2xl shadow-primary/40 rounded-full px-8 h-14" onClick={handleDownloadAll} disabled={isZipping}>
                {isZipping ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                {isZipping ? 'Zipping...' : 'Download All'}
              </Button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
