import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home,
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  MessageSquare,
  TrendingUp, 
  Target, 
  Settings, 
  LogOut, 
  BrainCircuit,
  Zap
} from 'lucide-react';
import { logoutUser, subscribeToAuth, streamDocuments, whereClause } from '../firebase';

export default function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(100);

  useEffect(() => {
    let unsubscribeUser = null;
    
    const unsubscribeAuth = subscribeToAuth((currUser) => {
      setUser(currUser);
      if (currUser) {
        // Stream the user profile in real-time to sync productivity score
        unsubscribeUser = streamDocuments(
          'users',
          [whereClause('uid', '==', currUser.uid)],
          (snapshot) => {
            if (snapshot.docs.length > 0) {
              setScore(snapshot.docs[0].data().productivityScore || 100);
            }
          }
        );
      } else {
        if (unsubscribeUser) unsubscribeUser();
        setScore(100);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
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
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks & AI', path: '/tasks', icon: CheckSquare },
    { name: 'Smart Planner', path: '/planner', icon: Calendar },
    { name: 'AI Coach', path: '/coach', icon: MessageSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Habit Tracker', path: '/habits', icon: Target },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Gradient arc degrees based on score
  const scoreColor = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col justify-between z-20 overflow-hidden"
           style={{ background: '#0F172A', borderRight: '1px solid rgba(14,165,233,0.12)' }}>

      {/* ── LOGO ── */}
      <div>
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)' }}>
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              {/* AI Pulse dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
              </span>
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight text-white">Deadline Guardian</h1>
              <span className="text-[9px] font-bold tracking-widest uppercase"
                    style={{ color: '#0EA5E9' }}>
                AI Companion
              </span>
            </div>
          </div>
        </div>

        {/* ── NAV ── */}
        <nav className="px-3 pt-5 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: 'linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(20,184,166,0.12) 100%)',
                      border: '1px solid rgba(14,165,233,0.2)',
                    }
                  : {}
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── BOTTOM PANEL ── */}
      <div className="px-3 pb-5 space-y-3">
        {/* Guardian Status */}
        <div className="rounded-xl p-3 flex items-center gap-3"
             style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)' }}>
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Guardian Active</p>
            <p className="text-[10px] text-slate-400">Monitoring timelines</p>
          </div>
          <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        </div>

        {/* User Card with gradient score ring */}
        {user && (
          <div className="flex items-center justify-between p-2.5 rounded-xl"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              {/* Avatar with gradient ring based on score */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full p-[2px]"
                     style={{ background: `conic-gradient(${scoreColor} ${score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`, borderRadius: '50%' }}>
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white relative z-10 m-[2px]"
                     style={{ background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)', width: '32px', height: '32px' }}>
                  {initials}
                </div>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.displayName || 'User'}</p>
                <p className="text-[10px]" style={{ color: scoreColor }}>
                  Score: <span className="font-bold">{score}%</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200 shrink-0"
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
