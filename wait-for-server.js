/**
 * Wait for server utility
 * Polls the server until it responds successfully
 */

import http from 'http';

const PORT = process.env.APP_PORT || 5500;
const MAX_RETRIES = 60; // 60 attempts
const RETRY_INTERVAL = 1000; // 1 second

function checkServer(attempt = 1) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 304) {
        console.log(`✓ 서버가 준비되었습니다! (${attempt}번째 시도)`);
        resolve();
      } else {
        reject(new Error(`Unexpected status: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function waitForServer() {
  console.log(`서버 준비 대기 중... (http://localhost:${PORT})`);

  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      await checkServer(i);
      return true;
    } catch (err) {
      if (i === MAX_RETRIES) {
        console.error('✗ 서버가 시작되지 않았습니다. 수동으로 확인해주세요.');
        return false;
      }
      // Show progress every 5 attempts
      if (i % 5 === 0) {
        console.log(`  대기 중... (${i}/${MAX_RETRIES})`);
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
}

waitForServer().then((success) => {
  process.exit(success ? 0 : 1);
});
