const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// @desc    Enroll / Create a new Student account & profile
// @route   POST /api/teacher/students
// @access  Private (Teacher, Admin)
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, initialPassword, studentId, department, yearOfStudy } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const assignedDept = department ? department.trim() : 'Computer Science';
    const assignedStudentId = studentId ? studentId.trim() : '';
    const assignedYear = yearOfStudy ? yearOfStudy.trim() : '1st Year';

    // 1. Create User Document
    const user = await User.create({
      name: name ? name.trim() : '',
      email: normalizedEmail,
      password: password || initialPassword || 'Student123!',
      role: 'Student',
      studentId: assignedStudentId,
      department: assignedDept,
      yearOfStudy: assignedYear,
      cgpa: null,
      attendance: null,
      riskLevel: null, // Unevaluated by default
      surveyCompleted: false,
    });

    // 2. Create Student Profile Document
    const profile = await StudentProfile.create({
      user: user._id,
      studentId: assignedStudentId || `STU-${user._id.toString().slice(-4)}`,
      department: assignedDept,
      yearOfStudy: assignedYear,
      cgpa: null,
      attendancePercentage: null,
      riskLevel: null,
      surveyCompleted: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      student: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: profile.studentId,
        department: profile.department,
        yearOfStudy: profile.yearOfStudy,
        cgpa: null,
        attendance: null,
        surveyCompleted: false,
        canEvaluate: false,
        riskLevel: null,
      },
    });
  } catch (error) {
    console.error('Error in createStudent:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error enrolling student',
      error: error.message,
    });
  }
};

// @desc    Fetch students belonging strictly to the teacher's department
// @route   GET /api/teacher/students
// @access  Private (Teacher, Admin)
exports.getTeacherStudents = async (req, res) => {
  try {
    // Build query: Filter by teacher's department unless user is Admin
    const query = { role: 'Student' };
    if (req.user?.role === 'Teacher' && req.user?.department) {
      query.department = req.user.department;
    }

    const users = await User.find(query).select('-password').lean();

    const userIds = users.map((u) => u._id);
    const profiles = await StudentProfile.find({ user: { $in: userIds } }).lean();

    const combinedStudents = users.map((user) => {
      const profile = profiles.find((p) => p.user?.toString() === user._id.toString()) || {};

      const resolvedCgpa = profile.cgpa ?? user.cgpa ?? null;
      const resolvedAttendance = profile.attendancePercentage ?? profile.attendance ?? user.attendance ?? null;
      const isSurveyDone = profile.surveyCompleted ?? user.surveyCompleted ?? false;

      // Evaluation button is enabled ONLY when CGPA, Attendance, AND Survey are present
      const canEvaluate = resolvedCgpa !== null && resolvedAttendance !== null && isSurveyDone === true;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: profile.studentId || user.studentId || '',
        department: profile.department || user.department || 'Computer Science',
        yearOfStudy: profile.yearOfStudy || user.yearOfStudy || '1st Year',
        cgpa: resolvedCgpa,
        attendance: resolvedAttendance,
        attendancePercentage: resolvedAttendance,
        surveyCompleted: isSurveyDone,
        canEvaluate, // Used by frontend to toggle AI Evaluation Button
        riskLevel: profile.riskLevel || user.riskLevel || null,
        riskCategory: profile.riskCategory || 'None',
        assignedRole: profile.assignedRole || 'Unassigned',
        aiRecommendations: profile.aiRecommendations || [],
        qualitativeNotes: profile.qualitativeNotes || [],
      };
    });

    return res.status(200).json({
      success: true,
      count: combinedStudents.length,
      students: combinedStudents,
    });
  } catch (error) {
    console.error('Error in getTeacherStudents:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching department students',
      error: error.message,
    });
  }
};

