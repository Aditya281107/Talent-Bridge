const Application = require('../models/Application');
const Job = require('../models/Job');
const mongoose = require('mongoose');

// @desc    Apply to a job
// @route   POST /api/applications
// @access  Private (Seeker only)
const applyToJob = async (req, res, next) => {
  try {
    const { jobId, coverLetter } = req.body;

    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }
    if (job.status !== 'open') {
      res.status(400);
      throw new Error('This job is no longer accepting applications');
    }

    // Check for duplicate application
    const existingApp = await Application.findOne({
      job: jobId,
      applicant: req.user._id,
    });
    if (existingApp) {
      res.status(400);
      throw new Error('You have already applied to this job');
    }

    // Create application with initial status history entry
    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      coverLetter: coverLetter || '',
      statusHistory: [
        {
          fromStatus: 'none',
          toStatus: 'pending',
          changedBy: req.user._id,
          changedAt: new Date(),
          note: 'Application submitted',
        },
      ],
    });

    // Increment application count on job
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    const populatedApp = await Application.findById(application._id)
      .populate('job', 'title company location type')
      .populate('applicant', 'name email title');

    res.status(201).json({
      success: true,
      data: populatedApp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my applications (seeker)
// @route   GET /api/applications/mine
// @access  Private (Seeker)
const getMyApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { applicant: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('job', 'title company location type salaryMin salaryMax status')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get applications for a specific job (employer)
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer)
const getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    // Verify ownership
    if (job.employer.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view these applications');
    }

    const { status, page = 1, limit = 20 } = req.query;

    const query = { job: req.params.jobId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('applicant', 'name email title skills experience location bio avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { generateICS } = require('../utils/calendar');

// @desc    Update application status (with audit trail & concurrency control)
// @route   PUT /api/applications/:id/status
// @access  Private (Employer)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, note, version, scheduledDate, meetingLink } = req.body;

    if (!['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }

    const application = await Application.findById(req.params.id).populate('job').populate('applicant');

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    // Verify that the employer owns the job
    if (application.job.employer.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this application');
    }

    // Optimistic concurrency check — if client sent a version, verify it matches
    if (version !== undefined && application.__v !== Number(version)) {
      res.status(409);
      throw new Error(
        'This application was modified by another user. Please refresh and try again.'
      );
    }

    // Record the status change in audit trail
    const previousStatus = application.status;
    application.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || '',
    });

    application.status = status;

    try {
      await application.save();

      // Feature: Auto Closure
      if (status === 'accepted') {
        await Job.findByIdAndUpdate(application.job._id, { status: 'closed' });
      }

      // Feature: Automated Messaging & Calendar Sync
      if (scheduledDate) {
        try {
          const icsData = await generateICS({
            title: `Interview / Assessment for ${application.job.title}`,
            description: `You have been invited to an interview/assessment for the role of ${application.job.title} at ${application.job.company}.\n\nLink/Location: ${meetingLink || 'To be provided'}\n\nNote: ${note}`,
            start: scheduledDate,
            duration: 60,
            location: meetingLink
          });

          const conversation = await Conversation.findOrCreate(
            req.user._id,
            application.applicant._id,
            application._id
          );

          const message = await Message.create({
            conversation: conversation._id,
            sender: req.user._id,
            content: `Your application status has been updated to ${status}. An interview or assessment has been scheduled for ${new Date(scheduledDate).toLocaleString()}.\n\nMeeting Link: ${meetingLink || 'N/A'}\n\nNote: ${note}\n\nPlease download the calendar invite attached to this message.`,
            messageType: 'link',
            linkMetadata: {
              url: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsData)}`,
              label: 'Download Calendar Invite (.ics)',
              type: 'interview_link'
            },
            readBy: [req.user._id]
          });

          const currentUnread = conversation.unreadCount?.get(application.applicant._id.toString()) || 0;
          await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: {
              content: message.content,
              sender: req.user._id,
              createdAt: message.createdAt,
            },
            [`unreadCount.${application.applicant._id.toString()}`]: currentUnread + 1,
          });
        } catch (err) {
          console.error("Calendar Sync Error: ", err);
        }
      }
    } catch (saveError) {
      // Mongoose VersionError from optimisticConcurrency
      if (saveError.name === 'VersionError') {
        res.status(409);
        throw new Error(
          'Concurrency conflict: This application was modified by another user. Please refresh and try again.'
        );
      }
      throw saveError;
    }

    const updatedApp = await Application.findById(application._id)
      .populate('job', 'title company')
      .populate('applicant', 'name email title')
      .populate('statusHistory.changedBy', 'name email role');

    res.json({
      success: true,
      data: updatedApp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get application status history (audit trail)
// @route   GET /api/applications/:id/history
// @access  Private
const getApplicationHistory = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company employer')
      .populate('applicant', 'name email')
      .populate('statusHistory.changedBy', 'name email role');

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    // Only the applicant or the job's employer can view the history
    const isApplicant = application.applicant._id.toString() === req.user._id.toString();
    const isEmployer = application.job.employer.toString() === req.user._id.toString();

    if (!isApplicant && !isEmployer) {
      res.status(403);
      throw new Error('Not authorized to view this application history');
    }

    res.json({
      success: true,
      data: {
        applicationId: application._id,
        job: application.job,
        applicant: application.applicant,
        currentStatus: application.status,
        version: application.__v,
        history: application.statusHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

const { generateOfferLetter } = require('../utils/pdfGenerator');

// @desc    Generate and download Offer Letter PDF
// @route   GET /api/applications/:id/offer-letter
// @access  Private (Employer)
const generateOfferLetterPDF = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('applicant');

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    // Verify ownership
    if (application.job.employer.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to generate an offer for this application');
    }

    // The utility will automatically pipe the PDF to `res`
    generateOfferLetter(application, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationHistory,
  generateOfferLetterPDF,
};
