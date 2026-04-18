import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Camera, Moon, Sun, Menu, X, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import OrganizerDashboard from '@/pages/OrganizerDashboard';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-dropdown-btn')) setIsProfileOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const baseLinks = [
    { name: 'Home', path: '/' },
    { name: 'Join Event', path: '/join' },
  ];
  const token = localStorage.getItem('token');
  const isLogin = !!token;
  const navLinks = isLogin ?
    [...baseLinks, { name: "Organizer Dashboard", path: '/dashboard' }] :
    baseLinks

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">GrabPic</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === link.path ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right side Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="hidden md:block">
            {!isLogin ? (
              <Link to="/login">
                <Button variant="primary" size="sm">Login</Button>
              </Link>
            ) : (
              <div className="relative">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }} 
                  className="rounded-full bg-accent hover:bg-muted profile-dropdown-btn"
                >
                  <User className="w-5 h-5 text-foreground" />
                </Button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-border/50 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      My Account
                    </div>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('token');
                        navigate('/');
                        window.location.reload();
                      }} 
                      className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-500/10 text-left font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="flex flex-col space-y-4 px-4 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium ${location.pathname === link.path ? 'text-primary' : 'text-muted-foreground'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border space-y-2">
              {!isLogin ? (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full" variant="primary">Login</Button>
                </Link>
              ) : (
                <Button 
                  className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                  variant="ghost"
                  onClick={() => {
                    localStorage.removeItem('token');
                    navigate('/');
                    window.location.reload();
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Log Out
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
