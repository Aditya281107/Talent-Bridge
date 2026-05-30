const axios = require('axios');

async function runTest() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'aditya@email.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('✅ Logged in successfully');

    // 2. Get applications to find one with an assessment
    const appsRes = await axios.get('http://localhost:5000/api/applications/mine', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // In our seed, Aditya applies to jobs. We need to find the one with an assessment.
    // If the employer hasn't assigned one in this fresh seed, we might need to assign it first.
    // Let's check apps.
    const appWithOA = appsRes.data.data.find(app => app.assessment);
    
    let appId;
    if (appWithOA) {
      appId = appWithOA._id;
      console.log('✅ Found assigned assessment on application:', appId);
    } else {
      console.log('⚠️ No assessment assigned. Let\'s assign one as an employer first.');
      // Login as employer
      const empLogin = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'priya@google.com',
        password: 'password123'
      });
      const empToken = empLogin.data.data.token;
      
      // Get job applications for Google
      const jobsRes = await axios.get('http://localhost:5000/api/jobs/mine', {
        headers: { Authorization: `Bearer ${empToken}` }
      });
      
      const job = jobsRes.data.data[0];
      const jobAppsRes = await axios.get(`http://localhost:5000/api/applications/job/${job._id}`, {
        headers: { Authorization: `Bearer ${empToken}` }
      });
      
      const app = jobAppsRes.data.data[0];
      appId = app._id;
      
      // Get assessment template
      const assessmentsRes = await axios.get('http://localhost:5000/api/assessments', {
        headers: { Authorization: `Bearer ${empToken}` }
      });
      const template = assessmentsRes.data.data.find(a => a.type === 'coding');
      
      // Assign OA
      await axios.put(`http://localhost:5000/api/applications/${appId}/assign-oa`, {
        assessmentId: template._id
      }, {
        headers: { Authorization: `Bearer ${empToken}` }
      });
      
      console.log('✅ Assigned coding assessment to application:', appId);
    }
    
    // 3. Run Code!
    const pythonCode = `
nums = list(map(int, input().split(",")))
target = int(input())

num_map = {}
for i, num in enumerate(nums):
    diff = target - num
    if diff in num_map:
        print(f"{num_map[diff]} {i}")
        break
    num_map[num] = i
`;

    console.log('🚀 Sending run-code request to backend (powered by JDoodle)...');
    
    const runRes = await axios.post(`http://localhost:5000/api/applications/${appId}/run-code`, {
      code: pythonCode,
      language: 'python',
      questionIndex: 0
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n--- 🎯 JDoodle Execution Results ---');
    console.log(`Score: ${runRes.data.score}%`);
    runRes.data.results.forEach((r, i) => {
      console.log(`\nTest Case ${i+1}: ${r.passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Input: ${r.input}`);
      console.log(`Expected: ${r.expected}`);
      console.log(`Actual: ${r.actual}`);
      if (r.error) console.log(`Error: ${r.error}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

runTest();