// @desc    Update ONLY student CGPA and attendance (Without altering Risk Level)
// @route   POST /api/teacher/students/:id/marks
// @access  Private (Teacher, Admin)
exports.updateStudentMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { cgpa, marks, attendance, attendancePercentage, teacherNotes } = req.body;

    const isObjectId = Boolean(id.match(/^[0-9a-fA-F]{24}$/));
    if (!isObjectId) {
      return res.status(400).json({ success: false, message: 'Invalid Student User ID' });
    }

    // 1. Check Student User existence
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student user not found' });
    }

    // 2. Parse CGPA & Attendance values
    let valCgpa = null;
    if (cgpa !== undefined && cgpa !== null && cgpa !== '') {
      valCgpa = Number(cgpa);
    } else if (marks !== undefined && marks !== null && marks !== '') {
      const numMarks = Number(marks);
      valCgpa = numMarks > 10 ? Math.min(10, Math.max(0, (numMarks / 100) * 10)) : numMarks;
    }

    let valAttendance = null;
    const rawAttendance = attendancePercentage ?? attendance;
    if (rawAttendance !== undefined && rawAttendance !== null && rawAttendance !== '') {
      valAttendance = Number(rawAttendance);
    }

    // 3. Save directly to User Document
    if (valCgpa !== null && !isNaN(valCgpa)) user.cgpa = valCgpa;
    if (valAttendance !== null && !isNaN(valAttendance)) user.attendance = valAttendance;
    await user.save();

    // 4. Update or Upsert StudentProfile Document
    const updatePayload = {};
    if (valCgpa !== null && !isNaN(valCgpa)) updatePayload.cgpa = valCgpa;
    if (valAttendance !== null && !isNaN(valAttendance)) {
      updatePayload.attendancePercentage = valAttendance;
      updatePayload.attendance = valAttendance;
    }

    const pushPayload = {};
    if (teacherNotes && typeof teacherNotes === 'string' && teacherNotes.trim().length > 0) {
      pushPayload.qualitativeNotes = {
        authorRole: 'Teacher',
        note: teacherNotes.trim(),
        category: 'Academic',
        createdAt: new Date(),
      };
    }

    const updateQuery = { $set: updatePayload };
    if (Object.keys(pushPayload).length > 0) {
      updateQuery.$push = pushPayload;
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { user: user._id },
      updateQuery,
      { new: true, upsert: true, setDefaultsOnInsert: false }
    );

    // Compute readiness status
    const isSurveyDone = Boolean(profile.surveyCompleted || user.surveyCompleted);
    const canEvaluate = profile.cgpa !== null && profile.attendancePercentage !== null && isSurveyDone;

    return res.status(200).json({
      success: true,
      message: 'Student academic record updated successfully',
      student: {
        _id: user._id,
        cgpa: profile.cgpa,
        attendance: profile.attendancePercentage,
        canEvaluate,
        riskLevel: profile.riskLevel || user.riskLevel || null,
      },
    });
  } catch (error) {
    console.error('CRITICAL ERROR in updateStudentMarks:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating student marks',
    });
  }
};

