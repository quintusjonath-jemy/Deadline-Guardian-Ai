import { useState } from 'react';
import { ShieldCheck, Key, Trash2, Cpu } from 'lucide-react';
import { getGeminiApiKey } from '../gemini';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('dg_gemini_api_key') || '');
  const [clientId, setClientId] = useState(() => localStorage.getItem('dg_google_client_id') || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('dg_gemini_api_key', apiKey.trim());
    localStorage.setItem('dg_google_client_id', clientId.trim());
    
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      window.location.reload(); // Refresh to re-initialize Gemini/Firebase configurations
    }, 1500);
  };

  const handleClearDb = () => {
    if (!window.confirm("Are you sure you want to clear your local database sandbox? This deletes all custom tasks, goals, and schedule blocks.")) return;
    
    // Remove local mocks
    localStorage.removeItem('dg_db_tasks');
    localStorage.removeItem('dg_db_goals');
    localStorage.removeItem('dg_db_users');
    localStorage.removeItem('dg_db_plans');
    localStorage.removeItem('dg_db_notifications');
    localStorage.removeItem('dg_user');
    sessionStorage.removeItem('dg_flagged_missed_tasks');

    alert("Workspace database purged successfully.");
    window.location.reload();
  };

  return (
    <div className="pl-68 pr-8 py-8 min-h-screen max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Configuration Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Configure your API credentials and local development sandboxes.</p>
      </header>

      <div className="space-y-6">
        {/* Credentials Form */}
        <section className="glass-panel rounded-2xl border border-slate-800 p-6">
          <h3 className="font-extrabold text-base text-slate-200 mb-6 flex items-center gap-2.5">
            <Key className="w-5 h-5 text-brand-blue" />
            <span>Developer API Keys</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between">
                <span>Google Gemini API Key (Google AI Studio)</span>
                <span className="text-brand-blue normal-case">Stored locally in your browser</span>
              </label>
              <input
                type="password"
                className="glass-input font-mono"
                placeholder={getGeminiApiKey() ? "••••••••••••••••••••••••••••••••" : "Paste your GEMINI_API_KEY..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Provide an API key from Google AI Studio to replace the fallback Mock AI with live, real-time Gemini generation (Subtasks breakdown, priority scanning, risk forecasting, and voice analysis).
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Google Cloud Console OAuth 2.0 Client ID
              </label>
              <input
                type="text"
                className="glass-input font-mono"
                placeholder="Paste your client_id.apps.googleusercontent.com..."
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Connect your Google Account Client credentials to fetch real meetings and class timings from the Google Calendar API into the Smart Planner conflicts engine.
              </p>
            </div>

            <button
              type="submit"
              className="glass-btn-primary flex items-center gap-2 px-6 py-2.5"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              <span>{isSaved ? "Saved successfully!" : "Save Keys"}</span>
            </button>
          </form>
        </section>

        {/* Maintenance / Cache Clear */}
        <section className="glass-panel rounded-2xl border border-slate-800 p-6">
          <h3 className="font-extrabold text-base text-brand-red mb-6 flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-brand-red" />
            <span>Workspace Operations</span>
          </h3>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-red/5 border border-brand-red/20 rounded-xl p-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Purge Sandbox Local Databases</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">
                Deletes all tasks, roadmaps, consistency streaks, and planner blocks configured in your current browser session. This will reset the workspace to a clean state.
              </p>
            </div>

            <button
              onClick={handleClearDb}
              className="py-2.5 px-5 rounded-lg bg-brand-red/10 border border-brand-red/35 hover:bg-brand-red text-white text-xs font-bold transition-all shrink-0"
            >
              Purge Database
            </button>
          </div>
        </section>

        {/* System Information */}
        <section className="glass-panel rounded-2xl border border-slate-800 p-6">
          <h3 className="font-extrabold text-base text-slate-350 mb-4 flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-slate-400" />
            <span>Developer Sandbox Environment</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">AI Model</span>
              <span className="text-slate-200 mt-1 font-semibold block">gemini-2.5-flash</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Speech API</span>
              <span className="text-slate-250 mt-1 font-semibold text-brand-green block">WebSpeech Webkit</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Firebase Mode</span>
              <span className="text-slate-200 mt-1 font-semibold block">Local Fallback</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Vite Version</span>
              <span className="text-slate-200 mt-1 font-semibold block">v8.0.12</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
