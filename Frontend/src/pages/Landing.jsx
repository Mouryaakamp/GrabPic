import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Camera, Search, Shield, Zap } from 'lucide-react';

export default function Landing() {
const token=localStorage.getItem('token');
  const isLogin=!!token



  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 animate-fade-in relative">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] -z-10 mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] -z-10 mix-blend-multiply dark:mix-blend-screen" />

      <div className="max-w-4xl mx-auto space-y-8 mt-16 lg:mt-24">
        
        {/* Badge */}
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary animate-slide-up">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
          AI-Powered Face Recognition
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Stop searching. <br className="hidden md:block" />
          <span className="text-gradient">Start finding.</span>
        </h1>
        
        {/* Hero Subtitle */}
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Instantly find all your photos from any event. Just snap a selfie, and let our private AI classifier do the work.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Link to="/join">
            <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/25">
              <Camera className="mr-2 h-5 w-5" />
              Find My Photos
            </Button>
          </Link>
          <Link to={isLogin?"/dashboard":"/login"}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto glass">
              I'm an Organizer
            </Button>
          </Link>
        </div>

      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-32 mb-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        
        <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
          <p className="text-muted-foreground text-sm">Find your photos in milliseconds from galleries with thousands of images.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center shadow-lg">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">High Accuracy</h3>
          <p className="text-muted-foreground text-sm">State-of-the-art vector embeddings ensure we find you even in crowds.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Privacy First</h3>
          <p className="text-muted-foreground text-sm">Your selfie is only used for search and never stored or shared.</p>
        </div>

      </div>
    </div>
  );
}
