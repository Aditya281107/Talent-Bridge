const Assessment = require('../models/Assessment');
const Application = require('../models/Application');
const { runCode } = require('../utils/codeRunner');

// @desc    Get assessment for an application
// @route   GET /api/applications/:id/assessment
// @access  Private (Seeker)
exports.getAssessment = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this assessment' });
    }

    if (!application.assessmentRef) {
      return res.status(404).json({ message: 'No assessment assigned to this application' });
    }

    const assessment = await Assessment.findById(application.assessmentRef);
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment template not found' });
    }

    // Build safe response based on type
    const safeAssessment = {
      _id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      type: assessment.type,
      timeLimit: assessment.timeLimit,
    };

    if (assessment.type === 'coding') {
      safeAssessment.codingQuestions = assessment.codingQuestions.map(cq => ({
        _id: cq._id,
        title: cq.title,
        description: cq.description,
        initialCode: cq.initialCode,
        testCases: cq.testCases
          .filter(tc => !tc.isHidden)
          .map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
      }));
    } else if (assessment.type === 'quiz') {
      // Send questions WITHOUT correct answers
      safeAssessment.questions = assessment.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        points: q.points,
      }));
    }

    // Update OA status to in-progress if it's currently pending
    if (application.oaStatus === 'pending') {
      application.oaStatus = 'in-progress';
      await application.save();
    }

    res.json(safeAssessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ message: 'Server error fetching assessment' });
  }
};

// @desc    Submit assessment for grading
// @route   POST /api/applications/:id/assessment
// @access  Private (Seeker)
exports.submitAssessment = async (req, res) => {
  try {
    const { codingAnswers, language, warningsCount, answers } = req.body;
    
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (application.oaStatus === 'completed') {
      return res.status(400).json({ message: 'Assessment already completed' });
    }

    const assessment = await Assessment.findById(application.assessmentRef);
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment template not found' });
    }

    let score = 0;
    let results = [];

    if (assessment.type === 'coding') {
      let totalTests = 0;
      let totalPassed = 0;
      results = [];

      for (let i = 0; i < assessment.codingQuestions.length; i++) {
        const question = assessment.codingQuestions[i];
        const code = codingAnswers?.[i] || '';
        
        const runResults = await runCode(code, language, question.testCases);
        totalTests += runResults.totalTests;
        totalPassed += runResults.passedTests;
        
        results.push({
          questionTitle: question.title,
          score: runResults.score,
          testResults: runResults.results
        });
      }
      
      score = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    } else if (assessment.type === 'quiz') {
      // Grade quiz answers
      let totalPoints = 0;
      let earnedPoints = 0;

      results = assessment.questions.map((q, i) => {
        totalPoints += q.points;
        const selectedAnswer = answers?.[i];
        const isCorrect = selectedAnswer === q.correctAnswer;
        if (isCorrect) earnedPoints += q.points;
        return {
          question: q.question,
          selectedAnswer,
          correctAnswer: q.correctAnswer,
          passed: isCorrect,
          points: q.points,
        };
      });

      score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    }

    // Update the application with the final score and warnings
    application.oaScore = score;
    application.proctorWarnings = warningsCount || 0;
    application.oaStatus = 'completed';
    await application.save();

    // Trigger real-time update for employer dashboard (Optional)
    const io = req.app.get('io');
    if (io) {
      io.to(`oa-${application._id}`).emit('oa-completed', {
        applicationId: application._id,
        applicantId: application.applicant,
        score,
        warningsCount: application.proctorWarnings,
      });

      // Also emit to the job-level scoreboard room
      io.to(`scoreboard-${application.job}`).emit('scoreboard-update', {
        applicationId: application._id,
        applicantId: application.applicant,
        score,
        warningsCount: application.proctorWarnings,
        oaStatus: 'completed',
      });
    }

    res.json({
      message: 'Assessment submitted successfully',
      score,
      results // Can be stripped in production so candidates don't see hidden test results
    });

  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ message: 'Server error during auto-grading' });
  }
};