// @desc    Trigger Weighted AI Risk Evaluation for a Student (Manual Trigger Only)
// @route   POST /api/teacher/risk/evaluate
// @access  Private (Teacher, Admin)
exports.evaluateStudentRisk = async (req, res) => {
  try {
    const targetId = req.params.studentId || req.params.id || req.body.studentId || req.body.id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const isObjectId = Boolean(targetId.match(/^[0-9a-fA-F]{24}$/));

    // 1. Fetch Student Profile and User Document
    let profile = await StudentProfile.findOne(
      isObjectId ? { $or: [{ user: targetId }, { _id: targetId }] } : { studentId: targetId }
    );

    let user = await User.findById(isObjectId ? targetId : profile?.user);

    if (!user && !profile) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    if (!profile) {
      profile = new StudentProfile({
        user: user._id,
        studentId: user.studentId || `STU-${user._id.toString().slice(-4)}`,
        department: user.department || 'Computer Science',
        yearOfStudy: user.yearOfStudy || '1st Year',
      });
    }

    // 2. Validate prerequisites BEFORE running evaluation algorithm
    const hasCgpa = profile.cgpa !== null && profile.cgpa !== undefined;
    const hasAttendance = profile.attendancePercentage !== null && profile.attendancePercentage !== undefined;
    const hasSurvey = profile.surveyCompleted === true;

    if (!hasCgpa || !hasAttendance || !hasSurvey) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation locked: Requires Teacher Marks (CGPA & Attendance) AND Student Survey completion.',
      });
    }

    // 3. Extract metrics with safe fallbacks
    const cgpa = Number(profile.cgpa ?? user?.cgpa ?? 0);
    const attendance = Number(profile.attendancePercentage ?? profile.attendance ?? user?.attendance ?? 0);
    const backlogs = String(profile.activeBacklogs || '0');

    const sData = profile.surveyData || {};
    const financialStress = profile.financialStress || sData.moneyFeeWorries || 'Low';
    const mentalHealth = profile.mentalHealthSelfReport || profile.mentalHealthState || sData.mentalHealthState || 'Good';
    const addictions = profile.addictions || sData.impactFactors || [];

    // Weighted risk scoring
    let academicRiskPoints = 0;
    let financialRiskPoints = 0;
    let wellnessRiskPoints = 0;

    // A. ACADEMIC EVALUATION
    if (cgpa > 0 && cgpa < 5.0) academicRiskPoints += 3;
    else if (cgpa >= 5.0 && cgpa < 6.5) academicRiskPoints += 2;
    else if (cgpa >= 6.5 && cgpa < 7.5) academicRiskPoints += 1;

    if (attendance < 60) academicRiskPoints += 3;
    else if (attendance >= 60 && attendance < 75) academicRiskPoints += 2;
    else if (attendance >= 75 && attendance < 85) academicRiskPoints += 1;

    if (backlogs === '> 4' || backlogs === '3-4') academicRiskPoints += 3;
    else if (backlogs === '1-2') academicRiskPoints += 1.5;

    // B. FINANCIAL EVALUATION
    if (financialStress.toLowerCase().includes('high') || financialStress.toLowerCase().includes('severe')) {
      financialRiskPoints += 3;
    } else if (financialStress.toLowerCase().includes('moderate')) {
      financialRiskPoints += 1;
    }

    // C. WELLNESS & LIFESTYLE EVALUATION
    const mentalLower = mentalHealth.toLowerCase();
    if (mentalLower.includes('burned out') || mentalLower.includes('depressed') || mentalLower.includes('overwhelmed')) {
      wellnessRiskPoints += 3;
    } else if (mentalLower.includes('anxious') || mentalLower.includes('stressed')) {
      wellnessRiskPoints += 2;
    }

    if (Array.isArray(addictions) && addictions.some((item) => item.toLowerCase().includes('substance'))) {
      wellnessRiskPoints += 3;
    }

    // 4. TOTAL RISK SCORE & CATEGORY ASSIGNMENT
    const totalRiskScore = academicRiskPoints + financialRiskPoints + wellnessRiskPoints;

    let calculatedRiskLevel = 'Low';
    if (totalRiskScore >= 5 || academicRiskPoints >= 5 || wellnessRiskPoints >= 4) {
      calculatedRiskLevel = 'High';
    } else if (totalRiskScore >= 2.5) {
      calculatedRiskLevel = 'Medium';
    }

    // Primary Risk Category Identification & Role Routing
    let primaryRiskCategory = 'None';
    let assignedRole = 'TEACHER'; // Default action handler

    if (calculatedRiskLevel !== 'Low') {
      const highestPoints = Math.max(academicRiskPoints, financialRiskPoints, wellnessRiskPoints);

      if (highestPoints === academicRiskPoints) {
        primaryRiskCategory = 'Academic Concern';
        assignedRole = 'TEACHER'; // Teacher provides academic interventions
      } else if (highestPoints === financialRiskPoints) {
        primaryRiskCategory = 'Financial Burden';
        assignedRole = 'COUNSELOR'; // Escalate to financial/student counselor
      } else if (highestPoints === wellnessRiskPoints) {
        primaryRiskCategory = 'Wellness & Mental Health';
        assignedRole = 'COUNSELOR'; // Escalate to psychological counselor
      }
    }

    // 5. Save updated risk evaluations to MongoDB
    profile.riskLevel = calculatedRiskLevel;
    profile.riskCategory = primaryRiskCategory;
    profile.assignedRole = assignedRole;
    profile.riskEvaluated = true;
    profile.lastEvaluatedAt = new Date();

    if (user) {
      user.riskLevel = calculatedRiskLevel;
      await user.save();
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: `AI Evaluation complete. Student assigned to ${assignedRole} for ${primaryRiskCategory}.`,
      riskLevel: calculatedRiskLevel,
      riskCategory: primaryRiskCategory,
      assignedRole,
      student: {
        _id: user?._id || profile.user,
        riskLevel: calculatedRiskLevel,
        riskCategory: primaryRiskCategory,
        assignedRole,
      },
      evaluation: {
        riskLevel: calculatedRiskLevel,
        riskCategory: primaryRiskCategory,
        assignedRole,
        totalRiskScore,
        breakdown: {
          academicRiskPoints,
          financialRiskPoints,
          wellnessRiskPoints,
        },
      },
    });
  } catch (error) {
    console.error('Error evaluating risk:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during risk evaluation',
    });
  }
};

// @desc    Delete a student user and associated profile
// @route   DELETE /api/teacher/students/:id
// @access  Private (Teacher, Admin)
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const isObjectId = Boolean(id.match(/^[0-9a-fA-F]{24}$/));
    if (!isObjectId) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await User.findByIdAndDelete(id);
    await StudentProfile.deleteMany({ user: id });

    return res.status(200).json({
      success: true,
      message: 'Student account and profile deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting student',
    });
  }
};