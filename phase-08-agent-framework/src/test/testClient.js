/**
 * Phase 08 - Agent Framework Test Client
 *
 * Interactive client for testing the NPC Agent Framework.
 * Tests basic agent interactions and state management.
 *
 * Usage:
 *   1. Start your server: npm run dev
 *   2. Run this test: node src/test/testClient.js
 */

import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const PLAYER_ID = 'test_player_001';
const NPC_ID = 'merchant_001';

console.log('🎮 Phase 08: Agent Framework Test Client');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Server:', SERVER_URL);
console.log('NPC:', NPC_ID);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
});

const testMessages = [
  { message: 'Hello! What can you tell me about yourself?', description: 'Test personality' },
  { message: 'Do you have any potions for sale?', description: 'Test context retrieval' },
  { message: 'Thank you for your help!', description: 'Test relationship' },
];

let currentTest = 0;

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('📡 Client ID:', socket.id);
  console.log('');
  console.log('🧪 Running Agent Framework Tests...');
  console.log('');

  runNextTest();
});

socket.on('connected', (data) => {
  console.log('📨 Server:', data.message);
  console.log('');
});

socket.on('npc_response', (data) => {
  const test = testMessages[currentTest - 1];

  console.log(`Test ${currentTest}/${testMessages.length}: ${test.description}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 You:', test.message);
  console.log('🤖 NPC:', data.response.dialog);
  console.log('');
  console.log('📊 Agent State:');
  console.log('  Emotion:', data.state?.currentEmotion || 'N/A');
  console.log('  Intensity:', data.state?.emotionIntensity?.toFixed(2) || 'N/A');
  console.log('  Relationship:', data.state?.relationshipScore?.toFixed(2) || 'N/A');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  if (currentTest < testMessages.length) {
    setTimeout(runNextTest, 2000);
  } else {
    console.log('✅ All agent framework tests completed!');
    console.log('');
    setTimeout(() => socket.disconnect(), 1000);
  }
});

function runNextTest() {
  const test = testMessages[currentTest];
  currentTest++;

  socket.emit('player_input', {
    playerId: PLAYER_ID,
    npcId: NPC_ID,
    message: test.message,
  });
}

socket.on('error', (data) => {
  console.error('❌ ERROR:', data.message);
  socket.disconnect();
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection Error:', error.message);
  console.error('Make sure server is running: npm run dev');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});
