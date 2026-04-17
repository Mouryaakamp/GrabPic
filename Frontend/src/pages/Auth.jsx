import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const email = e.target.email.value;
      const password = e.target.password.value;
      
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = { email, password };
      
      if (!isLogin) {
        // Default role to organizer or attendee as required by backend (API spec requires this)
        body.role = 'organizer'; 
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.data && data.data.access_token) {
          localStorage.setItem('token', data.data.access_token);
        }
        // Redirect to homepage or joining point on success
         navigate('/dashboard');
         setIsLogin(true);
      } else {
        console.error('Auth failed:', data);
        alert(data.error?.message || data.message || 'Authentication failed');
      }
     
    } catch (error) {
      console.error('Network error:', error);
      alert('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      <Card glass className="w-full max-w-md animate-fade-in relative z-10 border-white/20 dark:border-white/10">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Enter your credentials to access your account' 
              : 'Sign up for a new account'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="email"
                  name="email"
                  placeholder="name@example.com" 
                  className="pl-10" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="password" 
                  name="password"
                  placeholder="Password" 
                  className="pl-10" 
                  required 
                />
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={loading}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
