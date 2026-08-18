import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Users, 
  UserCheck, 
  Activity, 
  BarChart3, 
  GraduationCap, 
  ArrowRight, 
  LogIn, 
  HeartHandshake, 
  CheckCircle2,
  Brain
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <ShieldAlert size={22} />
            </div>
            <span className="font-bold text-lg text-white tracking-wide">
              EduRisk<span className="text-indigo-400">Predict</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              <LogIn size={16} /> Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Sub-badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <Brain size={14} /> AI-Powered Early Warning System
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Predict Student Attrition <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-300">
            Before Academic Recovery Fails
          </span>
        </h1>

        <p className="mt-6 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          A centralized retention analytics platform connecting faculty, counselors, and students. Monitor academic performance, lifestyle distress metrics, and manage timely intervention workflows.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            Access Dashboard <ArrowRight size={18} />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700 font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            Learn How It Works
          </a>
        </div>

        {/* Stats Strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-400">3-Tier</div>
            <div className="text-xs text-slate-400 mt-1">Risk Classification</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">1-Click</div>
            <div className="text-xs text-slate-400 mt-1">Counselor Referrals</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-sky-400">4 Roles</div>
            <div className="text-xs text-slate-400 mt-1">RBAC Security</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">Real-Time</div>
            <div className="text-xs text-slate-400 mt-1">Self-Assessment</div>
          </div>
        </div>
      </section>

      {/* Institutional Roles Portal */}
      <section className="py-16 bg-slate-950/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Tailored Portals for Educational Roles</h2>
            <p className="text-slate-400 text-sm mt-2">Log in directly based on your institutional function</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Teacher Card */}
            <Link
              to="/login?role=teacher"
              className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700/70 hover:border-indigo-500/50 hover:bg-slate-800 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <UserCheck size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Faculty / Teachers</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Log marks, attendance trends, and trigger 1-click counselor referrals for vulnerable students.
              </p>
            </Link>

            {/* Counselor Card */}
            <Link
              to="/login?role=counselor"
              className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700/70 hover:border-emerald-500/50 hover:bg-slate-800 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <HeartHandshake size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Counselors</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Review referred cases, record meeting logs, and manage student wellness interventions.
              </p>
            </Link>

            {/* Student Card */}
            <Link
              to="/login?role=student"
              className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700/70 hover:border-sky-500/50 hover:bg-slate-800 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <GraduationCap size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Students</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Submit lifestyle self-assessments, track study habits, and review personalized guidance metrics.
              </p>
            </Link>

            {/* Admin Card */}
            <Link
              to="/login?role=admin"
              className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700/70 hover:border-purple-500/50 hover:bg-slate-800 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Administrators</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Manage user access, configure system settings, and analyze institution-wide retention metrics.
              </p>
            </Link>

          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Key Platform Capabilities</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Combining academic indicators and lifestyle metrics to prevent dropout risks in a proactive manner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Activity size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Dynamic Risk Tiering</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Calculates Low, Moderate, and High Risk status based on internal exam performance, attendance thresholds, and engagement logs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lifestyle Self-Assessment</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Gathers non-academic indicators—such as daily commute time, study hours, financial strain, and wellness scores.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Integrated Case Management</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enables seamless case tracking, meeting note logs, and resolution updates between faculty members and counselors.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Student Dropout Risk Prediction System (MERN Stack Edition).</p>
      </footer>

    </div>
  );
};

export default LandingPage;