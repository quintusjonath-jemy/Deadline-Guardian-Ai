import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, X, BrainCircuit } from 'lucide-react';
import { processVoiceCommand } from '../gemini';
import { createDocument, authInstance, whereClause, queryDocuments } from '../firebase';

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSupported] = useState(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    // Cancel any current utterances
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Choose a nice female voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural"));
    if (premiumVoice) utterance.voice = premiumVoice;

    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceCommand = useCallback(async (text) => {
    setResponse('Processing your request...');
    
    try {
      // Retrieve existing pending tasks to feed context to Gemini
      let tasksList = [];
      const user = authInstance.currentUser;
      if (user) {
        const snap = await queryDocuments('tasks', whereClause('userId', '==', user.uid));
        tasksList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      // Send transcript to Gemini for intent extraction
      const result = await processVoiceCommand(text, tasksList);
      console.log("Voice Command Result:", result);

      if (result.action === 'ADD_TASK') {
        const taskData = result.data;
        if (user) {
          // Construct base task structure
          const newTask = {
            userId: user.uid,
            title: taskData.title,
            description: taskData.description || 'Added by voice',
            deadline: taskData.deadline,
            priority: 'medium',
            estimatedHours: taskData.estimatedHours || 2,
            status: 'pending',
            aiGeneratedSubtasks: [
              { id: 'sub_' + Math.random().toString(36).substr(2, 5), title: 'Initial draft and setup', status: 'pending', estimatedHours: 1 },
              { id: 'sub_' + Math.random().toString(36).substr(2, 5), title: 'Final review and finish', status: 'pending', estimatedHours: 1 }
            ],
            createdAt: new Date().toISOString()
          };
          
          await createDocument('tasks', newTask);
          
          const voiceReply = `I've successfully created the task: "${taskData.title}" and queued it in your workspace.`;
          setResponse(voiceReply);
          speakText(voiceReply);
        } else {
          setResponse("Please log in to add tasks.");
          speakText("Please log in to add tasks.");
        }
      } 
      else if (result.action === 'NAVIGATE') {
        const page = result.data.page;
        const voiceReply = result.data.speechResponse || `Navigating to ${page}`;
        setResponse(voiceReply);
        speakText(voiceReply);
        setTimeout(() => {
          navigate(page);
          setIsOpen(false);
        }, 1500);
      } 
      else if (result.action === 'TALK') {
        const voiceReply = result.data.speechResponse;
        setResponse(voiceReply);
        speakText(voiceReply);
      }
    } catch (error) {
      console.error("Error executing voice action:", error);
      const errorMsg = "I couldn't process that command. Please try again.";
      setResponse(errorMsg);
      speakText(errorMsg);
    }
  }, [navigate]);

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
      setResponse('');
    };

    rec.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      await handleVoiceCommand(text);
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
      setTranscript('Error listening. Try again.');
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, [handleVoiceCommand]);

  const toggleListening = () => {
    if (!isSupported) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start recognition:", e);
      }
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          speakText("Hi there! I am your deadline guardian companion. How can I help you stay on track today?");
          setResponse("Ask me to create a task, review your planner, or check your timeline!");
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-brand-blue to-cyan-500 hover:scale-110 active:scale-95 shadow-xl shadow-blue-500/20 text-white flex items-center justify-center transition-all duration-300 z-50 group"
        title="AI Voice Assistant"
      >
        <Mic className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute right-16 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-brand-blue font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Talk to Guardian
        </span>
      </button>

      {/* Assistant Voice Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col items-center gap-6 relative shadow-2xl animate-fade-in">
            {/* Close Button */}
            <button 
              onClick={() => {
                setIsOpen(false);
                if (isListening) recognitionRef.current.stop();
                window.speechSynthesis.cancel();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Avatar Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center text-brand-blue shadow-inner relative">
                {isListening ? (
                  <div className="absolute inset-0 rounded-full border border-brand-blue/40 animate-ping opacity-75"></div>
                ) : null}
                <BrainCircuit className={`w-8 h-8 ${isListening ? 'animate-pulse text-cyan-400' : ''}`} />
              </div>
              <h3 className="font-bold text-lg text-slate-100 mt-2">Guardian Voice Assistant</h3>
              {!isSupported && (
                <span className="text-[10px] bg-brand-red/20 text-brand-red font-bold px-2 py-0.5 rounded">
                  Speech Not Supported in Browser
                </span>
              )}
            </div>

            {/* Listening Wave Visualizer */}
            {isListening && (
              <div className="flex items-center gap-1.5 h-8">
                <span className="voice-bar"></span>
                <span className="voice-bar"></span>
                <span className="voice-bar"></span>
                <span className="voice-bar"></span>
                <span className="voice-bar"></span>
              </div>
            )}

            {/* Transcript & Response Area */}
            <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 min-h-32 flex flex-col gap-4 text-sm justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1">User Command</p>
                <p className={`italic ${transcript ? 'text-slate-200' : 'text-slate-500'}`}>
                  {transcript || 'Click start and speak... (e.g. "Add a presentation task due tomorrow")'}
                </p>
              </div>
              
              <div className="border-t border-slate-800 pt-3">
                <p className="text-[10px] text-brand-blue font-bold tracking-wider uppercase mb-1">Guardian Reply</p>
                <div className="flex gap-2 text-slate-300">
                  <Volume2 className="w-4 h-4 shrink-0 mt-0.5 text-brand-blue" />
                  <p>{response || 'Awaiting your command...'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full">
              <button
                disabled={!isSupported}
                onClick={toggleListening}
                className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                  isListening 
                    ? 'bg-brand-red text-white hover:bg-red-600' 
                    : 'bg-gradient-to-r from-brand-blue to-teal-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                } disabled:opacity-40`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Start Listening
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
