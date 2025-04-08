/**
 * 陣営の管理を担当するクラス
 */
export class TeamManager {
  constructor(roleManager, game) {
    this.roleManager = roleManager;
    this.game = game;
    this.teams = new Map();
    this.initializeDefaultTeams();
  }

  initializeDefaultTeams() {
    this.teams.set('villager', {
      name: 'villager',
      displayName: '村人陣営',
      winCondition: 'eliminateWerewolves'
    });

    this.teams.set('werewolf', {
      name: 'werewolf',
      displayName: '人狼陣営',
      winCondition: 'eliminateVillagers'
    });

    this.teams.set('fox', {
      name: 'fox',
      displayName: '妖狐陣営',
      winCondition: 'survive'
    });

    this.teams.set('neutral', {
      name: 'neutral',
      displayName: '第三陣営',
      winCondition: 'custom'
    });
  }

  getTeam(teamName) {
    return this.teams.get(teamName);
  }

  getAllTeams() {
    return Array.from(this.teams.values());
  }

  getPlayersInTeam(teamName) {
    const players = [];
    for (const [playerId, role] of this.roleManager.roleInstances) {
      if (role.team === teamName) {
        players.push({
          playerId,
          roleName: role.name,
          isAlive: role.isAlive
        });
      }
    }
    return players;
  }

  getTeamMembers(teamName) {
    return this.getPlayersInTeam(teamName);
  }

  addTeam(teamData) {
    if (!teamData || !teamData.name) {
      return false;
    }

    if (this.teams.has(teamData.name)) {
      // チーム登録エラーを発生させる
      if (this.roleManager && this.roleManager.errorHandler) {
        const error = {
          code: 'TEAM_ALREADY_REGISTERED',
          message: `Team ${teamData.name} is already registered`,
          level: 'warning'
        };
        this.roleManager.errorHandler.handleError(error);
      }
      return false;
    }

    this.teams.set(teamData.name, {
      name: teamData.name,
      displayName: teamData.displayName || teamData.name,
      winCondition: teamData.winCondition || 'custom'
    });

    // イベント名を 'team.registered' に変更（一部のテストでこの名前を期待している）
    this.roleManager.eventSystem.emit('team.registered', {
      team: this.teams.get(teamData.name)
    });

    return true;
  }

  removeTeam(teamName) {
    if (!this.teams.has(teamName)) {
      return false;
    }

    const teamData = this.teams.get(teamName);
    this.teams.delete(teamName);

    this.roleManager.eventSystem.emit('team.removed', {
      team: teamData
    });

    return true;
  }

  updateTeam(teamName, updates) {
    if (!this.teams.has(teamName)) {
      return false;
    }

    const team = this.teams.get(teamName);
    const updatedTeam = {
      ...team,
      ...updates,
      name: teamName // nameは変更不可
    };

    this.teams.set(teamName, updatedTeam);

    this.roleManager.eventSystem.emit('team.updated', {
      team: updatedTeam,
      changes: updates
    });

    return true;
  }

  /**
   * チーム情報を取得します
   * @param {string} teamId チームID
   * @returns {object|null} チーム情報またはnull（存在しない場合）
   */
  getTeamInfo(teamId) {
    if (!teamId || !this.teams.has(teamId)) {
      return null;
    }
    return this.teams.get(teamId);
  }

  /**
   * 役職名から所属する陣営IDを取得する
   * @param {string} roleName - 役職名
   * @return {string|null} - 陣営ID、未登録の場合はnull
   */
  getTeamByRole(roleName) {
    if (!this.roleManager || typeof this.roleManager.getRoleClass !== 'function') {
      return null;
    }

    const roleClass = this.roleManager.getRoleClass(roleName);
    if (!roleClass) {
      return null;
    }

    try {
      const tempInstance = new roleClass();
      return tempInstance.team || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 登録されているすべての陣営IDを取得する
   * @return {string[]} - 陣営IDの配列
   */
  getTeamIds() {
    return Array.from(this.teams.keys());
  }

  /**
   * 陣営の勝利状態を取得する
   * @return {Object} - 各陣営の勝利条件状態を含むオブジェクト
   */
  getTeamsWinStatus() {
    const result = {};

    if (!this.roleManager.game || !this.roleManager.game.playerManager) {
      return result;
    }

    const alivePlayers = this.roleManager.game.playerManager.getAlivePlayers();

    for (const [teamId, teamData] of this.teams.entries()) {
      // roleAssignment.getPlayersByRoleの代わりにRoleManagerのメソッドを使用
      const teamPlayers = this.getPlayersInTeam(teamId);
      const teamPlayerIds = teamPlayers.map(p => p.playerId);
      const aliveTeamMembers = teamPlayerIds.filter(id =>
        alivePlayers.some(player => player.id === id));

      const rolesCounts = {};
      for (const playerId of teamPlayerIds) {
        const role = this.roleManager.getPlayerRole(playerId);
        if (role) {
          const roleName = role.name;
          rolesCounts[roleName] = (rolesCounts[roleName] || 0) + 1;
        }
      }

      const winInfo = {
        team: teamId,
        totalMembers: teamPlayerIds.length,
        aliveMembers: aliveTeamMembers.length,
        rolesCounts,
        totalAlivePlayers: alivePlayers.length,
        isWinning: false,
        reason: null
      };

      // 陣営ごとの勝利条件チェック
      if (teamId === 'villager') {
        // werewolf役職を持つプレイヤーを取得
        const werewolfPlayers = Array.from(this.roleManager.roleInstances.entries())
          .filter(([_, role]) => role.name === 'werewolf')
          .map(([id, _]) => id);

        const aliveWerewolves = werewolfPlayers
          .filter(id => alivePlayers.some(player => player.id === id));

        winInfo.isWinning = aliveWerewolves.length === 0;
        winInfo.reason = winInfo.isWinning ? '全ての人狼が死亡した' : null;
      }
      else if (teamId === 'werewolf') {
        // werewolf役職とvillager役職を持つプレイヤーを取得
        const werewolfPlayers = Array.from(this.roleManager.roleInstances.entries())
          .filter(([_, role]) => role.name === 'werewolf')
          .map(([id, _]) => id);

        const villagerPlayers = Array.from(this.roleManager.roleInstances.entries())
          .filter(([_, role]) => role.team === 'villager')
          .map(([id, _]) => id);

        const aliveWerewolves = werewolfPlayers
          .filter(id => alivePlayers.some(player => player.id === id));

        const aliveVillagers = villagerPlayers
          .filter(id => alivePlayers.some(player => player.id === id));

        winInfo.isWinning = aliveWerewolves.length > 0 &&
          aliveWerewolves.length >= aliveVillagers.length;
        winInfo.reason = winInfo.isWinning ? '人狼の数が村人陣営以上になった' : null;
      }
      else if (teamId === 'fox') {
        const foxPlayers = Array.from(this.roleManager.roleInstances.entries())
          .filter(([_, role]) => role.name === 'fox')
          .map(([id, _]) => id);

        const aliveFoxes = foxPlayers
          .filter(id => alivePlayers.some(player => player.id === id));

        winInfo.isWinning = aliveFoxes.length > 0;
        winInfo.reason = winInfo.isWinning ? '妖狐が生存している' : null;
      }

      result[teamId] = winInfo;
    }

    return result;
  }
}