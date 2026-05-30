const axios = require('axios');
const { exec, spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const JDOODLE_API_URL = 'https://api.jdoodle.com/v1/execute';

// JDoodle Configuration
const jdoodleConfigs = {
  javascript: { language: 'nodejs', versionIndex: '4' },
  python: { language: 'python3', versionIndex: '4' },
  cpp: { language: 'cpp17', versionIndex: '0' },
  java: { language: 'java', versionIndex: '4' }
};

// Local Execution Fallback Configuration
const localConfigs = {
  javascript: { ext: 'js', runCmd: 'node' },
  python: { ext: 'py', runCmd: 'python3' },
  cpp: { ext: 'cpp', compileCmd: 'g++', runCmd: '' },
  java: { ext: 'java', compileCmd: 'javac', runCmd: 'java' } 
};

/**
 * Runs code against a set of test cases.
 * Uses JDoodle API if credentials are provided in .env,
 * otherwise falls back to local execution.
 */
const runCode = async (code, languageStr, testCases) => {
  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (clientId && clientSecret) {
    return runCodeJDoodle(code, languageStr, testCases, clientId, clientSecret);
  } else {
    console.warn("JDoodle credentials not found in .env. Falling back to local execution.");
    return runCodeLocal(code, languageStr, testCases);
  }
};

/**
 * JDoodle API Execution
 */
const runCodeJDoodle = async (code, languageStr, testCases, clientId, clientSecret) => {
  let passedCount = 0;
  const results = [];
  const config = jdoodleConfigs[languageStr] || jdoodleConfigs['javascript'];

  for (const testCase of testCases) {
    try {
      const response = await axios.post(JDOODLE_API_URL, {
        clientId: clientId,
        clientSecret: clientSecret,
        script: code,
        stdin: testCase.input,
        language: config.language,
        versionIndex: config.versionIndex
      });

      const data = response.data;
      let actualOutput = data.output || '';
      const expectedStr = testCase.expectedOutput.trim();
      const actualStr = actualOutput.trim();
      const isPass = actualStr === expectedStr;

      if (isPass) passedCount++;

      results.push({
        input: testCase.input,
        expected: expectedStr,
        actual: actualStr,
        passed: isPass,
        error: isPass ? null : (actualStr || 'Execution error')
      });
    } catch (err) {
      results.push({
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: null,
        passed: false,
        error: err.response?.data?.error || err.message || 'JDoodle Execution failed'
      });
    }
  }

  const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;
  return { score, totalTests: testCases.length, passedTests: passedCount, results };
};

/**
 * Local Execution (Fallback)
 */
const runCodeLocal = async (code, languageStr, testCases) => {
  let passedCount = 0;
  const results = [];
  const config = localConfigs[languageStr] || localConfigs['javascript'];
  const tmpDir = os.tmpdir();
  const fileId = crypto.randomBytes(8).toString('hex');
  const filePath = path.join(tmpDir, `code_${fileId}.${config.ext}`);
  const exePath = path.join(tmpDir, `code_${fileId}.exe`);

  try {
    await fs.writeFile(filePath, code);

    let compileError = null;
    if (config.compileCmd) {
      try {
        await new Promise((resolve, reject) => {
          exec(`${config.compileCmd} "${filePath}" -o "${exePath}"`, (error, stdout, stderr) => {
            if (error) reject(stderr || stdout);
            else resolve();
          });
        });
      } catch (err) {
        compileError = err.toString();
      }
    }

    if (compileError) {
      for (const tc of testCases) {
        results.push({ input: tc.input, expected: tc.expectedOutput, actual: null, passed: false, error: compileError });
      }
      return { score: 0, totalTests: testCases.length, passedTests: 0, results };
    }

    for (const testCase of testCases) {
      let runError = null;
      let actualOutput = '';
      
      try {
        actualOutput = await new Promise((resolve, reject) => {
          const runCmd = config.compileCmd ? `"${exePath}"` : `${config.runCmd} "${filePath}"`;
          const process = spawn(runCmd, { shell: true });
          let stdout = ''; let stderr = '';
          
          process.stdout.on('data', data => stdout += data);
          process.stderr.on('data', data => stderr += data);
          process.on('close', code => {
            if (code !== 0) reject(stderr || stdout);
            else resolve(stdout);
          });

          if (testCase.input) process.stdin.write(testCase.input);
          process.stdin.end();

          setTimeout(() => { process.kill(); reject('Execution timed out'); }, 5000);
        });
      } catch (err) {
        runError = err.toString();
      }

      const expectedStr = testCase.expectedOutput.trim();
      const actualStr = actualOutput.trim();
      const isPass = !runError && actualStr === expectedStr;
      if (isPass) passedCount++;

      results.push({ input: testCase.input, expected: expectedStr, actual: actualStr, passed: isPass, error: runError });
    }
  } finally {
    try { await fs.unlink(filePath); } catch (e) {}
    if (config.compileCmd) { try { await fs.unlink(exePath); } catch (e) {} }
  }

  const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;
  return { score, totalTests: testCases.length, passedTests: passedCount, results };
};

module.exports = { runCode };
