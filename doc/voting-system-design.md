# 人狼ゲームGM支援ライブラリ 投票システム設計書

## 1. 概要

本設計書では、人狼ゲームGM支援ライブラリの投票システムについて詳細に定義します。投票システムは、昼フェーズにおける処刑者決定のための投票プロセスを管理する重要なコンポーネントです。プレイヤーの投票の受付から集計、処刑対象の決定までの一連の流れを制御します。

## 2. 設計目標

- **透明性**: 投票プロセスが明確で理解しやすい
- **柔軟性**: 様々な投票ルールに対応できる設計
- **公平性**: 投票の集計と結果処理が公正に行われる
- **追跡可能性**: 投票履歴が記録され、参照可能
- **拡張性**: 特殊な投票ルールや役職効果に対応できる

## 3. 投票プロセスの定義

### 3.1 投票フェーズの流れ

標準的な投票フェーズは以下の流れで進行します：

1. **投票フェーズ開始**: 投票の開始が宣言され、投票可能なプレイヤーと対象が設定される
2. **投票受付**: 生存プレイヤーの投票を受け付ける
3. **投票変更**: 必要に応じて投票の変更を受け付ける
4. **投票締切**: 全員の投票完了または時間切れで締め切り
5. **投票集計**: 得票数を集計
6. **同数判定**: 最多得票者が複数いる場合、設定されたルールに従って処理
7. **決選投票**: 必要に応じて決選投票を実施
8. **処刑対象決定**: 最終的な処刑対象を決定
9. **投票フェーズ終了**: 結果の通知と次フェーズへの移行

### 3.2 投票の基本属性

投票は以下の属性を持ちます：

```javascript
{
  voterId: 1,              // 投票者のプレイヤーID
  targetId: 3,             // 投票先のプレイヤーID
  voteType: "execution",   // 投票タイプ（処刑投票、決選投票など）
  voteStrength: 1,         // 投票の重み（通常は1）
  turn: 2,                 // ゲームのターン数
  timestamp: 1621234567890 // 投票時刻
}
```

### 3.3 投票タイプの定義

| 投票タイプ | 説明 | タイミング |
|-----------|------|-----------|
| `execution` | 処刑投票 | 通常の昼フェーズ終了時 |
| `runoff` | 決選投票 | 同数得票時（設定に依存） |
| `special` | 特殊投票 | 特定の状況や役職効果 |

## 4. コンポーネント設計

### 4.1 主要コンポーネント

- **VoteManager**: 投票処理全体を管理するコアコンポーネント
- **VoteCollector**: 投票の受付と変更を管理
- **VoteCounter**: 投票の集計と同数判定を担当
- **RunoffResolver**: 決選投票の処理を担当
- **ExecutionHandler**: 処刑処理を担当

### 4.2 VoteManager のインターフェース

```javascript
class VoteManager {
  constructor(game) {
    this.game = game;
    this.voteCollector = new VoteCollector();
    this.voteCounter = new VoteCounter();
    this.runoffResolver = new RunoffResolver();
    this.executionHandler = new ExecutionHandler();
    this.voteHistory = [];
  }
  
  // 投票フェーズの開始
  startVoting(type = "execution") { ... }
  
  // 投票の登録
  registerVote(voterId, targetId) { ... }
  
  // 投票の変更
  changeVote(voterId, newTargetId) { ... }
  
  // 全投票の集計
  countVotes() { ... }
  
  // 決選投票の実施
  startRunoffVote(candidates) { ... }
  
  // 処刑の実行
  executeTarget(targetId) { ... }
  
  // 投票履歴の取得
  getVoteHistory(turn = null) { ... }
  
  // 特定プレイヤーの投票履歴
  getPlayerVoteHistory(playerId) { ... }
  
  // 特定プレイヤーの得票履歴
  getPlayerTargetHistory(playerId) { ... }
}
```

## 5. 投票の基本操作

### 5.1 投票フェーズの開始

