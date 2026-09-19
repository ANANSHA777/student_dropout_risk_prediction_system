# 🎓 Student Dropout Risk Prediction & Management System

An AI-driven multi-portal system designed to identify, evaluate, and prevent student dropout risk across **Teacher**, **Admin**, **Counselor**, and **Student** roles.

---

## 🚀 Core Features

* 🧠 **AI Risk Evaluation & Gating:** Evaluates academic metrics alongside survey indicators to assign risk tiers (`High`, `Medium`, `Low`). Disables evaluations until both marks and surveys are submitted.
* 🛡️ **Role-Based Privacy:** Masks sensitive mental health responses for Teachers and Admins while granting full access to assigned Counselors.
* 💬 **Smart Load Balancing:** Sorts counselors by active caseload and recommends the counselor with the lowest workload during referrals.
* 🔄 **Automated Risk Recovery:** Automatically updates risk status to `Low Risk / Normal` when a counselor resolves a case and academic metrics satisfy safety thresholds (≥75% attendance, ≥6.0 CGPA).
* 💰 **Financial Relief Workflow:** Manages multi-step financial aid requests (`REQUESTED` → `DOCUMENTS_REQUIRED` → `APPROVED` → `DISBURSED`) with document upload support.
* ⏱️ **Survey Cooldown:** Limits student survey resubmissions to a 14-day cycle with a one-click teacher override.
* 📜 **Intervention Audit Log:** Keeps a chronological history of every intervention, referral, and status update.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express.js, JWT Auth
* **Database:** MongoDB & Mongoose
