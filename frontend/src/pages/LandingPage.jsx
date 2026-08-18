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
  Brain,
  Sparkles,
  TrendingDown,
  ShieldCheck
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic Background Glow Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-sky-500/10 to-purple-600/20 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-inner">
              <ShieldAlert size={22} />
            </div>
            <span className="font-bold text-xl text-white tracking-wide">
              EduRisk<span className="text-indigo-400">Predict</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition flex items-center gap-1.5"
            >
              <LogIn size={16} /> Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
        
        {/* Sub-badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 shadow-sm backdrop-blur-md">
          <Sparkles size={14} className="text-amber-400 animate-pulse" /> AI-Powered Early Warning & Retention System
        </div>

        {/* Updated Main Heading: Replaced "Attrition" with "Dropout" */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.15] max-w-5xl mx-auto">
          Prevent Student Dropouts <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400">
            Before It's Too Late
          </span>
        </h1>

        <p className="mt-6 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          A smart early-warning platform that connects faculty, counselors, and students. Monitor academic performance and well-being metrics to provide timely support to students who need it most.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Access Dashboard <ArrowRight size={18} />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 font-semibold rounded-xl transition flex items-center justify-center gap-2 backdrop-blur-md"
          >
            How It Works
          </a>
        </div>

        {/* Live UI Mockup Preview */}
        <div className="mt-16 max-w-4xl mx-auto p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative rounded-xl bg-slate-950 p-4 sm:p-6 text-left border border-slate-800/80">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-500 font-mono ml-2">Live Student Risk Radar</span>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-medium">Real-time Analytics</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-400">High Risk Students</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-red-400">12</span>
                  <span className="text-[10px] text-red-400/80 flex items-center"><TrendingDown size={10} className="mr-0.5" /> Requires Action</span>
                </div>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-400">Active Interventions</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-amber-400">28</span>
                  <span className="text-[10px] text-slate-400">Counseling in Progress</span>
                </div>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-400">Retention Success Rate</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-emerald-400">94.2%</span>
                  <span className="text-[10px] text-emerald-400/80">+3.1% this term</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">3-Tier</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Risk Levels (Low/Med/High)</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">1-Click</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Counselor Referrals</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-400">4 Roles</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Secure Access Control</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">Instant</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Wellness Check-ins</div>
          </div>
        </div>
      </section>

      {/* Institutional Roles Portal */}
      <section className="py-20 bg-slate-900/60 border-y border-slate-800/80 relative backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white tracking-tight">Dedicated Institutional Portals</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
              Select your role to access customized dashboards tailored to your daily workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Teacher Card */}
            <Link
              to="/login?role=teacher"
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition duration-300 group flex flex-col justify-between transform hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/10"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                  <UserCheck size={22} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">Faculty / Teachers</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Log academic marks, monitor attendance dips, and send instant counseling alerts for struggling students.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-indigo-400 gap-1 group-hover:translate-x-1 transition">
                Launch Portal <ArrowRight size={14} />
              </div>
            </Link>

            {/* Counselor Card */}
            <Link
              to="/login?role=counselor"
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition duration-300 group flex flex-col justify-between transform hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/10"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                  <HeartHandshake size={22} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">Counselors</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Review referred cases, record confidential session notes, and manage student wellness plans.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-emerald-400 gap-1 group-hover:translate-x-1 transition">
                Launch Portal <ArrowRight size={14} />
              </div>
            </Link>

            {/* Student Card */}
            <Link
              to="/login?role=student"
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80 transition duration-300 group flex flex-col justify-between transform hover:-translate-y-1 shadow-lg hover:shadow-sky-500/10"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                  <GraduationCap size={22} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition">Students</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Complete brief lifestyle check-ins, keep track of study habits, and access academic support resources.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-sky-400 gap-1 group-hover:translate-x-1 transition">
                Launch Portal <ArrowRight size={14} />
              </div>
            </Link>

            {/* Admin Card */}
            <Link
              to="/login?role=admin"
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/80 transition duration-300 group flex flex-col justify-between transform hover:-translate-y-1 shadow-lg hover:shadow-purple-500/10"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                  <Users size={22} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">Administrators</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Manage user permissions, oversee system configurations, and view institution-wide retention analytics.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-purple-400 gap-1 group-hover:translate-x-1 transition">
                Launch Portal <ArrowRight size={14} />
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight">Key Platform Capabilities</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Combining academic indicators and lifestyle metrics to identify risk early and drive meaningful support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-7 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
              <Activity size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Risk Tiering</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Categorizes students into Low, Moderate, and High Risk status based on real-time exam trends, attendance rates, and engagement logs.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Holistic Self-Assessments</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Captures non-academic factors—such as daily commute stress, study hours, financial pressures, and overall wellness scores.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Closed-Loop Case Tracking</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Facilitates transparent communication between faculty and counselors with private meeting logs and action plans.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Student Dropout Risk Prediction System (MERN Stack Edition).</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-400" /> Enterprise Privacy Standard</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;