```javascript
startVoting(type = "execution") {
  // 現在のターン数取得
  const currentTurn = this.game.phaseManager.getCurrentTurn();
  
  // 投票者リスト（生存プレイヤー）
  const voters = this.game.getAlivePlayers();
  
  // 投票対象リスト（基本は生存プレイヤー）
  const targets = this.game.getAlivePlayers();
  
  // 投票情報の初期化
  this.voteCollector.initialize(voters, targets, type, currentTurn);
  
  // 投票開始イベント発火
  this.game.eventSystem.emit('vote.start', {
    type,
    turn: currentTurn,
    voters: voters.map(p => p.id),
    targets: targets.map(p => p.id)
  });
  
  return {
    type,
    voters: voters.length,
    targets: targets.length
  };
}
```

### 5.2 投票の登録

```javascript
registerVote(voterId, targetId) {
  // 投票者と対象の検証
  const validationResult = this.validateVote(voterId, targetId);
  if (!validationResult.valid) {
    return {
      success: false,
      reason: validationResult.reason
    };
  }
  
  // 投票オブジェクトの作成
  const vote = {
    voterId,
    targetId,
    voteType: this.voteCollector.currentVoteType,
    voteStrength: this.getVoteStrength(voterId),
    turn: this.game.phaseManager.getCurrentTurn(),
    timestamp: Date.now()
  };
  
  // 投票登録前イベント発火
  this.game.eventSystem.emit('vote.register.before', { vote });
  
  // 投票を保存
  const result = this.voteCollector.addVote(vote);
  
  // 投票登録後イベント発火
  this.game.eventSystem.emit('vote.register.after', {
    vote,
    isChange: result.isChange,
    previousTarget: result.previousTarget
  });
  
  // 投票履歴に追加
  this.voteHistory.push(vote);
  
  return {
    success: true,
    vote
  };
}
```

### 5.3 投票の検証

```javascript
validateVote(voterId, targetId) {
  // 投票者の検証
  const voter = this.game.getPlayer(voterId);
  if (!voter) {
    return {
      valid: false,
      reason: 'INVALID_VOTER',
      message: '投票者が存在しません'
    };
  }
  
  if (!voter.isAlive) {
    return {
      valid: false,
      reason: 'DEAD_VOTER',
      message: '死亡したプレイヤーは投票できません'
    };
  }
  
  // 対象の検証
  const target = this.game.getPlayer(targetId);
  if (!target) {
    return {
      valid: false,
      reason: 'INVALID_TARGET',
      message: '投票対象が存在しません'
    };
  }
  
  // 現在の投票タイプで対象が有効か
  if (!this.voteCollector.isValidTarget(targetId)) {
    return {
      valid: false,
      reason: 'INELIGIBLE_TARGET',
      message: 'この対象に投票することはできません'
    };
  }
  
  // カスタム検証ルール
  const customValidation = this.customValidateVote(voterId, targetId);
  if (customValidation && !customValidation.valid) {
    return customValidation;
  }
  
  return { valid: true };
}
```

### 5.4 投票の変更

```javascript
changeVote(voterId, newTargetId) {
  // 既に投票済みか確認
  if (!this.voteCollector.hasVoted(voterId)) {
    return {
      success: false,
      reason: 'NO_PREVIOUS_VOTE',
      message: '変更する投票がありません'
    };
  }
  
  // 新しい投票先の検証
  const validationResult = this.validateVote(voterId, newTargetId);
  if (!validationResult.valid) {
    return {
      success: false,
      reason: validationResult.reason,
      message: validationResult.message
    };
  }
  
  // 現在の投票を取得
  const currentVote = this.voteCollector.getVote(voterId);
  
  // 同じ対象への投票なら何もしない
  if (currentVote.targetId === newTargetId) {
    return {
      success: true,
      unchanged: true,
      vote: currentVote
    };
  }
  
  // 投票変更前イベント発火
  this.game.eventSystem.emit('vote.change.before', {
    voterId,
    oldTargetId: currentVote.targetId,
    newTargetId
  });
  
  // 投票の変更
  const newVote = {
    ...currentVote,
    targetId: newTargetId,
    timestamp: Date.now()
  };
  
  this.voteCollector.updateVote(newVote);
  
  // 投票変更後イベント発火
  this.game.eventSystem.emit('vote.change.after', {
    vote: newVote,
    oldTargetId: currentVote.targetId
  });
  
  // 投票履歴に追加
  this.voteHistory.push(newVote);
  
  return {
    success: true,
    vote: newVote
  };
}
```

