const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env
dotenv.config({ path: '../.env' });
if (!process.env.MONGO_URI) dotenv.config();

const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Assessment = require('./models/Assessment');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Assessment.deleteMany({});
    console.log('🗑️  Cleared existing data\n');

    // ========== EMPLOYERS ==========
    const employers = await User.create([
      {
        name: 'Priya Sharma',
        email: 'priya@google.com',
        password: 'password123',
        role: 'employer',
        company: 'Google',
        industry: 'Technology',
        location: 'Bangalore, India',
        companySize: '500+',
        companyWebsite: 'https://google.com',
        bio: 'Leading innovation in search, cloud computing, and AI. We build products that help billions of people.',
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@microsoft.com',
        password: 'password123',
        role: 'employer',
        company: 'Microsoft',
        industry: 'Technology',
        location: 'Hyderabad, India',
        companySize: '500+',
        companyWebsite: 'https://microsoft.com',
        bio: 'Empowering every person and organization on the planet to achieve more.',
      },
      {
        name: 'Ananya Patel',
        email: 'ananya@flipkart.com',
        password: 'password123',
        role: 'employer',
        company: 'Flipkart',
        industry: 'E-Commerce',
        location: 'Bangalore, India',
        companySize: '201-500',
        companyWebsite: 'https://flipkart.com',
        bio: "India's leading e-commerce marketplace with 400M+ registered users.",
      },
      {
        name: 'Vikram Singh',
        email: 'vikram@razorpay.com',
        password: 'password123',
        role: 'employer',
        company: 'Razorpay',
        industry: 'FinTech',
        location: 'Bangalore, India',
        companySize: '51-200',
        companyWebsite: 'https://razorpay.com',
        bio: 'Simplifying payments for Indian businesses. Processing billions in transactions.',
      },
      {
        name: 'Meera Joshi',
        email: 'meera@zomato.com',
        password: 'password123',
        role: 'employer',
        company: 'Zomato',
        industry: 'Food & Delivery',
        location: 'Gurugram, India',
        companySize: '201-500',
        companyWebsite: 'https://zomato.com',
        bio: 'Better food for more people. Connecting restaurants with food lovers across India.',
      },
      {
        name: 'Arjun Reddy',
        email: 'arjun@infosys.com',
        password: 'password123',
        role: 'employer',
        company: 'Infosys',
        industry: 'IT Services',
        location: 'Pune, India',
        companySize: '500+',
        companyWebsite: 'https://infosys.com',
        bio: 'Global leader in next-generation digital services and consulting.',
      },
    ]);
    console.log(`🏢 Created ${employers.length} employer accounts`);

    // ========== SEEKERS ==========
    const seekers = await User.create([
      {
        name: 'Aditya Kumar',
        email: 'aditya@email.com',
        password: 'password123',
        role: 'seeker',
        title: 'Full Stack Developer',
        skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
        experience: 3,
        location: 'Delhi, India',
        bio: 'Passionate full-stack developer with 3 years of experience building scalable web applications.',
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha@email.com',
        password: 'password123',
        role: 'seeker',
        title: 'Frontend Engineer',
        skills: ['React', 'Vue.js', 'CSS', 'JavaScript', 'Figma'],
        experience: 2,
        location: 'Mumbai, India',
        bio: 'Creative frontend engineer who loves building beautiful, responsive user interfaces.',
      },
      {
        name: 'Rohan Mehta',
        email: 'rohan@email.com',
        password: 'password123',
        role: 'seeker',
        title: 'Backend Engineer',
        skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'Kubernetes'],
        experience: 4,
        location: 'Bangalore, India',
        bio: 'Backend engineer specializing in distributed systems and microservices architecture.',
      },
      {
        name: 'Kavya Nair',
        email: 'kavya@email.com',
        password: 'password123',
        role: 'seeker',
        title: 'Data Scientist',
        skills: ['Python', 'TensorFlow', 'SQL', 'Machine Learning', 'Pandas'],
        experience: 2,
        location: 'Chennai, India',
        bio: 'Data scientist with expertise in ML models and data-driven decision making.',
      },
      {
        name: 'Amit Desai',
        email: 'amit@email.com',
        password: 'password123',
        role: 'seeker',
        title: 'DevOps Engineer',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
        experience: 5,
        location: 'Hyderabad, India',
        bio: 'DevOps engineer passionate about infrastructure automation and cloud-native technologies.',
      },
      {
        name: 'Divya Iyer',
        email: 'divya@email.com',
        password: 'password123',
        role: 'seeker',
        title: 'UI/UX Designer',
        skills: ['Figma', 'Adobe XD', 'CSS', 'User Research', 'Prototyping'],
        experience: 3,
        location: 'Pune, India',
        bio: 'UI/UX designer creating intuitive and delightful digital experiences.',
      },
    ]);
    console.log(`👤 Created ${seekers.length} seeker accounts`);

    // ========== JOBS ==========
    const jobs = await Job.create([
      // Google jobs
      {
        title: 'Senior React Developer',
        company: 'Google',
        description: 'We are looking for a Senior React Developer to join our Cloud Console team. You will be building next-generation UI components for Google Cloud Platform, working with cutting-edge technologies and serving millions of developers worldwide.\n\nYou will collaborate with product managers, designers, and backend engineers to deliver exceptional user experiences.',
        requirements: ['5+ years React experience', 'TypeScript proficiency', 'Experience with design systems', 'Strong CS fundamentals'],
        location: 'Bangalore, India',
        type: 'full-time',
        salaryMin: 2500000,
        salaryMax: 4500000,
        salaryCurrency: 'INR',
        skills: ['React', 'TypeScript', 'GraphQL', 'CSS'],
        experienceLevel: 'senior',
        employer: employers[0]._id,
        deadline: new Date('2025-08-30'),
      },
      {
        title: 'ML Engineer Intern',
        company: 'Google',
        description: 'Join Google AI as an ML Engineer Intern. Work on real-world machine learning problems at Google scale. You will get mentorship from world-class researchers and engineers.\n\nThis is a 6-month internship with the possibility of a full-time offer.',
        requirements: ['Currently pursuing B.Tech/M.Tech in CS or related', 'Strong Python skills', 'ML/DL fundamentals', 'Research publications preferred'],
        location: 'Bangalore, India',
        type: 'internship',
        salaryMin: 80000,
        salaryMax: 120000,
        salaryCurrency: 'INR',
        skills: ['Python', 'TensorFlow', 'Machine Learning', 'Deep Learning'],
        experienceLevel: 'entry',
        employer: employers[0]._id,
        deadline: new Date('2025-07-15'),
      },
      // Microsoft jobs
      {
        title: 'Full Stack Developer',
        company: 'Microsoft',
        description: 'Join Microsoft Teams to build collaboration tools used by 300M+ people. You will work on both frontend and backend components, shipping features that impact how the world works together.\n\nWe value diversity, inclusion, and a growth mindset.',
        requirements: ['3+ years full-stack experience', 'React and Node.js', 'Cloud services experience', 'Agile methodology'],
        location: 'Hyderabad, India',
        type: 'full-time',
        salaryMin: 2000000,
        salaryMax: 3500000,
        salaryCurrency: 'INR',
        skills: ['React', 'Node.js', 'Azure', 'TypeScript', 'SQL'],
        experienceLevel: 'mid',
        employer: employers[1]._id,
        deadline: new Date('2025-09-01'),
      },
      {
        title: 'Cloud Solutions Architect',
        company: 'Microsoft',
        description: 'Help enterprise customers architect and deploy solutions on Azure. You will be the technical bridge between Microsoft and our largest customers in India.\n\nTravel up to 20% within India.',
        requirements: ['5+ years cloud experience', 'Azure certifications preferred', 'Strong communication skills', 'Enterprise architecture knowledge'],
        location: 'Hyderabad, India',
        type: 'full-time',
        salaryMin: 3000000,
        salaryMax: 5000000,
        salaryCurrency: 'INR',
        skills: ['Azure', 'AWS', 'Kubernetes', 'Terraform', 'Networking'],
        experienceLevel: 'senior',
        employer: employers[1]._id,
        deadline: new Date('2025-08-15'),
      },
      // Flipkart jobs
      {
        title: 'Backend Engineer - Payments',
        company: 'Flipkart',
        description: 'Build and scale the payment infrastructure that processes millions of transactions daily. You will work on high-throughput, low-latency systems that are critical to Flipkart\'s business.\n\nJoin our world-class engineering team in Bangalore.',
        requirements: ['3+ years backend experience', 'Java or Go proficiency', 'Distributed systems knowledge', 'Payment systems experience a plus'],
        location: 'Bangalore, India',
        type: 'full-time',
        salaryMin: 1800000,
        salaryMax: 3000000,
        salaryCurrency: 'INR',
        skills: ['Java', 'Go', 'Microservices', 'Kafka', 'Redis'],
        experienceLevel: 'mid',
        employer: employers[2]._id,
        deadline: new Date('2025-08-20'),
      },
      // Razorpay jobs
      {
        title: 'Frontend Developer',
        company: 'Razorpay',
        description: 'Build the dashboard that thousands of businesses use to manage their payments. We care deeply about developer experience and beautiful interfaces.\n\nFast-paced startup environment with high ownership.',
        requirements: ['2+ years frontend experience', 'React expertise', 'API integration experience', 'Eye for design'],
        location: 'Bangalore, India',
        type: 'full-time',
        salaryMin: 1500000,
        salaryMax: 2500000,
        salaryCurrency: 'INR',
        skills: ['React', 'JavaScript', 'CSS', 'REST APIs', 'Git'],
        experienceLevel: 'mid',
        employer: employers[3]._id,
        deadline: new Date('2025-09-10'),
      },
      {
        title: 'DevOps Engineer',
        company: 'Razorpay',
        description: 'Manage and scale our cloud infrastructure serving 8M+ businesses. You will work on CI/CD pipelines, container orchestration, and infrastructure as code.\n\nWe run on AWS and use Kubernetes extensively.',
        requirements: ['3+ years DevOps experience', 'AWS expertise', 'Kubernetes and Docker', 'Scripting (Python/Bash)'],
        location: 'Bangalore, India',
        type: 'full-time',
        salaryMin: 1800000,
        salaryMax: 3200000,
        salaryCurrency: 'INR',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Python'],
        experienceLevel: 'mid',
        employer: employers[3]._id,
        deadline: new Date('2025-08-25'),
      },
      // Zomato jobs
      {
        title: 'React Native Developer',
        company: 'Zomato',
        description: 'Build features for the Zomato app used by 80M+ monthly users. You will work on the core ordering experience, making food delivery faster and more delightful.\n\nRemote-friendly with flexible hours.',
        requirements: ['2+ years React Native', 'Published app on Play Store/App Store', 'Performance optimization experience', 'Good design sense'],
        location: 'Gurugram, India',
        type: 'full-time',
        salaryMin: 1600000,
        salaryMax: 2800000,
        salaryCurrency: 'INR',
        skills: ['React Native', 'JavaScript', 'Redux', 'REST APIs'],
        experienceLevel: 'mid',
        employer: employers[4]._id,
        deadline: new Date('2025-09-05'),
      },
      {
        title: 'Data Analyst Intern',
        company: 'Zomato',
        description: 'Analyze food delivery patterns and customer behavior to drive business decisions. You will work with large datasets and present insights to leadership.\n\n3-month internship with PPO opportunity.',
        requirements: ['Pursuing degree in CS/Statistics/Math', 'SQL proficiency', 'Python basics', 'Analytical mindset'],
        location: 'Gurugram, India',
        type: 'internship',
        salaryMin: 30000,
        salaryMax: 50000,
        salaryCurrency: 'INR',
        skills: ['SQL', 'Python', 'Excel', 'Data Analysis'],
        experienceLevel: 'entry',
        employer: employers[4]._id,
        deadline: new Date('2025-07-30'),
      },
      // Infosys jobs
      {
        title: 'Java Developer',
        company: 'Infosys',
        description: 'Join our digital transformation team to build enterprise-grade applications for Fortune 500 clients. Work on modernizing legacy systems using Java and Spring Boot.\n\nExcellent learning and growth opportunities.',
        requirements: ['2+ years Java experience', 'Spring Boot proficiency', 'REST API design', 'SQL databases'],
        location: 'Pune, India',
        type: 'full-time',
        salaryMin: 800000,
        salaryMax: 1500000,
        salaryCurrency: 'INR',
        skills: ['Java', 'Spring Boot', 'MySQL', 'REST APIs', 'Git'],
        experienceLevel: 'mid',
        employer: employers[5]._id,
        deadline: new Date('2025-09-15'),
      },
      {
        title: 'UI/UX Designer',
        company: 'Infosys',
        description: 'Design intuitive interfaces for our enterprise clients across banking, healthcare, and retail. You will conduct user research, create wireframes, and deliver pixel-perfect designs.\n\nWork in a collaborative, creative environment.',
        requirements: ['2+ years design experience', 'Figma or Sketch proficiency', 'Portfolio required', 'Understanding of design systems'],
        location: 'Pune, India',
        type: 'full-time',
        salaryMin: 900000,
        salaryMax: 1600000,
        salaryCurrency: 'INR',
        skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'CSS'],
        experienceLevel: 'mid',
        employer: employers[5]._id,
        deadline: new Date('2025-08-28'),
      },
      // Remote job
      {
        title: 'Contract Python Developer',
        company: 'Razorpay',
        description: 'We need a Python developer for a 6-month contract to build internal automation tools and data pipelines.\n\nFully remote, flexible schedule.',
        requirements: ['3+ years Python', 'Data pipeline experience', 'API development', 'Self-motivated'],
        location: 'Remote, India',
        type: 'contract',
        salaryMin: 100000,
        salaryMax: 180000,
        salaryCurrency: 'INR',
        skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Airflow'],
        experienceLevel: 'mid',
        employer: employers[3]._id,
        deadline: new Date('2025-08-10'),
      },
    ]);
    console.log(`💼 Created ${jobs.length} job listings`);

    // ========== APPLICATIONS ==========
    const applications = await Application.create([
      {
        job: jobs[0]._id, // Google Senior React
        applicant: seekers[0]._id, // Aditya
        status: 'shortlisted',
        coverLetter: 'I am excited to apply for the Senior React Developer position at Google. With 3 years of experience building React applications and a strong foundation in TypeScript, I believe I can contribute significantly to your Cloud Console team.',
        statusHistory: [
          { fromStatus: 'none', toStatus: 'pending', changedBy: seekers[0]._id, changedAt: new Date('2025-06-01'), note: 'Application submitted' },
          { fromStatus: 'pending', toStatus: 'reviewed', changedBy: employers[0]._id, changedAt: new Date('2025-06-03'), note: 'Strong React portfolio' },
          { fromStatus: 'reviewed', toStatus: 'shortlisted', changedBy: employers[0]._id, changedAt: new Date('2025-06-05'), note: 'Moving to interview round' },
        ],
      },
      {
        job: jobs[2]._id, // Microsoft Full Stack
        applicant: seekers[0]._id, // Aditya
        status: 'reviewed',
        coverLetter: 'As a full-stack developer with experience in React and Node.js, I would love to contribute to Microsoft Teams.',
        statusHistory: [
          { fromStatus: 'none', toStatus: 'pending', changedBy: seekers[0]._id, changedAt: new Date('2025-06-02'), note: 'Application submitted' },
          { fromStatus: 'pending', toStatus: 'reviewed', changedBy: employers[1]._id, changedAt: new Date('2025-06-04'), note: 'Good experience match' },
        ],
      },
      {
        job: jobs[5]._id, // Razorpay Frontend
        applicant: seekers[1]._id, // Sneha
        status: 'pending',
        coverLetter: 'I love building beautiful interfaces and Razorpay\'s dashboard is one I admire. I would be thrilled to contribute to it.',
        statusHistory: [
          { fromStatus: 'none', toStatus: 'pending', changedBy: seekers[1]._id, changedAt: new Date('2025-06-04'), note: 'Application submitted' },
        ],
      },
      {
        job: jobs[4]._id, // Flipkart Backend
        applicant: seekers[2]._id, // Rohan
        status: 'accepted',
        coverLetter: 'With 4 years of backend experience and knowledge of distributed systems, I am confident I can help scale Flipkart\'s payment infrastructure.',
        statusHistory: [
          { fromStatus: 'none', toStatus: 'pending', changedBy: seekers[2]._id, changedAt: new Date('2025-05-20'), note: 'Application submitted' },
          { fromStatus: 'pending', toStatus: 'reviewed', changedBy: employers[2]._id, changedAt: new Date('2025-05-22'), note: 'Excellent backend skills' },
          { fromStatus: 'reviewed', toStatus: 'shortlisted', changedBy: employers[2]._id, changedAt: new Date('2025-05-25'), note: 'Cleared technical round' },
          { fromStatus: 'shortlisted', toStatus: 'accepted', changedBy: employers[2]._id, changedAt: new Date('2025-05-30'), note: 'Offer extended - L4 Backend Engineer' },
        ],
      },
      {
        job: jobs[6]._id, // Razorpay DevOps
        applicant: seekers[4]._id, // Amit
        status: 'shortlisted',
        coverLetter: 'I have 5 years of DevOps experience with AWS and Kubernetes — exactly the stack Razorpay uses. Excited to help scale your infrastructure.',
        statusHistory: [
          { fromStatus: 'none', toStatus: 'pending', changedBy: seekers[4]._id, changedAt: new Date('2025-06-01'), note: 'Application submitted' },
          { fromStatus: 'pending', toStatus: 'shortlisted', changedBy: employers[3]._id, changedAt: new Date('2025-06-04'), note: 'Perfect skill match, scheduling interview' },
        ],
      },
      {
        job: jobs[10]._id, // Infosys UI/UX
        applicant: seekers[5]._id, // Divya
        status: 'rejected',
        coverLetter: 'As a UI/UX designer with 3 years of experience, I am passionate about creating user-centered designs for enterprise applications.',
        statusHistory: [
          { fromStatus: 'none', toStatus: 'pending', changedBy: seekers[5]._id, changedAt: new Date('2025-05-28'), note: 'Application submitted' },
          { fromStatus: 'pending', toStatus: 'reviewed', changedBy: employers[5]._id, changedAt: new Date('2025-05-30'), note: 'Reviewing portfolio' },
          { fromStatus: 'reviewed', toStatus: 'rejected', changedBy: employers[5]._id, changedAt: new Date('2025-06-02'), note: 'Position filled internally' },
        ],
      },
    ]);

    // Update application counts on jobs
    const appCounts = {};
    applications.forEach((app) => {
      const jobId = app.job.toString();
      appCounts[jobId] = (appCounts[jobId] || 0) + 1;
    });
    for (const [jobId, count] of Object.entries(appCounts)) {
      await Job.findByIdAndUpdate(jobId, { applicationCount: count });
    }

    console.log(`📄 Created ${applications.length} applications (with audit trails)`);

    // ========== ASSESSMENTS ==========
    const assessments = await Assessment.create([
      {
        title: 'Software Engineer Assessment',
        description: 'Complete the following coding challenges to evaluate your problem solving skills.',
        type: 'coding',
        codingQuestions: [
          {
            title: 'Two Sum',
            description: 'Given an array of integers and a target sum, return the indices of the two numbers that add up to the target.\n\nInput: First line is the array (comma-separated), second line is the target.\nOutput: Two indices separated by a space.',
            initialCode: {
              javascript: '// Read input from stdin\nconst readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on("line", (line) => lines.push(line));\nrl.on("close", () => {\n  const nums = lines[0].split(",").map(Number);\n  const target = parseInt(lines[1]);\n  // Your solution here\n  \n});',
              python: 'nums = list(map(int, input().split(",")))\ntarget = int(input())\n# Your solution here\n',
            },
            testCases: [
              { input: '2,7,11,15\n9', expectedOutput: '0 1', isHidden: false },
              { input: '3,2,4\n6', expectedOutput: '1 2', isHidden: false },
              { input: '1,5,3,7,2\n9', expectedOutput: '1 3', isHidden: true },
            ],
          },
          {
            title: 'Valid Palindrome',
            description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nInput: A single string.\nOutput: "true" if it is a palindrome, or "false" otherwise.',
            initialCode: {
              javascript: 'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on("line", (line) => {\n  // Your solution here\n  \n});',
              python: 's = input()\n# Your solution here\n',
            },
            testCases: [
              { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
              { input: 'race a car', expectedOutput: 'false', isHidden: false },
              { input: ' ', expectedOutput: 'true', isHidden: true },
            ]
          }
        ],
        timeLimit: 45,
        createdBy: employers[0]._id,
      },
      {
        title: 'JavaScript Fundamentals Quiz',
        description: 'Test your knowledge of JavaScript fundamentals including closures, promises, and data types.',
        type: 'quiz',
        questions: [
          {
            question: 'What is the output of: typeof null?',
            options: ['"null"', '"undefined"', '"object"', '"boolean"'],
            correctAnswer: 2,
            points: 1,
          },
          {
            question: 'Which method is used to convert a JSON string to a JavaScript object?',
            options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.toObject()'],
            correctAnswer: 1,
            points: 1,
          },
          {
            question: 'What does the "===" operator check?',
            options: ['Value only', 'Type only', 'Value and type', 'Reference'],
            correctAnswer: 2,
            points: 1,
          },
          {
            question: 'What is a closure in JavaScript?',
            options: [
              'A function that returns nothing',
              'A function bundled with its lexical environment',
              'A function that only runs once',
              'A function without parameters'
            ],
            correctAnswer: 1,
            points: 2,
          },
          {
            question: 'Which of the following is NOT a primitive type in JavaScript?',
            options: ['string', 'number', 'array', 'boolean'],
            correctAnswer: 2,
            points: 1,
          },
        ],
        timeLimit: 10,
        createdBy: employers[0]._id,
      },
      {
        title: 'FizzBuzz Classic',
        description: 'Complete the FizzBuzz problem.',
        type: 'coding',
        codingQuestions: [
          {
            title: 'FizzBuzz',
            description: 'Print numbers from 1 to N. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".\n\nInput: A single integer N.\nOutput: One value per line.',
            initialCode: {
              javascript: 'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on("line", (line) => {\n  const n = parseInt(line);\n  // Your solution here\n  \n});',
              python: 'n = int(input())\n# Your solution here\n',
            },
            testCases: [
              { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: false },
              { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isHidden: true },
            ],
          }
        ],
        timeLimit: 15,
        createdBy: employers[1]._id,
      },
    ]);
    console.log(`📝 Created ${assessments.length} assessment templates`);

    console.log('\n✨ Seed complete! Here are the login credentials:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  EMPLOYERS (password: password123)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    employers.forEach((e) => console.log(`  ${e.company.padEnd(12)} → ${e.email}`));
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  SEEKERS (password: password123)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    seekers.forEach((s) => console.log(`  ${s.title.padEnd(22)} → ${s.email}`));
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();
