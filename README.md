# Student Risk Evaluation & Intervention System

An AI-driven dashboard designed for educators to evaluate student academic performance, mental health indicators, and survey responses to recommend targeted interventions.

## 🚀 Key Features

* **AI-Powered Risk Evaluation:** Automatically assesses student data (CGPA, attendance, survey responses) to identify risk levels (**High**, **Medium**, **Low**).
* **Multi-Category Diagnostics:** Detects specific concern areas including **Academic Concern**, **Wellness & Mental Health**, or combined **Academic & Mental Health** issues.
* **Smart Action Recommendations:** Dynamically displays appropriate intervention actions:
  * **Assign Counselor:** Triggered for wellness, psychological, or high/medium risk flags.
  * **Academic Support Plan:** Triggered for low CGPA or low attendance records.
* **Interactive Roster Table:** Optimized React UI with memoized rows for fast performance, inline mark editing, and risk re-evaluation.

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS, Lucide React (Icons)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB

## 📦 Project Setup

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/student-risk-evaluation.git](https://github.com/your-username/student-risk-evaluation.git)
cd student-risk-evaluation
