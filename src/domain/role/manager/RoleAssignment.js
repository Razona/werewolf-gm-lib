import { RoleUtils } from '../utils/RoleUtils';

/**
 * 役職の割り当てと管理を担当するクラス
 */
export class RoleAssignment {
  constructor(roleManager) {
    this.roleManager = roleManager;
    this.roleDependencies = new Map();
  }

  /**
   * 役職クラスを登録する
   * @param {string} roleName - 役職名
   * @param {Class} roleClass - 役職クラス（Role基底クラスを継承したもの）
   * @return {boolean} - 成功した場合はtrue、失敗した場合はfalse
   */
  registerRole(roleName, roleClass) {
    // RoleManagerのregisterRoleに委譲
    return this.roleManager.registerRole(roleName, roleClass);
  }

  /**
   * 複数の役職を一括で登録する
   * @param {Object} roles - 役職名とクラスのマッピング
   * @return {boolean} - すべての役職が正常に登録された場合はtrue
   */
  registerRoles(roles) {
    // RoleManagerのregisterRolesに委譲
    return this.roleManager.registerRoles(roles);
  }

  /**
   * 役職の登録を解除する
   * @param {string} roleName - 役職名
   * @return {boolean} - 成功した場合はtrue、失敗した場合はfalse
   */
  unregisterRole(roleName) {
    // RoleManagerのunregisterRoleに委譲
    return this.roleManager.unregisterRole(roleName);
  }

  /**
   * すべての登録済み役職を削除する
   * @return {boolean} - 常にtrue
   */
  clearRoles() {
    // RoleManagerのclearRolesに委譲
    return this.roleManager.clearRoles();
  }

  /**
   * プレイヤーに役職を割り当てる
   * @param {number} playerId - プレイヤーID
   * @param {string} roleName - 割り当てる役職名
   * @return {Object} - 成功時: {success: true, role: roleInstance}
   *                    失敗時: {success: false, error: errorObject}
   */
  assignRole(playerId, roleName) {
    // RoleManagerのassignRoleに委譲
    return this.roleManager.assignRole(playerId, roleName);
  }

  /**
   * プレイヤーから役職を削除する
   * @param {number} playerId - プレイヤーID
   * @return {boolean} - 成功した場合はtrue
   */
  unassignRole(playerId) {
    if (!this.roleManager.roleInstances.has(playerId)) {
      return false;
    }

    const role = this.roleManager.roleInstances.get(playerId);
    this.roleManager.roleInstances.delete(playerId);

    this.roleManager.eventSystem.emit('role.unassigned', {
      playerId,
      roleName: role.name
    });

    return true;
  }

  /**
   * 役職をプレイヤーに一括で配布する
   * @param {number[]} playerIds - プレイヤーIDの配列
   * @param {string[]} roleList - 配布する役職のリスト
   * @param {Object} options - 配布オプション
   * @return {Object} - 結果オブジェクト
   */
  distributeRoles(playerIds, roleList, options = {}) {
    // RoleManagerのdistributeRolesに委譲
    try {
      const assignments = this.roleManager.distributeRoles(playerIds, roleList, options);
      return {
        success: true,
        assignments
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 役職間の相互参照を設定する
   * @param {number[]} playerIds - プレイヤーIDのリスト
   */
  setupRoleReferences(playerIds) {
    // RoleManagerのsetupRoleReferencesに委譲
    return this.roleManager.setupRoleReferences(playerIds);
  }

  // その他のヘルパーメソッド
  hasRole(roleName) {
    return this.roleManager.hasRole(roleName);
  }

  getRoleClass(roleName) {
    return this.roleManager.getRoleClass(roleName);
  }

  getRegisteredRoles() {
    return this.roleManager.getRegisteredRoles();
  }

  getPlayerRole(playerId) {
    return this.roleManager.getPlayerRole(playerId);
  }

  getRolesByPlayerId() {
    return this.roleManager.getRolesByPlayerId();
  }

  getPlayersByRole(roleName) {
    return this.roleManager.getPlayersByRole(roleName);
  }

  /**
   * 役職リストのバランスをチェック
   * @param {string[]} roleList - 役職リスト
   * @return {boolean} - バランスが取れている場合はtrue
   */
  validateRoleBalance(roleList) {
    // RoleManagerのvalidateRoleBalanceに委譲（存在する場合）
    if (typeof this.roleManager.validateRoleBalance === 'function') {
      return this.roleManager.validateRoleBalance(roleList);
    }

    // 基本的なバランスチェックの実装
    const werewolfCount = roleList.filter(role => role === 'werewolf').length;
    if (werewolfCount === 0) {
      const error = {
        code: 'INVALID_ROLE_BALANCE',
        message: 'At least one werewolf is required'
      };
      this.roleManager.errorHandler.handleError(error);
      return false;
    }

    return true;
  }

  /**
   * 役職の依存関係をチェック
   * @param {string[]} roleList - 役職リスト
   * @return {Object} - 検証結果と問題点
   */
  validateRoleDependencies(roleList) {
    // RoleManagerのvalidateRoleDependenciesに委譲（存在する場合）
    if (typeof this.roleManager.validateRoleDependencies === 'function') {
      try {
        const result = this.roleManager.validateRoleDependencies(roleList);
        return { isValid: true, errors: [] };
      } catch (error) {
        return { isValid: false, errors: [error.message] };
      }
    }

    // 基本的な依存関係チェックの実装
    const errors = [];

    // 背徳者は妖狐がいる場合のみ選択可能
    if (roleList.includes('heretic') && !roleList.includes('fox')) {
      errors.push('Heretic requires fox to be present');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 配列をシャッフルする（Fisher-Yates algorithm）
   * @param {Array} array - シャッフルする配列
   * @return {Array} - シャッフルされた配列
   * @private
   */
  shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}