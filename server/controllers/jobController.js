const Job = require('../models/Job');

// @desc    Get all jobs (with search, filter, pagination)
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res, next) => {
  try {
    const {
      search,
      type,
      location,
      experienceLevel,
      salaryMin,
      salaryMax,
      status = 'open',
      page = 1,
      limit = 12,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (type) query.type = type;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (status) query.status = status;

    // Salary range filter
    if (salaryMin) query.salaryMax = { $gte: Number(salaryMin) };
    if (salaryMax) query.salaryMin = { $lte: Number(salaryMax) };

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('employer', 'name company avatar')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: jobs,
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

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      'employer',
      'name company avatar bio companyWebsite companySize industry location'
    );

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Employer only)
const createJob = async (req, res, next) => {
  try {
    const {
      title,
      company,
      description,
      requirements,
      location,
      type,
      salaryMin,
      salaryMax,
      salaryCurrency,
      skills,
      experienceLevel,
      deadline,
    } = req.body;

    const job = await Job.create({
      title,
      company: company || req.user.company,
      description,
      requirements: requirements || [],
      location,
      type,
      salaryMin: salaryMin || 0,
      salaryMax: salaryMax || 0,
      salaryCurrency: salaryCurrency || 'USD',
      skills: skills || [],
      experienceLevel: experienceLevel || 'mid',
      deadline,
      employer: req.user._id,
    });

    const populatedJob = await Job.findById(job._id).populate(
      'employer',
      'name company avatar'
    );

    res.status(201).json({
      success: true,
      data: populatedJob,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (Employer - owner only)
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    // Check ownership
    if (job.employer.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this job');
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('employer', 'name company avatar');

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer - owner only)
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    // Check ownership
    if (job.employer.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this job');
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my jobs (employer)
// @route   GET /api/jobs/mine
// @access  Private (Employer)
const getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .sort('-createdAt')
      .select('title company status applicationCount type location createdAt');

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs };
