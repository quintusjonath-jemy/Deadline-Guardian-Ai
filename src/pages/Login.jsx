import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Mail, Lock, ShieldAlert } from 'lucide-react';
import { loginUser, loginWithGoogle } from '../firebase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      if (e.message.includes('user-not-found') || e.message.includes('wrong-password') || e.message.includes('invalid-credential')) {
        setError('Invalid email or password.');
      } else {
        setError('Login failed. Check your connection or settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      setError(`Google Sign-In failed: ${e.message || e.code || e}`);
    }
  };

  const handleGuestExplore = () => {
    // Enable local storage mode immediately by pre-populating mock data
    const guestUid = 'usr_guest';
    const guestUser = {
      uid: guestUid,
      email: 'guest@deadlineguardian.ai',
      displayName: 'Guest Pilot',
      productivityScore: 82,
      createdAt: new Date().toISOString()
    };
    
    // Seed Users
    const users = JSON.parse(localStorage.getItem('dg_db_users') || '{}');
    users[guestUid] = guestUser;
    localStorage.setItem('dg_db_users', JSON.stringify(users));

    // Seed Tasks (including one missed task to trigger the Recovery Agent!)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(17, 0, 0, 0);

    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay() + 7) % 7 || 7);
    nextFriday.setHours(18, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const sampleTasks = {
      'tsk_1': {
        id: 'tsk_1',
        userId: guestUid,
        title: 'Review physics syllabus and summary sheets',
        description: 'Need to review equations for midterm exam.',
        deadline: yesterday.toISOString(), // Missed deadline!
        priority: 'high',
        estimatedHours: 3,
        status: 'pending',
        aiGeneratedSubtasks: [
          { id: 'sub_1a', title: 'Collect formula notebook', status: 'completed', estimatedHours: 0.5 },
          { id: 'sub_1b', title: 'Solve past mock tests', status: 'pending', estimatedHours: 1.5 },
          { id: 'sub_1c', title: 'Memorize thermodynamic laws', status: 'pending', estimatedHours: 1 }
        ],
        createdAt: yesterday.toISOString()
      },
      'tsk_2': {
        id: 'tsk_2',
        userId: guestUid,
        title: 'Build React UI for Vibe2Ship Hackathon',
        description: 'Complete the landing page, analytics dashboard, and voice settings.',
        deadline: nextFriday.toISOString(),
        priority: 'high',
        estimatedHours: 6,
        status: 'in_progress',
        aiGeneratedSubtasks: [
          { id: 'sub_2a', title: 'Configure project routers', status: 'completed', estimatedHours: 1 },
          { id: 'sub_2b', title: 'Write glassmorphic component libraries', status: 'completed', estimatedHours: 1.5 },
          { id: 'sub_2c', title: 'Integrate browser speech synthesis', status: 'pending', estimatedHours: 1.5 },
          { id: 'sub_2d', title: 'Test production deployment hosting', status: 'pending', estimatedHours: 2 }
        ],
        createdAt: new Date().toISOString()
      },
      'tsk_3': {
        id: 'tsk_3',
        userId: guestUid,
        title: 'Prepare Vibe2Ship submission slideshow',
        description: 'Build slides showing Problem Selected, Tech Stack, and Agentic Depth highlights.',
        deadline: tomorrow.toISOString(),
        priority: 'medium',
        estimatedHours: 2.5,
        status: 'pending',
        aiGeneratedSubtasks: [
          { id: 'sub_3a', title: 'Write outline summary docs', status: 'pending', estimatedHours: 1 },
          { id: 'sub_3b', title: 'Design slide layouts', status: 'pending', estimatedHours: 1.5 }
        ],
        createdAt: new Date().toISOString()
      }
    };
    localStorage.setItem('dg_db_tasks', JSON.stringify(sampleTasks));

    // Seed Goals
    const sampleGoals = {
      'go_1': {
        goalId: 'go_1',
        userId: guestUid,
        title: 'Maintain 90% Deadline Compliance',
        category: 'career',
        targetDate: nextFriday.toISOString(),
        progress: 82,
        habits: [
          { name: 'Plan daily focus sessions', frequency: 'daily', history: [yesterday.toISOString().split('T')[0]] },
          { name: 'Perform weekly risk checks', frequency: 'weekly', history: [] }
        ]
      },
      'go_2': {
        goalId: 'go_2',
        userId: guestUid,
        title: 'Learn Advanced Gemini Integration',
        category: 'study',
        targetDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 40,
        habits: [
          { name: 'Read AI SDK docs for 15m', frequency: 'daily', history: [yesterday.toISOString().split('T')[0]] }
        ]
      }
    };
    localStorage.setItem('dg_db_goals', JSON.stringify(sampleGoals));

    // Seed Plans
    const samplePlans = {
      'pl_1': {
        planId: 'pl_1',
        userId: guestUid,
        generatedSchedule: [
          {
            date: new Date().toISOString().split('T')[0],
            timeBlocks: [
              { startTime: '10:00', endTime: '11:30', taskId: 'tsk_2', subtaskId: 'sub_2c', taskTitle: 'Build React UI for Vibe2Ship', subtaskTitle: 'Integrate browser speech synthesis' },
              { startTime: '14:00', endTime: '15:30', taskId: 'tsk_3', subtaskId: 'sub_3a', taskTitle: 'Prepare submission slideshow', subtaskTitle: 'Write outline summary docs' }
            ]
          }
        ],
        progress: 0.5,
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem('dg_db_plans', JSON.stringify(samplePlans));

    // Log user in
    localStorage.setItem('dg_user', JSON.stringify(guestUser));
    
    // Dispatch auth state change
    window.location.reload(); // Simple refresh forces the app state to reevaluate auth
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-app-bg relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-[120px] -z-10"
           style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.10), transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[120px] -z-10"
           style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08), transparent 70%)' }} />

      <div className="w-full max-w-md glass-card p-8 flex flex-col gap-6 shadow-card animate-slide-up">

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-ocean"
               style={{ background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)' }}>
            <BrainCircuit className="w-7 h-7 text-white animate-pulse-glow" />
          </div>
          <h2 className="font-extrabold text-2xl text-app-dark mt-1">Deadline Guardian AI</h2>
          <p className="text-slate-500 text-xs max-w-xs">
            "An AI productivity companion that doesn't just remind you — it helps you finish."
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                className="glass-input pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                className="glass-input pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-btn-primary flex justify-center py-3 disabled:opacity-40"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-1">
          <div className="w-full border-t border-slate-200"></div>
          <span className="absolute px-3 bg-white text-[10px] font-bold tracking-wider uppercase text-slate-400">or</span>
        </div>

        {/* Third-party buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full glass-btn-secondary flex items-center justify-center gap-2.5 py-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <button
            onClick={handleGuestExplore}
            className="w-full glass-btn-primary py-3 px-4 flex items-center justify-center gap-2"
          >
            ⚡ Explore as Guest (Instant Sandbox)
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-1">
          New to the Guardian?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </main>
  );
}
