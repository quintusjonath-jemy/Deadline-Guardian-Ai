import { Link } from 'react-router-dom';
import { 
  BrainCircuit, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  Mic, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  TrendingUp,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { authInstance } from '../firebase';

export default function Landing() {
  const user = authInstance.currentUser;

  const coreProblems = [
    {
      title: "Traditional Apps Only Remind",
      description: "Standard calendars alert you a task is due, but do nothing to help you actually execute and complete it.",
      icon: Clock,
      accent: '#EF4444',
      bg: 'rgba(239,68,68,0.07)',
      border: 'rgba(239,68,68,0.18)',
    },
    {
      title: "Task Paralysis & Overwhelm",
      description: "Big goals like 'Build Portfolio Site' cause friction. Without step-by-step breakdowns, starting feels impossible.",
      icon: AlertTriangle,
      accent: '#F59E0B',
      bg: 'rgba(245,158,11,0.07)',
      border: 'rgba(245,158,11,0.18)',
    },
    {
      title: "Burnout & Rigid Timelines",
      description: "Missed schedule slots accumulate, causing users to abandon their entire planning framework out of stress.",
      icon: TrendingUp,
      accent: '#EF4444',
      bg: 'rgba(239,68,68,0.05)',
      border: 'rgba(239,68,68,0.14)',
    }
  ];

  const features = [
    {
      title: "AI Task Breakdown Agent",
      description: "Input any goal and Gemini 2.5 Flash instantly decomposes it into executable step-by-step checklists.",
      icon: BrainCircuit,
      accent: '#0EA5E9',
    },
    {
      title: "Deadline Risk Predictor",
      description: "Our priority engine evaluates remaining workload hours against available slots to calculate live risk scores.",
      icon: ShieldCheck,
      accent: '#10B981',
    },
    {
      title: "Smart Recovery Agent",
      description: "Missed a focus session? The Recovery Agent auto-redistributes your tasks to avoid burnout and keep you on track.",
      icon: UserCheck,
      accent: '#14B8A6',
    },
    {
      title: "Voice Task Creation",
      description: "Create plans hands-free. Native Speech Recognition parses titles and deadlines into your agenda instantly.",
      icon: Mic,
      accent: '#F59E0B',
    },
    {
      title: "AI Time-Block Planner",
      description: "AI-generated daily plans automatically block out focus hours for every task based on deadline urgency.",
      icon: Calendar,
      accent: '#06B6D4',
    },
    {
      title: "AI Productivity Coach",
      description: "A chat companion that knows your exact tasks and timelines to give tailored, personal time-saving advice.",
      icon: Sparkles,
      accent: '#8B5CF6',
    }
  ];

  const stats = [
    { label: 'Tasks Managed', value: '2,000+' },
    { label: 'Deadlines Saved', value: '98%' },
    { label: 'AI Accuracy', value: '4.9★' },
    { label: 'Active Users', value: '500+' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden"
         style={{ background: '#F8FAFC' }}>

      {/* ── Ambient background orbs ── */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.08), transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] -z-10 pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.07), transparent 70%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[160px] -z-10 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.04), transparent 70%)' }} />

      {/* ── NAVIGATION ── */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 backdrop-blur-xl py-4 px-6 md:px-12 flex justify-between items-center"
           style={{ background: 'rgba(248,250,252,0.85)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-ocean"
               style={{ background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)' }}>
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-app-dark">Deadline Guardian</h1>
            <span className="text-[9px] font-bold tracking-widest uppercase text-primary block">
              AI Productivity Companion
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="glass-btn-primary py-2 px-5 text-sm flex items-center gap-1.5">
              Launch App <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-slate-500 hover:text-app-dark font-semibold text-sm transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="glass-btn-primary py-2 px-5 text-sm">
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center flex flex-col items-center gap-7">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase animate-slide-up"
             style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: '#0EA5E9' }}>
          <Sparkles className="w-3.5 h-3.5" />
          Vibe2Ship Hackathon 2026 · Powered by Gemini 2.5 Flash
        </div>

        <h2 className="text-5xl md:text-[68px] font-black tracking-tight text-app-dark leading-[1.08] max-w-4xl animate-slide-up"
            style={{ animationDelay: '0.1s' }}>
          Your Deadlines,{' '}
          <br className="hidden md:inline" />
          Guarded by{' '}
          <span className="shimmer-text">Active Agentic AI</span>
        </h2>

        <p className="text-slate-500 text-lg max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Traditional apps only remind you of missed work. Deadline Guardian AI actively decomposes your goals,
          plans your day, predicts deadline risk, and helps you{' '}
          <span className="font-semibold text-app-dark">recover when you fall behind</span>.
        </p>

        <div className="flex flex-wrap gap-3 mt-2 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {user ? (
            <Link to="/dashboard" className="glass-btn-primary py-3.5 px-9 text-base flex items-center gap-2 shadow-ocean-lg">
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="glass-btn-primary py-3.5 px-9 text-base shadow-ocean-lg flex items-center gap-2">
                Protect Your Timeline <Zap className="w-5 h-5" />
              </Link>
              <Link to="/login" className="glass-btn-secondary py-3.5 px-9 text-base">
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs text-slate-400 font-medium animate-fade-in"
             style={{ animationDelay: '0.4s' }}>
          {['No credit card required', 'Free to start', 'AI-powered by Gemini'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="glass-card p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black ocean-gradient-text">{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WAVE DIVIDER ── */}
      <div className="wave-divider -mt-4">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 30 C360 60 720 0 1080 30 C1260 45 1380 20 1440 30 L1440 60 L0 60 Z"
            fill="rgba(14,165,233,0.06)"
          />
          <path
            d="M0 40 C300 20 600 55 900 35 C1100 22 1300 50 1440 40 L1440 60 L0 60 Z"
            fill="rgba(20,184,166,0.04)"
          />
        </svg>
      </div>

      {/* ── PROBLEM SECTION ── */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">The Problem</p>
          <h3 className="text-3xl font-extrabold text-app-dark">Why Traditional Planners Fail</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
            Students and professionals miss deadlines not because of lack of effort — but because existing tools offer zero active assistance.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coreProblems.map((prob, i) => (
            <div key={i} className="glass-card p-6 relative overflow-hidden group hover:shadow-card-hover transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-card"
                   style={{ background: `linear-gradient(90deg, ${prob.accent}, transparent)` }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: prob.bg, border: `1px solid ${prob.border}` }}>
                <prob.icon className="w-6 h-6" style={{ color: prob.accent }} />
              </div>
              <h4 className="text-base font-bold text-app-dark mb-2">{prob.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{prob.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-slate-100">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">What We Do</p>
          <h3 className="text-3xl font-extrabold text-app-dark">The Active AI Companion</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
            Explore the agentic features designed to secure your workload timelines and keep you consistent.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <div key={i} className="glass-card p-6 flex flex-col gap-3 group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                   style={{ background: `${feat.accent}14`, border: `1px solid ${feat.accent}30` }}>
                <feat.icon className="w-5 h-5" style={{ color: feat.accent }} />
              </div>
              <h4 className="text-base font-bold text-app-dark">{feat.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section className="w-full border-t border-slate-100 py-20 px-6 text-center flex flex-col items-center gap-5 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.04), rgba(20,184,166,0.04))' }}>
        <div className="absolute inset-0 -z-10 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.06), transparent 70%)' }} />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide"
             style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', color: '#0EA5E9' }}>
          <Zap className="w-3.5 h-3.5" /> Get started in under 60 seconds
        </div>
        <h4 className="text-3xl font-extrabold text-app-dark max-w-lg leading-tight">
          Ready to stop missing deadlines?
        </h4>
        <p className="text-slate-500 text-sm max-w-md leading-relaxed">
          Start planning with active breakdowns, calendar integration, habit trackers, and voice commands — completely free.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link to="/register" className="glass-btn-primary py-3 px-8 text-base shadow-ocean-lg flex items-center gap-2">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="glass-btn-secondary py-3 px-8 text-base">
            Sign In
          </Link>
        </div>
        <span className="text-[11px] text-slate-400 mt-6">© 2026 Deadline Guardian AI. All rights reserved.</span>
      </section>
    </div>
  );
}
