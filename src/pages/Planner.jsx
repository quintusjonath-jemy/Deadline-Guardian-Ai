import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { queryDocuments, whereClause, authInstance, setDocument, streamDocuments } from '../firebase';
import { generateSchedule } from '../gemini';

export default function Planner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [plan, setPlan] = useState(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const currUser = authInstance.currentUser;
    if (!currUser) {
      navigate('/login');
      return;
    }
    setUser(currUser);

    // Stream tasks
    const unsubscribeTasks = streamDocuments(
      'tasks',
      [whereClause('userId', '==', currUser.uid)],
      (snapshot) => {
        const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(tasksList);
      }
    );

    // Stream plan
    const unsubscribePlans = streamDocuments(
      'plans',
      [whereClause('userId', '==', currUser.uid)],
      (snapshot) => {
        if (snapshot.docs.length > 0) {
          setPlan(snapshot.docs[0].data());
        } else {
          setPlan(null);
        }
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribePlans();
    };
  }, []);

  const handleRegenerateSchedule = async () => {
    if (tasks.filter(t => t.status !== 'completed').length === 0) {
      alert("Please add some active tasks first before generating a schedule roadmap.");
      return;
    }

    setIsUpdating(true);
    try {
      // 1. Fetch mock/real Google calendar events
      const eventsSnap = await queryDocuments('notifications', whereClause('userId', '==', user.uid));
      // In a real app we'd fetch Google Calendar events; for demonstration, we pass mock events or standard work constraints.
      const mockCalendarEvents = [
        { title: "Weekly Sync Meeting", startTime: "09:00", endTime: "10:00" },
        { title: "Lunch Break", startTime: "12:00", endTime: "13:00" }
      ];

      // 2. Call Gemini Schedule Generator
      const newSchedule = await generateSchedule(tasks, mockCalendarEvents);
      console.log("New schedule generated:", newSchedule);

      // 3. Write plan to database
      const planData = {
        userId: user.uid,
        generatedSchedule: newSchedule,
        progress: 0,
        updatedAt: new Date().toISOString()
      };

      // Set document under user UID (one plan document per user for simplicity)
      await setDocument('plans', user.uid, planData);
      setSelectedDayIdx(0);
    } catch (e) {
      console.error("Error generating planner schedule:", e);
      alert("Failed to build schedule. Check your connection and try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getActiveDayPlan = () => {
    if (!plan || !plan.generatedSchedule || plan.generatedSchedule.length === 0) return null;
    return plan.generatedSchedule[selectedDayIdx] || null;
  };

  const activeDayPlan = getActiveDayPlan();
  const daysCount = plan?.generatedSchedule?.length || 0;

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="pl-68 pr-8 py-8 min-h-screen">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Smart Planner Workspace</h2>
          <p className="text-slate-400 text-sm mt-1">AI-powered time allocation and schedule conflict resolution.</p>
        </div>

        <button
          onClick={handleRegenerateSchedule}
          disabled={isUpdating}
          className="glass-btn-primary flex items-center justify-center gap-2 py-3 px-6 shrink-0 self-start sm:self-auto disabled:opacity-40"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Re-organizing time blocks...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Regenerate AI Schedule
            </>
          )}
        </button>
      </header>

      {/* Date Navigation Bar */}
      {daysCount > 0 && (
        <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-6">
          <button 
            disabled={selectedDayIdx === 0}
            onClick={() => setSelectedDayIdx(prev => prev - 1)}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Focus Roadmap Day</span>
            <span className="text-base font-extrabold text-slate-100">
              {activeDayPlan ? formatDateLabel(activeDayPlan.date) : `Day ${selectedDayIdx + 1}`}
            </span>
          </div>

          <button 
            disabled={selectedDayIdx >= daysCount - 1}
            onClick={() => setSelectedDayIdx(prev => prev + 1)}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Planner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Schedule Timeline (Col span 2) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6">
            <h3 className="font-extrabold text-lg text-slate-200 mb-6 flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-brand-blue" />
              <span>Time-Block Roadmap</span>
            </h3>

            {!activeDayPlan || !activeDayPlan.timeBlocks || activeDayPlan.timeBlocks.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-400">No scheduled blocks found</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Click the "Regenerate AI Schedule" button at the top to have Gemini analyze your active tasks and block out time automatically.
                </p>
              </div>
            ) : (
              <div className="relative border-l border-slate-800/80 ml-4 pl-8 space-y-6">
                {activeDayPlan.timeBlocks.map((block, idx) => (
                  <div key={idx} className="relative group">
                    
                    {/* Time Marker Circle */}
                    <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-brand-blue flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-blue animate-pulse-glow"></div>
                    </div>

                    <div className="glass-panel border border-slate-800/70 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-slate-700">
                      <div>
                        {/* Time Block Title */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                            {block.startTime} - {block.endTime}
                          </span>
                          <span className="text-xs text-brand-blue font-bold tracking-wide">
                            {block.taskTitle}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-extrabold text-slate-200 mt-2">
                          {block.subtaskTitle}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate('/tasks')}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-850 hover:border-slate-700 bg-slate-900/60 text-xs text-slate-300 font-bold transition-all"
                        >
                          Focus Milestones
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sync Controls / Legend panel */}
        <section className="space-y-6">
          
          {/* Guardian Agent Coaching Status */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-6">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest mb-4">
              Schedule Health
            </h3>

            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Optimal Distribution</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    AI blocks are segmented in 1.5-hour study blocks to maximize cognitive load efficiency and reduce task completion risk.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Buffer Blocks Configured</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    A default 1-hour rest buffer has been mapped between sessions to accommodate unexpected meeting requests.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prompting instruction widget */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-6 bg-gradient-to-br from-brand-blue/5 to-transparent relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-brand-blue/5 rounded-full blur-xl"></div>
            <h4 className="text-xs font-bold text-brand-blue tracking-wider uppercase mb-2">PRO TIP</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect your external Google Calendar in the <span className="font-semibold text-white">Settings</span> page. The AI agent will automatically re-allocate blocks to fit inside your calendar schedule gaps.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
