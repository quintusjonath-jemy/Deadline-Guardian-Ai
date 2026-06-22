import { GoogleGenerativeAI } from "@google/generative-ai";

// Retrieves the configured API key (localStorage settings take priority over environment variables)
export const getGeminiApiKey = () => {
  return localStorage.getItem('dg_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || "";
};

const getGenAIInstance = () => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

// ==========================================
// MOCK AI RESPONSES (FOR IMMEDIATE EVALUATION)
// ==========================================

const mockGenerateSubtasks = (title, description, estimatedHours) => {
  const totalHrs = Number(estimatedHours) || 4;
  const defaultSubtasks = [
    { title: "Define requirements and compile research materials", estimatedHours: Math.max(1, Math.round(totalHrs * 0.2)) },
    { title: "Create initial outline, wireframes, or structural draft", estimatedHours: Math.max(1, Math.round(totalHrs * 0.2)) },
    { title: "Develop core implementation components or content sections", estimatedHours: Math.max(1, Math.round(totalHrs * 0.4)) },
    { title: "Review, refine, test, and finalize deliverables", estimatedHours: Math.max(1, Math.round(totalHrs * 0.2)) }
  ];
  
  // Try to generate slightly customized tasks based on keywords
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("web") || lowerTitle.includes("site") || lowerTitle.includes("app") || lowerTitle.includes("portfolio")) {
    return [
      { title: "Sketch wireframes and layout user flows", estimatedHours: Math.max(1, Math.round(totalHrs * 0.15)) },
      { title: "Set up project structure and configure style engine", estimatedHours: Math.max(1, Math.round(totalHrs * 0.15)) },
      { title: "Build responsive frontend layout and components", estimatedHours: Math.max(1, Math.round(totalHrs * 0.4)) },
      { title: "Integrate backend state managers or APIs", estimatedHours: Math.max(1, Math.round(totalHrs * 0.2)) },
      { title: "Deploy application and verify mobile compatibility", estimatedHours: Math.max(1, Math.round(totalHrs * 0.1)) }
    ];
  } else if (lowerTitle.includes("exam") || lowerTitle.includes("study") || lowerTitle.includes("learn") || lowerTitle.includes("test")) {
    return [
      { title: "Gather lecture notes, syllabus, and study guidelines", estimatedHours: Math.max(1, Math.round(totalHrs * 0.2)) },
      { title: "Summarize key formulas, definitions, and concepts", estimatedHours: Math.max(1, Math.round(totalHrs * 0.3)) },
      { title: "Complete practice problems and review past quizzes", estimatedHours: Math.max(1, Math.round(totalHrs * 0.3)) },
      { title: "Take a timed mock exam and review weak areas", estimatedHours: Math.max(1, Math.round(totalHrs * 0.2)) }
    ];
  } else if (lowerTitle.includes("report") || lowerTitle.includes("paper") || lowerTitle.includes("essay") || lowerTitle.includes("write")) {
    return [
      { title: "Conduct literature search and collect academic references", estimatedHours: Math.max(1, Math.round(totalHrs * 0.25)) },
      { title: "Formulate thesis statement and outline the arguments", estimatedHours: Math.max(1, Math.round(totalHrs * 0.15)) },
      { title: "Write the introduction and body paragraphs", estimatedHours: Math.max(1, Math.round(totalHrs * 0.4)) },
      { title: "Draft conclusion and run grammar/citation checks", estimatedHours: Math.max(1, Math.round(totalHrs * 0.2)) }
    ];
  }
  return defaultSubtasks;
};

const mockCalculatePriority = (task, existingTasksCount) => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
  
  if (diffDays <= 1 || task.importance === 'critical') return "high";
  if (diffDays <= 4 || existingTasksCount > 5) return "medium";
  return "low";
};

const mockAnalyzeDeadlineRisk = (task) => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const diffHours = (deadline - now) / (1000 * 60 * 60);
  
  if (diffHours < 0) return { riskScore: 100, riskLevel: "Critical", reasoning: "The deadline has already passed.", recommendations: ["Reschedule immediately", "Reach out to stakeholders if applicable"] };
  
  const estimatedHours = Number(task.estimatedHours) || 4;
  const ratio = estimatedHours / Math.max(1, diffHours);
  
  let riskScore = Math.min(95, Math.round(ratio * 100));
  
  // Add some buffer based on status
  if (task.status === 'pending' && diffHours < 12) {
    riskScore = Math.max(80, riskScore);
  } else if (task.status === 'in_progress') {
    riskScore = Math.max(0, riskScore - 15);
  }
  
  let riskLevel = "Low";
  let recommendations = ["Keep up the steady pace.", "Review requirements briefly before completing."];
  
  if (riskScore >= 75) {
    riskLevel = "High";
    recommendations = [
      "Decline new meetings and block out absolute focus time immediately.",
      "Break this down and start the first subtask right now.",
      "Work in short, intensive 25-minute Pomodoro sprints."
    ];
  } else if (riskScore >= 40) {
    riskLevel = "Medium";
    recommendations = [
      "Allocate at least 1-2 hours today to make progress.",
      "Complete the initial drafting phase to lower the completion barrier."
    ];
  }
  
  return { riskScore, riskLevel, reasoning: `You have ${estimatedHours} hours of work remaining with only ${Math.round(diffHours)} hours left before the deadline.`, recommendations };
};

