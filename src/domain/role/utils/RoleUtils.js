/**
 * 役職関連のユーティリティ機能を提供するクラス
 */
export class RoleUtils {
  /**
   * 配列をシャッフルする
   * @param {Array} array - シャッフルする配列
   * @param {number} [seed] - 乱数シード（省略時はランダム）
   * @param {Function} [randomFunc=Math.random] - 乱数生成関数
   * @return {Array} - シャッフルされた配列
   */
  static shuffleArray(array, seed, randomFunc = Math.random) {
    const newArray = [...array];
    const random = seed !== undefined
      ? (() => {
        let currentSeed = seed;
        return () => {
          currentSeed = (currentSeed * 9301 + 49297) % 233280;
          return currentSeed / 233280;
        };
      })()
      : randomFunc;

    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }

    return newArray;
  }

  /**
   * 役職の依存関係を検証する
   * @param {string[]} roleList - 検証する役職のリスト
   * @param {Object} errorHandler - エラーハンドラ
   * @return {boolean} - 依存関係が満たされている場合はtrue、そうでない場合はfalse
   */
  static validateRoleDependencies(roleList, errorHandler) {
    const dependencies = {
      'heretic': ['fox']
    };

    return roleList.every(role => {
      if (!dependencies[role]) return true;

      return dependencies[role].every(dependency => {
        if (!roleList.includes(dependency)) {
          errorHandler?.createError && errorHandler.handleError(
            errorHandler.createError('ROLE_DEPENDENCY_NOT_MET',
              `Role '${role}' requires '${dependency}' but it is not included in the role list`)
          );
          return false;
        }
        return true;
      });
    });
  }

  /**
   * 役職バランスを検証する
   * @param {string[]} roleList - 検証する役職のリスト
   * @param {Object} errorHandler - エラーハンドラ
   * @return {boolean} - バランスが適切な場合はtrue、そうでない場合はfalse
   */
  static validateRoleBalance(roleList, errorHandler) {
    const createError = (message) => {
      errorHandler?.createError && errorHandler.handleError(
        errorHandler.createError('INVALID_ROLE_BALANCE', message)
      );
      return false;
    };

    const werewolfCount = roleList.filter(role => role === 'werewolf').length;
    if (werewolfCount === 0) {
      return createError('At least one werewolf is required');
    }

    const foxCount = roleList.filter(role => role === 'fox').length;
    if (foxCount > 1) {
      return createError('Maximum one fox allowed');
    }

    return true;
  }

  /**
   * 役職の互換性を検証する
   * @param {string[]} roleList - 検証する役職のリスト
   * @return {boolean} - 互換性がある場合はtrue、そうでない場合はfalse
   */
  static validateRoleCompatibility(roleList) {
    // 基本実装では常にtrueを返す
    // 将来的にはカスタム役職の互換性チェックを実装する
    return true;
  }
}