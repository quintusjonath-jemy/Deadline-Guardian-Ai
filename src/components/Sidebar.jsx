import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  TrendingUp, 
  Target, 
  Settings, 
  LogOut, 
  BrainCircuit
} from 'lucide-react';
import { logoutUser, subscribeToAuth, getDocument } from '../firebase';

export default function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(100);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currUser) => {
      setUser(currUser);
      if (currUser) {
        // Retrieve productivity score from users database
        try {
          const userDoc = await getDocument('users', currUser.uid);
          if (userDoc && userDoc.exists()) {
            setScore(userDoc.data().productivityScore || 100);
          }
        } catch (e) {
          console.error("Error reading user details:", e);
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (e) {
      console.error("Failed to sign out:", e);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tasks & AI Breakdown', path: '/tasks', icon: CheckSquare },
    { name: 'Smart Planner', path: '/planner', icon: Calendar },
    { name: 'Calendar Sync', path: '/calendar', icon: Calendar },
    { name: 'Goals & Habits', path: '/goals', icon: Target },
    { name: 'Risk Analytics', path: '/analytics', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-slate-800 flex flex-col justify-between py-6 px-4 z-20">
      {/* Header Logo */}
      <div className="flex items-center gap-3 px-2">
        <div className="bg-brand-blue/15 text-brand-blue p-2 rounded-lg border border-brand-blue/20">
          <BrainCircuit className="w-6 h-6 animate-pulse-glow" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Deadline Guardian
          </h1>
          <span className="text-[10px] text-brand-blue font-bold tracking-widest uppercase">
            AI Companion
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 mt-8 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-brand-blue/20 to-brand-blue/5 text-white border-l-2 border-brand-blue' 
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Status Card */}
      <div className="space-y-4">
        {/* Active AI Pulse */}
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">Guardian active</p>
            <p className="text-[10px] text-slate-500">Monitoring timelines</p>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-cyan-500 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.displayName || 'User'}</p>
                <p className="text-[10px] text-slate-500">Score: <span className="text-brand-green font-bold">{score}%</span></p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-500 hover:text-brand-red p-1 rounded transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
