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
  TrendingUp 
} from 'lucide-react';
import { authInstance } from '../firebase';

export default function Landing() {
  const user = authInstance.currentUser;

  const coreProblems = [
    {
      title: "Traditional Apps Only Remind",
      description: "Standard calendar notification alerts only tell you that a task is due, doing nothing to help you actually execute it.",
      icon: Clock,
      color: "text-brand-red bg-brand-red/10 border-brand-red/20"
    },
    {
      title: "Task Paralysis & Overwhelm",
      description: "Huge objectives like 'Build Portfolio Site' cause friction. Without step-by-step breakdowns, starting feels impossible.",
      icon: AlertTriangle,
      color: "text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20"
    },
    {
      title: "Burnout & Rigid Timelines",
      description: "Missed schedule slots accumulate, causing users to throw off their entire planning framework out of stress.",
      icon: TrendingUp,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20"
    }
  ];

  const features = [
    {
      title: "AI Task Breakdown Agent",
      description: "Input any goal (e.g. 'Build a Portfolio Website') and Gemini instantly decomposes it into step-by-step checklists.",
      icon: BrainCircuit,
    },
    {
      title: "Deadline Risk Predictor",
      description: "Our priority engine evaluates remaining workload hours against available slots to calculate an active risk score.",
      icon: ShieldCheck,
    },
    {
      title: "Smart Recovery Agent",
      description: "Missed yesterday's focus session? The Recovery Agent automatically redistributes your tasks to avoid burnout.",
      icon: UserCheck,
    },
    {
      title: "Voice Task Creation",
      description: "Create plans hands-free. Native Speech Recognition automatically parses titles and deadlines into your agenda.",
      icon: Mic,
    },
    {
      title: "AI Time-Block Planner",
      description: "AI-generated daily plans block out focus hours for exam revision, development, or syllabus reading automatically.",
      icon: Calendar,
    },
    {
      title: "AI Productivity Coach",
      description: "A chat companion that knows your exact syllabus, homework, and timelines to give tailored time-saving advice.",
      icon: Sparkles,
    }
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col bg-[#020813] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[140px] -z-10 animate-pulse-glow"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[140px] -z-10"></div>

      {/* Navigation Header */}
      <nav className="w-full border-b border-slate-900 bg-[#020813]/60 backdrop-blur-md sticky top-0 z-50 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-brand-blue/15 text-brand-blue p-2 rounded-lg border border-brand-blue/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Deadline Guardian
            </h1>
            <span className="text-[9px] text-brand-blue font-bold tracking-widest uppercase block">
              AI Productivity Companion
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard" className="glass-btn-primary py-2 px-5 text-sm flex items-center gap-1.5">
              Launch App <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-slate-400 hover:text-white font-semibold text-sm transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="glass-btn-primary py-2 px-5 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-xs text-brand-blue font-bold tracking-wide uppercase animate-pulse">
          <Sparkles className="w-4 h-4" /> Vibe2Ship Hackathon 2026 Submission
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mt-3">
          Your Deadlines, Guarded by <br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
            Active Agentic AI
          </span>
        </h2>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
          Traditional apps only remind you of missed work. Deadline Guardian AI actively decomposes your goals, plans your day, predicts deadline risk, and helps you recover when you fall behind.
        </p>

        <div className="flex gap-4 mt-6">
          {user ? (
            <Link to="/dashboard" className="glass-btn-primary py-3 px-8 text-base flex items-center gap-2">
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="glass-btn-primary py-3 px-8 text-base">
                Protect Your Timeline
              </Link>
              <Link to="/login" className="glass-btn-secondary py-3 px-8 text-base hover:bg-slate-800/40">
                Explore Features
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Core Problem Statement Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-12 border-t border-slate-900">
        <h3 className="text-2xl font-bold text-center text-white mb-10">
          Why Traditional Planners Fail Students & Professionals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coreProblems.map((prob, i) => (
            <div key={i} className="glass-panel border border-slate-900 rounded-2xl p-6 relative overflow-hidden">
              <div className={`p-3 rounded-xl border w-fit mb-4 ${prob.color}`}>
                <prob.icon className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-100 mb-2">{prob.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{prob.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-slate-900">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-extrabold text-white">The Active AI Companion</h3>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            Explore the advanced agentic features designed to secure your workload timelines and keep you consistent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <div key={i} className="glass-panel border border-slate-900 rounded-2xl p-6 flex flex-col gap-3 hover:border-brand-blue/30 transition-all duration-300">
              <div className="bg-brand-blue/10 text-brand-blue p-2.5 rounded-xl border border-brand-blue/20 w-fit">
                <feat.icon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-200">{feat.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Footer */}
      <section className="w-full bg-slate-950 border-t border-slate-900 py-12 px-6 text-center flex flex-col items-center gap-4">
        <h4 className="text-xl font-bold text-white">Ready to stop missing deadlines?</h4>
        <p className="text-slate-400 text-xs max-w-md">
          Start planning with active breakdowns, calendar integration, habit trackers, and voice commands immediately.
        </p>
        <Link to="/register" className="glass-btn-primary py-2.5 px-6 text-sm mt-2">
          Create Free Sandbox Account
        </Link>
        <span className="text-[10px] text-slate-500 mt-6">© 2026 Deadline Guardian AI. All rights reserved.</span>
      </section>
    </div>
  );
}
