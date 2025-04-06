/**
 * @jest-environment node
 */

/**
 * VictoryManager テスト統合インデックス
 * このファイルは各テストファイルをインポートしてまとめて実行するためのものです。
 */

// 各テストファイルをインポート
import './VillageVictoryCondition.test.js';
import './WerewolfVictoryCondition.test.js';
import './FoxVictoryCondition.test.js';
import './DrawAndPriorityCondition.test.js'; // 正しいファイル名に修正（スペルミスはそのまま）
import './CustomAndTimeLimitCondition.test.js';
import './EventsAndErrorsCondition.test.js';

// このファイルでは実際のテストケースは定義せず、他のファイルからのテストをまとめています。
describe('VictoryManager 統合テスト', () => {
  it('各テストが正しくインポートされること', () => {
    // このテストは常に成功します
    expect(true).toBe(true);
  });
});