## 6. 集計処理

### 6.1 投票の集計

```javascript
countVotes() {
  // 現在の投票を取得
  const votes = this.voteCollector.getCurrentVotes();
  
  // 投票集計前イベント発火
  this.game.eventSystem.emit('vote.count.before', { votes });
  
  // 投票を集計
  const result = this.voteCounter.count(votes);
  
  // 同数判定
  const tieResult = this.voteCounter.checkForTie(result);
  
  // 投票集計結果オブジェクト
  const countResult = {
    type: this.voteCollector.currentVoteType,
    turn: this.game.phaseManager.getCurrentTurn(),
    votes,
    counts: result.counts,
    maxVoted: result.maxVoted,
    isTie: tieResult.isTie,
    needsRunoff: this.needsRunoffVote(tieResult)
  };
  
  // 投票集計後イベント発火
  this.game.eventSystem.emit('vote.count.after', countResult);
  
  return countResult;
}
```

### 6.2 集計ロジック

```javascript
count(votes) {
  // 得票数カウント
  const counts = {};
  
  // 各投票を処理
  votes.forEach(vote => {
    const targetId = vote.targetId;
    const strength = vote.voteStrength || 1;
    
    // 対象の得票数を更新
    counts[targetId] = (counts[targetId] || 0) + strength;
  });
  
  // 最大得票数を取得
  let maxCount = 0;
  Object.values(counts).forEach(count => {
    if (count > maxCount) maxCount = count;
  });
  
  // 最大得票者リスト
  const maxVoted = [];
  Object.entries(counts).forEach(([targetId, count]) => {
    if (count === maxCount) {
      maxVoted.push(parseInt(targetId));
    }
  });
  
  return {
    counts,
    maxCount,
    maxVoted
  };
}
```

### 6.3 同数判定と処理方針

```javascript
checkForTie(countResult) {
  // 最大得票者が1人だけなら同数なし
  if (countResult.maxVoted.length === 1) {
    return {
      isTie: false,
      tiedPlayers: []
    };
  }
  
  // 同数の場合
  return {
    isTie: true,
    tiedPlayers: countResult.maxVoted
  };
}

needsRunoffVote(tieResult) {
  // 同数でない場合は決選投票不要
  if (!tieResult.isTie) {
    return false;
  }
  
  // 決選投票ルールを取得
  const tieRule = this.game.options.regulations.executionRule;
  
  // ルールに基づいて決選投票が必要か判断
  switch (tieRule) {
    case 'runoff':
      return true; // 決選投票を行う
    case 'random':
      return false; // ランダム選出
    case 'no_execution':
      return false; // 処刑なし
    case 'all_execution':
      return false; // 全員処刑
    default:
      return true; // デフォルトは決選投票
  }
}
```

## 7. 決選投票処理

### 7.1 決選投票の開始

```javascript
startRunoffVote(candidates) {
  // 現在のターン数取得
  const currentTurn = this.game.phaseManager.getCurrentTurn();
  
  // 投票者リスト（生存プレイヤー）
  const voters = this.game.getAlivePlayers();
  
  // 決選投票の対象は同数だった候補者
  const targets = candidates.map(id => this.game.getPlayer(id))
                           .filter(p => p && p.isAlive);
  
  // 投票情報の初期化（決選投票タイプ）
  this.voteCollector.initialize(voters, targets, "runoff", currentTurn);
  
  // 決選投票開始イベント発火
  this.game.eventSystem.emit('vote.runoff.start', {
    turn: currentTurn,
    voters: voters.map(p => p.id),
    candidates: targets.map(p => p.id)
  });
  
  return {
    type: "runoff",
    voters: voters.length,
    candidates: targets.length
  };
}
```

### 7.2 決選投票の集計と結果処理

