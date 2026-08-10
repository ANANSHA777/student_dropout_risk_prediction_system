import React, { useState } from 'react';

const StudentSurveyForm = ({ onSurveySubmitted }) => {
  const [formData, setFormData] = useState({
    stressLevel: 3,
    financialStress: 3,
    personalSubstanceUsage: 'None',
    mentalHealthSelfReport: 'Moderate',
    additionalNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Level') || name.includes('Stress') ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token'); // Retrieve stored JWT auth token
      
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit survey');
      }

      setStatusMessage({
        type: 'success',
        text: 'Survey submitted successfully! Your feedback will help us support you better.',
      });

      // Optional callback to notify parent component to refresh data
      if (onSurveySubmitted) {
        onSurveySubmitted(result.data);
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error.message || 'An error occurred while submitting your survey.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Self-Assessment Survey</h2>
      <p className="text-sm text-gray-600 mb-6">
        Please complete this confidential check-in. Your responses help advisors provide tailored academic and wellness assistance.
      </p>

      {statusMessage.text && (
        <div
          className={`p-4 mb-6 rounded-lg text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Academic & Overall Stress Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic & General Stress Level (1 = Very Low, 5 = Extreme Stress)
          </label>
          <div className="flex items-center justify-between gap-4">
            <input
              type="range"
              name="stressLevel"
              min="1"
              max="5"
              value={formData.stressLevel}
              onChange={handleChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="w-8 text-center text-lg font-bold text-indigo-600">
              {formData.stressLevel}
            </span>
          </div>
        </div>

        {/* Financial Stress Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Financial Strain / Tuition Burden (1 = No Concern, 5 = Severe Strain)
          </label>
          <div className="flex items-center justify-between gap-4">
            <input
              type="range"
              name="financialStress"
              min="1"
              max="5"
              value={formData.financialStress}
              onChange={handleChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="w-8 text-center text-lg font-bold text-indigo-600">
              {formData.financialStress}
            </span>
          </div>
        </div>

        {/* Mental Health Self Report */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your overall emotional & mental wellness?
          </label>
          <select
            name="mentalHealthSelfReport"
            value={formData.mentalHealthSelfReport}
            onChange={handleChange}
            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Excellent">Excellent - Feeling completely on track</option>
            <option value="Good">Good - Handling challenges well</option>
            <option value="Moderate">Moderate - Experiencing occasional burnout or anxiety</option>
            <option value="Poor">Poor - Struggling significantly day-to-day</option>
            <option value="Critical">Critical - Need immediate support</option>
          </select>
        </div>

        {/* Substance Usage / Personal Challenges */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Are you currently dealing with habits, addictions, or personal challenges affecting attendance/focus?
          </label>
          <select
            name="personalSubstanceUsage"
            value={formData.personalSubstanceUsage}
            onChange={handleChange}
            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="None">None</option>
            <option value="Occasional Alcohol/Vaping">Occasional Alcohol / Vaping</option>
            <option value="Gaming/Screen Addiction">Severe Gaming / Screen Addiction</option>
            <option value="Substance Dependency Concern">Substance Dependency Concern</option>
            <option value="Prefer Not To Say">Prefer Not To Say</option>
          </select>
        </div>

        {/* Additional Qualitative Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Is there anything specific happening in your life that you'd like your advisor to know?
          </label>
          <textarea
            name="additionalNotes"
            rows="3"
            value={formData.additionalNotes}
            onChange={handleChange}
            placeholder="e.g., Working full-time job at night, family medical emergency, etc."
            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg shadow transition duration-150 disabled:opacity-50"
        >
          {loading ? 'Submitting Survey...' : 'Submit Survey'}
        </button>
      </form>
    </div>
  );
};

export default StudentSurveyForm;