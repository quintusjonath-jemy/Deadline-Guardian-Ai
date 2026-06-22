import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  ShieldAlert, 
  AlertCircle, 
  Activity, 
  Clock, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { queryDocuments, whereClause, authInstance, streamDocuments } from '../firebase';
import { analyzeDeadlineRisk } from '../gemini';

export default function Analytics() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [selectedTaskRisk, setSelectedTaskRisk] = useState(null);
  const [riskDetails, setRiskDetails] = useState(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);

  useEffect(() => {
    const user = authInstance.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    const unsubscribe = streamDocuments(
      'tasks',
      [whereClause('userId', '==', user.uid)],
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(list);
        
        // Auto-select first pending task for risk analysis
        const pending = list.filter(t => t.status !== 'completed');
        if (pending.length > 0 && !selectedTaskRisk) {
          triggerRiskAnalysis(pending[0]);
        }
      }
    );

    return unsubscribe;
  }, []);

  const triggerRiskAnalysis = async (task) => {
    setSelectedTaskRisk(task.id);
    setIsLoadingRisk(true);
    try {
      const result = await analyzeDeadlineRisk(task);
      setRiskDetails(result);
    } catch (e) {
      console.error(e);
      setRiskDetails(null);
    } finally {
      setIsLoadingRisk(false);
    }
  };

  // Chart Data preparation
  const getAreaChartData = () => {
    // Mock daily compliance progress over past week
    return [
      { name: 'Mon', score: 85 },
      { name: 'Tue', score: 90 },
      { name: 'Wed', score: 82 },
      { name: 'Thu', score: 88 },
      { name: 'Fri', score: 94 },
      { name: 'Sat', score: 92 },
      { name: 'Sun', score: 82 }
    ];
  };

  const getBarChartData = () => {
    // Number of tasks completed vs pending by category (mock/real mix)
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const pendingCount = tasks.filter(t => t.status !== 'completed').length;
    
    return [
      { name: 'Completed Tasks', count: completedCount, color: '#34A853' },
      { name: 'Active Tasks', count: pendingCount, color: '#4285F4' },
      { name: 'Overdue Alerts', count: tasks.filter(t => {
        if (t.status === 'completed') return false;
        return new Date(t.deadline) < new Date();
      }).length, color: '#EA4335' }
    ];
  };

  const getPriorityRiskBadge = (level) => {
    if (level === 'Critical' || level === 'High') return 'bg-brand-red/15 text-brand-red border border-brand-red/35';
    if (level === 'Medium') return 'bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/35';
    return 'bg-brand-green/15 text-brand-green border border-brand-green/35';
  };

  return (
    <div className="pl-68 pr-8 py-8 min-h-screen">
      
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Deadline Risk Analytics</h2>
        <p className="text-slate-400 text-sm mt-1">
          Proactive vulnerability scanning and predictive completion metrics.
        </p>
      </header>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Compliance Trend Chart */}
        <section className="glass-panel rounded-2xl border border-slate-800 p-6">
          <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-blue" />
            <span>Productivity Score Trend</span>
          </h3>
          
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getAreaChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4285F4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4285F4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[50, 100]} stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161F30', borderColor: '#243249', borderRadius: '8px' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#4285F4" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Task Volume Distribution */}
        <section className="glass-panel rounded-2xl border border-slate-800 p-6">
          <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-green" />
            <span>Workspace Load Volume</span>
          </h3>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getBarChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161F30', borderColor: '#243249', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {getBarChartData().map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Proactive Risk Scan Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Task List selector (1/3 width) */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 xl:col-span-1">
          <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest mb-4">
            Deadline compliance Scan
          </h3>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {tasks.filter(t => t.status !== 'completed').length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No active tasks to analyze.</p>
            ) : (
              tasks.filter(t => t.status !== 'completed').map((task) => (
                <div 
                  key={task.id}
                  onClick={() => triggerRiskAnalysis(task)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                    selectedTaskRisk === task.id 
                      ? 'bg-brand-blue/10 border-brand-blue' 
                      : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <span className="font-bold text-slate-200 truncate">{task.title}</span>
                    <span className="text-[9px] text-slate-500 font-bold shrink-0">{task.estimatedHours}h</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Due: {new Date(task.deadline).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Gemini risk Analysis Panel (2/3 width) */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 xl:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-brand-blue" />
              <span>AI Compliancy Assessment</span>
            </h3>

            {isLoadingRisk ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-brand-blue">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Running risk simulation models...</span>
              </div>
            ) : riskDetails ? (
              <div className="space-y-5">
                {/* Risk score pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Predictive Risk Level</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1.5 ${getPriorityRiskBadge(riskDetails.riskLevel)}`}>
                      {riskDetails.riskLevel} ({riskDetails.riskScore}% Failure Chance)
                    </span>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Reasoning Summary</span>
                    <p className="text-xs text-slate-300 mt-1 font-medium">{riskDetails.reasoning}</p>
                  </div>
                </div>

                {/* Mitigation Checklist */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">AI-Prescribed Mitigation Steps</h4>
                  <div className="space-y-2">
                    {riskDetails.recommendations?.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/20 border border-slate-850 text-xs text-slate-300">
                        <AlertCircle className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-500">
                Select a pending task from the list to trigger predictive deadline scanning.
              </div>
            )}
          </div>

          <div className="border-t border-slate-850 pt-4 mt-6 flex justify-between items-center text-xs text-slate-500">
            <span>Powered by Gemini 2.5 predictive analysis</span>
            <button 
              onClick={() => navigate('/planner')}
              className="font-bold text-brand-blue hover:underline flex items-center gap-1"
            >
              Re-schedule this task <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </section>

    </div>
  );
}
