import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Clock, 
  Trash2, 
  AlertCircle, 
  ListTodo, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  queryDocuments, 
  whereClause, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  authInstance, 
  streamDocuments,
  setDocument
} from '../firebase';
import { generateSubtasks, calculatePriority } from '../gemini';

export default function Tasks() {
  const navigate = useNavigate();
  const [user] = useState(() => authInstance.currentUser);
  const [tasks, setTasks] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(4);
  
  const [isLoading, setIsLoading] = useState(false);
  const [decomposingTaskId, setDecomposingTaskId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Stream tasks list
    const unsubscribe = streamDocuments(
      'tasks',
      [whereClause('userId', '==', user.uid)],
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort: pending first, then by deadline
        list.sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
        setTasks(list);
      }
    );

    // Listen for recovery agent trigger to reload tasks
    const handleReschedule = () => {
      // Stream takes care of it, but forces state re-sync if needed
    };
    window.addEventListener('task-rescheduled', handleReschedule);

    return () => {
      unsubscribe();
      window.removeEventListener('task-rescheduled', handleReschedule);
    };
  }, [user, navigate]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title || !deadline) return;

    setIsLoading(true);
    try {
      const taskObject = {
        userId: user.uid,
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        estimatedHours: Number(estimatedHours) || 4,
        status: 'pending',
        aiGeneratedSubtasks: [],
        createdAt: new Date().toISOString()
      };

      // 1. Calculate Priority using Gemini
      const priority = await calculatePriority(taskObject, tasks.length);
      taskObject.priority = priority;

      // 2. Write basic task to database
      const ref = await createDocument('tasks', taskObject);
      const newTaskId = ref.id;

      // 3. Clear Form
      setTitle('');
      setDescription('');
      setDeadline('');
      setEstimatedHours(4);

      // Expand the newly created task card to show loading state
      setExpandedTaskId(newTaskId);
      setDecomposingTaskId(newTaskId);

      // 4. Trigger Subtask Decomposition using Gemini
      const subtasks = await generateSubtasks(title, description, estimatedHours);
      
      const formattedSubtasks = subtasks.map((st, idx) => ({
        id: `sub_${newTaskId}_${idx}`,
        title: st.title,
        estimatedHours: st.estimatedHours || 1,
        status: 'pending'
      }));

      await updateDocument('tasks', newTaskId, {
        aiGeneratedSubtasks: formattedSubtasks
      });
      
    } catch (err) {
      console.error("Error creating task:", err);
    } finally {
      setIsLoading(false);
      setDecomposingTaskId(null);
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.aiGeneratedSubtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, status: st.status === 'completed' ? 'pending' : 'completed' };
      }
      return st;
    });

    // Check if ALL subtasks are now completed
    const allCompleted = updatedSubtasks.every(st => st.status === 'completed');
    const newStatus = allCompleted ? 'completed' : 'in_progress';

    try {
      await updateDocument('tasks', taskId, {
        aiGeneratedSubtasks: updatedSubtasks,
        status: newStatus
      });

      // Trigger recalculation of overall user productivity score
      recalculateProductivityScore();
    } catch (e) {
      console.error("Failed to update subtask:", e);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteDocument('tasks', taskId);
      recalculateProductivityScore();
    } catch (e) {
      console.error(e);
    }
  };

  const recalculateProductivityScore = async () => {
    if (!user) return;
    try {
      // Re-fetch tasks to ensure we have the absolute latest state
      const snap = await queryDocuments('tasks', whereClause('userId', '==', user.uid));
      const list = snap.docs.map(doc => doc.data());
      
      if (list.length === 0) return;
      
      const completedCount = list.filter(t => t.status === 'completed').length;
      const totalCount = list.length;
      const newScore = Math.round((completedCount / totalCount) * 100);

      await setDocument('users', user.uid, {
        productivityScore: newScore
      });
    } catch (e) {
      console.error("Error recalculating score:", e);
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'high') return 'bg-brand-red/10 text-brand-red border border-brand-red/20';
    if (priority === 'medium') return 'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20';
    return 'bg-brand-green/10 text-brand-green border border-brand-green/20';
  };

  return (
    <div className="pl-68 pr-8 py-8 min-h-screen grid grid-cols-1 xl:grid-cols-3 gap-8">
      
      {/* Task Creation Form (Left/Top) */}
      <section className="xl:col-span-1">
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 sticky top-8">
          <h3 className="font-extrabold text-lg text-white mb-6 flex items-center gap-2.5">
            <Plus className="w-5 h-5 text-brand-blue" />
            <span>Create AI Managed Task</span>
          </h3>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Task Title</label>
              <input
                type="text"
                required
                className="glass-input"
                placeholder="e.g. Compile presentation deck"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description</label>
              <textarea
                rows="3"
                className="glass-input resize-none"
                placeholder="Details for the AI agent (e.g. Include 5 slides on cost estimation)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Hours</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  className="glass-input"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deadline</label>
                <input
                  type="datetime-local"
                  required
                  className="glass-input text-xs"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full glass-btn-primary py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing details...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Decompose with Gemini
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Task List Workspace (Right/Bottom) */}
      <section className="xl:col-span-2 space-y-4">
        <header className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Your Workspace roadmaps</h2>
            <p className="text-xs text-slate-400">Expand tasks to check off AI-generated milestones.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-lg text-slate-400 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-brand-blue" />
            <span>{tasks.length} Total tasks</span>
          </div>
        </header>

        {tasks.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No active tasks</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">Use the form on the left or click the floating microphone in the bottom-right corner to speak to your assistant.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const isDecomposing = decomposingTaskId === task.id;
              
              // Calculate task progress percentage
              const totalSub = task.aiGeneratedSubtasks?.length || 0;
              const completedSub = task.aiGeneratedSubtasks?.filter(s => s.status === 'completed').length || 0;
              const progressPercent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

              return (
                <div 
                  key={task.id} 
                  className={`glass-panel border rounded-xl overflow-hidden transition-all duration-200 ${
                    task.status === 'completed' 
                      ? 'border-brand-green/20 opacity-75' 
                      : isExpanded 
                        ? 'border-brand-blue/30 shadow-lg' 
                        : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header Summary */}
                  <div 
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="p-4 flex justify-between items-center gap-4 cursor-pointer select-none"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border shrink-0 ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        <h4 className={`text-sm font-bold text-slate-100 truncate ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                          <span>{new Date(task.deadline).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">Estim. {task.estimatedHours}h</span>
                        {totalSub > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-brand-green font-semibold">{progressPercent}% complete</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="bg-slate-950/40 border-t border-slate-800/70 p-4 space-y-4">
                      {task.description && (
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Description</p>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{task.description}</p>
                        </div>
                      )}

                      {/* Subtask Roadmap section */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[9px] text-brand-blue font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                            <span>AI-Generated Breakdown Roadmap</span>
                          </p>
                          <span className="text-[10px] text-slate-400">{completedSub}/{totalSub} Completed</span>
                        </div>

                        {isDecomposing ? (
                          <div className="flex items-center gap-2.5 py-4 justify-center text-xs text-brand-blue">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>AI is designing your subtask breakdown...</span>
                          </div>
                        ) : totalSub === 0 ? (
                          <p className="text-xs text-slate-500 py-2">No subtasks generated yet.</p>
                        ) : (
                          <div className="space-y-2.5 mt-2.5">
                            {task.aiGeneratedSubtasks.map((st) => (
                              <label 
                                key={st.id} 
                                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-150 cursor-pointer select-none text-xs ${
                                  st.status === 'completed' 
                                    ? 'bg-slate-900/10 border-slate-800/20 text-slate-500' 
                                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={st.status === 'completed'}
                                  onChange={() => handleToggleSubtask(task.id, st.id)}
                                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-brand-blue focus:ring-brand-blue focus:ring-offset-slate-900"
                                />
                                <div className="flex-1 flex justify-between gap-4">
                                  <span className={st.status === 'completed' ? 'line-through' : ''}>{st.title}</span>
                                  <span className="text-[10px] text-slate-500 font-bold shrink-0">{st.estimatedHours}h</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Action footer */}
                      <div className="flex justify-between pt-2 border-t border-slate-800/40">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-xs text-brand-red font-bold flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-brand-red/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