const mockGenerateSchedule = (tasks, calendarEvents) => {
  // Simply place tasks in consecutive 1-2 hour blocks for the next 3 days
  const today = new Date();
  const schedule = [];
  
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  
  for (let i = 0; i < 3; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const timeBlocks = [];
    let startHour = 9; // Start work at 9 AM
    
    // For each task, try to assign a subtask block
    activeTasks.forEach(task => {
      const subtasks = task.aiGeneratedSubtasks || [];
      const pendingSubtask = subtasks.find(s => s.status !== 'completed');
      
      if (pendingSubtask && startHour < 17) {
        // Simple 1-hour block allocation
        timeBlocks.push({
          startTime: `${String(startHour).padStart(2, '0')}:00`,
          endTime: `${String(startHour + 1).padStart(2, '0')}:00`,
          taskId: task.id || task.taskId,
          subtaskId: pendingSubtask.id,
          taskTitle: task.title,
          subtaskTitle: pendingSubtask.title
        });
        startHour += 2; // Leave a 1 hour gap
      }
    });
    
    schedule.push({ date: dateStr, timeBlocks });
  }
  return schedule;
};

// ==========================================
// GEMINI API CALLS WITH SCHEMAS
// ==========================================

export const generateSubtasks = async (title, description, estimatedHours) => {
  const genAI = getGenAIInstance();
  if (!genAI) {
    console.log("Using Mock AI for subtasks");
    return mockGenerateSubtasks(title, description, estimatedHours);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          description: "List of decomposed subtasks to complete the main task.",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING", description: "Brief actionable title for the subtask." },
              estimatedHours: { type: "NUMBER", description: "Estimated hours to complete this specific subtask." }
            },
            required: ["title", "estimatedHours"]
          }
        }
      }
    });

    const prompt = `Decompose this task into a sequential, actionable list of subtasks.
Task Title: "${title}"
Description: "${description || 'No description provided'}"
Total Estimated Hours: ${estimatedHours || 4} hours.
Ensure the sum of estimated subtask hours matches the total estimated hours approximately. Make them bite-sized and actionable.`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini Subtask Generation failed. Falling back to Mock AI:", error);
    return mockGenerateSubtasks(title, description, estimatedHours);
  }
};

export const calculatePriority = async (task, existingTasksCount) => {
  const genAI = getGenAIInstance();
  if (!genAI) {
    return mockCalculatePriority(task, existingTasksCount);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            priority: { type: "STRING", enum: ["high", "medium", "low"] }
          },
          required: ["priority"]
        }
      }
    });

    const prompt = `Given the following task and context, calculate its priority level.
Task: "${task.title}"
Deadline: ${task.deadline}
Estimated Hours: ${task.estimatedHours}
Current User Total Pending Tasks: ${existingTasksCount}
Respond with either 'high', 'medium', or 'low'.`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return parsed.priority;
  } catch (error) {
    console.error("Gemini Priority Calculation failed:", error);
    return mockCalculatePriority(task, existingTasksCount);
  }
};

export const analyzeDeadlineRisk = async (task) => {
  const genAI = getGenAIInstance();
  if (!genAI) {
    return mockAnalyzeDeadlineRisk(task);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            riskScore: { type: "NUMBER", description: "Risk probability from 0 to 100." },
            riskLevel: { type: "STRING", enum: ["Low", "Medium", "High", "Critical"] },
            reasoning: { type: "STRING", description: "Detailed explanation of why this risk level was chosen." },
            recommendations: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Actionable tips for the user to reduce risk and finish the task."
            }
          },
          required: ["riskScore", "riskLevel", "reasoning", "recommendations"]
        }
      }
    });

    const prompt = `Analyze the deadline compliance risk for this task:
Task Title: "${task.title}"
Estimated Hours: ${task.estimatedHours} hours.
Deadline: ${task.deadline} (Current Date/Time: ${new Date().toISOString()})
Task Status: ${task.status}
Calculate a risk score percentage (0-100), assign a level, and suggest specific actionable tactics to ensure this deadline is met.`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini Risk Analysis failed. Using Mock:", error);
    return mockAnalyzeDeadlineRisk(task);
  }
};

export const generateSchedule = async (tasks, calendarEvents) => {
  const genAI = getGenAIInstance();
  if (!genAI) {
    return mockGenerateSchedule(tasks, calendarEvents);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              date: { type: "STRING", description: "Date in YYYY-MM-DD format." },
              timeBlocks: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    startTime: { type: "STRING", description: "24h format HH:MM" },
                    endTime: { type: "STRING", description: "24h format HH:MM" },
                    taskId: { type: "STRING" },
                    subtaskId: { type: "STRING" },
                    taskTitle: { type: "STRING" },
                    subtaskTitle: { type: "STRING" }
                  },
                  required: ["startTime", "endTime", "taskId", "subtaskId", "taskTitle", "subtaskTitle"]
                }
              }
            },
            required: ["date", "timeBlocks"]
          }
        }
      }
    });

    const prompt = `Create an optimized daily schedule for the next 3 days. Focus on allocating specific 1-2 hour work blocks for the subtasks of our current pending tasks. Avoid scheduling conflicts with the user's existing Google Calendar events.
Pending Tasks & Subtasks: ${JSON.stringify(tasks.filter(t => t.status !== 'completed'))}
Existing Calendar Blockout Events: ${JSON.stringify(calendarEvents)}`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini Schedule Generation failed. Using Mock:", error);
    return mockGenerateSchedule(tasks, calendarEvents);
  }
};

export const proposeRecoveryPlan = async (missedTasks, upcomingPlan) => {
  const genAI = getGenAIInstance();
  
  const prompt = `The user missed their planned tasks: ${JSON.stringify(missedTasks)}.
Here is their remaining upcoming plan: ${JSON.stringify(upcomingPlan)}.
Draft an empathetic, coaching recovery plan. Propose how we can redistribute these missed tasks across their free slots without causing burnout. Explain this in 2-3 sentences.`;

  if (!genAI) {
    return {
      message: `I noticed you missed "${missedTasks.map(t => t.title).join(', ')}" yesterday. Don't worry! I have cleared some space in your schedule today and split the tasks to keep your stress levels low while ensuring we stay on target.`,
      actionSuggested: "Reschedule missed blocks into available slots this evening and tomorrow morning."
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            message: { type: "STRING", description: "Empathetic message for the user explaining the rescheduling." },
            actionSuggested: { type: "STRING", description: "Brief summary of the rescheduling action to take." }
          },
          required: ["message", "actionSuggested"]
        }
      }
    });

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini Recovery proposal failed:", error);
    return {
      message: `I've updated your schedule to buffer in the work you missed yesterday. We will catch up by splitting the extra work over the next two days.`,
      actionSuggested: "Distribute missed tasks over next 48 hours."
    };
  }
};

export const processVoiceCommand = async (transcript, existingTasks = []) => {
  const genAI = getGenAIInstance();
  const now = new Date();
  
  if (!genAI) {
    // Local regex parser
    const cleanText = transcript.toLowerCase();
    
    if (cleanText.includes("add") || cleanText.includes("create")) {
      // e.g. "add task buy groceries tomorrow at 5pm" or "add project report due next Friday"
      let title = "Voice Task";
      let hours = 2;
      let deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Default tomorrow
      
      const titleMatch = transcript.match(/(?:add|create)\s+(?:task|project)?\s*(.*?)(?:\s+due|\s+by|\s+tomorrow|\s+next|\s+at|$)/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
      
      if (cleanText.includes("friday")) {
        // Set to next Friday
        const day = now.getDay();
        const daysToFriday = (5 - day + 7) % 7 || 7;
        const target = new Date(now);
        target.setDate(now.getDate() + daysToFriday);
        target.setHours(17, 0, 0, 0);
        deadline = target.toISOString();
      } else if (cleanText.includes("tomorrow")) {
        const target = new Date(now);
        target.setDate(now.getDate() + 1);
        target.setHours(18, 0, 0, 0);
        deadline = target.toISOString();
      }
      
      return {
        action: "ADD_TASK",
        data: { title, description: "Added via Voice Assistant", deadline, estimatedHours: hours }
      };
    }
    
    if (cleanText.includes("status") || cleanText.includes("what should i") || cleanText.includes("schedule")) {
      return {
        action: "NAVIGATE",
        data: { page: "/planner", speechResponse: "Navigating to your schedule planner. Let's see what you need to focus on next." }
      };
    }
    
    return {
      action: "TALK",
      data: { speechResponse: `I heard you say: "${transcript}". I can help you add tasks (e.g. "Add task research outline due tomorrow") or check your schedule.` }
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            action: { type: "STRING", enum: ["ADD_TASK", "COMPLETE_TASK", "NAVIGATE", "TALK"] },
            data: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                deadline: { type: "STRING", description: "ISO date format if applicable" },
                estimatedHours: { type: "NUMBER" },
                page: { type: "STRING", description: "Route: /dashboard, /tasks, /planner, /analytics, /settings" },
                speechResponse: { type: "STRING", description: "Empathetic feedback text to read aloud to the user." }
              }
            }
          },
          required: ["action", "data"]
        }
      }
    });

    const prompt = `Analyze the user's voice command: "${transcript}"
Current Time: ${now.toISOString()}
Existing Tasks List: ${JSON.stringify(existingTasks.map(t => ({ id: t.id, title: t.title })))}
Decide which action to take:
1. ADD_TASK: User wants to create a new task. Extract the task details (title, deadline, hours).
2. COMPLETE_TASK: User wants to check off a task.
3. NAVIGATE: User wants to view a specific screen (e.g., 'show calendar', 'go to settings').
4. TALK: User is asking a question or talking. Write a smart, helpful spoken response.`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini Voice Parsing failed. Using fallback parser:", error);
    return {
      action: "TALK",
      data: { speechResponse: "Sorry, I had trouble parsing that command. Could you try saying it a different way?" }
    };
  }
};
