// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  IdCard,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Calendar,
} from 'lucide-react';
import { registerUser } from '../services/authService';

const DEPARTMENTS = [
  'Computer Science',
  'Business',
  'Mathematics',
  'English',
  'Architecture',
  'Commerce',
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: DEPARTMENTS[0], // Default to first department
    studentId: '',
    yearOfStudy: YEAR_OPTIONS[0], // Default to 1st Year
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.studentId.trim()) {
      return setError('Student ID is required');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);

    try {
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: 'Student', // Always default public self-registration to Student
        department: formData.department || DEPARTMENTS[0],
        studentId: formData.studentId.trim(),
        yearOfStudy: formData.yearOfStudy,
        password: formData.password,
      });

      setSuccess('Student account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 mb-2">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Registration</h1>
          <p className="text-xs text-slate-400">Create your account to access your performance portal</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="text-xs uppercase font-semibold text-slate-400 block mb-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                name="name"
                required
                placeholder="John Doe"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="text-xs uppercase font-semibold text-slate-400 block mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                name="email"
                required
                placeholder="john.doe@university.edu"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Department & Year of Study */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-1">Department</label>
              <select
                name="department"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                value={formData.department}
                onChange={handleChange}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-1">Year of Study</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-slate-500 pointer-events-none" />
                <select
                  name="yearOfStudy"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                >
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student ID */}
          <div>
            <label className="text-xs uppercase font-semibold text-slate-400 block mb-1">Student ID</label>
            <div className="relative">
              <IdCard size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                name="studentId"
                required
                placeholder="STU-001"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                value={formData.studentId}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Register'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}