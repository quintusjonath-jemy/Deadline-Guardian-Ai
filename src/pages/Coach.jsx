import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  User, 
  BrainCircuit, 
  HelpCircle, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { whereClause, authInstance, streamDocuments } from '../firebase';
import { askAiCoach } from '../gemini';

export default function Coach() {
  const navigate = useNavigate();
  const [user] = useState(() => authInstance.currentUser);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      content: "Hi there! I am your Guardian AI Coach. I analyze your current tasks, priorities, and deadlines to help you structure your day and avoid task overwhelm. What can I help you plan today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Stream tasks list to pass as live context to Gemini
    const unsubscribe = streamDocuments(
      'tasks',
      [whereClause('userId', '==', user.uid)],
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter out completed tasks so the coach focuses on pending items
        setTasks(list.filter(t => t.status !== 'completed'));
      }
    );

    return () => unsubscribe();
  }, [user, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    setInputValue('');
    const userMsg = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      sender: 'user',
      content: text
    };
    
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Query AI Coach with chat history and current tasks context
      const reply = await askAiCoach([...messages, userMsg], tasks);
      
      setMessages(prev => [...prev, {
        id: 'reply_' + Math.random().toString(36).substr(2, 9),
        sender: 'ai',
        content: reply
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: 'error_' + Math.random().toString(36).substr(2, 9),
        sender: 'ai',
        content: "Sorry, I lost connection to the core priority node. Let's try again in a second."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "How should I prepare for tomorrow's exam?",
    "I only have 2 hours today. What should I prioritize?",
    "Review my pending tasks and tell me if they are safe.",
    "Give me a 50-10 Pomodoro session outline for my high priority items."
  ];

  return (
    <div className="pl-68 pr-8 py-8 min-h-screen bg-app-bg flex flex-col justify-between h-screen relative">
      {/* Page Header */}
      <header className="mb-4">
        <h2 className="text-3xl font-extrabold text-app-dark tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
          <span>AI Productivity Coach</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Discuss strategies, resolve schedule conflicts, and stay motivated with your personal planning advisor.
        </p>
      </header>

      {/* Chat workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 mb-4">
        {/* Chat Thread Panel */}
        <section className="lg:col-span-3 glass-card p-4 flex flex-col justify-between min-h-0">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.sender === 'user' 
                    ? 'bg-primary/10 border-primary/20 text-primary' 
                    : 'bg-teal-500/10 border-teal-500/20 text-teal-600'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                </div>

                {/* Bubble content */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-tr-none border-transparent'
                    : 'bg-white text-slate-800 rounded-tl-none border-slate-200/60 shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 mr-auto max-w-[80%] items-center">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white text-slate-500 rounded-2xl rounded-tl-none border border-slate-200/60 p-4 text-xs font-semibold animate-pulse shadow-sm">
                  Analyzing timeline constraints & coaching...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt input field */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-3 bg-white/90 border border-slate-200 p-2 rounded-xl focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-sky-500/15 transition-all shadow-sm"
          >
            <input
              type="text"
              className="flex-1 bg-transparent border-none text-slate-800 text-sm focus:outline-none px-2 py-2 placeholder:text-slate-400"
              placeholder="Ask for prioritization advice, Pomodoro schedules, or recovery tactics..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-primary hover:bg-sky-600 text-white p-2.5 rounded-lg disabled:opacity-40 transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>

        {/* Suggestion & Context Panel */}
        <aside className="space-y-6 flex flex-col min-h-0">
          {/* Quick Questions Card */}
          <div className="glass-card rounded-2xl p-5 shrink-0">
            <h3 className="text-sm font-extrabold text-app-dark flex items-center gap-2 mb-3.5">
              <HelpCircle className="w-4.5 h-4.5 text-primary" />
              <span>Suggested Queries</span>
            </h3>
            <div className="space-y-2.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-xl bg-white border border-slate-200/80 hover:border-primary/30 hover:bg-sky-50/50 text-xs text-slate-500 hover:text-primary transition-all text-ellipsis overflow-hidden shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tasks Context View */}
          <div className="glass-card rounded-2xl p-5 flex-1 overflow-y-auto min-h-0 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-app-dark flex items-center gap-2 mb-3">
                <BrainCircuit className="w-4.5 h-4.5 text-teal-600" />
                <span>Coach Task Context</span>
              </h3>
              <p className="text-[10px] text-slate-500 leading-normal mb-4">
                The Coach automatically reviews these pending tasks to formulate your customized advice.
              </p>

              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  No active tasks. Seed sample data to test context!
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 4).map(t => (
                    <div 
                      key={t.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-left"
                    >
                      <p className="text-xs font-bold text-slate-700 truncate">{t.title}</p>
                      <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block">
                        Hours: {t.estimatedHours || 2}h | Priority: {t.priority}
                      </span>
                    </div>
                  ))}
                  {tasks.length > 4 && (
                    <p className="text-[9px] text-slate-500 text-center font-semibold">
                      + {tasks.length - 4} more pending tasks
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/tasks')}
              className="w-full mt-4 glass-btn-secondary text-[10px] tracking-wider uppercase py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all"
            >
              Go to Tasks <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