```javascript
finalizeRunoffVote() {
  // 決選投票を集計
  const result = this.countVotes();
  
  // 決選投票でも同数の場合
  if (result.isTie) {
    // 決選投票同数ルールに基づいて処理
    const tieRule = this.game.options.regulations.runoffTieRule;
    const executionTarget = this.resolveRunoffTie(result.maxVoted, tieRule);
    
    result.executionTarget = executionTarget;
  } else {
    // 同数でない場合は最多得票者
    result.executionTarget = result.maxVoted[0];
  }
  
  // 決選投票結果イベント発火
  this.game.eventSystem.emit('vote.runoff.result', {
    ...result,
    executionTarget: result.executionTarget
  });
  
  return result;
}

resolveRunoffTie(tiedPlayers, tieRule) {
  switch (tieRule) {
    case 'random':
      // ランダムに1人選出
      return tiedPlayers[Math.floor(this.game.random() * tiedPlayers.length)];
    
    case 'no_execution':
      // 処刑なし
      return null;
    
    case 'all_execution':
      // 全員処刑（特殊値）
      return 'all';
    
    default:
      // デフォルトはランダム
      return tiedPlayers[Math.floor(this.game.random() * tiedPlayers.length)];
  }
}
```

## 8. 処刑実行処理

### 8.1 処刑対象の決定

```javascript
determineExecutionTarget(voteResult) {
  // 投票タイプに応じて処理
  if (voteResult.type === "execution") {
    // 通常投票の場合
    if (voteResult.isTie) {
      // 同数の場合は同数ルールに基づく
      const tieRule = this.game.options.regulations.executionRule;
      
      switch (tieRule) {
        case 'runoff':
          // 決選投票フェーズへ移行
          return { needsRunoff: true, candidates: voteResult.maxVoted };
        
        case 'random':
          // ランダム選出
          return {
            needsRunoff: false,
            executionTarget: voteResult.maxVoted[Math.floor(this.game.random() * voteResult.maxVoted.length)]
          };
        
        case 'no_execution':
          // 処刑なし
          return { needsRunoff: false, executionTarget: null };
        
        case 'all_execution':
          // 全員処刑
          return { needsRunoff: false, executionTarget: 'all' };
      }
    } else {
      // 同数でない場合は最多得票者
      return {
        needsRunoff: false,
        executionTarget: voteResult.maxVoted[0]
      };
    }
  } else if (voteResult.type === "runoff") {
    // 決選投票の結果をそのまま返す
    return {
      needsRunoff: false,
      executionTarget: voteResult.executionTarget
    };
  }
  
  // 不明な投票タイプの場合
  return { needsRunoff: false, executionTarget: null };
}
```

### 8.2 処刑の実行

```javascript
executeTarget(targetId) {
  // 処刑なしの場合
  if (targetId === null) {
    // 処刑なしイベント発火
    this.game.eventSystem.emit('execution.none', {
      turn: this.game.phaseManager.getCurrentTurn(),
      reason: 'no_execution_rule'
    });
    
    return { executed: false };
  }
  
  // 全員処刑の特殊ケース
  if (targetId === 'all') {
    return this.executeAllCandidates();
  }
  
  // 通常の処刑
  const target = this.game.getPlayer(targetId);
  if (!target || !target.isAlive) {
    return {
      executed: false,
      reason: 'INVALID_TARGET'
    };
  }
  
  // 処刑前イベント発火
  this.game.eventSystem.emit('execution.before', {
    targetId,
    playerName: target.name,
    turn: this.game.phaseManager.getCurrentTurn()
  });
  
  // 処刑効果（死亡）の適用
  this.game.killPlayer(targetId, 'execution');
  
  // 処刑後イベント発火
  this.game.eventSystem.emit('execution.after', {
    targetId,
    playerName: target.name,
    turn: this.game.phaseManager.getCurrentTurn(),
    role: this.game.options.regulations.revealRoleOnDeath ? target.role.name : null
  });
  
  return {
    executed: true,
    targetId,
    playerName: target.name
  };
}
```

## 9. イベントとの連携

### 9.1 投票システムが発火するイベント

