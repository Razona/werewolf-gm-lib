/**
 * Example usage of the EventSystem module in the werewolf game context
 */

const EventSystem = require('../src/core/event/EventSystem');

// Create an instance of the event system
const eventSystem = new EventSystem({
  enableNamespaces: true,
  debugMode: true,
  enableWildcards: true
});

console.log('EventSystem Example for Werewolf Game GM Library');
console.log('----------------------------------------------\n');

// Example 1: Basic event handling
console.log('Example 1: Basic Event Handling');
eventSystem.on('player.join', (data) => {
  console.log(`Player joined: ${data.playerName} (ID: ${data.playerId})`);
});

eventSystem.emit('player.join', { 
  playerId: 1, 
  playerName: 'Alice' 
});

// Example 2: Using event priorities
console.log('\nExample 2: Event Priorities');
eventSystem.on('phase.start.night', (data) => {
  console.log(`[Priority 0] Night phase started: Turn ${data.turn}`);
}, 0);

eventSystem.on('phase.start.night', (data) => {
  console.log(`[Priority 10] Preparing role actions for night ${data.turn}`);
}, 10);

eventSystem.emit('phase.start.night', { turn: 1 });

// Example 3: Namespace propagation
console.log('\nExample 3: Namespace Propagation');
eventSystem.on('phase', (data) => {
  console.log(`[phase] Phase event: ${data.type}`);
});

eventSystem.on('phase.start', (data) => {
  console.log(`[phase.start] Phase started: ${data.type}`);
});

eventSystem.emit('phase.start.day', { type: 'day', turn: 2 });

// Example 4: One-time events
console.log('\nExample 4: One-time Events');
eventSystem.once('player.death', (data) => {
  console.log(`Player died: ${data.playerName} (one-time notification)`);
});

eventSystem.emit('player.death', { 
  playerId: 2, 
  playerName: 'Bob', 
  cause: 'execution' 
});

// This second emission won't trigger the one-time listener
eventSystem.emit('player.death', { 
  playerId: 3, 
  playerName: 'Charlie', 
  cause: 'werewolf' 
});

// Example 5: Wildcard listeners
console.log('\nExample 5: Wildcard Listeners');
eventSystem.on('role.*.action', (data) => {
  console.log(`[role.*.action] Role action: ${data.role} by player ${data.playerId}`);
});

eventSystem.on('role.**', (data) => {
  console.log(`[role.**] Any role event: ${data.role} - ${data.action}`);
});

eventSystem.emit('role.werewolf.action', { 
  playerId: 4, 
  role: 'werewolf', 
  action: 'attack',
  target: 5 
});

// Example 6: Error handling in listeners
console.log('\nExample 6: Error Handling');
eventSystem.on('error.test', () => {
  console.log('This listener runs first');
  throw new Error('Deliberate error in listener');
});

eventSystem.on('error.test', () => {
  console.log('This listener still runs despite the error in the previous one');
});

eventSystem.emit('error.test');

// Example 7: Event history
console.log('\nExample 7: Event History');
const history = eventSystem.getEventHistory(3);
console.log('Last 3 events in history:');
history.forEach((item, index) => {
  console.log(`${index + 1}. ${item.eventName} at ${item.timestamp.toISOString()}`);
});

// Example 8: Utility methods
console.log('\nExample 8: Utility Methods');
console.log(`Total registered events: ${eventSystem.eventNames().length}`);
console.log(`'phase.start.night' has listeners: ${eventSystem.hasListeners('phase.start.night')}`);
console.log(`'phase.start.night' listener count: ${eventSystem.listenerCount('phase.start.night')}`);
console.log(`'role.**' listener count: ${eventSystem.listenerCount('role.**')}`);

// Example 9: Removing listeners
console.log('\nExample 9: Removing Listeners');
const voteHandler = (data) => {
  console.log(`Vote registered: ${data.voterId} voted for ${data.targetId}`);
};

eventSystem.on('vote.register', voteHandler);
console.log("Registered 'vote.register' handler");

eventSystem.emit('vote.register', { 
  voterId: 1, 
  targetId: 2 
});

eventSystem.off('vote.register', voteHandler);
console.log("Removed 'vote.register' handler");

eventSystem.emit('vote.register', { 
  voterId: 3, 
  targetId: 4 
});
console.log("^ This vote should NOT trigger any handlers");

// Example 10: Real game simulation
console.log('\nExample 10: Game Simulation');
console.log('Simulating a brief game sequence...');

// Game setup
eventSystem.emit('game.create', { gameId: 'game-123', options: { playerCount: 7 } });

// Adding players
for (let i = 1; i <= 7; i++) {
  eventSystem.emit('player.join', { 
    playerId: i, 
    playerName: `Player ${i}` 
  });
}

// Game start
eventSystem.emit('game.start', { gameId: 'game-123', timestamp: new Date() });

// First night
eventSystem.emit('phase.start.night', { turn: 1 });

// Night actions
eventSystem.emit('role.werewolf.action', { 
  playerId: 2, 
  role: 'werewolf', 
  action: 'attack',
  target: 5 
});

eventSystem.emit('role.seer.action', { 
  playerId: 3, 
  role: 'seer', 
  action: 'fortune',
  target: 4,
  result: 'human' 
});

// End night
eventSystem.emit('phase.end.night', { turn: 1 });

// Process night results
eventSystem.emit('player.death', { 
  playerId: 5, 
  playerName: 'Player 5', 
  cause: 'werewolf',
  turn: 1
});

// First day
eventSystem.emit('phase.start.day', { turn: 1 });

// Voting
eventSystem.emit('phase.start.vote', { turn: 1 });

const alivePlayerIds = [1, 2, 3, 4, 6, 7]; // Player 5 died
for (const voterId of alivePlayerIds) {
  // Random target (except self)
  const validTargets = alivePlayerIds.filter(id => id !== voterId);
  const targetId = validTargets[Math.floor(Math.random() * validTargets.length)];
  
  eventSystem.emit('vote.register', { 
    voterId, 
    targetId 
  });
}

eventSystem.emit('vote.count', { 
  result: {
    3: 2, // Player 3 got 2 votes
    6: 4  // Player 6 got 4 votes
  }
});

// Execution
eventSystem.emit('player.death', { 
  playerId: 6, 
  playerName: 'Player 6', 
  cause: 'execution',
  turn: 1
});

// End day
eventSystem.emit('phase.end.day', { turn: 1 });

console.log('\nEvent history overview:');
eventSystem.getEventHistory(15).forEach((event, i) => {
  console.log(`${i+1}. ${event.eventName}`);
});

console.log('\nEnd of example');
