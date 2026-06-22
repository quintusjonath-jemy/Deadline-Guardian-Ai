import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Flame, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { queryDocuments, whereClause, getDocument, authInstance, streamDocuments } from '../firebase';
import { analyzeDeadlineRisk } from '../gemini';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [productivityScore, setProductivityScore] = useState(100);
  const [aiTip, setAiTip] = useState("Scanning your schedule to compile recommendations...");
  const [coachingLoading, setCoachingLoading] = useState(true);

  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    riskCount: 0,
    streak: 3
  });

  useEffect(() => {
    const currUser = authInstance.currentUser;
    if (!currUser) {
      navigate('/login');
      return;
    }
    setUser(currUser);

    // Initial load
    fetchData(currUser.uid);

    // Stream tasks for live updates
    const unsubscribeTasks = streamDocuments(
      'tasks',
      [whereClause('userId', '==', currUser.uid)],
      (snapshot) => {
        const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(tasksList);
        processStatsAndAiCoaching(tasksList, currUser.uid);
      }
    );

    // Stream plans/schedule
    const unsubscribePlans = streamDocuments(
      'plans',
      [whereClause('userId', '==', currUser.uid)],
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

    // Listen to recovery agent reschedule triggers
    const handleReschedule = () => fetchData(currUser.uid);
    window.addEventListener('task-rescheduled', handleReschedule);

    return () => {
      unsubscribeTasks();
      unsubscribePlans();
      window.removeEventListener('task-rescheduled', handleReschedule);
    };
  }, []);

  const fetchData = async (uid) => {
    try {
      const userDoc = await getDocument('users', uid);
      if (userDoc && userDoc.exists()) {
        setProductivityScore(userDoc.data().productivityScore || 100);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const processStatsAndAiCoaching = async (tasksList, uid) => {
    const completed = tasksList.filter(t => t.status === 'completed').length;
    const pending = tasksList.filter(t => t.status !== 'completed').length;
    
    // Simple mock calculation for risk tasks (deadlines within 48 hours)
    const now = new Date();
    const riskTasks = tasksList.filter(t => {
      if (t.status === 'completed') return false;
      const hoursLeft = (new Date(t.deadline) - now) / (1000 * 60 * 60);
      return hoursLeft > 0 && hoursLeft <= 48;
    });

    setStats({
      completed,
      pending,
      riskCount: riskTasks.length,
      streak: 4 // Sample streak
    });

    // Compute AI Coaching suggestion based on the highest risk task
    if (riskTasks.length > 0) {
      setCoachingLoading(true);
      try {
        const highestRiskTask = riskTasks[0];
        const analysis = await analyzeDeadlineRisk(highestRiskTask);
        if (analysis && analysis.recommendations) {
          setAiTip(`Warning: "${highestRiskTask.title}" has a compliance risk of ${analysis.riskScore}%. ${analysis.reasoning} Recommendation: ${analysis.recommendations[0]}`);
        }
      } catch (e) {
        setAiTip(`You have ${riskTasks.length} tasks due soon. Focus on completing them sequentially to keep your productivity high.`);
      } finally {
        setCoachingLoading(false);
      }
    } else {
      setAiTip("Looking solid! No high-risk deadlines approaching. Use this calm window to build consistency on your habits.");
      setCoachingLoading(false);
    }
  };

  // Helper for computing countdown string
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

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-brand-red/10 text-brand-red border-brand-red/20';
    if (priority === 'medium') return 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20';
    return 'bg-brand-green/10 text-brand-green border-brand-green/20';
  };

  return (
    <div className="pl-68 pr-8 py-8 min-h-screen">
      {/* Top Banner Greeting */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.displayName || 'Guardian pilot'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Let's keep your deadlines safe. Here is your compliance status for today.
          </p>
        </div>
        <div className="flex gap-4">
          {/* Quick Streak Widget */}
          <div className="glass-panel border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Consistency Streak</p>
              <p className="text-sm font-extrabold text-slate-100">{stats.streak} Days</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Core AI Insights Panel */}
        <section className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800/80 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-blue/5 rounded-full blur-2xl"></div>
          <div>
            <div className="flex items-center gap-2 text-brand-blue font-bold text-sm tracking-wide mb-3">
              <Sparkles className="w-5 h-5" />
              <span>GUARDIAN AI COMPANION INSIGHT</span>
            </div>
            
            {coachingLoading ? (
              <div className="space-y-2 animate-pulse py-2">
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
              </div>
            ) : (
              <p className="text-base text-slate-200 leading-relaxed font-medium">
                "{aiTip}"
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">Autonomous priority analysis updated live</span>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-xs font-bold text-brand-blue flex items-center gap-1 hover:underline"
            >
              Manage Tasks <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Productivity Score Meter */}
        <section className="glass-panel rounded-2xl p-6 border border-slate-800/80 flex flex-col items-center justify-center text-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Compliance Score
          </h3>
          
          {/* Radial progress mockup using svg */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-brand-green fill-none transition-all duration-1000"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - productivityScore / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-100">{productivityScore}%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">On-Time</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed max-w-xs">
            {productivityScore >= 80 
              ? "Excellent! You are staying ahead of your plan and keeping task risks low." 
              : "Slipping! Let the AI assist you in rescheduling tasks to restore compliance."}
          </p>
        </section>
      </div>

      {/* Focus & Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule blocks */}
        <section className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800/80">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-blue" />
              <span>Today's Time-Block Plan</span>
            </h3>
            <button 
              onClick={() => navigate('/planner')}
              className="text-xs font-bold text-brand-blue flex items-center gap-1 hover:underline"
            >
              Open Planner <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {schedule.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
              <p className="text-slate-400 text-sm">No task sessions scheduled for today.</p>
              <button 
                onClick={() => navigate('/planner')}
                className="mt-3 text-xs bg-brand-blue/15 hover:bg-brand-blue/20 border border-brand-blue/30 text-brand-blue px-3.5 py-1.5 rounded-lg font-bold transition-all duration-200"
              >
                ⚡ Trigger AI Scheduler
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.map((block, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-4 p-3 bg-slate-900/40 border border-slate-800/70 hover:border-slate-800 rounded-xl transition-all duration-200"
                >
                  <div className="flex flex-col items-center bg-brand-blue/10 border border-brand-blue/15 rounded-lg p-2 min-w-20 text-center shrink-0">
                    <Clock className="w-4 h-4 text-brand-blue mb-1" />
                    <span className="text-xs font-extrabold text-slate-200 leading-tight">
                      {block.startTime}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">
                      to {block.endTime}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider truncate">
                      {block.taskTitle}
                    </p>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
                      {block.subtaskTitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate('/tasks')}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                      title="View Task Details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Impending Tasks Countdowns */}
        <section className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-brand-green" />
            <span>Active Deadlines</span>
          </h3>

          <div className="space-y-4">
            {tasks.filter(t => t.status !== 'completed').slice(0, 3).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">All deadlines clear!</p>
            ) : (
              tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task) => (
                <div key={task.id} className="p-3 bg-slate-900/30 border border-slate-800/60 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-slate-200 truncate flex-1">{task.title}</h4>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border shrink-0 ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Clock className="w-3.5 h-3.5 text-brand-blue" />
                    <span>{getCountdownString(task.deadline)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
