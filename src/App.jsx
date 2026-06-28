import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { subscribeToAuth } from './firebase';

// Components
import Sidebar from './components/Sidebar';
import VoiceAssistant from './components/VoiceAssistant';
import RecoveryAgent from './components/RecoveryAgent';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Planner from './pages/Planner';
import Coach from './pages/Coach';
import CalendarView from './pages/CalendarView';
import Goals from './pages/Goals';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#080B11] relative">
      {/* Main Layout Navigation - Hidden on Landing page */}
      {!isLanding && <Sidebar />}

      {/* Page Routing */}
      <main className="transition-all duration-300">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/habits" element={<Goals />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Autonomous AI Assistants - Hidden on Landing page */}
      {!isLanding && <VoiceAssistant />}
      {!isLanding && <RecoveryAgent />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currUser) => {
      setUser(currUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B11] flex items-center justify-center text-brand-blue text-sm font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-brand-blue rounded-full animate-spin"></div>
          <span>Loading Deadline Guardian...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user ? (
        <AppContent user={user} />
      ) : (
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
