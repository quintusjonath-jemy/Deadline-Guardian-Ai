import { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, X, CalendarCheck2 } from 'lucide-react';
import { queryDocuments, whereClause, updateDocument, authInstance, createDocument } from '../firebase';
import { proposeRecoveryPlan } from '../gemini';

export default function RecoveryAgent() {
  const [missedTasks, setMissedTasks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [recoveryProposal, setRecoveryProposal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkForMissedTasks = async () => {
    const user = authInstance.currentUser;
    if (!user) return;

    try {
      // Fetch all tasks for the user
      const snap = await queryDocuments('tasks', whereClause('userId', '==', user.uid));
      const allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Find tasks that are pending/in_progress and have a deadline in the past
      const now = new Date();
      const missed = allTasks.filter(task => {
        if (task.status === 'completed') return false;
        const deadlineDate = new Date(task.deadline);
        return deadlineDate < now;
      });

      // Avoid bugging the user constantly; check if we already flagged these specific tasks in this browser session
      const flaggedStr = sessionStorage.getItem('dg_flagged_missed_tasks') || '[]';
      const flaggedIds = JSON.parse(flaggedStr);
      const newMissed = missed.filter(m => !flaggedIds.includes(m.id));

      if (newMissed.length > 0) {
        setMissedTasks(newMissed);
        
        // Fetch current plan to understand upcoming load
        const plansSnap = await queryDocuments('plans', whereClause('userId', '==', user.uid));
        const currentPlan = plansSnap.docs.length > 0 ? plansSnap.docs[0].data() : null;

        setIsLoading(true);
        // Ask Gemini to draft a recovery coaching response
        const proposal = await proposeRecoveryPlan(newMissed, currentPlan);
        setRecoveryProposal(proposal);
        setIsLoading(false);
        setIsOpen(true);

        // Store in session storage so it doesn't pop up again unless a new task is missed
        const updatedFlagged = [...flaggedIds, ...newMissed.map(m => m.id)];
        sessionStorage.setItem('dg_flagged_missed_tasks', JSON.stringify(updatedFlagged));
      }
    } catch (e) {
      console.error("Error in RecoveryAgent check:", e);
    }
  };

  useEffect(() => {
    // Only check if user is logged in
    const checkTimer = setTimeout(() => {
      checkForMissedTasks();
    }, 3000); // Check 3 seconds after loading to let things settle

    return () => clearTimeout(checkTimer);
  }, []);

  const handleApplyReschedule = async () => {
    const user = authInstance.currentUser;
    if (!user) return;

    setIsLoading(true);
    try {
      // 1. Extend the deadlines of the missed tasks by 2 days so they are no longer "missed"
      const now = new Date();
      const promises = missedTasks.map(task => {
        const extendedDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
        return updateDocument('tasks', task.id, {
          deadline: extendedDeadline,
          priority: 'high' // Bump priority since it slipped once
        });
      });

      await Promise.all(promises);

      // 2. Create a notification logging the adjustment
      await createDocument('notifications', {
        userId: user.uid,
        message: `Recovery Agent adjusted schedules for: ${missedTasks.map(t => t.title).join(', ')}. Priority bumped to High.`,
        type: 'recovery',
        read: false,
        timestamp: new Date().toISOString()
      });

      setIsOpen(false);
      
      // Emit custom event so that dashboard/tasks lists refresh their data
      window.dispatchEvent(new Event('task-rescheduled'));
      
      alert("Planner successfully updated! Deadlines extended and priority bumped to High to recover your momentum.");
    } catch (e) {
      console.error("Error updating recovery schedules:", e);
      alert("Could not update schedules. Please try manually.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || missedTasks.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 max-w-sm glass-panel border border-brand-red/30 rounded-xl shadow-2xl z-40 p-4 animate-fade-in">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-brand-red font-bold text-sm">
          <ShieldAlert className="w-5 h-5 text-brand-red animate-pulse" />
          <span>Deadline Compliance Alert</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-slate-300">
          I detected that deadlines for <span className="font-semibold text-slate-100">{missedTasks.length} task(s)</span> have passed without completion:
        </p>
        
        <ul className="text-xs text-slate-400 list-disc list-inside max-h-20 overflow-y-auto bg-slate-950/40 p-2 rounded border border-slate-800">
          {missedTasks.map(t => (
            <li key={t.id} className="truncate">{t.title}</li>
          ))}
        </ul>

        {isLoading ? (
          <div className="flex items-center gap-2 justify-center py-2 text-xs text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-blue" />
            <span>Formulating recovery proposal...</span>
          </div>
        ) : (
          recoveryProposal && (
            <div className="bg-brand-blue/5 border border-brand-blue/20 rounded p-2.5 space-y-2">
              <p className="text-xs italic text-slate-300">
                "{recoveryProposal.message}"
              </p>
              <p className="text-[10px] text-brand-blue font-bold uppercase tracking-wider">
                Suggested Action: {recoveryProposal.actionSuggested}
              </p>
            </div>
          )
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
          >
            Ignore
          </button>
          <button
            disabled={isLoading}
            onClick={handleApplyReschedule}
            className="px-3 py-1.5 rounded bg-gradient-to-r from-brand-red to-rose-600 hover:shadow-lg hover:shadow-red-500/20 text-xs text-white font-semibold flex items-center gap-1.5 disabled:opacity-40"
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            Accept & Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}
