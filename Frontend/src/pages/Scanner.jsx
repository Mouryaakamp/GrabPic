import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Camera, RefreshCw } from 'lucide-react';

export default function FaceScanner() {
  const { id } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied or unavailable.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || scanning) return;

    setScanning(true);
    setError('');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setError('Unable to access camera frame.');
      setScanning(false);
      return;
    }

    // Wait until video dimensions are ready
    if (!video.videoWidth || !video.videoHeight) {
      setError('Camera not ready. Please try again.');
      setScanning(false);
      return;
    }

    // Smaller square output to reduce payload and speed up ML call
    const targetSize = 384;
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Center-crop source frame to a square
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const srcSize = Math.min(srcW, srcH);
    const sx = Math.floor((srcW - srcSize) / 2);
    const sy = Math.floor((srcH - srcSize) / 2);

    // Draw mirrored frame (matches selfie preview)
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, srcSize, srcSize, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Compress JPEG to keep request fast
    const base64Image = canvas.toDataURL('image/jpeg', 0.7);

    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${baseUrl}/events/${id}/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/event/${id}/results`, {
          state: { matches: data.data?.matches || [] }
        });
      } else {
        setError(data.message || data.error?.message || 'Error occurred during search');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Could not connect to search service.');
    } finally {
      setScanning(false);
      stopCamera();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)] p-4 max-w-md mx-auto w-full animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Find Your Photos</h1>
        <p className="text-muted-foreground mt-1">Center your face in the frame.</p>
      </div>

      <div className="relative flex-1 bg-black rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 ring-4 ring-muted">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <p className="font-medium text-red-500 mb-4">{error}</p>
            <Button onClick={startCamera} variant="outline" className="glass">
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />

            <div className="absolute inset-0 border-4 border-primary/30 m-8 rounded-full border-dashed animate-pulse opacity-50 pointer-events-none" />

            {scanning && (
              <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center animate-fade-in">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white font-medium drop-shadow-md">Analyzing Face Embeddings...</p>
              </div>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="py-8 flex justify-center mt-auto">
        <button
          onClick={capturePhoto}
          disabled={!!error || scanning}
          className="w-20 h-20 rounded-full bg-white/10 border-[6px] border-primary flex items-center justify-center hover:bg-white/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          aria-label="Capture face"
        >
          <div className="w-14 h-14 bg-primary rounded-full" />
        </button>
      </div>
    </div>
  );
}
