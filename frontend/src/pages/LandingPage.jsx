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
  ShieldCheck,
  DollarSign,
  Layers,
  Lock,
  Calendar,
  Clock,
  Zap,
  ArrowUpRight,
  BookOpen,
  Award,
  UserPlus
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between overflow-x-hidden relative selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Background Radial Glow Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[550px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-[65%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 blur-[160px] pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shadow-inner group-hover:scale-105 transition duration-300">
              <ShieldAlert size={22} className="text-indigo-400 group-hover:text-indigo-300" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-white tracking-tight flex items-center gap-1">
                EduRisk<span className="text-indigo-400">Intelligence</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase block font-semibold">
                Retention & Care Platform
              </span>
            </div>
          </Link>

          {/* Quick Nav Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition hover:underline underline-offset-8 decoration-indigo-500/60">
              Core Modules
            </a>
            <a href="#roles" className="hover:text-white transition hover:underline underline-offset-8 decoration-purple-500/60">
              Role Portals
            </a>
            <a href="#stats" className="hover:text-white transition hover:underline underline-offset-8 decoration-emerald-500/60">
              Retention Impact
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 rounded-xl transition flex items-center gap-1.5"
            >
              <LogIn size={15} /> Sign In
            </Link>
            <Link
              to="/register"
              className="px-4.5 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <UserPlus size={15} /> Register <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-14 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-sm backdrop-blur-md">
          <Sparkles size={14} className="text-amber-400 animate-pulse" />
          <span>Next-Generation Predictive Student Support & Retention Platform</span>
        </div>

        {/* High-Impact Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12] max-w-5xl mx-auto">
          Early Warning & Student Retention <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">
            Intelligence System
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed font-normal">
          Proactively identify at-risk students through machine learning and multi-dimensional behavioral analytics.
          Unify faculty observations, clinical counseling, and institutional emergency relief into one synchronized retention ecosystem.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <LogIn size={18} />
            <span>Portal Login</span>
            <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold rounded-xl transition flex items-center justify-center gap-2 backdrop-blur-md hover:border-slate-600"
          >
            <Sparkles size={16} className="text-amber-400" />
            <span>View Features</span>
          </a>
        </div>

        {/* Live UI Mockup / Radar Card */}
        <div className="mt-14 max-w-5xl mx-auto p-3 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-2xl backdrop-blur-xl relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500 pointer-events-none" />
          <div className="relative rounded-xl bg-[#0a0f1d] p-5 sm:p-7 text-left border border-slate-800/90">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 mb-5 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs text-slate-400 font-mono font-medium ml-1">Live Institutional Risk & Triage Radar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Real-time Synchronized
                </span>
                <span className="text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                  Multi-Role Portals
                </span>
              </div>
            </div>

            {/* Mock Dashboard Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">At-Risk Students Flagged</p>
                  <TrendingDown size={14} className="text-red-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-2xl font-bold text-red-400">14</span>
                  <span className="text-[11px] text-red-300 font-medium">Auto-Triage Active</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-red-500 h-1.5 rounded-full w-[24%]" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Academic Remedial Plans</p>
                  <BookOpen size={14} className="text-blue-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-2xl font-bold text-blue-400">28</span>
                  <span className="text-[11px] text-blue-300 font-medium">92% On-Track</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full w-[82%]" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Counseling Cases Resolved</p>
                  <HeartHandshake size={14} className="text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-2xl font-bold text-purple-400">19 / 21</span>
                  <span className="text-[11px] text-purple-300 font-medium">90.5% Resolved</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-500 h-1.5 rounded-full w-[90.5%]" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Emergency Aid Disbursed</p>
                  <DollarSign size={14} className="text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-2xl font-bold text-emerald-400">₹2.45L</span>
                  <span className="text-[11px] text-emerald-300 font-medium">100% Verified</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full w-[100%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Stats Cards Section */}
        <div id="stats" className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition">
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">96.4%</div>
            <div className="text-xs font-semibold text-white mt-1">Risk Accuracy Rate</div>
            <p className="text-[11px] text-slate-400 mt-1">Dual-Engine AI Diagnostic with strict root-cause mapping</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition">
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-400">140+</div>
            <div className="text-xs font-semibold text-white mt-1">Active Interventions</div>
            <p className="text-[11px] text-slate-400 mt-1">Simultaneous remedial, wellness, and financial tracks</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">89.2%</div>
            <div className="text-xs font-semibold text-white mt-1">Counseling Success</div>
            <p className="text-[11px] text-slate-400 mt-1">Documented wellness improvements and academic recovery</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition">
            <div className="text-3xl sm:text-4xl font-extrabold text-sky-400">&lt; 48h</div>
            <div className="text-xs font-semibold text-white mt-1">Relief Turnaround</div>
            <p className="text-[11px] text-slate-400 mt-1">From faculty application to administrative fund release</p>
          </div>
        </div>

      </section>

      {/* Role-Based Fast Access Section */}
      <section id="roles" className="py-20 bg-[#090e1c]/80 border-y border-slate-800/80 relative backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <Users size={13} /> Dedicated Portals
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Role-Based Fast Access</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
              Select your institutional portal to access specialized tooling configured precisely for your operational responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Teacher Card */}
            <Link
              to="/login?role=teacher"
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-800/80 transition-all duration-300 group flex flex-col justify-between transform hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/10"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                  <UserCheck size={22} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">Faculty / Teacher</h3>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full">Academic</span>
                </div>
                <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
                  Log semester marks and attendance, trigger Gemini AI student evaluations, assign academic remedial plans, and request emergency aid.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Roster Matrix</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Remedial Plans</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Re-survey Gating</span>
                </div>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-indigo-400 gap-1 group-hover:translate-x-1 transition">
                Launch Teacher Portal <ArrowRight size={14} />
              </div>
            </Link>

            {/* Counselor Card */}
            <Link
              to="/login?role=counselor"
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800/80 transition-all duration-300 group flex flex-col justify-between transform hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/10"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                  <HeartHandshake size={22} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">Counselor</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full">Clinical</span>
                </div>
                <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
                  Manage load-balanced caseload queues, review unmasked clinical disclosures, schedule sessions with student confirmation, and log recovery notes.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Caseload Queue</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Session Loop</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Auto-Recovery</span>
                </div>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-emerald-400 gap-1 group-hover:translate-x-1 transition">
                Launch Counselor Portal <ArrowRight size={14} />
              </div>
            </Link>

            {/* Student Card */}
            <Link
              to="/login?role=student"
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/60 hover:bg-slate-800/80 transition-all duration-300 group flex flex-col justify-between transform hover:-translate-y-1 shadow-lg hover:shadow-sky-500/10"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                  <GraduationCap size={22} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition">Student</h3>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full">Self-Care</span>
                </div>
                <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
                  Submit periodic lifestyle self-assessments, upload relief verification proof documents, confirm scheduled counseling sessions, and track remedial tasks.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Survey Cooldown</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Proof Uploads</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Session Confirmation</span>
                </div>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-sky-400 gap-1 group-hover:translate-x-1 transition">
                Launch Student Portal <ArrowRight size={14} />
              </div>
            </Link>

            {/* Admin Card */}
            <Link
              to="/login?role=admin"
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-800/80 transition-all duration-300 group flex flex-col justify-between transform hover:-translate-y-1 shadow-lg hover:shadow-purple-500/10"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                  <Users size={22} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">System Admin</h3>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full">Governance</span>
                </div>
                <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
                  Institutional oversight, Financial Relief Approval Hub, student proof document verification, intervention resolution analytics, and data export.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Relief Approval</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Resolution KPIs</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Report Exports</span>
                </div>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-purple-400 gap-1 group-hover:translate-x-1 transition">
                Launch Admin Portal <ArrowRight size={14} />
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Key Feature Cards: Modern Glassmorphism Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Zap size={13} /> Architecture & Modules
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Comprehensive Multi-Tier Intelligence Engine
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl mx-auto">
            Engineered to isolate academic concerns from personal and financial hardships, delivering targeted interventions without administrative friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: AI Risk Diagnostic Engine */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/90 hover:border-purple-500/40 transition duration-300 backdrop-blur-xl relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-105 transition">
              <Brain size={28} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Core Engine 01</span>
              <span className="text-[10px] bg-purple-950/60 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800/40">Gemini 1.5 + Matrix</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Risk Diagnostic Engine</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Synthesizes quantitative metrics (CGPA &lt; 6.0, Attendance &lt; 75%, active backlogs) with student lifestyle disclosures (mental distress, study disengagement, financial stress). Generates transparent, deterministic risk tiers with strict root-cause classification.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-purple-400 shrink-0" />
                <span>Zero-penalty isolation: Wellness distress does not trigger disciplinary academic plans</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-purple-400 shrink-0" />
                <span>Dual-Tier fallback: Deterministic rule engine acts as immediate backup to Google Gemini AI</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-purple-400 shrink-0" />
                <span>Multi-role privacy masking: Protects sensitive health disclosures from unauthorized eyes</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Multi-Tier Intervention Tracking */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/40 transition duration-300 backdrop-blur-xl relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-105 transition">
              <Layers size={28} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Core Engine 02</span>
              <span className="text-[10px] bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800/40">Remedial Tracking</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Multi-Tier Intervention Tracking</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Full lifecycle tracking for academic support plans. Faculty formulate custom remedial roadmaps with target CGPA and attendance milestones. Includes dynamic state pills (Unassigned → In Progress → Completed).
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-indigo-400 shrink-0" />
                <span>Prerequisite button gating prevents premature evaluations before data submission</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-indigo-400 shrink-0" />
                <span>14-day survey cooldown prevents spamming while faculty override allows instant reset</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-indigo-400 shrink-0" />
                <span>Audited completion timestamps visible directly to students on their personal dashboard</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Financial Relief Portal */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/90 hover:border-emerald-500/40 transition duration-300 backdrop-blur-xl relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-105 transition">
              <DollarSign size={28} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Core Engine 03</span>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/40">Document Enforced</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Financial Relief Portal</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Direct grant disbursement pipeline for students facing financial distress. Faculty submit relief applications, students upload verifiable documentation, and administrators review and disburse funds with zero paperwork bottleneck.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>Enforced document review workflow before disbursement authorization</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>Admin Approval Hub with one-click verification and permanent grant logging</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>Strict eligibility gating: suppresses fund triggers for students without economic hardship</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Counselor Workflow Automation */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/90 hover:border-teal-500/40 transition duration-300 backdrop-blur-xl relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-105 transition">
              <HeartHandshake size={28} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Core Engine 04</span>
              <span className="text-[10px] bg-teal-950/60 text-teal-300 px-2 py-0.5 rounded-full border border-teal-800/40">Load-Balanced</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Counselor Workflow Automation</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Connects faculty referrals to counselors through workload-aware routing. Provides an interactive session calendar, student attendance confirmations, confidential clinical logs, and automated risk recovery when cases resolve.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-teal-400 shrink-0" />
                <span>Strict counselor caseload queue: unassigned students never pollute active lists</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-teal-400 shrink-0" />
                <span>Student session confirmation loop guarantees attendance alignment</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-teal-400 shrink-0" />
                <span>Automated recovery: healthy resolved cases automatically transition to Low Risk</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060a12] py-10 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ShieldAlert size={16} />
            </div>
            <span className="font-bold text-white tracking-wide">
              EduRisk Intelligence System
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">MERN Stack Edition</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#roles" className="hover:text-white transition">Portals</a>
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck size={14} /> Enterprise Privacy Standard
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}