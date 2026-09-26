// backend/models/StudentProfile.js
const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Guarantees one profile document per User
      index: true,
    },
    studentId: {
      type: String,
      default: '',
      index: true,
    },
    department: {
      type: String,
      default: 'Computer Science',
      index: true,
    },
    yearOfStudy: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      default: '1st Year',
    },
    cgpa: {
      type: Number,
      default: null,
      min: 0,
      max: 10.0,
    },
    attendancePercentage: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    // --- STUDENT SELF-ASSESSMENT & SURVEY DATA ---
    surveyCompleted: {
      type: Boolean,
      default: false,
    },
    surveyStatus: {
      type: String,
      default: 'Pending',
    },
    lastSurveySubmittedAt: {
      type: Date,
    },
    last_survey_submission_date: {
      type: Date,
    },
    survey_cooldown_override: {
      type: Boolean,
      default: false,
    },

    // --- FLAT SURVEY FIELDS ---
    academicInterest: { 
      type: String, 
      default: 'High (Interested & Motivated)' 
    },
    disengagementReason: { 
      type: String, 
      enum: [
        'Mental Health Burden', 
        'Financial Stress', 
        'Low Study Interest', 
        'Substance Impact', 
        'Personal/Family Issue', 
        'None'
      ], 
      default: 'None' 
    },
    abilityToStudy: { 
      type: String, 
      default: 'Full (Good Environment & Focus)' 
    },
    familyIncome: { 
      type: String, 
      default: 'Above ₹60,000' 
    },
    familyMonthlyIncome: { 
      type: String, 
      default: 'Above ₹60,000' 
    },
    financialStress: { 
      type: String, 
      default: 'Moderate (Manageable)' 
    },
    moneyFeeWorries: { 
      type: String, 
      default: 'Moderate (Manageable)' 
    },
    livingSituation: { 
      type: String, 
      default: 'Campus Hostel' 
    },
    commuteTime: { 
      type: String, 
      default: 'Less than 30 mins' 
    },
    dailyCommuteTime: { 
      type: String, 
      default: 'Less than 30 mins' 
    },
    partTimeJob: { 
      type: String, 
      default: 'No Job' 
    },
    partTimeWork: { 
      type: String, 
      default: 'No Job' 
    },
    activeBacklogs: { 
      type: String, 
      default: '0 Backlogs' 
    },
    studyHoursPerDay: { 
      type: String, 
      default: '1 - 2 hours' 
    },
    dailySelfStudyHours: { 
      type: String, 
      default: '1 - 2 hours' 
    },
    academicWorkload: { 
      type: String, 
      default: '3 - 5 hours' 
    },
    sleepHoursPerNight: { 
      type: String, 
      default: '5 - 6 hours' 
    },
    nightlySleepHours: { 
      type: String, 
      default: '5 - 6 hours' 
    },
    mentalHealthSelfReport: { 
      type: String, 
      default: 'Anxious / Stressed' 
    },
    mentalHealthState: { 
      type: String, 
      default: 'Anxious / Stressed' 
    },
    mentalHealthStatus: { 
      type: String, 
      default: 'Good / Balanced' 
    },
    comments: {
      type: String,
      default: '',
    },
    additionalNotes: {
      type: String,
      default: '',
    },
    addictions: [{ type: String }],
    impactFactors: [{ type: String }],

    // --- NESTED SURVEY OBJECT (FLEXIBLE / UNRESTRICTED) ---
    surveyData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    assignmentsSubmitted: {
      type: Number,
      default: 0,
    },
    assignmentsTotal: {
      type: Number,
      default: 0,
    },
    financialAidStatus: {
      type: String,
      enum: [
        'Paid',
        'Pending',
        'Required',
        'Granted',
        'Emergency Assistance Requested',
        'Approved',
        'APPROVED',
        'Not Applied',
        'Pending Institutional Support',
        'Disbursed',
        'DISBURSED',
        'DOCUMENTS_REQUIRED',
        'DOCUMENTS_SUBMITTED',
        'REQUESTED',
        'REJECTED',
        'Rejected',
      ],
      default: 'Paid',
    },
    financialAidGrant: {
      amount: { type: Number, default: 0 },
      reason: { type: String, default: '' },
      grantedAt: { type: Date },
    },
    collegeFinancialAid: {
      status: { 
        type: String, 
        enum: ['Not Applied', 'Pending Review', 'Approved', 'Rejected', 'Pending Institutional Support', 'Disbursed', 'DISBURSED'], 
        default: 'Not Applied' 
      },
      grantAmount: { type: Number, default: 0 },
      appliedAt: { type: Date },
      approvedAt: { type: Date },
    },
    qualitativeNotes: [
      {
        authorRole: {
          type: String,
          enum: ['Teacher', 'Counselor', 'Admin'],
          default: 'Teacher',
        },
        note: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          enum: ['Academic', 'Financial', 'Personal', 'Health', 'Wellness', 'General'],
          default: 'Academic',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // --- FINANCIAL RELIEF STATUS (STRICT SPEC) ---
    financial_relief_status: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'DOCUMENTS_REQUIRED', 'DOCUMENTS_SUBMITTED', 'APPROVED', 'DISBURSED', 'REJECTED'],
      default: 'NONE',
    },

    // --- FINANCIAL PROOF DOCUMENTS ---
    financial_documents: [
      {
        document_id: {
          type: String,
          default: () => new mongoose.Types.ObjectId().toString(),
        },
        url: {
          type: String,
          default: '',
        },
        filename: {
          type: String,
          required: true,
        },
        fileData: {
          type: String,
          default: '',
        },
        uploaded_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // --- EVALUATION SOURCE ---
    evaluation_source: {
      type: String,
      enum: ['AUTOMATED_AI', 'MANUAL_TEACHER_OVERRIDE'],
      default: 'AUTOMATED_AI',
    },

    // --- INTERVENTION AUDIT LOGS (CHRONOLOGICAL TIMELINE) ---
    intervention_logs: [
      {
        action: {
          type: String,
          required: true,
        },
        performed_by: {
          type: String,
          default: 'System',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          default: '',
        },
      },
    ],

    // --- AI DIAGNOSTIC & CLASSIFICATION FIELDS ---
    riskEvaluated: {
      type: Boolean,
      default: false,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      default: null,
      index: true,
    },
    riskCategory: {
      type: String,
      default: 'None',
    },
    primaryRiskCategory: {
      type: String,
      enum: [
        'ACADEMIC',
        'ATTENDANCE',
        'FINANCIAL',
        'PERSONAL',
        'WELLNESS',
        'DISENGAGEMENT',
        'DUAL',
        'NONE',
        'Dual Risk (Academic + Personal)',
        'Academic Risk Only',
        'Personal / Financial Risk',
        'No Policy Risk',
      ],
      default: 'NONE',
      index: true,
    },
    assignedRole: {
      type: String,
      enum: ['TEACHER', 'COUNSELOR', 'FINANCIAL_AID'],
      default: 'TEACHER',
    },

    evaluationCase: {
      type: String,
      enum: ['CASE_A_WELLNESS_DISENGAGEMENT', 'CASE_B_FINANCIAL_STRESS', 'CASE_C_PURE_ACADEMIC', 'NONE'],
      default: 'NONE',
    },
    nonAcademicRisk: {
      wellness: {
        score: { type: Number, default: 0 },
        level: { type: String, default: 'Low' },
        details: { type: String, default: '' },
      },
      disengagement: {
        score: { type: Number, default: 0 },
        level: { type: String, default: 'Low' },
        details: { type: String, default: '' },
        rootCause: { type: String, default: 'None' },
      },
      financial: {
        score: { type: Number, default: 0 },
        level: { type: String, default: 'Low' },
        details: { type: String, default: '' },
      },
    },

    // --- ASSIGNED INTERVENTIONS & COUNSELING ---
    assignedCounselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assigned_counselor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    counselingStatus: {
      type: String,
      enum: ['Active Review', 'In Progress', 'Resolved', 'Escalated', 'Referral Initiated', 'Assigned', 'Pending Contact'],
      default: 'Active Review',
    },
    counseling_session: {
      date: { type: Date, default: null },
      time: { type: String, default: '' },
      notes: { type: String, default: '' },
      counselor_name: { type: String, default: '' },
      status: {
        type: String,
        enum: ['PENDING_SCHEDULE', 'SCHEDULED', 'CONFIRMED_BY_STUDENT', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING_SCHEDULE',
      },
      completion_notes: { type: String, default: '' },
      completed_at: { type: Date, default: null },
    },
    assignedPlan: {
      type: String,
      default: null,
    },
    assignedAcademicPlan: {
      type: String,
      default: null,
    },
    academicPlan: {
      type: String,
      default: null,
    },
    academic_remedial_plan: {
      plan_title: { type: String, default: '' },
      plan_details: { type: String, default: '' },
      target_metrics: { type: String, default: '' },
      assigned_by_teacher_name: { type: String, default: '' },
      assigned_at: { type: Date, default: null },
      status: {
        type: String,
        enum: ['NOT_REQUIRED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'NOT_REQUIRED',
      },
      completion_notes: { type: String, default: '' },
      completed_at: { type: Date, default: null },
    },
    academicInterventionPlan: {
      studySchedule: { type: String, default: '' },
      remedialClasses: [{ type: String }],
      backlogTracking: { type: String, default: '' },
      cgpaRecoveryMilestones: [{ type: String }],
      generatedAt: { type: Date },
    },

    // --- AUTOMATED ACTION FLAGS ---
    recommendedActions: {
      enableRemedialQuiz: {
        type: Boolean,
        default: false,
      },
      matchPeerTutor: {
        type: Boolean,
        default: false,
      },
      assignTeacherMentor: {
        type: Boolean,
        default: false,
      },
      escalateToCounselor: {
        type: Boolean,
        default: false,
      },
      assignCounselor: {
        type: Boolean,
        default: false,
      },
      grantFinancialAid: {
        type: Boolean,
        default: false,
      },
      requestCollegeFund: {
        type: Boolean,
        default: false,
      },
      routeToAcademicPlan: {
        type: Boolean,
        default: false,
      },
      suppressAcademicPenalty: {
        type: Boolean,
        default: false,
      },
    },

    aiRecommendations: [{ type: String }],
    lastAiAnalysisDate: {
      type: Date,
    },
    lastEvaluatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: false, // Essential so unexpected UI fields aren't discarded on submit
  }
);

// Indexes for administrative searches & analytical reporting
studentProfileSchema.index({ department: 1, riskLevel: 1 });
studentProfileSchema.index({ riskEvaluated: 1, primaryRiskCategory: 1 });

// Virtual getter mapping `_id` to `id` for standardized API JSON returns
studentProfileSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);