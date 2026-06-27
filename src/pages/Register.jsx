import { useState } from 'react';
import { Link, useNavigate as useNav } from 'react-router-dom';
import { BrainCircuit, Mail, Lock, ShieldAlert, User } from 'lucide-react';
import { registerUser, setDocument } from '../firebase';

export default function Register() {
  const navigate = useNav();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const res = await registerUser(email, password);
      // Initialize user record in the users database
      await setDocument('users', res.user.uid, {
        uid: res.user.uid,
        name: name || email.split('@')[0],
        email: email,
        productivityScore: 100,
        createdAt: new Date().toISOString()
      });
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      if (e.message.includes('email-already-in-use')) {
        setError('That email address is already registered.');
      } else {
        setError('Failed to create account. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-app-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] -z-10"
           style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.10), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[120px] -z-10"
           style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08), transparent 70%)' }} />

      <div className="w-full max-w-md glass-card p-8 flex flex-col gap-6 shadow-card animate-slide-up">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-brand-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-brand-red/5 rounded-full blur-3xl"></div>

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-ocean"
               style={{ background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)' }}>
            <BrainCircuit className="w-7 h-7 text-white animate-pulse-glow" />
          </div>
          <h2 className="font-extrabold text-2xl text-app-dark mt-1">Create Account</h2>
          <p className="text-slate-500 text-xs">
            Start protecting your deadlines with active AI planning.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
              <input
                type="text"
                required
                className="w-full glass-input pl-10"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full glass-input pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full glass-input pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full glass-input pl-10"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-btn-primary flex justify-center py-3 disabled:opacity-40"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