| イベント | 説明 | データ例 |
|---------|------|----------|
| `vote.start` | 投票開始時 | `{type, turn, voters, targets}` |
| `vote.register.before` | 投票登録前 | `{vote}` |
| `vote.register.after` | 投票登録後 | `{vote, isChange, previousTarget}` |
| `vote.change.before` | 投票変更前 | `{voterId, oldTargetId, newTargetId}` |
| `vote.change.after` | 投票変更後 | `{vote, oldTargetId}` |
| `vote.count.before` | 投票集計前 | `{votes}` |
| `vote.count.after` | 投票集計後 | `{type, turn, votes, counts, maxVoted, isTie, needsRunoff}` |
| `vote.runoff.start` | 決選投票開始時 | `{turn, voters, candidates}` |
| `vote.runoff.result` | 決選投票結果時 | `{...voteResult, executionTarget}` |
| `execution.before` | 処刑実行前 | `{targetId, playerName, turn}` |
| `execution.after` | 処刑実行後 | `{targetId, playerName, turn, role}` |
| `execution.none` | 処刑なし時 | `{turn, reason}` |

### 9.2 投票システムが購読するイベント

| イベント | 処理内容 |
|---------|----------|
| `phase.start.vote` | 投票フェーズの開始処理 |
| `phase.end.vote` | 投票の集計と次フェーズへの情報引き継ぎ |
| `phase.start.runoffVote` | 決選投票フェーズの開始処理 |
| `phase.end.runoffVote` | 決選投票の集計と次フェーズへの情報引き継ぎ |
| `player.death` | 死亡プレイヤーの投票取り消し |

### 9.3 フェーズシステムとの連携

```javascript
initializePhaseListeners() {
  // 投票フェーズ開始時
  this.game.eventSystem.on('phase.start.vote', (event) => {
    // 投票の開始
    this.startVoting("execution");
  });
  
  // 投票フェーズ終了時
  this.game.eventSystem.on('phase.end.vote', (event) => {
    // 投票の集計
    const voteResult = this.countVotes();
    
    // 処刑対象の決定
    const executionDecision = this.determineExecutionTarget(voteResult);
    
    // 決選投票が必要な場合
    if (executionDecision.needsRunoff) {
      // フェーズコンテキストに決選投票情報を設定
      this.game.phaseManager.setPhaseContextData({
        runoffCandidates: executionDecision.candidates
      });
    } else {
      // 処刑対象をフェーズコンテキストに設定
      this.game.phaseManager.setPhaseContextData({
        executionTarget: executionDecision.executionTarget
      });
    }
  });
  
  // 決選投票フェーズ開始時
  this.game.eventSystem.on('phase.start.runoffVote', (event) => {
    // 前フェーズコンテキストから候補者を取得
    const prevContext = this.game.phaseManager.getPreviousPhaseContext();
    const candidates = prevContext.data.runoffCandidates || [];
    
    // 決選投票の開始
    this.startRunoffVote(candidates);
  });
  
  // 決選投票フェーズ終了時
  this.game.eventSystem.on('phase.end.runoffVote', (event) => {
    // 決選投票の集計と結果確定
    const result = this.finalizeRunoffVote();
    
    // 処刑対象をフェーズコンテキストに設定
    this.game.phaseManager.setPhaseContextData({
      executionTarget: result.executionTarget
    });
  });
}
```

## 10. 特殊ルールへの対応

### 10.1 初日処刑なしルール

```javascript
handleFirstDayExecution() {
  // 現在のターン数を取得
  const currentTurn = this.game.phaseManager.getCurrentTurn();
  
  // 初日かどうか確認
  if (currentTurn === 1) {
    // 初日処刑なしルールが有効か確認
    if (this.game.options.regulations.firstDayExecution === false) {
      // 投票フェーズをスキップする指示を返す
      return {
        skipVoting: true,
        reason: 'first_day_no_execution'
      };
    }
  }
  
  return {
    skipVoting: false
  };
}
```

### 10.2 投票の重み付け

一部の役職が投票に特別な影響を与える場合の対応：

```javascript
getVoteStrength(playerId) {
  const player = this.game.getPlayer(playerId);
  if (!player) return 1; // デフォルトは1
  
  // 役職に基づく投票の重み
  const role = player.role;
  
  // ここで役職に応じた投票の重みを設定できる
  // 例: 村長役職は2票分の価値がある場合
  if (role.name === 'mayor') {
    return 2;
  }
  
  // その他の役職で投票の重みに影響するものがあれば追加
  
  return 1; // 通常は1
}
```

