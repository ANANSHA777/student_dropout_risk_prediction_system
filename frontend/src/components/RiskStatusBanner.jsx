import React from 'react';
import { ShieldCheck, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

const RiskStatusBanner = ({ profile }) => {
  const riskLevel = profile?.riskLevel || 'Low';
  const riskCategory = profile?.riskCategory || 'None';

  const getTheme = () => {
    switch (riskLevel) {
      case 'High':
        return {
          bg: 'bg-red-500/10 border-red-500/30',
          text: 'text-red-400',
          icon: <AlertTriangle className="text-red-400" size={24} />,
          title: 'Attention Recommended',
          message: 'Your current academic/attendance status suggests you may benefit from campus support.',
        };
      case 'Medium':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          text: 'text-amber-400',
          icon: <AlertTriangle className="text-amber-400" size={24} />,
          title: 'Moderate Progress Alert',
          message: 'Consider scheduling a check-in with your academic advisor or counselor.',
        };
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          text: 'text-emerald-400',
          icon: <ShieldCheck className="text-emerald-400" size={24} />,
          title: 'Good Academic Standing',
          message: 'Keep up the great work! Your academic and attendance metrics look strong.',
        };
    }
  };

  const theme = getTheme();

  return (
    <div className={`border rounded-2xl p-5 ${theme.bg} shadow-lg space-y-3`}>
      <div className="flex items-center gap-3">
        {theme.icon}
        <div>
          <h3 className={`font-bold text-base ${theme.text}`}>{theme.title}</h3>
          <p className="text-xs text-slate-300">{theme.message}</p>
        </div>
      </div>

      {profile?.aiRecommendations && profile.aiRecommendations.length > 0 && (
        <div className="pt-3 border-t border-slate-700/50 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
            <Sparkles size={14} /> AI Recommended Support Actions:
          </div>
          <ul className="space-y-1">
            {profile.aiRecommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                <CheckCircle2 size={12} className="text-purple-400" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RiskStatusBanner;