// @desc    Assign assessment to application
// @route   PUT /api/applications/:id/assign-oa
// @access  Private (Employer)
exports.assignAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    let assessment;
    if (assessmentId) {
      // Employer picks a specific assessment
      assessment = await Assessment.findById(assessmentId);
    } else {
      // Fallback: grab the first available assessment
      assessment = await Assessment.findOne();
    }

    if (!assessment) return res.status(404).json({ message: 'No assessments exist in DB' });
    
    application.assessmentRef = assessment._id;
    application.oaStatus = 'pending';
    application.oaScore = 0;
    application.proctorWarnings = 0;
    
    await application.save();
    res.json({ message: 'Assessment assigned successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    List all assessments (optionally filtered by creator)
// @route   GET /api/assessments
// @access  Private (Employer)
exports.listAssessments = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [assessments, total] = await Promise.all([
      Assessment.find(query)
        .populate('createdBy', 'name company')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Assessment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: assessments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new assessment template
// @route   POST /api/assessments
// @access  Private (Employer)
exports.createAssessment = async (req, res) => {
  try {
    const {
      title,
      description,
      type = 'coding',
      codingQuestions,
      questions,
      timeLimit,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    if (type === 'coding' && (!codingQuestions || codingQuestions.length === 0)) {
      return res.status(400).json({ message: 'Coding assessments require at least one question' });
    }

    if (type === 'quiz' && (!questions || questions.length === 0)) {
      return res.status(400).json({ message: 'Quiz assessments require at least one question' });
    }

    const assessmentData = {
      title,
      description,
      type,
      timeLimit: timeLimit || 0,
      createdBy: req.user._id,
    };

    if (type === 'coding') {
      assessmentData.codingQuestions = codingQuestions;
    } else if (type === 'quiz') {
      assessmentData.questions = questions;
    }

    const assessment = await Assessment.create(assessmentData);

    res.status(201).json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating assessment' });
  }
};

// @desc    Get scoreboard data for a job (all applicants with OA scores)
// @route   GET /api/applications/job/:jobId/scoreboard
// @access  Private (Employer)
exports.getScoreboard = async (req, res) => {
  try {
    const Job = require('../models/Job');
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this scoreboard' });
    }

    const applications = await Application.find({
      job: req.params.jobId,
      assessmentRef: { $exists: true, $ne: null },
    })
      .populate('applicant', 'name email title avatar skills')
      .populate('assessmentRef', 'title type')
      .sort({ oaScore: -1, proctorWarnings: 1 });

    const scoreboard = applications.map((app, index) => ({
      rank: index + 1,
      applicationId: app._id,
      applicant: app.applicant,
      assessmentTitle: app.assessmentRef?.title || 'N/A',
      assessmentType: app.assessmentRef?.type || 'coding',
      oaStatus: app.oaStatus,
      oaScore: app.oaScore,
      proctorWarnings: app.proctorWarnings,
      status: app.status,
      submittedAt: app.updatedAt,
    }));

    res.json({
      success: true,
      data: scoreboard,
      jobTitle: job.title,
      jobCompany: job.company,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Run code against visible test cases
// @route   POST /api/applications/:id/run-code
// @access  Private (Seeker)
exports.runCodeDemo = async (req, res) => {
  try {
    const { code, language, questionIndex } = req.body;
    
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (application.oaStatus === 'completed') {
      return res.status(400).json({ message: 'Assessment already completed' });
    }

    const assessment = await Assessment.findById(application.assessmentRef);
    if (!assessment || assessment.type !== 'coding') {
      return res.status(404).json({ message: 'Coding assessment not found' });
    }

    const question = assessment.codingQuestions[questionIndex];
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Only run visible test cases
    const visibleTestCases = question.testCases.filter(tc => !tc.isHidden);
    
    const runResults = await runCode(code, language, visibleTestCases);

    res.json(runResults);

  } catch (error) {
    console.error('Error running code:', error);
    res.status(500).json({ message: 'Server error during code execution' });
  }
};