### 10.3 投票の制約

```javascript
customValidateVote(voterId, targetId) {
  // 自分自身への投票を禁止するルール
  if (voterId === targetId && !this.game.options.regulations.allowSelfVote) {
    return {
      valid: false,
      reason: 'SELF_VOTE_FORBIDDEN',
      message: '自分自身に投票することはできません'
    };
  }
  
  // その他の特殊制約を追加
  
  return { valid: true };
}
```

### 10.4 複数回の投票

一部のレギュレーションでは複数回の投票が行われる場合があります：

```javascript
startMultipleVotingRounds(rounds = 2) {
  this.multipleVotingRounds = rounds;
  this.currentVotingRound = 1;
  
  // 複数投票開始イベント発火
  this.game.eventSystem.emit('vote.multiple.start', {
    rounds,
    currentRound: 1
  });
  
  // 最初の投票ラウンド開始
  return this.startVoting("execution");
}

advanceToNextVotingRound() {
  this.currentVotingRound++;
  
  // 全てのラウンドが終了したか確認
  if (this.currentVotingRound > this.multipleVotingRounds) {
    // 複数投票終了
    const finalResult = this.getFinalMultipleVotingResult();
    
    this.game.eventSystem.emit('vote.multiple.complete', {
      rounds: this.multipleVotingRounds,
      finalResult
    });
    
    return {
      complete: true,
      result: finalResult
    };
  }
  
  // 次のラウンド開始
  this.game.eventSystem.emit('vote.multiple.nextRound', {
    round: this.currentVotingRound,
    totalRounds: this.multipleVotingRounds
  });
  
  // 新しい投票ラウンド開始
  return this.startVoting("execution");
}
```

## 11. 投票結果の履歴管理

### 11.1 投票履歴の構造

```javascript
class VoteHistory {
  constructor() {
    this.history = {}; // ターンごとの投票履歴
    this.playerVotes = {}; // プレイヤーごとの投票履歴
    this.playerTargets = {}; // プレイヤーごとの被投票履歴
  }
  
  // 投票の記録
  recordVote(vote) {
    const { turn, voterId, targetId, voteType } = vote;
    
    // ターンごとの履歴に追加
    if (!this.history[turn]) {
      this.history[turn] = {};
    }
    if (!this.history[turn][voteType]) {
      this.history[turn][voteType] = [];
    }
    this.history[turn][voteType].push(vote);
    
    // プレイヤーごとの投票履歴に追加
    if (!this.playerVotes[voterId]) {
      this.playerVotes[voterId] = [];
    }
    this.playerVotes[voterId].push(vote);
    
    // プレイヤーごとの被投票履歴に追加
    if (!this.playerTargets[targetId]) {
      this.playerTargets[targetId] = [];
    }
    this.playerTargets[targetId].push(vote);
  }
  
  // ターンごとの投票履歴取得
  getVotesByTurn(turn, type = null) {
    if (!this.history[turn]) return [];
    
    if (type) {
      return this.history[turn][type] || [];
    } else {
      // 全タイプの投票を結合
      let allVotes = [];
      Object.values(this.history[turn]).forEach(votes => {
        allVotes = allVotes.concat(votes);
      });
      return allVotes;
    }
  }
  
  // プレイヤーの投票履歴取得
  getPlayerVoteHistory(playerId) {
    return this.playerVotes[playerId] || [];
  }
  
  // プレイヤーの被投票履歴取得
  getPlayerTargetHistory(playerId) {
    return this.playerTargets[playerId] || [];
  }
  
  // 投票結果サマリーの生成
  generateVoteSummary(turn) {
    const summary = {
      turn,
      types: {},
      results: {}
    };
    
    // ターン内の各投票タイプごとに集計
    if (this.history[turn]) {
      Object.entries(this.history[turn]).forEach(([type, votes]) => {
        // 投票タイプごとの集計
        const counts = {};
        votes.forEach(vote => {
          counts[vote.targetId] = (counts[vote.targetId] || 0) + 
                                 (vote.voteStrength || 1);
        });
        
        summary.types[type] = {
          votes: votes.length,
          counts
        };
        
        // 最大得票者を追加
        let maxCount = 0;
        let maxVoted = [];
        Object.entries(counts).forEach(([targetId, count]) => {
          if (count > maxCount) {
            maxCount = count;
            maxVoted = [parseInt(targetId)];
          } else if (count === maxCount) {
            maxVoted.push(parseInt(targetId));
          }
        });
        
        summary.types[type].maxCount = maxCount;
        summary.types[type].maxVoted = maxVoted;
      });
    }
    
    return summary;
  }
}
```

### 11.2 投票履歴の参照API

```javascript
// 特定ターンの投票履歴取得
getVoteHistory(turn = null, type = null) {
  if (turn !== null) {
    return this.voteHistory.getVotesByTurn(turn, type);
  } else {
    // 全ターンの履歴取得
    const allHistory = {};
    Object.keys(this.voteHistory.history).forEach(turn => {
      allHistory[turn] = this.voteHistory.getVotesByTurn(parseInt(turn), type);
    });
    return allHistory;
  }
}

// 投票結果の履歴取得
getVoteResultHistory() {
  const results = [];
  
  Object.keys(this.voteHistory.history).forEach(turn => {
    results.push(this.voteHistory.generateVoteSummary(parseInt(turn)));
  });
  
  return results;
}

// 特定プレイヤーの投票パターン分析
analyzePlayerVotingPattern(playerId) {
  const votes = this.voteHistory.getPlayerVoteHistory(playerId);
  if (votes.length === 0) return null;
  
  // 投票対象の集計
  const targetCounts = {};
  votes.forEach(vote => {
    targetCounts[vote.targetId] = (targetCounts[vote.targetId] || 0) + 1;
  });
  
  // 最も多く投票した対象
  let maxCount = 0;
  let mostVotedTarget = null;
  Object.entries(targetCounts).forEach(([targetId, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostVotedTarget = parseInt(targetId);
    }
  });
  
  return {
    totalVotes: votes.length,
    uniqueTargets: Object.keys(targetCounts).length,
    targetCounts,
    mostVotedTarget,
    mostVotedCount: maxCount,
    votingHistory: votes.map(v => ({
      turn: v.turn,
      targetId: v.targetId,
      type: v.voteType
    }))
  };
}
```

## 12. 実装ガイドライン

### 12.1 イベント駆動設計の活用

投票システムはイベント駆動型のアーキテクチャと整合性が高いです：

1. 各ステップ（開始、登録、変更、集計など）でイベントを発火
2. 各コンポーネントは必要なイベントを購読して処理
3. UIやロギングは発火されたイベントを元に更新

### 12.2 堅牢なエラーハンドリング

```javascript
try {
  // 投票実行
  const result = this.registerVote(voterId, targetId);
  return result;
} catch (error) {
  // エラーのログ記録
  this.game.logger.error('Vote registration error', {
    voterId,
    targetId,
    error: error.message,
    stack: error.stack
  });
  
  // エラーイベント発火
  this.game.eventSystem.emit('vote.error', {
    voterId,
    targetId,
    error: error.message
  });
  
  // エラー応答を返す
  return {
    success: false,
    reason: 'SYSTEM_ERROR',
    message: '投票処理中にエラーが発生しました'
  };
}
```

### 12.3 投票処理の並列化回避

```javascript
// 投票処理のロック機構
let processingVote = false;

async registerVote(voterId, targetId) {
  // 他の投票処理中なら待機
  if (processingVote) {
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!processingVote) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }
  
  try {
    processingVote = true;
    // 投票処理...
    return result;
  } finally {
    processingVote = false;
  }
}
```

## 13. 拡張ポイント

### 13.1 カスタム投票ルールの追加

```javascript
// カスタム投票ルールの登録
registerVotingRule(name, rule) {
  this.customVotingRules[name] = rule;
  return true;
}

// カスタム投票ルールの適用
applyVotingRule(ruleName, context) {
  const rule = this.customVotingRules[ruleName];
  if (!rule) return null;
  
  return rule(context, this.game);
}

// 使用例
game.voteManager.registerVotingRule('weightedVoting', (context, game) => {
  // 役職に基づいて投票の重みを変更するルール
  return {
    getVoteStrength: (playerId) => {
      const player = game.getPlayer(playerId);
      // カスタムロジック...
      return strength;
    }
  };
});

// ルールの有効化
game.voteManager.enableVotingRule('weightedVoting');
```

### 13.2 投票プラグインシステム

```javascript
// 投票プラグインの登録
werewolf.registerVotePlugin('specialVoting', {
  // 投票タイプの追加
  voteTypes: [{
    type: 'accusation',
    displayName: '告発投票',
    description: '特定プレイヤーを告発する特殊投票'
  }],
  
  // 投票ハンドラ
  handlers: {
    'accusation': {
      validate: (voterId, targetId, game) => {
        // 検証ロジック
        return { valid: true };
      },
      process: (votes, game) => {
        // 処理ロジック
        return { ... };
      }
    }
  },
  
  // イベントハンドラ
  eventHandlers: {
    'vote.start': (event, game) => {
      // イベント処理
    }
  },
  
  // 初期化処理
  initialize: (game) => {
    // プラグイン初期化
  }
});

// プラグイン有効化
game.enableVotePlugin('specialVoting');
```

### 13.3 UI連携のための拡張

```javascript
// 投票状況の公開設定
configureVoteVisibility(options) {
  this.visibilityOptions = {
    showOngoing: options.showOngoing || false, // 投票中に途中経過を見せるか
    showVoters: options.showVoters || true,   // 投票者の名前を表示するか
    showCounts: options.showCounts || true,   // 得票数を表示するか
    anonymousUntilEnd: options.anonymousUntilEnd || false // 終了まで匿名にするか
  };
  
  return this.visibilityOptions;
}

// 現在の投票状況を取得（視点付き）
getCurrentVoteStatus(viewerId = null) {
  // 基本情報
  const status = {
    type: this.voteCollector.currentVoteType,
    turn: this.game.phaseManager.getCurrentTurn(),
    complete: this.voteCollector.isVotingComplete(),
    totalVoters: this.voteCollector.getTotalVoters(),
    votesSubmitted: this.voteCollector.getSubmittedVotes().length
  };
  
  // 視点に基づいた情報制限
  const isAdmin = viewerId === null || this.game.hasGlobalPermission(viewerId);
  
  // 管理者なら全ての情報を表示
  if (isAdmin) {
    status.votes = this.voteCollector.getCurrentVotes();
    status.remainingVoters = this.voteCollector.getRemainingVoters();
  } 
  // プレイヤーには設定に基づいて情報を制限
  else {
    // 自分の投票は常に見える
    status.ownVote = this.voteCollector.getVote(viewerId);
    
    // 設定に基づいて他の情報を制限
    if (this.visibilityOptions.showOngoing) {
      if (this.visibilityOptions.anonymousUntilEnd && !status.complete) {
        // 匿名投票情報
        status.counts = this.getAnonymousCounts();
      } else {
        // 通常の投票情報
        status.votes = this.getVisibleVotes(viewerId);
      }
    }
  }
  
  return status;
}
```

## 14. まとめ

投票システムは人狼ゲームの中核となる処刑決定メカニズムを管理する重要なコンポーネントです。本設計書では以下の特徴を持つ投票システムを定義しました：

1. **透明な投票プロセス**: 投票の受付から集計、結果適用までの流れを明確に定義
2. **柔軟なルール対応**: 同数時の処理やレギュレーションに応じた柔軟な設定が可能
3. **イベントとの緊密な連携**: フェーズシステムやゲーム状態と連携したイベント駆動型設計
4. **詳細な履歴管理**: 投票の履歴記録と分析機能の提供
5. **拡張可能な構造**: カスタムルールやプラグインによる機能拡張への対応

この設計により、GM支援ライブラリは様々な人狼ゲームのバリエーションに対応できる柔軟で堅牢な投票システムを提供できます。

投票システムはフェーズシステム、役職システム、アクションシステムと密接に連携することで、人狼ゲームの中核となる処刑メカニズムを実現します。
