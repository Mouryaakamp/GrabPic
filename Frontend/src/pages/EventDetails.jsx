import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, UploadCloud, RefreshCw, Save, ImageIcon, Trash } from 'lucide-react';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

function EventPhoto({ photo, eventId, token }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    fetch(`${baseUrl}/events/${eventId}/photos/${photo.id}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.data?.url) setSrc(data.data.url);
    })
    .catch(console.error);
  }, [eventId, photo.id, token]);

  if (!src) {
    return (
      <div className="w-full h-full bg-muted/50 flex items-center justify-center animate-pulse">
        <ImageIcon className="w-6 h-6 text-muted-foreground/30 mb-2" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={photo.storage_key.split('/').pop()}
      className="w-full h-full object-cover animate-fade-in"
      onError={(e) => e.target.style.display = 'none'}
    />
  );
}

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Event Details
      const eventRes = await fetch(`${baseUrl}/events/${id}`, { headers });
      const eventData = await eventRes.json();

      if (eventRes.ok && eventData.data?.event) {
        setEvent(eventData.data.event);
        setName(eventData.data.event.name);
        setDescription(eventData.data.event.description || "");
      }

      // Fetch Event Photos
      const photosRes = await fetch(`${baseUrl}/events/${id}/photos`, { headers });
      const photosData = await photosRes.json();

      if (photosRes.ok && photosData.data?.photos) {
        setPhotos(photosData.data.photos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Event updated successfully!");
        setEvent(data.data?.event || event);
      } else {
        alert(data.message || 'Failed to update event');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllPhotos = async () => {
    if (!window.confirm("Are you sure you want to delete ALL photos for this event? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${baseUrl}/events/${id}/photos`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPhotos([]);
        alert("All photos deleted successfully");
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete photos');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting photos');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      const res = await fetch(`${baseUrl}/events/${id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPhotos(photos.filter(p => p.id !== photoId));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete photo');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting photo');
    }
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 1. Get Presigned URL
        const contentType = "image/jpeg";

        const presignRes = await fetch(`${baseUrl}/events/${id}/photos/presign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            filename: file.name,
            content_type: contentType
          })
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok) throw new Error(presignData.message);

        console.log("PRESIGN:", presignData);


        const { upload_url, photo_id, storage_key } = presignData.data;
        console.log("UPLOAD URL:", upload_url);
        // upload
        const uploadRes = await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType   // MUST MATCH backend
          },
          body: file
        });

        console.log("UPLOAD STATUS:", uploadRes.status);

        if (!uploadRes.ok) {
          throw new Error('Upload to S3 failed');
        }

        // confirm
        const confirmRes = await fetch(`${baseUrl}/events/${id}/photos/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            photo_id,
            storage_key
          })
        });

        const confirmData = await confirmRes.json();
        console.log("CONFIRM:", confirmData);

        if (!confirmRes.ok) {
          throw new Error(confirmData.message || "Confirmation failed");
        }

      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
      setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Refresh photos
    fetchEventData();
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading event details...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in relative min-h-[calc(100vh-4rem)]">

      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link to={`/dashboard`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground mt-1">Join Code: <span className="font-mono font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded ml-1">{event?.join_code}</span></p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* Left Column: Details & Upload */}
        <div className="md:col-span-1 space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Event Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Event Description (Optional)"
                />
              </div>
              <Button onClick={handleUpdateEvent} isLoading={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card glass className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Upload Photos</h3>
                <p className="text-sm text-muted-foreground mt-1">Upload images to process faces.</p>
              </div>

              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />

              {uploading ? (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}></div>
                  </div>
                </div>
              ) : (
                <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
                  Select Files
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Photos Grid */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-muted-foreground" />
              Uploaded Photos ({photos.length})
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={fetchEventData}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              {/* {photos.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleDeleteAllPhotos} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600">
                  <Trash className="w-4 h-4 mr-2" /> Delete All
                </Button>
              )} */}
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed rounded-2xl border-muted-foreground/20">
              <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No photos uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload some photos to start face processing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted group border border-border">
                  <EventPhoto photo={photo} eventId={id} token={token} />
                  <div className="absolute top-2 left-2 bg-background/80 backdrop-blur text-xs px-2 py-0.5 rounded-full font-medium z-10 border border-border">
                    {photo.processing_status}
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500/80 backdrop-blur text-white p-1.5 rounded-full hover:bg-red-600 transition-colors z-10 opacity-0 group-hover:opacity-100"
                    title="Delete Photo"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
