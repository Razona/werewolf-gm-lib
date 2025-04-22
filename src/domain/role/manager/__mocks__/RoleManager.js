/**
 * RoleManager クラスのモック
 */

const mockRoleManager = jest.fn().mockImplementation(() => {
  return {
    // 役職設定と割り当て
    setRoles: jest.fn().mockReturnValue(true),
    distributeRoles: jest.fn().mockReturnValue({ 0: 'villager', 1: 'werewolf' }),
    assignRole: jest.fn().mockReturnValue(true),
    
    // 役職情報取得
    getRoleInfo: jest.fn().mockReturnValue({ 
      name: 'villager', 
      displayName: '村人', 
      team: 'village' 
    }),
    
    // グループ操作
    getPlayersByRole: jest.fn().mockReturnValue([0]),
    getPlayersByTeam: jest.fn().mockReturnValue([0]),
    areAllRolesAssigned: jest.fn().mockReturnValue(true),
    
    // 役職能力
    getFortuneResult: jest.fn().mockReturnValue('village'),
    getMediumResult: jest.fn().mockReturnValue('village'),
    canUseAbility: jest.fn().mockReturnValue({ allowed: true }),
    getLastGuardedTarget: jest.fn().mockReturnValue(null),
    
    // 拡張機能
    registerRole: jest.fn().mockReturnValue(true),
    validateRoleList: jest.fn().mockReturnValue({ valid: true }),
    setupRoleReferences: jest.fn().mockReturnValue({}),
    
    // その他のモックメソッド
    initialize: jest.fn(),
    reset: jest.fn(),
    getRegisteredRoles: jest.fn().mockReturnValue(['villager', 'werewolf', 'seer']),
    getTeamInfo: jest.fn().mockReturnValue({ name: 'village', displayName: '村人陣営' })
  };
});

export default mockRoleManager;
