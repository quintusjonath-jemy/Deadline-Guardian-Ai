import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  Flame, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  TrendingUp
} from 'lucide-react';
import { whereClause, getDocument, authInstance, streamDocuments, seedUserDatabase } from '../firebase';
import { analyzeDeadlineRisk } from '../gemini';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => authInstance.currentUser);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [productivityScore, setProductivityScore] = useState(100);
  const [aiTip, setAiTip] = useState("Scanning your schedule to compile recommendations...");
  const [coachingLoading, setCoachingLoading] = useState(true);
  const [animateStats, setAnimateStats] = useState(false);

  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    riskCount: 0,
    streak: 3
  });
  const [seeding, setSeeding] = useState(false);

  const handleSeedData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedUserDatabase(user.uid);
      await fetchData(user.uid);
    } catch (e) {
      console.error("Failed to seed database:", e);
    } finally {
      setSeeding(false);
    }
  };

  const fetchData = async (uid) => {
    try {
      const userDoc = await getDocument('users', uid);
      if (userDoc && userDoc.exists()) {
        setProductivityScore(userDoc.data().productivityScore || 100);
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  };

  const processStatsAndAiCoaching = useCallback(async (tasksList) => {
    const completed = tasksList.filter(t => t.status === 'completed').length;
    const pending = tasksList.filter(t => t.status !== 'completed').length;
    
    const now = new Date();
    const riskTasks = tasksList.filter(t => {
      if (t.status === 'completed') return false;
      const hoursLeft = (new Date(t.deadline) - now) / (1000 * 60 * 60);
      return hoursLeft > 0 && hoursLeft <= 48;
    });

    setStats({ completed, pending, riskCount: riskTasks.length, streak: 4 });
    setAnimateStats(true);

    if (riskTasks.length > 0) {
      setCoachingLoading(true);
      try {
        const highestRiskTask = riskTasks[0];
        const analysis = await analyzeDeadlineRisk(highestRiskTask);
        if (analysis && analysis.recommendations) {
          setAiTip(`"${highestRiskTask.title}" has a risk score of ${analysis.riskScore}%. ${analysis.reasoning} → ${analysis.recommendations[0]}`);
        }
      } catch (e) {
        console.error("AI coaching error:", e);
        setAiTip(`You have ${riskTasks.length} tasks due soon. Focus on completing them sequentially to keep your productivity high.`);
      } finally {
        setCoachingLoading(false);
      }
    } else {
      setAiTip("Looking solid! No high-risk deadlines approaching. Use this calm window to build consistency on your habits.");
      setCoachingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setTimeout(() => { fetchData(user.uid); }, 0);

    const unsubscribeTasks = streamDocuments(
      'tasks',
      [whereClause('userId', '==', user.uid)],
      (snapshot) => {
        const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(tasksList);
        processStatsAndAiCoaching(tasksList);
      }
    );

    const unsubscribePlans = streamDocuments(
      'plans',
      [whereClause('userId', '==', user.uid)],
      (snapshot) => {
        if (snapshot.docs.length > 0) {
          const planData = snapshot.docs[0].data();
          const todayStr = new Date().toISOString().split('T')[0];
          const todayPlan = planData.generatedSchedule?.find(s => s.date === todayStr);
          setSchedule(todayPlan?.timeBlocks || []);
        } else {
          setSchedule([]);
        }
      }
    );

    const handleReschedule = () => fetchData(user.uid);
    window.addEventListener('task-rescheduled', handleReschedule);

    return () => {
      unsubscribeTasks();
      unsubscribePlans();
      window.removeEventListener('task-rescheduled', handleReschedule);
    };
  }, [user, navigate, processStatsAndAiCoaching]);

  const getCountdownString = (deadlineStr) => {
    const diffMs = new Date(deadlineStr) - new Date();
    if (diffMs < 0) return "Overdue";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${mins}m remaining`;
  };

  const getRiskStrip = (task) => {
    if (!task.deadline) return 'risk-strip-low';
    const hoursLeft = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60);
    if (hoursLeft < 0) return 'risk-strip-high';
    if (hoursLeft <= 24) return 'risk-strip-high';
    if (hoursLeft <= 48) return 'risk-strip-medium';
    return 'risk-strip-low';
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'high') return 'badge-danger';
    if (priority === 'medium') return 'badge-warning';
    return 'badge-success';
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Score ring color
  const scoreColor = productivityScore >= 80 ? '#10B981' : productivityScore >= 60 ? '#F59E0B' : '#EF4444';

  const statCards = [
    {
      label: 'Active Tasks',
      value: stats.pending,
      icon: BarChart3,
      color: '#0EA5E9',
      bg: 'rgba(14,165,233,0.08)',
      border: 'rgba(14,165,233,0.2)',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.2)',
    },
    {
      label: 'At Risk',
      value: stats.riskCount,
      icon: AlertTriangle,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.2)',
    },
    {
      label: 'Day Streak',
      value: stats.streak,
      icon: Flame,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
    },
  ];

  return (
    <div className="pl-68 pr-8 py-8 min-h-screen bg-app-bg">
      {/* ══ HEADER ══ */}
      <header className="flex justify-between items-start mb-8 animate-fade-in">
        <div>
          <h2 className="text-2xl font-extrabold text-app-dark tracking-tight">
            {getGreeting()},{' '}
            <span className="ocean-gradient-text">{user?.displayName?.split(' ')[0] || 'Jemy'}</span>
            {' '}👋
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            You have{' '}
            <span className="font-bold text-primary">{stats.pending}</span> active tasks
            {stats.riskCount > 0 && (
              <>
                {' '}·{' '}
                <span className="font-bold text-danger">{stats.riskCount}</span> need attention today
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2.5 flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Compliance</p>
              <p className="text-sm font-extrabold text-app-dark">{productivityScore}%</p>
            </div>
          </div>
        </div>
      </header>

      {/* ══ EMPTY STATE / SEED DATA ══ */}
      {tasks.length === 0 && (
        <div className="glass-card border border-primary/20 p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in"
             style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(20,184,166,0.05))' }}>
          <div className="flex gap-4 items-center text-left">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                 style={{ background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)' }}>
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-bold text-app-dark">Populate Sandbox Data</h4>
              <p className="text-sm text-slate-500 mt-0.5">
                Your database is empty. Load sample tasks, habits, and AI planner schedule to see the app in action!
              </p>
            </div>
          </div>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="glass-btn-primary py-2.5 px-6 shrink-0"
          >
            {seeding ? 'Populating...' : '✨ Load Sample Data'}
          </button>
        </div>
      )}

      {/* ══ STAT CARDS ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="glass-card p-5 relative overflow-hidden group cursor-default"
            style={{
              animationDelay: `${i * 0.08}s`,
              animation: animateStats ? 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
              opacity: animateStats ? undefined : 0,
            }}
          >
            {/* Gradient top strip */}
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-card"
                 style={{ background: `linear-gradient(90deg, ${card.color}, transparent)` }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-3xl font-extrabold text-app-dark">{card.value}</p>
              </div>
              <div className="p-2.5 rounded-xl"
                   style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ MAIN 2-COLUMN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* AI Insight Panel */}
        <section className="lg:col-span-2 glass-card p-6 relative overflow-hidden flex flex-col justify-between">
          {/* Ambient glow */}
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-30"
               style={{ background: 'radial-gradient(circle, #0EA5E9, transparent)' }} />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)' }}>
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guardian AI Insight</p>
              </div>
              {!coachingLoading && (
                <span className="ml-auto badge-info">Live</span>
              )}
            </div>

            {coachingLoading ? (
              <div className="space-y-2.5 animate-pulse py-1">
                <div className="h-4 bg-slate-100 rounded-lg w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-5/6"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
              </div>
            ) : (
              <p className="text-base text-slate-700 leading-relaxed font-medium animate-fade-in">
                "{aiTip}"
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Autonomous priority analysis · updated live</span>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all duration-200"
            >
              Manage Tasks <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Compliance Score Ring */}
        <section className="glass-card p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Compliance Score</p>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Track */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="8" />
              {/* Score arc */}
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - productivityScore / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={scoreColor} />
                  <stop offset="100%" stopColor={scoreColor === '#10B981' ? '#06B6D4' : scoreColor} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-app-dark">{productivityScore}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On-Time</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4 leading-relaxed max-w-[180px]">
            {productivityScore >= 80
              ? "Excellent! Staying ahead of your plan."
              : "Slipping! Let AI reschedule tasks to restore compliance."}
          </p>

          <button
            onClick={() => navigate('/analytics')}
            className="mt-4 text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all"
          >
            View Analytics <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </div>

      {/* ══ SCHEDULE + DEADLINES ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's Time-Block Plan */}
        <section className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-extrabold text-base text-app-dark flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Time-Block Plan
            </h3>
            <button
              onClick={() => navigate('/planner')}
              className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all duration-200"
            >
              Open Planner <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {schedule.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200"
                 style={{ background: 'rgba(14,165,233,0.02)' }}>
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-3">No sessions scheduled for today.</p>
              <button
                onClick={() => navigate('/planner')}
                className="glass-btn-primary py-2 px-5 text-xs"
              >
                ⚡ Trigger AI Scheduler
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((block, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3.5 rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-ocean transition-all duration-200"
                  style={{ background: 'rgba(248,250,252,0.8)' }}
                >
                  <div className="flex flex-col items-center rounded-xl p-2.5 min-w-[72px] text-center shrink-0"
                       style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)' }}>
                    <Clock className="w-3.5 h-3.5 text-primary mb-1" />
                    <span className="text-xs font-extrabold text-app-dark leading-tight">{block.startTime}</span>
                    <span className="text-[9px] text-slate-400 font-medium">to {block.endTime}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{block.taskTitle}</p>
                    <p className="text-sm font-semibold text-app-dark mt-0.5 truncate">{block.subtaskTitle}</p>
                  </div>

                  <button
                    onClick={() => navigate('/tasks')}
                    className="p-2 rounded-xl transition-all duration-200 hover:shadow-ocean shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0EA5E9, #14B8A6)' }}
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Deadlines */}
        <section className="glass-card p-6">
          <h3 className="font-extrabold text-base text-app-dark flex items-center gap-2 mb-5">
            <ShieldCheck className="w-5 h-5 text-success" />
            Active Deadlines
          </h3>

          <div className="space-y-3">
            {tasks.filter(t => t.status !== 'completed').slice(0, 4).length === 0 ? (
              <div className="text-center py-10">
                <ShieldCheck className="w-10 h-10 text-success/30 mx-auto mb-2" />
                <p className="text-xs text-slate-400">All deadlines clear! 🎉</p>
              </div>
            ) : (
              tasks
                .filter(t => t.status !== 'completed')
                .slice(0, 4)
                .map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-2 hover:shadow-card transition-all duration-200 ${getRiskStrip(task)}`}
                    style={{ background: 'rgba(248,250,252,0.9)', paddingLeft: '14px' }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-bold text-app-dark truncate flex-1">{task.title}</h4>
                      <span className={getPriorityBadge(task.priority)}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{getCountdownString(task.deadline)}</span>
                    </div>
                  </div>
                ))
            )}
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="mt-4 w-full glass-btn-secondary py-2 text-xs text-center"
          >
            View All Tasks
          </button>
        </section>
      </div>
    </div>
  );
}
