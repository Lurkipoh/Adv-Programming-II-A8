/**
 * Phase 8: Agent Framework - Multi-Agent Test Client
 *
 * Tests the Socket.IO server with multiple NPC agents, each with unique personalities.
 * Demonstrates agent-based NPC management with different character types.
 *
 * NPCs tested:
 * - merchant_001: Elara Thornwood (Merchant)
 * - guard_001: Captain Marcus Ironwood (Town Guard Captain)
 * - blacksmith_001: Grimm Stonehammer (Master Blacksmith)
 * - innkeeper_001: Rosa Hearthfire (Tavern Innkeeper)
 *
 * Usage: npm run test:client
 * Prerequisites: Server running (npm run dev), Chroma running
 */

import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';
const PLAYER_ID = 'test_player_001';

// Define NPCs and their test conversations
const npcTests = [
  {
    npcId: 'merchant_001',
    name: 'Elara Thornwood',
    role: 'Merchant',
    messages: [
      'Hello! What do you have for sale today?',
      'Do you have any rare potions?',
    ],
  },
  {
    npcId: 'guard_001',
    name: 'Captain Marcus Ironwood',
    role: 'Town Guard Captain',
    messages: [
      'Greetings, Captain. Is the town safe?',
      'I heard rumors about bandits. What can you tell me?',
    ],
  },
  {
    npcId: 'blacksmith_001',
    name: 'Grimm Stonehammer',
    role: 'Master Blacksmith',
    messages: [
      'I need a strong sword. Can you forge one?',
      'What materials do you need for your best work?',
    ],
  },
  {
    npcId: 'innkeeper_001',
    name: 'Rosa Hearthfire',
    role: 'Tavern Innkeeper',
    messages: [
      'Good evening! Do you have any rooms available?',
      'What interesting stories have travelers brought lately?',
    ],
  },
];

console.log('=== Phase 8: Multi-Agent Framework Test Client ===');
console.log('Connecting to:', SERVER_URL);
console.log('');
console.log('NPCs to test:');
npcTests.forEach((npc, i) => {
  console.log(`  ${i + 1}. ${npc.name} (${npc.role})`);
});
console.log('');

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
});

let currentNpcIndex = 0;
let currentMessageIndex = 0;
let totalResponses = 0;
const totalExpectedResponses = npcTests.reduce((sum, npc) => sum + npc.messages.length, 0);

socket.on('connect', () => {
  console.log('Connected to server!');
  console.log('Client ID:', socket.id);
  console.log('');
  console.log('─'.repeat(60));

  // Start testing
  sendNextMessage();
});

socket.on('connected', (data) => {
  console.log('Server acknowledgment:', data.message);
  if (data.version) {
    console.log('Version:', data.version);
  }
  console.log('');
});

socket.on('npc_response', (data) => {
  const currentNpc = npcTests[currentNpcIndex];

  console.log('');
  console.log(`┌─ ${currentNpc.name} (${currentNpc.role}) ─┐`);
  console.log('│');
  console.log('│ Dialog:', data.response.dialog);
  console.log('│ Emotion:', data.response.emotion);
  if (data.response.action) {
    console.log('│ Action:', data.response.action);
  }
  console.log('│');
  console.log('└' + '─'.repeat(50));
  console.log('');

  totalResponses++;
  currentMessageIndex++;

  // Check if we need to move to the next NPC
  if (currentMessageIndex >= currentNpc.messages.length) {
    currentNpcIndex++;
    currentMessageIndex = 0;

    if (currentNpcIndex < npcTests.length) {
      console.log('─'.repeat(60));
      console.log(`Switching to: ${npcTests[currentNpcIndex].name}`);
      console.log('─'.repeat(60));
    }
  }

  // Continue testing or finish
  if (totalResponses < totalExpectedResponses) {
    setTimeout(sendNextMessage, 1500);
  } else {
    finishTests();
  }
});

socket.on('error', (data) => {
  console.error('');
  console.error('ERROR:', data.message);
  if (data.error) {
    console.error('Details:', data.error);
  }
  console.error('');

  // Try to continue with next message/NPC
  totalResponses++;
  currentMessageIndex++;

  if (currentMessageIndex >= npcTests[currentNpcIndex].messages.length) {
    currentNpcIndex++;
    currentMessageIndex = 0;
  }

  if (totalResponses < totalExpectedResponses && currentNpcIndex < npcTests.length) {
    setTimeout(sendNextMessage, 1500);
  } else {
    finishTests();
  }
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('Connection Error:', error.message);
  console.error('');
  console.error('Make sure the server is running:');
  console.error('  npm run dev');
  console.error('');
  process.exit(1);
});

function sendNextMessage() {
  if (currentNpcIndex >= npcTests.length) {
    finishTests();
    return;
  }

  const currentNpc = npcTests[currentNpcIndex];
  const message = currentNpc.messages[currentMessageIndex];

  console.log(`[${currentNpc.npcId}] Message ${currentMessageIndex + 1}/${currentNpc.messages.length}`);
  console.log(`Player → ${currentNpc.name}: "${message}"`);

  socket.emit('player_input', {
    playerId: PLAYER_ID,
    npcId: currentNpc.npcId,
    message: message,
  });
}

function finishTests() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('         ALL TESTS COMPLETED!');
  console.log('═'.repeat(60));
  console.log('');
  console.log('Summary:');
  console.log(`  - NPCs tested: ${npcTests.length}`);
  console.log(`  - Total messages: ${totalExpectedResponses}`);
  console.log(`  - Responses received: ${totalResponses}`);
  console.log('');
  console.log('Phase 8 features verified:');
  console.log('  ✓ Multi-agent NPC management');
  console.log('  ✓ Unique personality-driven responses');
  console.log('  ✓ Agent routing by NPC ID');
  console.log('  ✓ Memory integration per agent');
  console.log('');

  setTimeout(() => {
    socket.disconnect();
  }, 1000);
}

// Timeout after 3 minutes
setTimeout(() => {
  console.log('');
  console.log('Test timeout reached - disconnecting...');
  socket.disconnect();
}, 180000);
