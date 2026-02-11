#!/usr/bin/env node

/**
 * WebRTC Audio Fix Verification Script
 * Run this to verify the fix has been properly applied
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 WebRTC Audio Fix Verification\n');
console.log('=====================================\n');

const checks = [];

// Check 1: Verify the fix is in webrtc.handler.ts
const handlerPath = path.join(__dirname, '../src/services/socket/handlers/webrtc.handler.ts');
if (fs.existsSync(handlerPath)) {
  const content = fs.readFileSync(handlerPath, 'utf8');
  
  // Check for the fixed code
  if (content.includes('socket.to(`user:${toUserId}`).emit(WEBRTC_EVENTS.WEBRTC_SIGNALING')) {
    console.log('✅ Fix is applied in webrtc.handler.ts');
    console.log('   - Signaling is correctly forwarded to recipient\n');
    checks.push(true);
  } else if (content.includes('socket.emit(WEBRTC_EVENTS.WEBRTC_SIGNALING')) {
    console.log('❌ Fix is NOT applied correctly!');
    console.log('   - Still emitting back to sender instead of forwarding\n');
    console.log('   Action: Check lines ~162-190 in src/services/socket/handlers/webrtc.handler.ts\n');
    checks.push(false);
  } else {
    console.log('⚠️  Cannot verify - webrtc signaling handler may be missing\n');
    checks.push(false);
  }
  
  // Check for proper fromUserId usage
  if (content.includes('const fromUserId = socket.userId')) {
    console.log('✅ fromUserId correctly uses socket.userId');
    console.log('   - Sender ID is trusted from socket context\n');
    checks.push(true);
  } else {
    console.log('⚠️  fromUserId may not be correctly set from socket\n');
    checks.push(false);
  }
} else {
  console.log('❌ File not found: src/services/socket/handlers/webrtc.handler.ts\n');
  checks.push(false);
}

// Check 2: Verify socket.io is installed
const packagePath = path.join(__dirname, '../package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.dependencies && pkg.dependencies['socket.io']) {
    console.log(`✅ socket.io is installed (${pkg.dependencies['socket.io']})\n`);
    checks.push(true);
  } else {
    console.log('❌ socket.io is not installed!\n');
    checks.push(false);
  }
} else {
  console.log('❌ package.json not found\n');
  checks.push(false);
}

// Check 3: Verify documentation exists
const docs = [
  'AUDIO_ISSUE_FIX.md',
  'SIGNALING_GUIDE.md',
  'TESTING_AUDIO.md',
  'FIX_SUMMARY.md'
];

let docsExist = 0;
docs.forEach(doc => {
  if (fs.existsSync(path.join(__dirname, '..', doc))) {
    docsExist++;
  }
});

if (docsExist === docs.length) {
  console.log(`✅ All documentation files present (${docsExist}/${docs.length})\n`);
  checks.push(true);
} else {
  console.log(`⚠️  Some documentation files missing (${docsExist}/${docs.length})\n`);
  checks.push(false);
}

// Summary
console.log('=====================================\n');
const passed = checks.filter(c => c).length;
const total = checks.length;

if (passed === total) {
  console.log('✅ ALL CHECKS PASSED!\n');
  console.log('The fix has been successfully applied.\n');
  console.log('Next steps:');
  console.log('1. Restart your server: npm run dev');
  console.log('2. Test with two browsers/devices');
  console.log('3. Check audio is working\n');
  console.log('See TESTING_AUDIO.md for detailed testing instructions.\n');
  process.exit(0);
} else {
  console.log(`⚠️  CHECKS: ${passed}/${total} passed\n`);
  console.log('Some issues detected. Please review the output above.\n');
  console.log('See FIX_SUMMARY.md for the complete fix details.\n');
  process.exit(1);
}
