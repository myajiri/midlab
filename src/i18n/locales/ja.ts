// ============================================
// Japanese Translation - MidLab
// ============================================

const ja = {
  // ============================================
  // タブ
  // ============================================
  tabs: {
    home: 'ホーム',
    test: 'テスト',
    plan: '計画',
    workout: 'トレーニング',
    settings: '設定',
  },

  // ============================================
  // 共通
  // ============================================
  common: {
    cancel: 'キャンセル',
    delete: '削除',
    save: '保存',
    done: '完了',
    skip: 'スキップ',
    back: '戻る',
    next: '次へ',
    close: '閉じる',
    confirm: '確認',
    error: 'エラー',
    reset: 'リセット',
    update: '更新',
    create: '作成',
    edit: '編集',
    ok: 'OK',
    add: '追加',
    notSet: '未設定',
    example: '例:',
    seconds: '秒',
    secondsPer400m: '秒/400m',
    perKm: '/km',
    meters: 'm',
    km: 'km',
    laps: '周',
    all: 'すべて',
    today: '今日',
    dayNames: ['月', '火', '水', '木', '金', '土', '日'],
    dayNamesShort: ['月', '火', '水', '木', '金', '土', '日'],
    dayNamesFull: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    estimated: '推定',
    measured: '測定',
    default: 'デフォルト',
    recommended: '推奨',
    halfMarathon: 'ハーフマラソン',
    fullMarathon: 'マラソン',
    custom: 'カスタム',
    customDistance: '任意距離',
  },

  // ============================================
  // ホーム画面
  // ============================================
  home: {
    // ウェルカム画面
    welcomeTitle: 'ミドラボへようこそ',
    welcomeSubtitle: 'ETPテストであなたに最適なトレーニングを見つけましょう',
    step1Title: 'プロフィールを設定',
    step1Desc: '基本情報と自己ベストを登録',
    step2Title: 'ETPテストを実施',
    step2Desc: '持久力タイプを測定',
    step3Title: 'トレーニング開始',
    step3Desc: '最適なペースで練習',
    setupProfile: 'プロフィールを設定する',
    setupHint: '約1分で完了します',

    // ダッシュボード
    dashboard: 'ダッシュボード',
    estimated: '推定',
    measured: '測定',
    default: 'デフォルト',
    etpSeconds: '{{seconds}}s',
    etpSourceEstimated: '推定',
    etpSourceMeasured: '測定',
    etpSourceDefault: 'デフォルト',
    etpValue: '{{etp}}s',

    // リミッター
    limiterCardio: '心肺リミッター型',
    limiterMuscular: '筋持久力リミッター型',
    limiterBalanced: 'バランス型',

    // メトリクス
    level: 'レベル',
    estimatedVO2max: '推定VO2max',
    lastTest: '最終測定: {{date}}',

    // 次のステップ
    nextSteps: '次のステップ',
    runEtpTest: 'ETPテストを実施',
    runEtpTestDesc: '正確なETPとリミッタータイプを測定しましょう',
    recommended: '推奨',
    createPlan: 'トレーニング計画を作成',
    createPlanDesc: '目標レースに向けた週間計画を自動生成',

    // 計画カード
    targetRace: '目標レース',
    halfMarathon: 'ハーフマラソン',
    marathon: 'マラソン',
    todayWorkout: '今日のトレーニング',
    tapForDetails: 'タップして詳細を見る →',

    // 週間進捗
    weekProgress: '今週の進捗',
    ofWorkouts: '{{total}}ワークアウト中',
    weekProgressSubtitle: '{{total}}ワークアウト中',

    // レース予測
    racePredictions: 'レース予測 & PB',

    // ゾーン
    trainingZones: 'トレーニングゾーン',
    etpBadge: 'ETP: {{pace}} ({{seconds}}s/400m)',
    pacePerLap: '{{seconds}}s/400m',
  },

  // ============================================
  // オンボーディング
  // ============================================
  onboarding: {
    // ウェルカム
    appName: 'MidLab',
    tagline: '中距離ランナーのための\nトレーニングアプリ',
    featureEtp: 'ETPテスト',
    featureEtpDesc: '科学的に持久力タイプを判定',
    featureZones: 'ゾーン算出',
    featureZonesDesc: '最適なペースを自動計算',
    featurePersonalize: 'パーソナライズ',
    featurePersonalizeDesc: 'あなたに合ったトレーニング',
    feature1Title: 'ETPテスト',
    feature1Desc: '科学的に持久力タイプを判定',
    feature2Title: 'ゾーン算出',
    feature2Desc: '最適なペースを自動計算',
    feature3Title: 'パーソナライズ',
    feature3Desc: 'あなたに合ったトレーニング',
    getStarted: 'はじめる',
    start: 'はじめる',
    skip: 'スキップ',

    // セットアップ
    setupTitle: 'かんたん初期設定',
    setupSubtitle: '2つの質問に答えるだけ',
    quickSetup: 'かんたん初期設定',
    twoQuestions: '2つの質問に答えるだけ',
    ageLabel: '年齢',
    experienceLabel: '競技歴',
    pbLabel: '自己ベスト（任意）',
    estimatedEtp: '推定ETP: {{pace}} ({{seconds}}s/400m)',
    pbEstimatedEtp: '推定ETP: {{kmPace}} ({{etp}}s/400m)',
    monthlyMileageLabel: '月間走行距離上限（任意）',
    mileagePlaceholder: '例: 200',
    mileageHint: 'トレーニング期間中に走れる月間最大距離（km）を入力してください。この上限に収まるようにメニューが生成されます。基礎期は上限に近い量、その後段階的に調整されます。',
    monthlyMileagePlaceholder: '例: 200',
    monthlyMileageHint: 'トレーニング期間中に走れる月間最大距離（km）を入力してください。この上限に収まるようにメニューが生成されます。基礎期は上限に近い量、その後段階的に調整されます。',
    complete: '完了',
    bestTime: 'ベストタイム',

    // PBタイトル
    pbTitle: {
      m200: '200mベストタイム',
      m400: '400mベストタイム',
      m800: '800mベストタイム',
      m1500: '1500mベストタイム',
      m3000: '3000mベストタイム',
      m5000: '5000mベストタイム',
    },

    // 結果
    resultEstimated: 'PBからETPを推定しました',
    resultNeedTest: 'ETPテストで正確なETPを測定しましょう',
    nextStepTest: 'テストタブでETPテストを実施',
    nextStepHome: 'ホームでゾーンを確認',
    nextStepTrain: 'トレーニングを開始',
  },

  // ============================================
  // テスト画面
  // ============================================
  test: {
    // メイン
    title: 'ETPテスト',
    subtitle: 'ETPを測定してトレーニングゾーンを算出',
    pageTitle: 'ETPテスト',
    pageSubtitle: 'ETPを測定してトレーニングゾーンを算出',

    // PB推定
    pbEstimateTitle: 'PBからETPを推定',
    pbEstimateDesc: 'テストを受けなくても自己ベストからETPを推定できます',

    // スタートカード
    runTest: 'テストを実施',
    runTestHint: '400mトラックで実施',
    startTest: 'テストを実施',
    startTestHint: '400mトラックで実施',
    levelSelect: 'レベルを選択',
    startPace: 'スタートペース',
    maxLaps: '最大周回数',
    lapsCount: '{{count}}周',
    maxLapsValue: '{{laps}}周',
    acceleration: '加速',
    perLapDecrement: '1周ごとに-{{seconds}}秒',
    accelerationValue: '1周ごとに-{{increment}}秒',
    inputResults: 'テスト結果を入力',
    enterResults: 'テスト結果を入力',
    secondsSuffix: '秒',
    secPer400m: '秒/400m',

    // 進行表
    scheduleTitle: 'レベル{{level}} 進行表',
    lap: '周',
    pacePerKm: 'ペース/km',
    tableHeaderLap: '周',
    tableHeaderPaceKm: 'ペース/km',
    tableHeaderPace400: '400m',

    // 履歴
    pastResults: '過去の結果',

    // ガイド
    guideTitle: 'テストの流れ',
    guideStep1: 'レベルを選択しスタートペースを確認',
    guideStep2: '400mトラックで各周の目標ペースを維持',
    guideStep3: '目標より2秒以上遅れたら終了し結果を入力',

    // 位置づけ説明
    disclaimerTitle: 'ETPテストについて',
    disclaimerText1: 'ETPテストは自転車のランプテストをランニングに応用したものです。絶対的な正確さではなく、同じプロトコルを繰り返すことで変化を追跡することに価値があります。',
    disclaimerText2: '定期的にテストを実施（4週間ごとを推奨）し、トレーニング効果をモニタリングしましょう。',

    // 入力画面
    inputTitle: '結果を入力',
    executedLevel: 'テストレベル',
    completedLaps: '完了周回数',
    inputLevel: 'テストレベル',
    inputLaps: '完了周回数',
    lastPace: '最終ペース: {{pace}} ({{seconds}}s/400m)',
    whyStopped: '止まった理由は？',
    reasonBreath: '息がきつい',
    reasonLegs: '脚がきつい',
    reasonBoth: '両方',
    breathHard: '息がきつい',
    legsHeavy: '脚がきつい',
    both: '両方',
    recoveryTime: '息が整うまでの時間',
    recoveryUnder30: '30秒未満',
    recovery30to60: '30〜60秒',
    recoveryOver60: '60秒以上',
    breathRecovery: '息が整うまでの時間',
    breathRecoveryUnder30: '30秒未満',
    breathRecovery3060: '30〜60秒',
    breathRecoveryOver60: '60秒以上',
    calculateResult: '結果を計算',
    calculateResults: '結果を計算',

    // 結果画面
    resultTitle: 'テスト結果',
    testComplete: 'テスト完了',
    yourEtp: 'あなたのETP',
    trainingZones: 'トレーニングゾーン',
    racePredictions: 'レース予測',
    etpSuffix: 's',
  },

  // ============================================
  // 計画画面
  // ============================================
  plan: {
    // 作成画面
    pageTitle: 'トレーニング計画',
    pageSubtitle: '6ヶ月以内の最も重要なレース（目標レース）を設定してください。\n中間レースは計画作成後に追加できます。',
    createTitle: 'トレーニング計画',
    createSubtitle: '6ヶ月以内の最も重要なレース（目標レース）を設定してください。\n中間レースは計画作成後に追加できます。',
    raceName: 'レース名',
    raceNamePlaceholder: '例: 地区選手権',
    raceDate: 'レース日',
    selectDate: '日付を選択',
    raceDistance: 'レース距離',
    event: 'レース距離',
    customDistancePlaceholder: '距離をメートルで入力（例: 1000）',
    trainingDays: 'トレーニング日',
    restDay: '休養日',
    restDayFrequency: '休養日の頻度',
    keyWorkoutDays: 'キーワークアウト日',
    monthlyMileage: '月間走行距離上限（km）',
    monthlyMileageLabel: '月間走行距離上限（km）',
    mileagePlaceholder: '例: 200',
    mileageHint: 'メニューの量が自動調整されます',
    monthlyMileagePlaceholder: '例: 200',
    monthlyMileageHint: 'メニューの量が自動調整されます',
    createPlan: '計画を作成',
    generate: '計画を作成',
    selectRaceDate: 'レース日を選択',
    featureName: 'トレーニング計画',
    premiumFeatureName: 'トレーニング計画',

    // 曜日
    mon: '月',
    tue: '火',
    wed: '水',
    thu: '木',
    fri: '金',
    sat: '土',
    sun: '日',

    // バリデーション
    errorPastDate: '過去の日付です',
    errorMinDate: '4週間以上先の日付を選択してください',
    errorMaxDate: '6ヶ月以内のレースを設定してください。それ以上先のレースは、時期が近づいてから計画を作成してください。',
    errorFillAll: 'すべての項目を入力してください',
    errorCustomDistance: 'カスタム距離を入力してください',

    // 概要画面
    noPlan: '計画がありません',
    noPlanSubtitle: '目標レースを設定して\nトレーニング計画を作成しましょう',
    emptyTitle: '計画がありません',
    emptySubtitle: '目標レースを設定して\nトレーニング計画を作成しましょう',
    noData: 'データがありません',
    deletePlan: '計画を削除',
    deletePlanConfirm: 'この計画を削除してもよろしいですか？',
    newPlan: '新しい計画を作成',
    newPlanDesc: '現在の計画を上書きして新しい計画を作成します。トレーニングログとテスト結果は保持されます。',
    newPlanConfirm: '現在の計画を上書きして新しい計画を作成します。トレーニングログとテスト結果は保持されます。',
    newPlanAction: '作成',
    create: '作成',

    // メニュー更新
    updateMenu: 'メニューを更新',
    updateMenuDesc: '最新のメニューで計画を再生成します。完了マークは保持されます。',
    updateAction: '更新',
    update: '更新',
    menuUpdated: 'メニューが更新されました',
    menuUpdatedDesc: '最新のワークアウトメニューに更新できます',
    later: '後で',

    // 週間表示
    weekLabel: '第{{number}}週',
    weekNumber: '第{{week}}週',
    weeklySchedule: '週間スケジュール',
    weekProgress: '第{{current}}週 / {{total}}週',
    weekPhase: '第{{week}}週 {{phase}}',
    weekDayLabel: '第{{week}}週 {{day}}',
    weekGoal: '今週のポイント',
    thisWeek: '今週',
    today: '今日',
    phaseLabel: '{{phase}}',
    recoveryWeek: '回復週',
    testWeek: 'ETPテスト週',
    trainingPhase: 'トレーニングフェーズ',
    daysUntilRace: 'あと{{days}}日',

    // 体感
    feeling: {
      great: '絶好調',
      good: '好調',
      normal: '普通',
      tough: 'きつい',
      bad: '不調',
    },
    feelingGreat: '絶好調',
    feelingGood: '好調',
    feelingNormal: '普通',
    feelingTough: 'きつい',
    feelingBad: '不調',

    // レース距離ラベル
    customDistance: 'カスタム距離',
    halfMarathon: 'ハーフマラソン',
    marathon: 'マラソン',
    distanceHalf: 'ハーフ',
    distanceMarathon: 'マラソン',
    distanceCustom: 'カスタム',

    // 分析期間
    periodAll: '全期間',
    period30d: '30日間',
    period7d: '7日間',

    // トレーニングログ
    trainingLog: 'トレーニングログ',
    trainingRecord: 'トレーニング記録',
    recordCount: '{{count}}件',
    logCount: '{{count}}件',
    logCompleted: '完了',
    logSkipped: 'スキップ',
    logPlanned: '予定',
    todayPlanned: '今日の予定',
    addMenu: 'メニューを追加',
    skip: 'スキップ',
    skipConfirm: 'このワークアウトをスキップしますか？',
    recordsUntilRace: 'レースまでの記録',
    allRecords: 'すべての記録',
    noRecords: '記録はありません',
    noRecordsHint: 'トレーニングを記録してみましょう',
    deleteRecord: '記録を削除',
    deleteRecordConfirm: 'この記録を削除して未完了に戻しますか？',
    deleteRecordCompleted: '完了した記録を削除して未完了に戻しますか？',
    deleteRecordRevert: '記録を削除して取り消す',
    deleteRecordConfirmGeneral: 'この記録を削除しますか？',
    recordDeleted: '記録を削除しました',
    recordUpdated: '記録を更新しました',
    recordNotePlaceholder: '体感、ペース配分などのメモ',
    statusCompleted: '完了',
    statusSkipped: 'スキップ',
    statusPlanned: '予定',
    completionHint: '左のチェックボタンで完了マーク、長押しで記録入力',
    actualDataHint: 'ゾーンごとの実際の距離を入力できます（任意）',
    planned: '計画: {{distance}}m',
    durationFormat: '{{min}}分{{sec}}秒',
    record: '記録',
    recordAndComplete: '記録して完了',
    completeWithoutRecord: '記録なしで完了',
    editRecord: '記録を編集',
    selectRecordDate: '記録日を選択',
    customWorkout: 'カスタム',

    // 分析
    allPeriod: '全期間',
    thirtyDays: '30日間',
    sevenDays: '7日間',
    trainingAnalytics: 'トレーニング分析',
    weeklyKm: '週間km',
    monthlyKm: '月間km',
    completionRate: '完了率',
    overallProgress: '全体進捗',
    zoneStimulus: 'ゾーン別刺激',
    zoneRatio: 'ゾーン比率',
    targetLine100: '100%目標',
    all: 'すべて',

    // レーススケジュール
    raceSchedule: 'レーススケジュール',
    targetRace: '目標レース',
    finished: '終了',

    // サブレース
    addRace: 'レースを追加',
    subRace: '中間レース',
    subRaceEmptyText: '中間レースはまだ追加されていません',
    subRacePriorityHigh: '重要',
    subRacePriorityMedium: 'やや重要',
    subRacePriorityLow: '練習レース',
    priorityHigh: '重要',
    priorityMedium: 'やや重要',
    priorityLow: '練習レース',
    priority: '重要度',
    subRacePriorityHighDesc: 'ピークを合わせたいレース',
    subRacePriorityMediumDesc: '軽くテーパーしてレースに臨む',
    subRacePriorityLowDesc: 'テーパーなし、練習として出場',
    subRaceNamePlaceholder: '例: 県選手権',
    subRaceDaysLeft: 'あと{{days}}日',
    subRaceEnded: '終了',
    deleteSubRace: '中間レースを削除',
    deleteSubRaceConfirm: '「{{name}}」を削除しますか？',
    subRaceErrorPast: '過去の日付には中間レースを設定できません。\n未来の日付を選択してください。',
    subRaceErrorCompleted: 'この日は完了済みのワークアウトがあります。\n完了済みの日には中間レースを設定できません。',
    subRaceErrorBeforePlan: '計画開始日より前の日付は設定できません',
    subRaceErrorAfterTarget: '目標レース日以降の日付は設定できません',
    subRaceErrorCustomDistance: 'カスタム距離を入力してください',
    errorSubRacePast: '過去の日付には中間レースを設定できません',
    errorSubRaceCompleted: 'この日は完了済みのワークアウトがあります',
    errorSubRaceBeforeStart: '計画開始日より前の日付は設定できません',
    errorSubRaceAfterTarget: '目標レース日以降の日付は設定できません',

    // 結果記録モーダル
    recordResult: '結果を記録',
    recordResultTitle: '{{title}}',
    distance: '距離（m）',
    distanceLabel: '距離（m）',
    durationLabel: 'タイム',
    minuteLabel: '分',
    secondLabel: '秒',
    feelingSectionLabel: '体感',
    feelingLabel: '体感はどうでしたか？',
    notes: 'メモ',
    notesLabel: 'メモ',
    notesPlaceholder: 'ワークアウトの感想、ペース配分など',
    deleteAndRevert: '記録を削除',
    deleteAndRevertConfirm: 'この記録を削除して未完了に戻しますか？',
    date: '日付',

    // 曜日表示
    dayNames: ['月', '火', '水', '木', '金', '土', '日'],
  },

  // ============================================
  // ワークアウト画面
  // ============================================
  workout: {
    // メイン
    pageTitle: 'ワークアウト',
    replaceTitle: 'メニュー変更',
    premiumFeatureName: 'ワークアウト',

    // カテゴリ
    categoryAll: 'すべて',
    categoryVO2max: 'VO2max',
    categoryThreshold: '乳酸閾値',
    categorySpeed: 'スピード・スプリント',
    categoryAerobic: '有酸素ベース',
    categoryGeneral: '総合',
    categoryRace: 'レース',
    categoryOriginal: 'オリジナル',

    // ゾーン表示
    zoneJog: 'リカバリー',
    zoneEasy: 'イージー',
    zoneMarathon: 'マラソン',
    zoneThreshold: '閾値',
    zoneInterval: 'インターバル',
    zoneRepetition: 'レペティション',

    // リミッター
    limiterCardio: '心肺リミッター型',
    limiterMuscular: '筋持久力リミッター型',
    limiterBalanced: 'バランス型',

    // 詳細画面
    selectionGuide: '選択ガイド',
    limiterAdjustments: 'リミッター別調整',
    whyThisWorkout: 'なぜこのワークアウト？',
    segments: 'セグメント',
    recovery: 'リカバリー',
    totalDistance: '合計',
    selectForTraining: 'トレーニングに選択',
    addedToLog: '計画タブのトレーニングログに追加しました',
    replaceWorkout: '{{dayLabel}}のメニューをこのワークアウトに変更',
    replaceWorkoutDefault: 'このワークアウトに変更',
    replacedWorkout: '{{dayLabel}}を「{{workoutName}}」に変更しました',
    customMenu: 'カスタムメニュー',

    // オリジナルメニュー作成
    createNew: '新規作成',
    createTitle: '新しいワークアウト',
    editTitle: 'ワークアウトを編集',
    namePlaceholder: '例: 500m×5 スピード持久力',
    descriptionPlaceholder: 'ワークアウトの目的と説明',
    categoryLabel: 'カテゴリ',
    segmentZone: 'ゾーン',
    segmentDistance: '距離（m）',
    segmentLabel: 'ラベル（例: W-up 4周）',
    segmentReps: '本数',
    segmentRecovery: 'リカバリー（m）',
    addSegment: 'セグメントを追加',
    needOneSegment: '少なくとも1つのセグメントが必要です',
    workoutUpdated: 'ワークアウトを更新しました',
    workoutCreated: 'ワークアウトを作成しました',
    deleteWorkout: 'ワークアウトを削除',
    deleteWorkoutConfirm: '「{{name}}」を削除しますか？',
    lapGuide: 'ラップ目安',
    selectReplacementMenu: '{{dayLabel}}のメニューを選択してください',
  },

  // ============================================
  // 設定画面
  // ============================================
  settings: {
    title: '設定',

    // サブスクリプション
    premiumMember: 'プレミアム会員',
    freePlan: '無料プラン',
    restorePurchase: '購入を復元',
    restoreSuccess: '購入を復元しました',
    restoreResult: '復元結果',
    restoreSuccessMsg: '購入が復元されました',
    restoreFailMsg: '復元できる購入がありません',

    // プロフィール
    profile: 'プロフィール',
    age: '年齢',
    experience: '競技歴',
    personalBests: '自己ベスト（PB）',
    estimatedEtp: '推定ETP: {{kmPace}} ({{etp}}s/400m)',
    speedIndex: 'スピード指数: {{value}} → {{reason}}（自動設定）',
    limiterType: 'リミッタータイプ',
    testDetermined: 'テストで判定済み',
    monthlyMileage: '月間走行距離上限（km）',
    monthlyMileagePlaceholder: '例: 200',
    monthlyMileageHint: 'メニューの量が自動調整されます',
    limiterCardio: '心肺',
    limiterBalanced: 'バランス',
    limiterMuscular: '筋持久力',

    // 年齢オプション
    ageJuniorHigh: '中学生',
    ageHighSchool: '高校生',
    ageCollegiate: '大学生',
    ageSenior: '一般',
    ageMasters40: '40代',
    ageMasters50: '50代',
    ageMasters60: '60歳〜',

    // 経験オプション
    expBeginner: '初心者',
    expIntermediate: '中級者',
    expAdvanced: '上級者',

    // PBタイトル
    pbTitle200m: '200mベストタイム',
    pbTitle400m: '400mベストタイム',
    pbTitle800m: '800mベストタイム',
    pbTitle1500m: '1500mベストタイム',
    pbTitle3000m: '3000mベストタイム',
    pbTitle5000m: '5000mベストタイム',
    bestTime: 'ベストタイム',

    // 言語
    language: '言語',
    languageSystem: 'システム言語',

    // 用語ヘルプ
    glossary: '用語集',
    helpEtpTerm: 'ETP（推定閾値ペース）',
    helpEtpDesc: '400mあたりの推定閾値ペース（秒）。ETPテストまたは自己ベストから算出。値が低いほど走力が高いことを示します。',
    helpLimiterTerm: 'リミッタータイプ',
    helpLimiterDesc: '持久力の制限要因を3タイプに分類：心肺型（息が先にきつくなる）、筋持久力型（脚が先にきつくなる）、バランス型（均等）。タイプによりトレーニングの重点が変わります。',
    helpZoneTerm: 'トレーニングゾーン',
    helpZoneDesc: 'ETPから算出される6段階の強度帯：リカバリー、イージー、マラソン、閾値、インターバル、レペティションの各ゾーンでトレーニングを行います。',
    helpVO2maxTerm: '推定VO2max',
    helpVO2maxDesc: '推定最大酸素摂取量（ml/kg/min）。ETPから算出される有酸素能力の大まかな指標。参考値としてご利用ください。',
    helpTestTerm: 'ETPテスト',
    helpTestDesc: '400mをレベルに応じた加速ペースで反復するフィールドテスト。結果からリミッタータイプとトレーニングゾーンが自動決定されます。',
    helpPhaseTerm: 'フェーズ（基礎期・強化期・試合期・テーパー）',
    helpPhaseDesc: 'トレーニング計画のフェーズ。基礎期で土台を構築、強化期で強度を上げ、試合期でレースに特化、テーパーでレース前に疲労を抜きます。',

    // トレーニング哲学
    philosophy: 'トレーニング哲学',
    philosophyIntro: 'MidLabのトレーニング設計の理論的背景',

    // データ管理
    dataManagement: 'データ管理',
    testResultCount: 'テスト結果: {{count}}件',
    deleteAllData: 'すべてのデータを削除',
    resetDataTitle: 'データをリセット',
    resetDataMessage: 'すべてのデータが削除されます。',

    // 法的情報
    legal: '法的情報',
    privacyPolicy: 'プライバシーポリシー',
    termsOfService: '利用規約',
  },

  // ============================================
  // アップグレード画面
  // ============================================
  upgrade: {
    premiumFeatures: [
      { icon: 'calendar', text: 'トレーニング計画' },
      { icon: 'barbell', text: 'ワークアウト' },
      { icon: 'analytics', text: 'レース予測' },
      { icon: 'trending-up', text: '進捗分析' },
    ],
    unlockAll: 'すべての機能をアンロック',
    planNotFound: '利用可能なプランが見つかりません',
    purchaseComplete: 'プレミアムへのアップグレードが完了しました！',
    purchaseFailed: '購入を完了できませんでした',
    purchaseError: '購入中にエラーが発生しました',
    restoreSuccess: '購入を復元しました',
    restoreNone: '復元できる購入が見つかりません',
    restoreError: '復元中にエラーが発生しました',
    autoRenewNotice: '無料トライアル終了後、{{price}} {{period}}で自動更新されます。\n{{store}}の設定からいつでもキャンセルできます。',
    yearly: '年額',
    monthly: '月額',
    yearlyPrice: '\u00a59,800/年',
    monthlyPrice: '\u00a5980/月',
  },

  // ============================================
  // 定数の翻訳
  // ============================================
  constants: {
    levels: {
      SS: { description: '1500m 3:30以内' },
      S: { description: '1500m 3:30-4:00' },
      A: { description: '1500m 4:00-4:30' },
      B: { description: '1500m 4:30-5:00' },
      C: { description: '1500m 5:00以上' },
    },

    zones: {
      jog: { name: 'リカバリー', label: 'リカバリー', description: '回復ペース' },
      easy: { name: 'イージー', label: 'イージー', description: 'VT1以下・有酸素ベース' },
      marathon: { name: 'マラソン', label: 'マラソン', description: 'マラソンペース' },
      threshold: { name: '閾値', label: '閾値', description: '乳酸閾値' },
      interval: { name: 'インターバル', label: 'インターバル', description: 'VO2max' },
      repetition: { name: 'レペティション', label: 'レペティション', description: 'スピード' },
    },

    ageCategories: {
      junior_high: { label: '中学生', desc: '12〜15歳' },
      high_school: { label: '高校生', desc: '15〜18歳' },
      collegiate: { label: '大学生', desc: '18〜22歳' },
      senior: { label: '一般', desc: '22〜39歳' },
      masters_40: { label: 'マスターズ40代', desc: '40〜49歳' },
      masters_50: { label: 'マスターズ50代', desc: '50〜59歳' },
      masters_60: { label: 'マスターズ60歳以上', desc: '60歳以上' },
    },

    gender: {
      male: '男性',
      female: '女性',
      other: '回答しない',
      femaleNote: '生理周期を考慮してテスト日を選択',
    },

    restDayFrequency: {
      weekly: { label: '毎週', desc: '毎週1回の完全休養（初心者推奨）' },
      biweekly: { label: '2週に1回', desc: '2週間に1回の完全休養' },
      monthly: { label: '月1〜2回', desc: '月に1〜2回の完全休養（上級者向け）' },
      auto: { label: '自動', desc: '競技歴と月間走行距離から自動決定' },
    },

    experience: {
      beginner: { label: '初心者', desc: '競技歴2年未満' },
      intermediate: { label: '中級者', desc: '競技歴2〜5年' },
      advanced: { label: '上級者', desc: '競技歴5年以上' },
      elite: { label: 'エリート', desc: '全国大会出場レベル' },
    },

    phases: {
      base: { name: '基礎期', label: '基礎' },
      build: { name: '強化期', label: '強化' },
      peak: { name: '試合期', label: '試合' },
      taper: { name: 'テーパー', label: 'テーパー' },
    },

    limiters: {
      cardio: { name: '心肺リミッター型', label: '心肺' },
      muscular: { name: '筋持久力リミッター型', label: '筋持久力' },
      balanced: { name: 'バランス型', label: 'バランス' },
    },

    focusCategories: {
      aerobic: {
        name: '有酸素ベース',
        description: '毛細血管発達・ミトコンドリア増加',
      },
      threshold: {
        name: '乳酸閾値',
        description: '乳酸処理能力の向上',
      },
      vo2max: {
        name: 'VO2max',
        description: '最大酸素摂取量の向上',
      },
      speed: {
        name: 'スピード・スプリント',
        description: 'スピード持久力・ランニングエコノミー',
      },
    },

    categories: {
      all: 'すべて',
      VO2max: 'VO2max',
      lactateThreshold: '乳酸閾値',
      speedSprint: 'スピード・スプリント',
      aerobicBase: '有酸素ベース',
      general: '総合',
      race: 'レース',
      original: 'オリジナル',
    },
  },

  // ============================================
  // 根拠テキスト
  // ============================================
  rationale: {
    limiter: {
      cardio: {
        summary: 'The cardiopulmonary system is the performance-limiting factor',
        detail: 'Based on the pattern of "breathing becoming difficult first" during the test, the cardiopulmonary system (VO2max, cardiac output) was identified as the bottleneck.',
        trainingFocus: 'VO2max intervals are prioritized to raise the ceiling of maximal oxygen uptake. Recovery is extended to maximize the quality of each rep.',
        scienceBasis: 'In cardiopulmonary-limited athletes, VT1 (first ventilatory threshold) sits at approximately 72% of VO2max, requiring high-intensity stimuli to drive cardiopulmonary adaptation (Seiler, 2010).',
      },
      muscular: {
        summary: 'Muscular endurance is the performance-limiting factor',
        detail: 'Based on the pattern of "legs becoming heavy first" during the test, muscular endurance (running economy, neuromuscular coordination) was identified as the bottleneck.',
        trainingFocus: 'Repetition and speed work are prioritized to improve neuromuscular coordination and running economy. Rep counts are increased to promote muscular adaptation.',
        scienceBasis: 'In muscular endurance-limited athletes, VT1 sits at approximately 78% of VO2max with cardiopulmonary reserves available, but muscular fatigue occurs first. Speed stimuli to improve muscular power and efficiency are effective.',
      },
      balanced: {
        summary: 'Cardiopulmonary and muscular endurance are evenly developed',
        detail: 'Both the cardiopulmonary system and muscular endurance are equally limiting factors. With no specific weakness, a comprehensive approach is effective.',
        trainingFocus: 'VO2max, threshold, and speed work are balanced to improve overall capacity.',
        scienceBasis: 'In balanced athletes, VT1 sits at approximately 75% of VO2max with even development across abilities. Based on Daniels\' training theory, multi-faceted stimuli drive progressive improvement.',
      },
    },

    phase: {
      base: {
        purpose: 'Building the aerobic foundation',
        why: 'All training builds upon an aerobic base. Capillary development and mitochondrial growth improve oxygen transport and utilization.',
        keyPrinciple: '"Build endurance before speed" \u2014 Solidifying the foundation in the base phase maximizes the effectiveness of high-intensity training in the build phase.',
      },
      build: {
        purpose: 'Improving VO2max and lactate threshold',
        why: 'Building on the aerobic base from the base phase, race-pace intensity stimuli are added to simultaneously improve cardiopulmonary function and lactate clearance.',
        keyPrinciple: '"Progressive overload" \u2014 Gradually increasing intensity avoids overtraining while steadily improving performance (principle of progressive overload).',
      },
      peak: {
        purpose: 'Final race-pace preparation',
        why: 'Training specific to the target race pace and distance creates the optimal state for peak performance on race day.',
        keyPrinciple: '"Specificity principle" \u2014 Training at race intensity and rhythm prepares both physiological and psychological readiness for race day.',
      },
      taper: {
        purpose: 'Recovery and performance peaking',
        why: 'Reducing training volume while maintaining intensity removes accumulated fatigue and triggers supercompensation.',
        keyPrinciple: '"The science of tapering" \u2014 Research shows that reducing volume by 40-60% while maintaining intensity produces 2-3% performance improvement (Mujika & Padilla, 2003).',
      },
    },

    focus: {
      aerobic: {
        whyImportant: 'The aerobic base is the foundation of all endurance performance. Improved capillary density enhances oxygen delivery to muscles.',
        limiterConnection: {
          cardio: 'For cardiopulmonary-limited athletes, expanding the aerobic base is foundational for VO2max improvement. Running longer at slower paces promotes cardiopulmonary adaptation even at low intensity.',
          muscular: 'The aerobic base is essential even for muscular endurance types. Marathon-pace segments in the latter portion also develop muscular endurance.',
          balanced: 'Standard aerobic training is effective for balanced types. Build the foundation with steady-paced running.',
        },
      },
      threshold: {
        whyImportant: 'Improving lactate threshold directly translates to maintaining faster paces for longer. Sustaining a "comfortably hard" pace improves lactate clearance.',
        limiterConnection: {
          cardio: 'Cardiopulmonary types take longer recovery and shorter sustain distances to ensure quality.',
          muscular: 'Muscular endurance types extend sustain distances to simultaneously build muscular fatigue resistance.',
          balanced: 'Standard threshold training is optimal for balanced types.',
        },
      },
      vo2max: {
        whyImportant: 'VO2max (maximal oxygen uptake) determines the ceiling of aerobic performance. Interval training provides maximal stimulus to the cardiopulmonary system.',
        limiterConnection: {
          cardio: 'Placed to improve your VO2max limitation. Fewer reps with longer recovery maximize quality per rep.',
          muscular: 'VO2max stimulus leverages cardiopulmonary reserves with more reps, also building muscular endurance.',
          balanced: 'Balanced VO2max stimulation to raise the aerobic ceiling.',
        },
      },
      speed: {
        whyImportant: 'Speed and sprint training improves running economy and top speed, enhancing the ability to respond to pace changes in races. For 800m/1500m, speed endurance is a major performance determinant.',
        limiterConnection: {
          cardio: 'Speed maintenance is important even for cardiopulmonary types. Rep count is kept moderate with sufficient recovery.',
          muscular: 'Prioritized to improve your muscular endurance limitation. Rep count is increased to maximize speed adaptation.',
          balanced: 'Balanced speed stimulation to improve running efficiency.',
        },
      },
    },

    phaseLimiter: {
      base: {
        cardio: 'Build the aerobic foundation with easy runs and threshold work. Promote capillary development and mitochondrial growth to solidify the cardiopulmonary base.',
        muscular: 'Build the aerobic foundation with easy runs while activating the neuromuscular system with strides and drills. Establish the basis for running economy.',
        balanced: 'Build a well-rounded aerobic foundation with easy runs and threshold work. Solidify the base from both cardiopulmonary and muscular endurance perspectives.',
      },
      build: {
        cardio: 'Prioritize VO2max intervals to raise the ceiling of maximal oxygen uptake. Take longer recovery to focus on quality per rep.',
        muscular: 'Prioritize repetition and speed work to improve neuromuscular coordination and running economy. Increase rep counts to promote muscular adaptation.',
        balanced: 'Balance VO2max intervals and speed work to simultaneously improve cardiopulmonary function and muscular endurance.',
      },
      peak: {
        cardio: 'Race-pace VO2max and threshold runs for final cardiopulmonary tuning. Race-specific stimuli for the finishing touch.',
        muscular: 'Race-pace repetitions and speed endurance for final neuromuscular tuning. Focus on establishing race rhythm.',
        balanced: 'Race-specific training for final tuning of both cardiopulmonary and muscular endurance. Sharpen race-pace awareness.',
      },
      taper: {
        cardio: 'Reduce volume while maintaining high-intensity stimuli to shed accumulated fatigue. Preserve cardiopulmonary sharpness while preparing for the race.',
        muscular: 'Reduce volume while maintaining speed stimuli to shed accumulated fatigue. Preserve neuromuscular sharpness while preparing for the race.',
        balanced: 'Reduce volume while maintaining intensity to shed accumulated fatigue. Preserve mental and physical sharpness while preparing for the race.',
      },
    },

    weeklyPlan: {
      rampTestWeek: 'ETP Test Week. Re-measure your current fitness and limiter type with the test, and reflect results in subsequent training.',
      recoveryWeek: 'Recovery Week. Reduce training load to promote recovery and prepare for the next high-load week. Planned rest is key to performance improvement.',
      subRaceHigh: 'You have "{{name}}" this week. Reduce training load and taper for the race.',
      subRaceMedium: 'You have "{{name}}" this week. Light taper while maintaining the training flow.',
      subRaceLow: 'You have "{{name}}" this week (practice race). Maintain normal training and use the race as practical experience.',
    },

    workoutFallback: 'This training is suited for your {{limiterName}} profile.',
  },

  // ============================================
  // トレーニング哲学
  // ============================================
  philosophy: [
    {
      title: 'MidLab\'s Core Philosophy',
      content: 'MidLab automatically designs training based on "ETP (Estimated Threshold Pace)" tailored to each individual\'s physiological characteristics. Built on Jack Daniels\' running theory, it identifies the limiter type (performance-limiting factor) and takes an approach that prioritizes improving weaknesses.',
      icon: 'flash',
    },
    {
      title: 'The Limiter Model',
      content: 'Endurance performance is limited by two factors: the cardiopulmonary system and muscular endurance. The ETP test determines whether "breathing limits first (cardiopulmonary)" or "legs limit first (muscular endurance)" to identify each athlete\'s weakness. Focusing training on weaknesses enables efficient performance improvement.',
      icon: 'analytics',
    },
    {
      title: 'Individualized Pace Setting',
      content: 'All training paces are calculated from ETP. A non-linear model sets slower low-intensity zones (Recovery/Easy) for less fit runners, reflecting individual VT1 (first ventilatory threshold) differences for appropriate training intensity (Seiler, 2010; Daniels VDOT theory).',
      icon: 'speedometer',
    },
    {
      title: 'Periodization',
      content: 'Training plans consist of 4 phases: Base \u2192 Build \u2192 Peak \u2192 Taper. Each phase progressively develops different physiological adaptations, designed to peak on race day. Recovery weeks are automatically adjusted based on age and experience to prevent overtraining.',
      icon: 'layers',
    },
    {
      title: 'Limiter-Based Load Distribution',
      content: 'Cardiopulmonary types receive more VO2max intervals; muscular endurance types receive more speed/repetition work. Even the same workout auto-adjusts rep counts and recovery times by limiter type, providing individually optimized training.',
      icon: 'options',
    },
    {
      title: 'Evidence-Based Approach',
      content: 'Every workout MidLab proposes has an exercise physiology rationale. By explaining "why this workout," "why this pace," and "why this sequence," we create an environment where athletes and coaches can train with conviction. Because "believing in what you do" makes the difference.',
      icon: 'school',
    },
  ],

  // ============================================
  // ワークアウトテンプレート翻訳
  // ============================================
  workouts: {
    'easy-6000': {
      name: 'Easy 6000m',
      description: 'A sustained easy-pace run to build fundamental aerobic capacity. Promotes fat burning and capillary development at a conversational pace. The displayed pace is an upper limit guide \u2014 running slower is fine.',
      selectionGuide: 'Ideal for runners with lower monthly mileage (~150km) or as a connector day after key workouts. Choose this when 8000m feels too long or would leave residual fatigue. The shorter distance makes it easier to focus on pace consistency.',
      limiterVariants: {
        cardio: { note: 'Keep pace 10s/km slower' },
        muscular: { note: 'OK to pick up last 2 laps to M pace' },
        balanced: { note: 'Run at standard pace' },
      },
    },
    'easy-8000': {
      name: 'Easy 8000m',
      description: 'A sustained easy-pace run to build aerobic capacity. The displayed pace is an upper limit guide \u2014 running slower is fine.',
      selectionGuide: 'Standard connector run for 150-250km/month runners. Longer stimulus time than 6000m promotes better aerobic adaptation. Choose this when 10000m would leave next-day fatigue. Also effective for practicing steady pacing.',
      limiterVariants: {
        cardio: { note: 'Keep pace 10s/km slower' },
        muscular: { note: 'OK to pick up last 4 laps to M pace' },
        balanced: { note: 'Run at standard pace' },
      },
    },
    'easy-10000': {
      name: 'Easy 10000m',
      description: 'A longer easy run. Effective for expanding aerobic capacity. Run with margin, as the displayed pace is an upper limit guide.',
      selectionGuide: 'For 250-350km/month runners. When 8000m feels too short but 12000m feels too demanding. Especially effective during the aerobic capacity expansion period (base to build phase). Focus on preventing pace drop in the final portion.',
      limiterVariants: {
        cardio: { note: 'Keep pace 10s/km slower' },
        muscular: { note: 'OK to pick up last 4 laps to M pace' },
        balanced: { note: 'Run at standard pace' },
      },
    },
    'easy-12000': {
      name: 'Easy 12000m',
      description: 'Easy run for high-volume runners. Effective for expanding the aerobic base.',
      selectionGuide: 'For 350-400km/month runners. About 20% longer than 10000m, further developing fat metabolism and mental endurance. However, after key workouts, 10000m or less is recommended. Aim for 1-2 sessions per week.',
      limiterVariants: {
        cardio: { note: 'Keep pace 10s/km slower' },
        muscular: { note: 'OK to pick up last 6 laps to M pace' },
        balanced: { note: 'Run at standard pace' },
      },
    },
    'easy-14000': {
      name: 'Easy 14000m',
      description: 'Extended easy run for high-volume runners. For athletes targeting 400+ km/month.',
      selectionGuide: 'For 400+ km/month runners. Extends 12000m by 2km to build a thicker aerobic base. Worth considering for middle-distance specialists also targeting 5000m+. Schedule on days away from key workouts.',
      limiterVariants: {
        cardio: { note: 'Keep pace 10s/km slower' },
        muscular: { note: 'OK to pick up last 6 laps to M pace' },
        balanced: { note: 'Run at standard pace' },
      },
    },
    'easy-16000': {
      name: 'Easy 16000m',
      description: 'Long easy run for elite runners. For athletes targeting 450+ km/month.',
      selectionGuide: 'For elite runners at 450+ km/month. When 14000m is insufficient. Extended easy-pace maintenance maximizes aerobic enzyme activity. However, this distance accumulates fatigue, so limit to once per week.',
      limiterVariants: {
        cardio: { note: 'Keep pace 10s/km slower' },
        muscular: { note: 'OK to pick up last 8 laps to M pace' },
        balanced: { note: 'Run at standard pace' },
      },
    },
    'recovery-4000': {
      name: 'Recovery 4000m',
      description: 'Recovery run for the day after key workouts. The displayed pace is an upper limit guide \u2014 running slower is fine. Prioritize recovery. Split runs (morning/evening) are also effective.',
      selectionGuide: 'Distinctly different from easy runs \u2014 active recovery is the goal. Run at recovery pace, slower than easy pace. For the day after key workouts or when fatigue is high. If unsure between easy and recovery, choose this when legs feel tight or heavy.',
      limiterVariants: {
        cardio: { note: 'Can shorten to 3200m. Pace is an upper limit' },
        muscular: { note: 'Run standard. Pace is an upper limit' },
        balanced: { note: 'Run standard. Pace is an upper limit' },
      },
    },
    'recovery-6000': {
      name: 'Recovery 6000m',
      description: 'Recovery run for 200+ km/month runners. The displayed pace is an upper limit guide \u2014 running slower is fine. Split runs (3000m x 2 morning/evening) are also recommended.',
      selectionGuide: '',
      limiterVariants: {
        cardio: { note: 'Can shorten to 4000m. Pace is an upper limit' },
        muscular: { note: 'Run standard. Pace is an upper limit' },
        balanced: { note: 'Run standard. Pace is an upper limit' },
      },
    },
    'recovery-8000': {
      name: 'Recovery 8000m',
      description: 'Recovery run for 300+ km/month runners. The displayed pace is an upper limit guide \u2014 running slower is fine. Split runs (4000m x 2 morning/evening) are also recommended.',
      selectionGuide: '',
      limiterVariants: {
        cardio: { note: 'Can shorten to 6000m. Pace is an upper limit' },
        muscular: { note: 'Run standard. Pace is an upper limit' },
        balanced: { note: 'Run standard. Pace is an upper limit' },
      },
    },
    'long-10000': {
      name: 'Long Run 10000m',
      description: 'Progressive long run. Gradually increase pace in the second half to build pace-holding ability under fatigue.',
      selectionGuide: 'Unlike easy runs, this includes M-pace segments in the second half. Develops race-half pace-holding ability. When 14000m long run is too demanding, or for ~250km/month runners. Focus on "shifting gears from a fatigued state" during M-pace segments.',
      limiterVariants: {
        cardio: { note: 'Shorten M-pace segment to 1600m' },
        muscular: { note: 'Can extend M-pace segment to 2400m' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'long-14000': {
      name: 'Long Run 14000m',
      description: 'Long run for high-volume runners. Builds aerobic base and mental toughness.',
      selectionGuide: '4km longer than 10000m long run with extended M-pace segment. For 300+ km/month runners. Transition to this when 10000m feels easy. The longer M-pace segment provides a more race-realistic simulation of the second half.',
      limiterVariants: {
        cardio: { note: 'Shorten M-pace segment to 2400m' },
        muscular: { note: 'Can extend M-pace segment to 4000m' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'long-18000': {
      name: 'Long Run 18000m',
      description: 'Long run for elite runners. Optimal for 400+ km/month athletes.',
      selectionGuide: 'Elite-level long run for 400+ km/month runners. When 14000m is insufficient. The 9-lap M-pace segment significantly builds both aerobic and mental fitness. Run on days when feeling fresh, with recovery the next day.',
      limiterVariants: {
        cardio: { note: 'Shorten M-pace segment to 2800m' },
        muscular: { note: 'Can extend M-pace segment to 4400m' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'tempo-4000': {
      name: 'Tempo Run 4000m',
      description: 'Sustained run at threshold pace. Improves lactate clearance and race-pace holding ability. Maintain a "comfortably hard" pace.',
      selectionGuide: 'Unlike cruise intervals (1200x4, 1600x3), this is a sustained run with no breaks. Develops concentration and lactate clearance for continuous threshold pace maintenance. Start here if 6000m tempo is too demanding, or if new to threshold runs. Key focus: "even pacing" \u2014 avoid going out too fast and maintain the same pace throughout.',
      limiterVariants: {
        cardio: { note: 'Shorten to 3200m (8 laps), pace +2s' },
        muscular: { note: 'Can extend to 4800m (12 laps)' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'cruise-1600x3': {
      name: 'Cruise 1600m x 3',
      description: 'Cruise intervals at threshold pace. Recovery between reps maintains high-quality threshold stimulus.',
      selectionGuide: 'Longer reps with fewer sets than 1200m x 4. Near-tempo stimulus with recovery breaks. Choose this when 1200m x 4 feels "too short to settle into pace," or for 3000m-5000m runners wanting longer sustained stimulus. Key focus: "start each rep calmly and don\'t fade in the second half."',
      limiterVariants: {
        cardio: { reps: 3, recoveryDistance: 600, note: 'Extend recovery to 600m' },
        muscular: { reps: 4, recoveryDistance: 400, note: 'Increase to 4 reps' },
        balanced: { reps: 3, recoveryDistance: 400, note: 'Run as prescribed' },
      },
    },
    'vo2max-1000x5': {
      name: '1000m x 5 Intervals',
      description: 'High-intensity repeats at interval pace. Stimulates VO2max to improve maximal oxygen uptake. Effective for cardiopulmonary limiter improvement.',
      selectionGuide: 'The classic VO2max interval. Longer reps than 800m x 6, requiring pace management. Less demanding than 1200m x 4, with well-balanced stimulus. Ideal standard workout for 1500m runners. Compared to 800m x 6, each rep spends more time at VO2max. Key focus: "run all reps at the same pace." Starting too fast leads to late-set collapse.',
      limiterVariants: {
        cardio: { reps: 4, recoveryDistance: 600, note: 'Reduce to 4 reps, 600m recovery' },
        muscular: { reps: 6, recoveryDistance: 400, note: 'Increase to 6 reps' },
        balanced: { reps: 5, recoveryDistance: 400, note: 'Run as prescribed' },
      },
    },
    'vo2max-800x6': {
      name: '800m x 6 Intervals',
      description: '800m intervals. Faster pace than 1000m for short-duration high-intensity stimulus. Builds speed endurance.',
      selectionGuide: 'Shorter reps with more sets than 1000m x 5. Reaches VO2max faster with a speed-biased stimulus. Recommended for 800m runners or those who can\'t maintain pace in 1000m intervals. Compared to 600m x 8, each rep sustains VO2max stimulus longer. Key focus: "don\'t fully recover between reps" \u2014 start the next rep with some breathing left.',
      limiterVariants: {
        cardio: { reps: 5, recoveryDistance: 600, note: 'Reduce to 5 reps, 600m recovery' },
        muscular: { reps: 7, recoveryDistance: 400, note: 'Increase to 7 reps' },
        balanced: { reps: 6, recoveryDistance: 400, note: 'Run as prescribed' },
      },
    },
    'reps-200x10': {
      name: '200m x 10 Repetitions',
      description: 'Short-distance repeats at repetition pace. Improves neuromuscular coordination and running economy. Effective for muscular endurance limiter speed development.',
      selectionGuide: 'The shortest distance in neuromuscular training. Focuses on pure speed and form improvement. Unlike 300m x 8 or 400m x 6, minimal lactate accumulation allows near-maximal quality on every rep. Choose this for improving absolute speed. Key focus: "reach top speed with relaxed form, no tension."',
      limiterVariants: {
        cardio: { reps: 8, recoveryDistance: 400, note: 'Reduce to 8 reps, 400m recovery' },
        muscular: { reps: 12, recoveryDistance: 200, note: 'Increase to 12 reps' },
        balanced: { reps: 10, recoveryDistance: 200, note: 'Run as prescribed' },
      },
    },
    'vo2max-1200x4': {
      name: '1200m x 4 Intervals',
      description: '1200m intervals. For highly fit runners. Provides more VO2max stimulus time than 1000m.',
      selectionGuide: 'The longest and most demanding VO2max interval. A step up when 1000m x 5 becomes manageable. Auto-recommended for runners with low (fast) ETP. Compared to 1000m x 5, each rep spends even longer in the VO2max zone and also builds lactate tolerance. Key focus: "push through the 800-1000m mark when it\'s toughest for those final 200m."',
      limiterVariants: {
        cardio: { reps: 3, recoveryDistance: 600, note: 'Reduce to 3 reps, 600m recovery' },
        muscular: { reps: 5, recoveryDistance: 400, note: 'Increase to 5 reps' },
        balanced: { reps: 4, recoveryDistance: 400, note: 'Run as prescribed' },
      },
    },
    'vo2max-600x8': {
      name: '600m x 8 Intervals',
      description: '600m short intervals. High-turnover VO2max stimulus. Builds speed endurance.',
      selectionGuide: 'The shortest and highest-rep VO2max interval. Faster pace than 800m x 6 with a speed-heavy stimulus. Also effective as race-pace training for 800m runners. Compared to 800m x 6, short recovery creates high-turnover repeated VO2max hits. Key focus: "use the 200m recovery to reset form and make a smooth start to the next rep."',
      limiterVariants: {
        cardio: { reps: 6, recoveryDistance: 400, note: 'Reduce to 6 reps, 400m recovery' },
        muscular: { reps: 10, recoveryDistance: 200, note: 'Increase to 10 reps' },
        balanced: { reps: 8, recoveryDistance: 200, note: 'Run as prescribed' },
      },
    },
    'tempo-6000': {
      name: 'Tempo Run 6000m',
      description: 'Extended threshold-pace sustained run. Simultaneously builds lactate clearance and mental toughness.',
      selectionGuide: 'Advanced version of 4000m tempo. Recommended when 4000m feels easy or for low (fast) ETP runners. 15 laps of sustained running is mentally tough but provides race-realistic training for 3000m-5000m second halves. Selection criteria vs. 4000m: "can you complete 4000m tempo at a steady threshold pace?"',
      limiterVariants: {
        cardio: { note: 'Shorten to 4800m (12 laps), pace +2s' },
        muscular: { note: 'Run standard, negative split OK' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'cruise-1200x4': {
      name: 'Cruise 1200m x 4',
      description: '1200m cruise intervals. High-quality threshold stimulus with short recovery.',
      selectionGuide: 'Shorter reps with more sets than 1600m x 3. Easier to focus on shorter reps, especially effective for 800m-1500m runners. Provides threshold-pace quality even for those who struggle with sustained tempo runs. Selection criteria vs. 1600m x 3: "can you sustain threshold pace for 1600m?" Start here if not yet. Key focus: "keep recovery short and don\'t drop pace on the next rep."',
      limiterVariants: {
        cardio: { reps: 3, recoveryDistance: 600, note: 'Reduce to 3 reps, 600m recovery' },
        muscular: { reps: 5, recoveryDistance: 400, note: 'Increase to 5 reps' },
        balanced: { reps: 4, recoveryDistance: 400, note: 'Run as prescribed' },
      },
    },
    'reps-300x8': {
      name: '300m x 8 Repetitions',
      description: '300m repetitions. Builds speed endurance over a longer distance than 200m.',
      selectionGuide: 'Between 200m x 10 and 400m x 6. When 200m is too short for speed endurance and 400m lactate is too severe. Especially effective for 800m-1500m runners\' finishing kick. Compared to 200m x 10, the final 100m requires maintaining form under lactate stress. Key focus: "maintain arm swing after 250m to prevent form breakdown."',
      limiterVariants: {
        cardio: { reps: 6, recoveryDistance: 400, note: 'Reduce to 6 reps, 400m recovery' },
        muscular: { reps: 10, recoveryDistance: 200, note: 'Increase to 10 reps' },
        balanced: { reps: 8, recoveryDistance: 300, note: 'Run as prescribed' },
      },
    },
    'reps-400x6': {
      name: '400m x 6 Repetitions',
      description: '400m repetitions. Builds one-lap speed endurance and form maintenance. Effective for middle-distance runners.',
      selectionGuide: 'The longest and most speed-endurance demanding neuromuscular workout. A step up when 200m and 300m reps feel comfortable. Auto-recommended for low (fast) ETP runners. Compared to 200m/300m, requires maintaining speed while processing lactate through the full lap. Key focus: "minimize deceleration after 300m."',
      limiterVariants: {
        cardio: { reps: 5, recoveryDistance: 600, note: 'Reduce to 5 reps, 600m recovery' },
        muscular: { reps: 8, recoveryDistance: 400, note: 'Increase to 8 reps' },
        balanced: { reps: 6, recoveryDistance: 400, note: 'Run as prescribed' },
      },
    },
    'pyramid': {
      name: 'Pyramid',
      description: 'Progressive distance pyramid: 400\u21921200\u2192400. Multi-pace stimulus with varying distances. Builds both speed and endurance simultaneously.',
      selectionGuide: 'Unlike single-distance intervals or reps, experience multiple distances and paces in one session. Effective for breaking monotony and building pace-change adaptability during races. A "best of both worlds" workout when unsure between intervals and reps. Key focus: "maintain zone-appropriate pace even as distance changes."',
      limiterVariants: {
        cardio: { note: 'Extend each recovery to 600m' },
        muscular: { note: 'Extend 1200m to 1600m' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'short-200x12': {
      name: '200m x 12 Short Intervals',
      description: 'High-turnover short intervals at VO2max to R pace. Builds speed endurance for 800m/1500m runners. Effective for race-pace adaptation.',
      selectionGuide: '',
      limiterVariants: {
        cardio: { reps: 10, recoveryDistance: 300, note: 'Reduce to 10 reps, 300m recovery' },
        muscular: { reps: 14, recoveryDistance: 200, note: 'Increase to 14 reps' },
        balanced: { reps: 12, recoveryDistance: 200, note: 'Run as prescribed' },
      },
    },
    'sprint-150x8': {
      name: '150m x 8 Sprints',
      description: 'Near-maximal speed short sprints. Improves running form and top speed. Effective for 800m runners\' finishing kick.',
      selectionGuide: '',
      limiterVariants: {
        cardio: { reps: 6, recoveryDistance: 400, note: 'Reduce to 6 reps, 400m recovery' },
        muscular: { reps: 10, recoveryDistance: 200, note: 'Increase to 10 reps' },
        balanced: { reps: 8, recoveryDistance: 250, note: 'Run as prescribed' },
      },
    },
    'speed-300x6': {
      name: '300m x 6 Speed Endurance',
      description: '300m at repetition pace. Builds mid-to-late race pace-holding ability. Optimal for 1500m runners\' speed endurance.',
      selectionGuide: '',
      limiterVariants: {
        cardio: { reps: 5, recoveryDistance: 500, note: 'Reduce to 5 reps, 500m recovery' },
        muscular: { reps: 8, recoveryDistance: 300, note: 'Increase to 8 reps' },
        balanced: { reps: 6, recoveryDistance: 300, note: 'Run as prescribed' },
      },
    },
    'windsprints': {
      name: 'Wind Sprints (Strides)',
      description: 'Easy run + strides. Adding 100m strides after an easy run provides speed stimulus while ensuring recovery. Maintains speed during base phase.',
      selectionGuide: '',
      limiterVariants: {
        cardio: { note: 'Reduce to 4 strides' },
        muscular: { note: 'Increase to 8 strides' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'speed-500x5': {
      name: '500m x 5 Speed Endurance',
      description: 'Event-specific training for 800m runners. Longer than 400m to build lactate tolerance, shorter than 600m to maintain rep quality. Develops first-half to mid-race pace feel for 800m.',
      selectionGuide: 'A key workout for 800m runners. When 400m x 6 is too short for second-half lactate tolerance and 600m x 4 causes pace drops. Run at 95-100% of race pace, focusing on maintaining form through the final 100m.',
      limiterVariants: {
        cardio: { reps: 4, recoveryDistance: 500, note: 'Reduce to 4 reps, 500m recovery' },
        muscular: { reps: 6, recoveryDistance: 300, note: 'Increase to 6 reps, 300m recovery' },
        balanced: { reps: 5, recoveryDistance: 400, note: 'Run as prescribed' },
      },
    },
    'speed-600x4': {
      name: '600m x 4 Race Model',
      description: 'Race-pace runs at 3/4 of 800m distance. Builds pace-holding ability and mental toughness during the tough mid-race phase. Effective as race simulation for 800m runners.',
      selectionGuide: 'At 75% of 800m race distance, enables high-quality practice at near-race pace. Provides a more race-realistic feel than 500m x 5, making it ideal for pre-competition simulation. Focus on picking up pace in the final 200m.',
      limiterVariants: {
        cardio: { reps: 3, recoveryDistance: 800, note: 'Reduce to 3 reps, 800m recovery' },
        muscular: { reps: 5, recoveryDistance: 400, note: 'Increase to 5 reps, 400m recovery' },
        balanced: { reps: 4, recoveryDistance: 600, note: 'Run as prescribed' },
      },
    },
    'set-200-400-200': {
      name: '(200+400+200)m x 3 Set Intervals',
      description: 'Variable-pace set intervals. 200m-400m-200m per set to build adaptability for pace changes during 800m races. Especially effective for 400-800m type runners.',
      selectionGuide: 'Develops pace-switching ability not available from single-distance repeats. Simulates an 800m race pattern: start dash (200m) \u2192 mid-race sustain (400m) \u2192 finishing kick (200m). Take sufficient rest between sets to maintain quality.',
      limiterVariants: {
        cardio: { reps: 2, recoveryDistance: 400, note: 'Reduce to 2 sets, 400m between sets' },
        muscular: { reps: 4, recoveryDistance: 200, note: 'Increase to 4 sets' },
        balanced: { reps: 3, recoveryDistance: 400, note: 'Run as prescribed' },
      },
    },
    'speed-350x6': {
      name: '350m x 6 Speed Endurance',
      description: 'Short intervals for 400-800m type runners. Maintaining repetition pace or faster at a slightly shorter distance than 400m. Focused on sprint endurance development.',
      selectionGuide: 'Positioned between 300m x 8 and 400m x 6. When 300m doesn\'t accumulate enough lactate and 400m causes pace drops. Trains both 400m-style sprint endurance and 800m-style lactate tolerance. Key focus: "maintain form through the final 50m."',
      limiterVariants: {
        cardio: { reps: 5, recoveryDistance: 500, note: 'Reduce to 5 reps, 500m recovery' },
        muscular: { reps: 8, recoveryDistance: 250, note: 'Increase to 8 reps, 250m recovery' },
        balanced: { reps: 6, recoveryDistance: 350, note: 'Run as prescribed' },
      },
    },
    'sprint-150x10': {
      name: '150m x 10 Wind Sprints',
      description: '10 near-maximal speed short sprints. Focused on neuromuscular activation and top speed development. Effective for 800m runners\' top speed and finishing kick.',
      selectionGuide: 'More reps than 150m x 8. Recommended for 800m runners wanting to raise absolute top speed. Relaxed, tension-free form is critical. If times drop after the second rep, extend recovery.',
      limiterVariants: {
        cardio: { reps: 8, recoveryDistance: 350, note: 'Reduce to 8 reps, 350m recovery' },
        muscular: { reps: 12, recoveryDistance: 200, note: 'Increase to 12 reps, 200m recovery' },
        balanced: { reps: 10, recoveryDistance: 250, note: 'Run as prescribed' },
      },
    },
    'race-800': {
      name: '800m Race',
      description: '800m race. Race-day workout including W-up and C-down. Recorded at repetition intensity.',
      selectionGuide: 'Default structure: W-up 2000m \u2192 Race 800m \u2192 C-down 2000m. W-up and C-down distances can be adjusted via custom workouts.',
      limiterVariants: {
        cardio: { note: 'Run as prescribed' },
        muscular: { note: 'Run as prescribed' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'race-1500': {
      name: '1500m Race',
      description: '1500m race. Race-day workout including W-up and C-down. Recorded at repetition intensity.',
      selectionGuide: 'Default structure: W-up 2000m \u2192 Race 1500m \u2192 C-down 2000m. W-up and C-down distances can be adjusted via custom workouts.',
      limiterVariants: {
        cardio: { note: 'Run as prescribed' },
        muscular: { note: 'Run as prescribed' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'race-3000': {
      name: '3000m Race',
      description: '3000m race. Race-day workout including W-up and C-down. Recorded at VO2max (interval) intensity.',
      selectionGuide: 'Default structure: W-up 2000m \u2192 Race 3000m \u2192 C-down 1600m.',
      limiterVariants: {
        cardio: { note: 'Run as prescribed' },
        muscular: { note: 'Run as prescribed' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'race-5000': {
      name: '5000m Race',
      description: '5000m race. Race-day workout including W-up and C-down. Recorded at VO2max (interval) intensity.',
      selectionGuide: 'Default structure: W-up 1600m \u2192 Race 5000m \u2192 C-down 1600m.',
      limiterVariants: {
        cardio: { note: 'Run as prescribed' },
        muscular: { note: 'Run as prescribed' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'race-10000': {
      name: '10000m Race',
      description: '10000m race. Race-day workout including W-up and C-down. Recorded at threshold intensity (10000m race pace is near threshold).',
      selectionGuide: 'Default structure: W-up 1600m \u2192 Race 10000m \u2192 C-down 1600m.',
      limiterVariants: {
        cardio: { note: 'Run as prescribed' },
        muscular: { note: 'Run as prescribed' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'race-half': {
      name: 'Half Marathon',
      description: 'Half marathon (21.0975km). Race-day workout including W-up and C-down. Recorded at threshold intensity (half marathon pace is near threshold).',
      selectionGuide: 'Default structure: W-up 1600m \u2192 Race 21097m \u2192 C-down 1600m.',
      limiterVariants: {
        cardio: { note: 'Run as prescribed' },
        muscular: { note: 'Run as prescribed' },
        balanced: { note: 'Run as prescribed' },
      },
    },
    'race-full': {
      name: 'Marathon',
      description: 'Full marathon (42.195km). Race-day workout including W-up and C-down. Recorded at marathon intensity.',
      selectionGuide: 'Default structure: W-up 1600m \u2192 Race 42195m \u2192 C-down 1600m.',
      limiterVariants: {
        cardio: { note: 'Run as prescribed' },
        muscular: { note: 'Run as prescribed' },
        balanced: { note: 'Run as prescribed' },
      },
    },
  },

  // ============================================
  // ユーティリティ文字列
  // ============================================
  utils: {
    lapFormat: '{{laps}} laps',
    lapFormatDecimal: '{{laps}} laps',
    etpReason: 'Recommended based on ETP {{etp}}s',
    etpReasonWithAdj: ' (adjusted {{adj}} for attributes)',
    difficultyDown: 'easier',
    difficultyUp: 'harder',
    ageReason: 'Age: {{label}}',
    expReason: 'Experience: {{label}}',
    noTestYet: 'No test taken yet',
    daysSinceTestRecommend: '{{days}} days since last test \u2014 retest recommended',
    daysSinceTest: '{{days}} days since last test',
    speedType: 'Speed type (middle-distance leaning)',
    balancedType: 'Balanced type',
    enduranceType: 'Endurance type (distance leaning)',
    limiterTraining: 'This training is suited for your {{name}} profile.',
    rampTestWeek: 'ETP Test Week. Re-measure your current fitness and limiter type with the test, and reflect results in subsequent training.',
    recoveryWeek: 'Recovery Week. Reduce training load to promote recovery and prepare for the next high-load week. Planned rest is key to performance improvement.',
    phaseRationale: 'This is the {{purpose}} phase. {{focus}}',
    subRaceHigh: 'You have "{{name}}" this week. Reduce training load and taper for the race.',
    subRaceMedium: 'You have "{{name}}" this week. Light taper while maintaining the training flow.',
    subRaceLow: 'You have "{{name}}" this week (practice race). Maintain normal training and use the race as practical experience.',
  },
};

export default ja;
