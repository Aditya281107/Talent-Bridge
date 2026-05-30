const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { generateEmbedding, cosineSimilarity } = require('../utils/embeddings');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Fields that can be updated
    const updatableFields = [
      'name', 'phone', 'location', 'bio', 'avatar',
      // Seeker fields
      'title', 'skills', 'experience', 'resume',
      // Employer fields
      'company', 'companyWebsite', 'companySize', 'industry',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Handle password update separately
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Generate new semantic embedding for the profile
    if (user.role === 'seeker') {
      const profileText = `Title: ${user.title || ''}. Experience: ${user.experience || 0} years. Skills: ${user.skills ? user.skills.join(', ') : ''}. Bio: ${user.bio || ''}`;
      const embedding = await generateEmbedding(profileText);
      if (embedding.length > 0) {
        user.profileEmbedding = embedding;
      }
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (req.user.role === 'seeker') {
      // Seeker dashboard stats
      const [totalApps, pendingApps, shortlistedApps, acceptedApps, rejectedApps, recentApps] =
        await Promise.all([
          Application.countDocuments({ applicant: userId }),
          Application.countDocuments({ applicant: userId, status: 'pending' }),
          Application.countDocuments({ applicant: userId, status: 'shortlisted' }),
          Application.countDocuments({ applicant: userId, status: 'accepted' }),
          Application.countDocuments({ applicant: userId, status: 'rejected' }),
          Application.find({ applicant: userId })
            .populate('job', 'title company location type')
            .sort('-createdAt')
            .limit(5),
        ]);

      res.json({
        success: true,
        data: {
          role: 'seeker',
          stats: {
            totalApplications: totalApps,
            pending: pendingApps,
            shortlisted: shortlistedApps,
            accepted: acceptedApps,
            rejected: rejectedApps,
          },
          recentApplications: recentApps,
        },
      });
    } else {
      // Employer dashboard stats
      const employerJobs = await Job.find({ employer: userId }).select('_id');
      const jobIds = employerJobs.map((j) => j._id);

      const [totalJobs, openJobs, totalApplicants, pendingApplicants, recentApplicants] =
        await Promise.all([
          Job.countDocuments({ employer: userId }),
          Job.countDocuments({ employer: userId, status: 'open' }),
          Application.countDocuments({ job: { $in: jobIds } }),
          Application.countDocuments({ job: { $in: jobIds }, status: 'pending' }),
          Application.find({ job: { $in: jobIds } })
            .populate('applicant', 'name email title')
            .populate('job', 'title')
            .sort('-createdAt')
            .limit(5),
        ]);

      res.json({
        success: true,
        data: {
          role: 'employer',
          stats: {
            totalJobs,
            openJobs,
            totalApplicants,
            pendingReview: pendingApplicants,
          },
          recentApplicants,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Search candidates (seekers)
// @route   GET /api/users/candidates
// @access  Private (Employer)
const searchCandidates = async (req, res, next) => {
  try {
    const {
      search,
      skills,
      location,
      experienceMin,
      experienceMax,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { role: 'seeker' };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Skills filter (comma-separated)
    if (skills) {
      const skillsArray = skills.split(',').map((s) => s.trim().toLowerCase());
      query.skills = { $in: skillsArray.map((s) => new RegExp(s, 'i')) };
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Experience range filter
    if (experienceMin || experienceMax) {
      query.experience = {};
      if (experienceMin) query.experience.$gte = Number(experienceMin);
      if (experienceMax) query.experience.$lte = Number(experienceMax);
    }

    const skip = (Number(page) - 1) * Number(limit);

    let [candidates, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(search ? { score: { $meta: 'textScore' } } : '-createdAt'),
      User.countDocuments(query),
    ]);

    // RAG/Semantic Contextual Ranking
    if (search && candidates.length > 0) {
      const queryEmbedding = await generateEmbedding(search);
      
      if (queryEmbedding.length > 0) {
        candidates = candidates.map(candidate => {
          const doc = candidate.toObject();
          // Calculate cosine similarity if candidate has an embedding
          if (doc.profileEmbedding && doc.profileEmbedding.length > 0) {
            doc.matchScore = cosineSimilarity(queryEmbedding, doc.profileEmbedding);
          } else {
            doc.matchScore = 0;
          }
          // Remove embedding from response to save bandwidth
          delete doc.profileEmbedding;
          return doc;
        });

        // Sort by semantic match score
        candidates.sort((a, b) => b.matchScore - a.matchScore);
      }
    }

    // Apply pagination after semantic sorting
    const paginatedCandidates = candidates.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedCandidates,
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

// @desc    Search employers/companies
// @route   GET /api/users/employers
// @access  Private
const searchEmployers = async (req, res, next) => {
  try {
    const {
      search,
      industry,
      location,
      companySize,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { role: 'employer' };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Industry filter
    if (industry) {
      query.industry = { $regex: industry, $options: 'i' };
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Company size filter
    if (companySize) {
      query.companySize = companySize;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Also get job count for each employer
    const [employers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(search ? { score: { $meta: 'textScore' } } : '-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    // Enrich with active job counts
    const employerIds = employers.map((e) => e._id);
    const jobCounts = await Job.aggregate([
      { $match: { employer: { $in: employerIds }, status: 'open' } },
      { $group: { _id: '$employer', count: { $sum: 1 } } },
    ]);

    const jobCountMap = {};
    jobCounts.forEach((jc) => {
      jobCountMap[jc._id.toString()] = jc.count;
    });

    const enriched = employers.map((emp) => ({
      ...emp.toObject(),
      activeJobCount: jobCountMap[emp._id.toString()] || 0,
    }));

    res.json({
      success: true,
      data: enriched,
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

const { parseResumeToProfile } = require('../utils/resumeParser');

// @desc    Upload Resume and Parse to Custom Profile
// @route   POST /api/users/profile/parse-resume
// @access  Private (Seeker)
const parseResume = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No resume file provided');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // 1. Parse the PDF buffer using Gemini
    const profileData = await parseResumeToProfile(req.file.buffer);

    // 2. Update the user profile
    user.title = profileData.title || user.title;
    user.skills = profileData.skills || user.skills;
    user.experience = profileData.experience || user.experience;
    user.bio = profileData.bio || user.bio;

    // 3. Regenerate Semantic Embedding
    const profileText = `Title: ${user.title || ''}. Experience: ${user.experience || 0} years. Skills: ${user.skills ? user.skills.join(', ') : ''}. Bio: ${user.bio || ''}`;
    const embedding = await generateEmbedding(profileText);
    if (embedding && embedding.length > 0) {
      user.profileEmbedding = embedding;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: updatedUser,
      message: 'Resume successfully parsed and profile updated!',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, updateUserProfile, getDashboardStats, searchCandidates, searchEmployers, parseResume };
