# 🛡️ Deadline Guardian AI
### *Proactive AI Productivity Companion & Autonomous Recovery Agent*

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD627)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-007FFF?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

> **Deadline Guardian AI** is a premium, modern productivity companion built for the **Vibe2Ship Hackathon 2026**. Traditional calendar and reminder apps fail because they only notify users. Deadline Guardian actively assists you by dynamically decomposing complex goals, tracking real-time risk scores, formulating automated time-blocks, and executing autonomous recovery plans when deadlines are missed.

🌐 **Live Demo:** [https://deadline-guardian-ai.web.app](https://deadline-guardian-ai.web.app)

---

## ✨ Features

### 🧠 1. AI Task Decomposition & Risk Analysis
* **Goal Breakdown:** Input any large goal, and the Gemini-powered agent splits it into specific, actionable sub-tasks with estimated hours.
* **Smart Priority Calculation:** Automatically assesses deadlines and workload density to calculate task priority and urgency.

### 🛡️ 2. Autonomous Recovery Agent
* **Compliance Monitoring:** Tracks your deadline compliance score in real-time.
* **Proactive Rescheduling:** If a deadline passes without completion, the Guardian triggers a **Deadline Compliance Alert**, formulating a recovery schedule proposal to split and reschedule missed items to protect your momentum.

### 💬 3. AI Productivity Coach
* Discuss schedule conflicts, study strategies, and get motivation tips with your personal planning advisor.
* Leverages task context to give customized, situational recommendations.

### 🎙️ 4. Voice-Activated Task Creation
* Build tasks hands-free using Web Speech Recognition. Say task titles and deadlines, and the AI parses them instantly.

### 🌊 5. Ocean Breeze UI & UX
* Premium dark/light themes featuring custom glassmorphism cards, soft shadows, rounded corners, and smooth Framer Motion micro-animations.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons
* **Animations:** Framer Motion
* **Analytics & Graphs:** Recharts
* **Backend Database:** Firebase Auth & Firestore
* **AI Model:** Google Gemini 2.5 Flash SDK (Google AI Studio)
* **Offline Fail-safe:** Integrated LocalStorage database sandbox fallback (works completely standalone if Firebase configuration is missing or firestore rules are locked).

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **yarn**

### 1. Clone the repository
```bash
git clone https://github.com/quintusjonath-jemy/Deadline-Guardian-Ai.git
cd deadline-guardian-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add your credentials:
```env
# Google Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration (Optional - Falls back to LocalStorage Sandbox mode if empty)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## ⚙️ Project Architecture
```
src/
├── components/          # Reusable UI widgets (Sidebar, VoiceAssistant, RecoveryAgent)
├── pages/               # Main application pages (Dashboard, Tasks, Goals, Analytics, Settings)
├── firebase.js          # Core auth & database abstraction with LocalStorage fallbacks
├── gemini.js            # Prompt construction and Gemini SDK integration
└── index.css            # Base stylesheet with Ocean Breeze component classes
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Deadline Guardian AI — Secure your timelines, eliminate task paralysis.*
