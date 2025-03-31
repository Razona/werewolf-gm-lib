/**
 * PlayerManager class for werewolf game GM support library
 * Manages the collection of players and their state
 */

const { Player } = require('./Player');

/**
 * PlayerManager class
 * Manages a collection of players, provides operations for adding, removing,
 * querying, and modifying player state
 */
class PlayerManager {
  /**
   * Creates a new PlayerManager instance
   * @param {Object} eventSystem - The event system for emitting events
   * @param {Object} errorHandler - The error handler for error management
   */
  constructor(eventSystem, errorHandler) {
    this.eventSystem = eventSystem;
    this.errorHandler = errorHandler;
    this.players = new Map(); // Map of player ID to Player object
    this.nameToId = new Map(); // Map of player name to ID for quick lookups
    this.nextId = 0; // The next player ID to assign
  }

  /**
   * Add a new player
   * @param {string} name - The player's name
   * @returns {number} The ID assigned to the new player
   * @throws {Error} If name is invalid or duplicate
   */
  addPlayer(name) {
    // Validate input
    if (!name || typeof name !== 'string' || name.trim() === '') {
      this.errorHandler.handleError('VALIDATION.INVALID_PARAMETER', {
        parameter: 'name',
        value: name,
        message: 'Player name must be a non-empty string'
      });
    }
    
    // Check for duplicate names
    if (this.nameToId.has(name)) {
      this.errorHandler.handleError('PLAYER.DUPLICATE_PLAYER', {
        name,
        existingId: this.nameToId.get(name),
        message: `Player with name '${name}' already exists`
      });
    }
    
    // Assign ID and create player
    const id = this.nextId++;
    const player = new Player(id, name);
    
    // Store player
    this.players.set(id, player);
    this.nameToId.set(name, id);
    
    // Emit event
    this.eventSystem.emit('player.add', {
      playerId: id,
      name
    });
    
    return id;
  }

  /**
   * Get a player by ID
   * @param {number} id - The player's ID
   * @returns {Player|null} The player object or null if not found
   */
  getPlayer(id) {
    return this.players.get(id) || null;
  }

  /**
   * Get a player by name
   * @param {string} name - The player's name
   * @returns {Player|null} The player object or null if not found
   */
  getPlayerByName(name) {
    const id = this.nameToId.get(name);
    return id !== undefined ? this.getPlayer(id) : null;
  }

  /**
   * Remove a player from the game
   * @param {number} id - The ID of the player to remove
   * @returns {boolean} True if player was removed
   * @throws {Error} If player doesn't exist
   */
  removePlayer(id) {
    const player = this.getPlayer(id);
    
    // Handle player not found
    if (!player) {
      this.errorHandler.handleError('PLAYER.PLAYER_NOT_FOUND', {
        playerId: id,
        message: `Player with ID ${id} not found`
      });
    }
    
    // Remember the name for the event
    const name = player.name;
    
    // Remove player
    this.nameToId.delete(name);
    this.players.delete(id);
    
    // Emit event
    this.eventSystem.emit('player.remove', {
      playerId: id,
      name
    });
    
    return true;
  }

  /**
   * Set a player to dead state
   * @param {number} id - The player's ID
   * @param {string} cause - The cause of death
   * @param {number} [turn] - The game turn when death occurred
   * @returns {boolean} True if player was killed
   * @throws {Error} If player doesn't exist
   */
  killPlayer(id, cause, turn) {
    const player = this.getPlayer(id);
    
    // Handle player not found
    if (!player) {
      this.errorHandler.handleError('PLAYER.PLAYER_NOT_FOUND', {
        playerId: id,
        message: `Player with ID ${id} not found`
      });
    }
    
    // Kill the player
    const killed = player.kill(cause, turn);
    
    // If player was already dead, don't emit event
    if (!killed) {
      return false;
    }
    
    // Emit event
    this.eventSystem.emit('player.death', {
      playerId: id,
      name: player.name,
      cause,
      turn
    });
    
    return true;
  }

  /**
   * Assign a role to a player
   * @param {number} id - The player's ID
   * @param {string|Object} role - The role to assign
   * @returns {boolean} True if role was assigned
   * @throws {Error} If player doesn't exist
   */
  assignRole(id, role) {
    const player = this.getPlayer(id);
    
    // Handle player not found
    if (!player) {
      this.errorHandler.handleError('PLAYER.PLAYER_NOT_FOUND', {
        playerId: id,
        message: `Player with ID ${id} not found`
      });
    }
    
    // Set role
    const assigned = player.setRole(role);
    
    // If player is dead, role won't be assigned
    if (!assigned) {
      this.errorHandler.handleError('PLAYER.DEAD_PLAYER_ACTION', {
        playerId: id,
        action: 'assignRole',
        message: `Cannot assign role to dead player ${id}`
      });
    }
    
    // Emit event
    this.eventSystem.emit('player.role.assign', {
      playerId: id,
      name: player.name,
      role
    });
    
    return true;
  }

  /**
   * Get all players
   * @returns {Player[]} Array of all players
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Get all alive players
   * @returns {Player[]} Array of alive players
   */
  getAlivePlayers() {
    return this.getAllPlayers().filter(player => player.isAlive);
  }

  /**
   * Get players with a specific role
   * @param {string} roleName - The role name to search for
   * @returns {Player[]} Array of matching players
   */
  getPlayersByRole(roleName) {
    return this.getAllPlayers().filter(player => {
      // Handle both string and object roles
      if (typeof player.role === 'string') {
        return player.role === roleName;
      } else if (player.role && typeof player.role === 'object') {
        return player.role.name === roleName;
      }
      return false;
    });
  }
}

module.exports = { PlayerManager };
