import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, CheckCircle, RefreshCw, Flame, BookOpen, User } from 'lucide-react';
import { queryDocuments, whereClause, createDocument, updateDocument, authInstance, streamDocuments } from '../firebase';

export default function Goals() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [user, setUser] = useState(null);
  
  // Create Goal Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('study');
  const [targetDays, setTargetDays] = useState(30);
  const [habitName, setHabitName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currUser = authInstance.currentUser;
    if (!currUser) {
      navigate('/login');
      return;
    }
    setUser(currUser);

    const unsubscribe = streamDocuments(
      'goals',
      [whereClause('userId', '==', currUser.uid)],
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGoals(list);
      }
    );

    return unsubscribe;
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title || !habitName) return;

    setIsLoading(true);
    try {
      const newGoal = {
        userId: user.uid,
        title,
        category,
        progress: 0,
        targetDate: new Date(new Date().getTime() + targetDays * 24 * 60 * 60 * 1000).toISOString(),
        habits: [
          {
            name: habitName,
            frequency: 'daily',
            history: [] // Holds date strings (YYYY-MM-DD)
          }
        ]
      };

      await createDocument('goals', newGoal);
      setTitle('');
      setHabitName('');
    } catch (e) {
      console.error("Error creating goal:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHabit = async (goalId, habitIndex) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedHabits = [...goal.habits];
    const targetHabit = updatedHabits[habitIndex];

    const alreadyChecked = targetHabit.history.includes(todayStr);
    
    if (alreadyChecked) {
      // Remove
      targetHabit.history = targetHabit.history.filter(h => h !== todayStr);
    } else {
      // Add
      targetHabit.history.push(todayStr);
    }

    // Recalculate goal progress based on simple history count (cap at 100%)
    const completedDays = targetHabit.history.length;
    const newProgress = Math.min(100, Math.round((completedDays / 10) * 100)); // Say 10 checkins is 100%

    try {
      await updateDocument('goals', goalId, {
        habits: updatedHabits,
        progress: newProgress
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getCategoryIcon = (cat) => {
    if (cat === 'study') return <BookOpen className="w-5 h-5 text-brand-blue" />;
    return <Target className="w-5 h-5 text-brand-green" />;
  };

  return (
    <div className="pl-68 pr-8 py-8 min-h-screen grid grid-cols-1 xl:grid-cols-3 gap-8">
      
      {/* Goal creation Panel */}
      <section className="xl:col-span-1">
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 sticky top-8">
          <h3 className="font-extrabold text-lg text-white mb-6 flex items-center gap-2.5">
            <Target className="w-5 h-5 text-brand-blue" />
            <span>Define AI Tracked Goal</span>
          </h3>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Goal Focus</label>
              <input
                type="text"
                required
                className="glass-input"
                placeholder="e.g. Master algorithms"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Primary Habit Anchor</label>
              <input
                type="text"
                required
                className="glass-input"
                placeholder="e.g. Practice 1 problem daily"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Category</label>
                <select
                  className="glass-input text-xs"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="study">Study</option>
                  <option value="career">Career</option>
                  <option value="fitness">Fitness</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration Days</label>
                <input
                  type="number"
                  min="5"
                  max="365"
                  required
                  className="glass-input"
                  value={targetDays}
                  onChange={(e) => setTargetDays(e.target.value)}
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
                  Creating goal tracker...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Activate Goal
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Goal List Workspace */}
      <section className="xl:col-span-2 space-y-4">
        <header className="mb-4">
          <h2 className="text-2xl font-extrabold text-white">Your Long-term Anchors</h2>
          <p className="text-xs text-slate-400">Streak builders. Complete daily habits to progress your goal meters.</p>
        </header>

        {goals.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <Target className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No active goals configured</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Add goals on the left to start building consistency streaks.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div 
                key={goal.id} 
                className="glass-panel border border-slate-800 p-5 rounded-xl flex flex-col gap-4 hover:border-slate-700 transition-colors"
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                      {getCategoryIcon(goal.category)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{goal.title}</h4>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{goal.category}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-200">{goal.progress}% progress</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-brand-blue h-full transition-all duration-500" 
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>

                {/* Habit checklist list */}
                <div className="border-t border-slate-850 pt-3">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2">Anchored Habits</p>
                  <div className="space-y-2">
                    {goal.habits?.map((habit, idx) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isCompletedToday = habit.history.includes(todayStr);

                      return (
                        <div 
                          key={idx}
                          onClick={() => handleToggleHabit(goal.id, idx)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150 cursor-pointer select-none text-xs ${
                            isCompletedToday 
                              ? 'bg-brand-green/5 border-brand-green/20 text-slate-400' 
                              : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className={`w-4 h-4 ${isCompletedToday ? 'text-brand-green fill-brand-green/10' : 'text-slate-600'}`} />
                            <span className={isCompletedToday ? 'line-through' : ''}>{habit.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                            <Flame className={`w-3.5 h-3.5 ${habit.history.length > 0 ? 'text-orange-500 fill-orange-500/10 animate-pulse' : ''}`} />
                            <span>{habit.history.length} Streak Days</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
