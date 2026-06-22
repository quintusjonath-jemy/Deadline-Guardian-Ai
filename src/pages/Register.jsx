import React, { useState } from 'react';
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
      navigate('/');
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
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 p-8 flex flex-col gap-6 shadow-2xl relative">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-brand-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-brand-red/5 rounded-full blur-3xl"></div>

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-brand-blue/15 text-brand-blue p-3.5 rounded-xl border border-brand-blue/20">
            <BrainCircuit className="w-8 h-8 animate-pulse-glow" />
          </div>
          <h2 className="font-extrabold text-2xl bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mt-2">
            Create Account
          </h2>
          <p className="text-slate-400 text-xs">
            Start protecting your deadlines with active AI planning.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-brand-red/10 border border-brand-red/30 rounded-lg p-3 text-xs text-brand-red flex items-center gap-2.5">
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
        <p className="text-center text-xs text-slate-400 mt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-blue font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
