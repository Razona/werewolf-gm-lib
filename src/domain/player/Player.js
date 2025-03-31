/**
 * Player class for werewolf game GM support library
 * Represents a player in the game and manages their state
 */

/**
 * Player class
 * Manages a player's state and attributes in the game
 */
class Player {
  /**
   * Creates a new Player instance
   * @param {number} id - The unique identifier for this player
   * @param {string} name - The player's name
   * @throws {Error} If id or name are invalid
   */
  constructor(id, name) {
    // Validate parameters
    if (id === null || id === undefined || typeof id !== 'number') {
      throw new Error('Player ID must be a valid number');
    }
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Player name must be a non-empty string');
    }

    this.id = id;
    this.name = name;
    this.isAlive = true;           // Whether player is alive
    this.role = null;              // Player's role (string or object)
    this.causeOfDeath = null;      // Reason for death (execution, attack, etc)
    this.deathTurn = null;         // Game turn when the player died
    this.statusEffects = [];       // Array of status effects affecting the player
  }

  /**
   * Set player to dead state
   * @param {string} cause - The cause of death
   * @param {number} turn - The game turn when death occurred
   * @returns {boolean} True if the player was killed, false if already dead
   */
  kill(cause, turn) {
    // If player is already dead, don't change state
    if (!this.isAlive) {
      return false;
    }
    
    this.isAlive = false;
    this.causeOfDeath = cause;
    this.deathTurn = turn;
    return true;
  }

  /**
   * Assign a role to the player
   * @param {string|Object} role - Role name or role object
   * @returns {boolean} True if role was set, false if player is dead
   */
  setRole(role) {
    // Dead players can't change roles
    if (!this.isAlive) {
      return false;
    }
    
    this.role = role;
    return true;
  }

  /**
   * Add a status effect to the player
   * @param {Object} effect - The effect to add
   * @returns {boolean} True if effect was added, false if player is dead or already has effect of this type
   */
  addStatusEffect(effect) {
    // Dead players can't receive status effects
    if (!this.isAlive) {
      return false;
    }
    
    // Check if player already has an effect of this type
    if (this.hasStatusEffect(effect.type)) {
      return false;
    }
    
    this.statusEffects.push(effect);
    return true;
  }

  /**
   * Remove a status effect from the player
   * @param {string} effectType - The type of effect to remove
   * @returns {boolean} True if effect was removed, false if not found
   */
  removeStatusEffect(effectType) {
    const initialLength = this.statusEffects.length;
    
    this.statusEffects = this.statusEffects.filter(effect => effect.type !== effectType);
    
    // Return true if something was removed
    return this.statusEffects.length < initialLength;
  }

  /**
   * Check if player has a specific status effect
   * @param {string} effectType - The type of effect to check for
   * @returns {boolean} True if player has the effect
   */
  hasStatusEffect(effectType) {
    return this.statusEffects.some(effect => effect.type === effectType);
  }
}

module.exports = { Player };
