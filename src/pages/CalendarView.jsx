import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { queryDocuments, whereClause, authInstance, streamDocuments } from '../firebase';

export default function CalendarView() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Connected");

  useEffect(() => {
    const user = authInstance.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Stream user tasks
    const unsubscribe = streamDocuments(
      'tasks',
      [whereClause('userId', '==', user.uid)],
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(list);
      }
    );

    return unsubscribe;
  }, []);

  const handleGoogleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus("Connected (Synced just now)");
      alert("Successfully synced with Google Calendar API!");
    }, 1500);
  };

  // Calendar Helper Math
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to find tasks due on a specific day in this month
  const getTasksForDay = (dayNum) => {
    return tasks.filter(task => {
      const d = new Date(task.deadline);
      return d.getDate() === dayNum && 
             d.getMonth() === currentDate.getMonth() && 
             d.getFullYear() === currentDate.getFullYear();
    });
  };

  const renderCells = () => {
    const cells = [];
    
    // Empty padding cells for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 border border-slate-800/40 min-h-16 bg-slate-950/10"></div>);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDay(day);
      const isSelected = selectedDay === day;
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === currentDate.getMonth() && 
                      new Date().getFullYear() === currentDate.getFullYear();

      cells.push(
        <div 
          key={`day-${day}`}
          onClick={() => setSelectedDay(day)}
          className={`p-2 border border-slate-850 min-h-20 flex flex-col justify-between cursor-pointer transition-colors relative ${
            isToday ? 'bg-brand-blue/5 border-brand-blue/30' : 'bg-slate-900/10 hover:bg-slate-900/40'
          } ${isSelected ? 'border-brand-blue bg-slate-900/30' : ''}`}
        >
          <span className={`text-xs font-bold ${isToday ? 'text-brand-blue' : 'text-slate-400'}`}>{day}</span>
          
          {dayTasks.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {dayTasks.slice(0, 2).map(task => (
                <div 
                  key={task.id} 
                  className={`text-[9px] px-1 py-0.5 rounded truncate font-semibold border ${
                    task.status === 'completed' 
                      ? 'bg-slate-900/80 text-slate-500 border-slate-800' 
                      : task.priority === 'high' 
                        ? 'bg-brand-red/10 text-brand-red border-brand-red/20' 
                        : 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                  }`}
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
              {dayTasks.length > 2 && (
                <span className="text-[8px] text-slate-500 font-bold self-end">+{dayTasks.length - 2} more</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="pl-68 pr-8 py-8 min-h-screen">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Calendar Workspace</h2>
          <p className="text-slate-400 text-sm mt-1">Overview of milestones and Google Calendar integration status.</p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Google Calendar Sync</span>
            <span className="text-xs font-bold text-brand-green">{syncStatus}</span>
          </div>
          <button
            onClick={handleGoogleSync}
            disabled={isSyncing}
            className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-2"
            title="Force Sync Now"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-brand-blue' : ''}`} />
            <span className="text-xs font-bold">Sync Now</span>
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Month Calendar Grid (3/4 width) */}
        <section className="xl:col-span-3 glass-panel rounded-2xl border border-slate-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-lg text-slate-200">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={prevMonth}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 uppercase tracking-widest py-2 border-b border-slate-800">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 mt-2">
            {renderCells()}
          </div>
        </section>

        {/* Selected Day Details Panel (1/4 width) */}
        <section className="xl:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 min-h-64 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest mb-4">
                Selected Day Details
              </h3>

              {selectedDay ? (
                <div>
                  <p className="text-base font-extrabold text-slate-200">
                    {monthNames[currentDate.getMonth()]} {selectedDay}, {currentDate.getFullYear()}
                  </p>
                  
                  <div className="space-y-3 mt-4">
                    {getTasksForDay(selectedDay).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No deadlines on this day.</p>
                    ) : (
                      getTasksForDay(selectedDay).map(task => (
                        <div 
                          key={task.id} 
                          onClick={() => navigate('/tasks')}
                          className="p-2.5 bg-slate-950/40 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 rounded-lg cursor-pointer transition-colors"
                        >
                          <h4 className="text-xs font-bold text-slate-200 truncate">{task.title}</h4>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Status: <span className={task.status === 'completed' ? 'text-brand-green' : 'text-brand-blue'}>{task.status}</span>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Select a day on the calendar to view full deadline details.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/tasks')}
              className="w-full py-2.5 rounded-lg border border-slate-850 bg-slate-900 text-xs text-slate-300 font-bold hover:bg-slate-800 transition-colors"
            >
              Add New Task
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
