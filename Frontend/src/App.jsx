import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { Navbar } from '@/components/Navbar';

import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import OrganizerDashboard from '@/pages/OrganizerDashboard';
import Join from '@/pages/Join';
import Scanner from '@/pages/Scanner';
import Gallery from '@/pages/Gallery';
import EventDetails from '@/pages/EventDetails';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
          <Navbar />
          <main className="flex-1 flex flex-col relative w-full overflow-hidden">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/dashboard" element={<OrganizerDashboard />} />
              <Route path="/join" element={<Join />} />
              <Route path="/event/:id/scanner" element={<Scanner />} />
              <Route path="/event/:id/results" element={<Gallery />} />
              <Route path="/event/:id/manage" element={<EventDetails />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
