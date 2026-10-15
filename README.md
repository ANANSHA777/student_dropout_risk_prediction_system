# 🎓 Student Dropout Risk Prediction & Management System (SDRPS)

An AI-driven multi-portal system designed to identify, evaluate, and prevent student dropout risk across **Teacher**, **Admin**, **Counselor**, and **Student** roles.

---

## 🚀 Core Features

- 🧠 **Condition-Gated AI Risk Engine:** Evaluates academic performance alongside survey indicators to assign risk tiers (`High Risk`, `Medium Risk`, `Low Risk`). Automatically gates AI evaluation until both teacher metrics (`Series Marks %`, `Failed Subjects Count`, `Monthly Attendance %`) and student survey responses are submitted.
- 🎯 **Targeted Intervention Mapping:** Uses strict factor isolation to prevent false recommendations—Financial Aid requests are strictly locked to financial strain indicators, and counseling is tied directly to stress and wellness scores.
- 🛡️ **Role-Based Privacy:** Masks sensitive mental health and wellness survey responses for Teachers and Admins while granting full access to assigned Counselors.
- 💬 **Smart Load Balancing:** Sorts counselors by active caseload and recommends the counselor with the lowest workload during referrals.
- 🔄 **Automated Risk Recovery:** Automatically updates risk status to `Low Risk / Normal` when a counselor resolves a case and academic metrics satisfy safety thresholds (≥75% monthly attendance, ≥55% series marks percentage, 0 backlogs).
- 💰 **Financial Relief Workflow:** Manages multi-step financial aid requests (`REQUESTED` → `DOCUMENTS_REQUIRED` → `APPROVED` → `DISBURSED`) with document upload support.
- ⏱️ **Survey Cooldown:** Limits student survey resubmissions to a 14-day cycle with a one-click teacher override.
- 📜 **Intervention Audit Log:** Keeps a chronological history of every intervention, referral, and status update.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js, JWT Auth
- **AI Integration:** Google Gemini AI API (with deterministic fallback scoring engine)
- **Database:** MongoDB & Mongoose
