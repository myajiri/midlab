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
        summary: '心肺系がパフォーマンスの制限要因',
        detail: 'テスト中に「息が先にきつくなる」パターンから、心肺系（VO2max・心拍出量）がボトルネックと判定されました。',
        trainingFocus: 'VO2maxインターバルを重点的に配置し、最大酸素摂取量の天井を引き上げます。回復を長めに取り、1本1本の質を重視します。',
        scienceBasis: '心肺リミッター型では、VT1（第1換気閾値）がVO2maxの約72%と低い位置にあるため、高強度刺激で心肺適応を促進する必要があります（Seiler, 2010）。',
      },
      muscular: {
        summary: '筋持久力がパフォーマンスの制限要因',
        detail: 'テスト中に「脚が先にきつくなる」パターンから、筋持久力（ランニングエコノミー・神経筋協調性）がボトルネックと判定されました。',
        trainingFocus: 'レペティション・スピード系を重点的に配置し、神経筋協調性とランニングエコノミーを改善します。本数を多めに設定し、筋適応を促します。',
        scienceBasis: '筋持久力リミッター型では、VT1がVO2maxの約78%と高い位置にあり心肺余裕がある一方、筋疲労が先行します。スピード刺激で筋パワー・効率を高めることが効果的です。',
      },
      balanced: {
        summary: '心肺系と筋持久力がバランスよく発達',
        detail: '心肺系と筋持久力の両方が均等に制限要因となっています。特定の弱点がない分、総合的なアプローチが有効です。',
        trainingFocus: 'VO2max・閾値・スピードをバランスよく配置し、全体的な能力底上げを図ります。',
        scienceBasis: 'バランス型ではVT1がVO2maxの約75%に位置し、各能力が均等に発達しています。Danielsのトレーニング理論に基づき、多面的な刺激で段階的に向上させます。',
      },
    },

    phase: {
      base: {
        purpose: '有酸素能力の土台構築',
        why: 'どんなトレーニングも有酸素基盤の上に成り立ちます。毛細血管の発達とミトコンドリアの増加により、酸素運搬・利用能力を高めます。',
        keyPrinciple: '「速く走る前に、長く走れる体を作る」— 基礎期で土台を固めることで、次の強化期の高強度トレーニングの効果を最大化します。',
      },
      build: {
        purpose: 'VO2max・乳酸閾値の向上',
        why: '基礎期で築いた有酸素基盤の上に、レースペースに近い強度の刺激を加えます。心肺機能と乳酸処理能力を同時に引き上げます。',
        keyPrinciple: '「段階的な負荷増大」— 漸進的に強度を上げることで、過負荷を避けながら着実にパフォーマンスを向上させます（漸進的過負荷の原則）。',
      },
      peak: {
        purpose: 'レースペースへの最終調整',
        why: '目標レースのペースと距離に特化したトレーニングで、レース当日に最高のパフォーマンスを発揮できる状態を作ります。',
        keyPrinciple: '「特異性の原則」— レースと同じ強度・リズムで練習することで、本番に必要な生理学的・心理的な準備を整えます。',
      },
      taper: {
        purpose: '疲労回復とパフォーマンスのピーキング',
        why: 'トレーニング量を減らしつつ強度は維持することで、蓄積された疲労を取り除き、体の超回復を引き出します。',
        keyPrinciple: '「テーパリングの科学」— 研究によりボリュームを40-60%減少させつつ強度を維持するテーパーが、2-3%のパフォーマンス向上をもたらすことが示されています（Mujika & Padilla, 2003）。',
      },
    },

    focus: {
      aerobic: {
        whyImportant: '有酸素ベースはすべての持久系パフォーマンスの土台です。毛細血管密度の向上により、筋肉への酸素供給が改善されます。',
        limiterConnection: {
          cardio: '心肺リミッター型にとって、有酸素ベースの拡大はVO2max向上の基盤となります。ペースを落として長く走ることで、低強度でも心肺適応を促します。',
          muscular: '筋持久力型でも有酸素ベースは不可欠です。後半のMペース区間で筋持久力も同時に養成します。',
          balanced: 'バランス型にはスタンダードな有酸素トレーニングが有効です。安定したペースで基盤を構築します。',
        },
      },
      threshold: {
        whyImportant: '乳酸閾値の向上は、より速いペースをより長く維持する能力に直結します。「快適にきつい」ペースの継続が乳酸処理能力を高めます。',
        limiterConnection: {
          cardio: '心肺リミッター型は回復を長めに、持続距離を短めにして質を確保します。',
          muscular: '筋持久力型は持続距離を長めにして、筋疲労耐性も同時に養います。',
          balanced: 'バランス型には標準的な閾値トレーニングが最適です。',
        },
      },
      vo2max: {
        whyImportant: 'VO2max（最大酸素摂取量）は有酸素パフォーマンスの天井を決定します。インターバルトレーニングで心肺系に最大刺激を与えます。',
        limiterConnection: {
          cardio: 'あなたのVO2maxリミッターを改善するために配置されています。本数を減らし回復を長めにすることで、1本あたりの質を最大化します。',
          muscular: 'VO2max刺激は心肺余裕を活かして本数を増やし、筋力面でも持久力を養成します。',
          balanced: 'バランスよくVO2maxを刺激し、有酸素能力の天井を引き上げます。',
        },
      },
      speed: {
        whyImportant: 'スピード・スプリント系のトレーニングはランニングエコノミーとトップスピードを改善し、レースのペース変動への対応力を高めます。特に800m/1500mではスピード持久力が成績を大きく左右します。',
        limiterConnection: {
          cardio: '心肺リミッター型でもスピード維持は重要です。本数を控えめにし回復を十分取ります。',
          muscular: 'あなたの筋持久力リミッターを改善するために重点配置されています。本数を多めにしてスピード適応を最大化します。',
          balanced: 'バランスよくスピード刺激を与え、走効率の向上を図ります。',
        },
      },
    },

    phaseLimiter: {
      base: {
        cardio: 'イージー走と閾値走で有酸素基盤を構築。毛細血管の発達とミトコンドリアの増加を促し、心肺系の土台を固めます。',
        muscular: 'イージー走で有酸素基盤を構築しつつ、流しやドリルで神経筋系を活性化。ランニングエコノミーの基礎を作ります。',
        balanced: 'イージー走と閾値走でバランスの良い有酸素基盤を構築。心肺系と筋持久力の両面から土台を固めます。',
      },
      build: {
        cardio: 'VO2maxインターバルを重点配置し、最大酸素摂取量の天井を引き上げます。回復を長めに取り、1本あたりの質を重視。',
        muscular: 'レペティション・スピード系を重点配置し、神経筋協調性とランニングエコノミーを改善。本数を多めに設定し、筋適応を促進。',
        balanced: 'VO2maxインターバルとスピード系をバランスよく配置。心肺機能と筋持久力を同時に向上させます。',
      },
      peak: {
        cardio: 'レースペースのVO2max走と閾値走で心肺系の最終調整。レース特異的な刺激で仕上げます。',
        muscular: 'レースペースのレペティションとスピード持久力で神経筋系の最終調整。レースリズムの確立に注力。',
        balanced: 'レース特異的なトレーニングで心肺系と筋持久力の両面を最終調整。レースペースの感覚を研ぎ澄まします。',
      },
      taper: {
        cardio: '量を減らしつつ高強度刺激を維持し、蓄積疲労を除去。心肺系のシャープさを保ちながらレースに備えます。',
        muscular: '量を減らしつつスピード刺激を維持し、蓄積疲労を除去。神経筋系のシャープさを保ちながらレースに備えます。',
        balanced: '量を減らしつつ強度を維持し、蓄積疲労を除去。心身のシャープさを保ちながらレースに備えます。',
      },
    },

    weeklyPlan: {
      rampTestWeek: 'ETPテスト週。テストで現在のフィットネスとリミッタータイプを再測定し、以降のトレーニングに反映します。',
      recoveryWeek: '回復週。トレーニング負荷を軽減し、回復を促進して次の高負荷週に備えます。計画的な休息がパフォーマンス向上の鍵です。',
      subRaceHigh: '今週「{{name}}」があります。トレーニング負荷を軽減し、レースに向けてテーパーします。',
      subRaceMedium: '今週「{{name}}」があります。トレーニングの流れを維持しながら軽めのテーパーを行います。',
      subRaceLow: '今週「{{name}}」があります（練習レース）。通常のトレーニングを維持し、レースを実戦経験として活用します。',
    },

    workoutFallback: 'このトレーニングはあなたの{{limiterName}}プロファイルに適しています。',
  },

  // ============================================
  // トレーニング哲学
  // ============================================
  philosophy: [
    {
      title: 'MidLabの基本理念',
      content: 'MidLabは「ETP（推定閾値ペース）」を軸に、個人の生理学的特性に応じたトレーニングを自動設計します。Jack Danielsのランニング理論をベースに、リミッタータイプ（パフォーマンスの制限要因）を特定し、弱点を重点的に改善するアプローチを採用しています。',
      icon: 'flash',
    },
    {
      title: 'リミッターモデル',
      content: '持久力パフォーマンスは「心肺系」と「筋持久力」の2つの要素で制限されます。ETPテストで「息が先にきつくなる（心肺型）」か「脚が先にきつくなる（筋持久力型）」かを判定し、各選手の弱点を特定します。弱点を重点的にトレーニングすることで、効率的なパフォーマンス向上を実現します。',
      icon: 'analytics',
    },
    {
      title: '個別ペース設定',
      content: 'すべてのトレーニングペースはETPから算出されます。走力が低い選手ほど低強度ゾーン（ジョグ・イージー）をよりゆっくり設定する非線形モデルを採用。VT1（第1換気閾値）の個人差を反映し、適切な強度でトレーニングできます（Seiler, 2010; Daniels VDOT理論）。',
      icon: 'speedometer',
    },
    {
      title: '期分け（ピリオダイゼーション）',
      content: 'トレーニング計画は基礎期→強化期→試合期→テーパーの4フェーズで構成されます。各フェーズで異なる生理学的適応を段階的に獲得し、レース当日にピークを持ってくる設計です。回復週は年齢・競技歴に応じて自動調整され、オーバートレーニングを防止します。',
      icon: 'layers',
    },
    {
      title: 'リミッター別の負荷配分',
      content: '心肺リミッター型にはVO2maxインターバルを多めに、筋持久力リミッター型にはスピード・レペティション系を多めに配分します。同じワークアウトでもリミッタータイプに応じて本数・回復時間が自動調整され、個人に最適化されたトレーニングを提供します。',
      icon: 'options',
    },
    {
      title: '根拠に基づくアプローチ',
      content: 'MidLabが提案するすべてのメニューには、運動生理学的な根拠があります。「なぜこのメニューか」「なぜこのペースか」「なぜこの順番か」を明示することで、選手・コーチが納得してトレーニングに取り組める環境を提供します。「信じてやれるか」が結果を左右するからです。',
      icon: 'school',
    },
  ],

  // ============================================
  // ワークアウトテンプレート翻訳
  // ============================================
  workouts: {
    'easy-6000': {
      name: 'イージー6000m',
      description: '基礎的な有酸素能力を構築するイージーペースでの持続走。会話ができるペースで脂肪燃焼と毛細血管発達を促進。ペースは上限目安で、余裕があればさらにゆっくり走ってもOK。',
      selectionGuide: '月間走行距離が少なめ（〜150km）の選手や、ポイント練習翌日のつなぎに最適。8000mでは長すぎる・疲労が残りそうな場合はこちらを選択。短い分、ペースの安定感に意識を向けやすい。',
      limiterVariants: {
        cardio: { note: 'ペースを10秒/km遅めに維持' },
        muscular: { note: '後半2周をMペースに上げてOK' },
        balanced: { note: '標準ペースで実施' },
      },
    },
    'easy-8000': {
      name: 'イージー8000m',
      description: '有酸素能力を構築するイージーペースでの持続走。ペースは上限目安で、余裕があればさらにゆっくり走ってもOK。',
      selectionGuide: '月間150〜250kmの選手の標準的なつなぎ練習。6000mより刺激時間が長く有酸素適応が進みやすい。10000mだと疲労が翌日に残る場合はこちら。一定ペースを保つ練習としても有効。',
      limiterVariants: {
        cardio: { note: 'ペースを10秒/km遅めに維持' },
        muscular: { note: '後半4周をMペースに上げてOK' },
        balanced: { note: '標準ペースで実施' },
      },
    },
    'easy-10000': {
      name: 'イージー10000m',
      description: '長めのイージー走。有酸素キャパシティの拡大に効果的。ペースは上限目安で、余裕を持って走る。',
      selectionGuide: '月間250〜350kmの選手に。8000mでは物足りないが12000mだと負担が大きい場合に最適。有酸素キャパシティの拡大期（基礎期〜強化期）に特に効果的。後半のペース落ちを防ぐ意識を。',
      limiterVariants: {
        cardio: { note: 'ペースを10秒/km遅めに維持' },
        muscular: { note: '後半4周をMペースに上げてOK' },
        balanced: { note: '標準ペースで実施' },
      },
    },
    'easy-12000': {
      name: 'イージー12000m',
      description: '高ボリューム走者向けのイージー走。有酸素ベースの拡大に効果的。',
      selectionGuide: '月間350〜400kmの選手向け。10000mと比べて約20%長い分、脂肪代謝能力と精神的持久力がより鍛えられる。ただしポイント練習翌日は10000m以下を推奨。週に1〜2回の実施が目安。',
      limiterVariants: {
        cardio: { note: 'ペースを10秒/km遅めに維持' },
        muscular: { note: '後半6周をMペースに上げてOK' },
        balanced: { note: '標準ペースで実施' },
      },
    },
    'easy-14000': {
      name: 'イージー14000m',
      description: '高ボリューム走者向けの長めイージー走。月間400km以上を目指す選手に。',
      selectionGuide: '月間400km以上の選手向け。12000mからさらに2km伸ばし、有酸素基盤を厚くする。中距離専門でも5000m以上のレースを見据える場合は検討価値あり。ポイント練習から離れた日に配置。',
      limiterVariants: {
        cardio: { note: 'ペースを10秒/km遅めに維持' },
        muscular: { note: '後半6周をMペースに上げてOK' },
        balanced: { note: '標準ペースで実施' },
      },
    },
    'easy-16000': {
      name: 'イージー16000m',
      description: 'エリート向けの長距離イージー走。月間450km以上を目指す選手に。',
      selectionGuide: '月間450km以上のエリート選手向け。14000mでは距離が不足する場合に。長時間のイージーペース維持が有酸素酵素活性を最大限に高める。ただしこの距離のイージーは疲労も蓄積するため週1回を目安に。',
      limiterVariants: {
        cardio: { note: 'ペースを10秒/km遅めに維持' },
        muscular: { note: '後半8周をMペースに上げてOK' },
        balanced: { note: '標準ペースで実施' },
      },
    },
    'recovery-4000': {
      name: 'リカバリー4000m',
      description: 'キーワークアウト翌日の回復走。表示ペースは上限目安で、これより遅くてOK。体の回復を最優先に。分割走（朝夕2回）にしても効果的。',
      selectionGuide: 'イージー走とは明確に異なり、積極的回復が目的。イージーペースよりさらに遅いリカバリーペースで走る。ポイント練習翌日や疲労感が強い日に。イージー走を選ぶか迷ったら、脚に張りや重さがあればこちらを。',
      limiterVariants: {
        cardio: { note: '3200mに短縮可。ペースは上限目安' },
        muscular: { note: '標準で実施。ペースは上限目安' },
        balanced: { note: '標準で実施。ペースは上限目安' },
      },
    },
    'recovery-6000': {
      name: 'リカバリー6000m',
      description: '月間走行距離200km以上の選手向けリカバリー走。表示ペースは上限目安で、これより遅くてOK。分割走（朝夕2回に分けて3000m×2）も推奨。',
      selectionGuide: '',
      limiterVariants: {
        cardio: { note: '4000mに短縮可。ペースは上限目安' },
        muscular: { note: '標準で実施。ペースは上限目安' },
        balanced: { note: '標準で実施。ペースは上限目安' },
      },
    },
    'recovery-8000': {
      name: 'リカバリー8000m',
      description: '月間走行距離300km以上の選手向けリカバリー走。表示ペースは上限目安で、これより遅くてOK。分割走（朝夕2回に分けて4000m×2）も推奨。',
      selectionGuide: '',
      limiterVariants: {
        cardio: { note: '6000mに短縮可。ペースは上限目安' },
        muscular: { note: '標準で実施。ペースは上限目安' },
        balanced: { note: '標準で実施。ペースは上限目安' },
      },
    },
    'long-10000': {
      name: 'ロングラン10000m',
      description: 'プログレッシブ・ロングラン。後半にかけてペースを上げ、疲労状態でのペース維持能力を養成。',
      selectionGuide: 'イージー走との違いは後半にMペース区間があること。レース後半のペース維持能力を養う。14000mロングランだと負荷が高すぎる場合や、月間走行距離が〜250kmの場合に。後半のMペース区間で「疲れた状態からの切り替え」を意識。',
      limiterVariants: {
        cardio: { note: 'Mペース区間を1600mに短縮' },
        muscular: { note: 'Mペース区間を2400mに延長可' },
        balanced: { note: '標準で実施' },
      },
    },
    'long-14000': {
      name: 'ロングラン14000m',
      description: '高ボリューム走者向けのロングラン。有酸素ベース拡大と精神的タフネスを養成。',
      selectionGuide: '10000mロングランより4km長く、Mペース区間も延長。月間300km以上の選手向け。10000mロングランでは物足りなくなった段階で移行。後半のMペース区間が長い分、レース後半のシミュレーションとしてより実戦的。',
      limiterVariants: {
        cardio: { note: 'Mペース区間を2400mに短縮' },
        muscular: { note: 'Mペース区間を4000mに延長可' },
        balanced: { note: '標準で実施' },
      },
    },
    'long-18000': {
      name: 'ロングラン18000m',
      description: 'エリート向けのロングラン。月間400km以上の選手に最適。',
      selectionGuide: '月間400km以上のエリート選手向けロングラン。14000mでは刺激が不足する場合に。Mペース区間が9周と長く、有酸素系と精神面の両方を大きく鍛える。体調万全の日に実施し、翌日はリカバリーを。',
      limiterVariants: {
        cardio: { note: 'Mペース区間を2800mに短縮' },
        muscular: { note: 'Mペース区間を4400mに延長可' },
        balanced: { note: '標準で実施' },
      },
    },
    'tempo-4000': {
      name: 'テンポ走4000m',
      description: '閾値ペースでの持続走。乳酸処理能力を向上させ、レースペースの維持能力を高める。「快適にきつい」ペースを維持。',
      selectionGuide: 'クルーズインターバル（1200×4, 1600×3）との違いは「休憩なしの持続走」であること。閾値ペースを途切れなく維持する集中力と乳酸処理能力を養う。6000mテンポ走がまだきつい段階や、閾値走に慣れていない場合はこちらから。意識すべきポイントは「ペースの均一性」。前半突っ込まず最後まで同じペースを保つこと。',
      limiterVariants: {
        cardio: { note: '3200m(8周)に短縮、ペース+2秒' },
        muscular: { note: '4800m(12周)に延長可' },
        balanced: { note: '標準で実施' },
      },
    },
    'cruise-1600x3': {
      name: 'クルーズ1600m×3',
      description: '閾値ペースでのクルーズインターバル。回復を挟むことで質の高い閾値刺激を維持。',
      selectionGuide: '1200m×4と比べて1本の距離が長く本数が少ない。テンポ走（持続走）に近い刺激を、回復を挟みながら得られる。1200m×4では「短すぎてペースが安定しない」場合や、3000m〜5000m選手でより長い持続刺激が欲しい場合に選択。意識すべきポイントは「各本の入りを落ち着いて入り、後半もペースを落とさない」こと。',
      limiterVariants: {
        cardio: { reps: 3, recoveryDistance: 600, note: '回復600mに延長' },
        muscular: { reps: 4, recoveryDistance: 400, note: '4本に増量' },
        balanced: { reps: 3, recoveryDistance: 400, note: '標準で実施' },
      },
    },
    'vo2max-1000x5': {
      name: '1000m×5インターバル',
      description: 'インターバルペースでの高強度反復。VO2maxを刺激し最大酸素摂取量を向上。心肺リミッター型の改善に効果的。',
      selectionGuide: 'VO2maxインターバルの定番メニュー。800m×6より1本が長くペース配分が求められる。1200m×4ほどきつくなく、バランスの良い刺激が得られる。1500m選手の標準メニューとして最適。800m×6との違いは、1本あたりのVO2max滞在時間が長い点。意識すべきポイントは「全本を同じペースで走ること」。最初の1本が速すぎると後半で崩れやすい。',
      limiterVariants: {
        cardio: { reps: 4, recoveryDistance: 600, note: '4本に減、回復600m' },
        muscular: { reps: 6, recoveryDistance: 400, note: '6本に増量' },
        balanced: { reps: 5, recoveryDistance: 400, note: '標準で実施' },
      },
    },
    'vo2max-800x6': {
      name: '800m×6インターバル',
      description: '800mインターバル。1000mより速いペースで短時間の高強度刺激。スピード持久力の養成に。',
      selectionGuide: '1000m×5と比べて1本が短く本数が多い。VO2maxへの到達が早く、スピード寄りの刺激になる。800m選手や、1000mインターバルだとペースが安定しない段階の選手に推奨。600m×8との違いは、1本の持続時間が長い分VO2max刺激がしっかり入ること。意識すべきポイントは「回復中に完全に呼吸を整えきらない」こと。やや息が残った状態で次の本に入る。',
      limiterVariants: {
        cardio: { reps: 5, recoveryDistance: 600, note: '5本に減、回復600m' },
        muscular: { reps: 7, recoveryDistance: 400, note: '7本に増量' },
        balanced: { reps: 6, recoveryDistance: 400, note: '標準で実施' },
      },
    },
    'reps-200x10': {
      name: '200m×10レペティション',
      description: 'レペティションペースでの短距離反復。神経筋協調性とランニングエコノミーを改善。筋持久力リミッター型のスピード強化に効果的。',
      selectionGuide: '神経筋系メニューの中で最も短い距離。ピュアなスピードとフォーム改善に特化。300m×8や400m×6と比べて乳酸の蓄積が少なく、1本1本をフレッシュな状態で全力に近い質で走れる。スピードの絶対値を上げたい場合はこちら。意識すべきポイントは「力まずにリラックスしたフォームでトップスピードに乗る」こと。',
      limiterVariants: {
        cardio: { reps: 8, recoveryDistance: 400, note: '8本に減、回復400m' },
        muscular: { reps: 12, recoveryDistance: 200, note: '12本に増量' },
        balanced: { reps: 10, recoveryDistance: 200, note: '標準で実施' },
      },
    },
    'vo2max-1200x4': {
      name: '1200m×4インターバル',
      description: '1200mインターバル。走力の高い選手向け。1000mよりVO2max刺激時間を確保できる。',
      selectionGuide: 'VO2maxインターバルの中で最も1本が長く負荷が高い。1000m×5で余裕が出てきた選手のステップアップに。eTPが低い（速い）選手に自動推奨される。1000m×5との違いは、1本あたりのVO2max帯の滞在時間がさらに長く、乳酸耐性も同時に鍛えられる点。意識すべきポイントは「800〜1000m通過で最もきつくなるが、そこからの200mを粘る」こと。',
      limiterVariants: {
        cardio: { reps: 3, recoveryDistance: 600, note: '3本に減、回復600m' },
        muscular: { reps: 5, recoveryDistance: 400, note: '5本に増量' },
        balanced: { reps: 4, recoveryDistance: 400, note: '標準で実施' },
      },
    },
    'vo2max-600x8': {
      name: '600m×8インターバル',
      description: '600mショートインターバル。高回転でVO2max刺激。スピード持久力の養成に。',
      selectionGuide: 'VO2maxインターバルの中で最も短く本数が多い。800m×6より速いペースで走れるため、スピード要素が強い。800m選手のレースペース練習としても有効。800m×6との違いは、回復が短く高回転でVO2maxに繰り返し到達するショートインターバル的な性質。意識すべきポイントは「回復200mの間にフォームを整え、次の本のスタートダッシュをスムーズにすること」。',
      limiterVariants: {
        cardio: { reps: 6, recoveryDistance: 400, note: '6本に減、回復400m' },
        muscular: { reps: 10, recoveryDistance: 200, note: '10本に増量' },
        balanced: { reps: 8, recoveryDistance: 200, note: '標準で実施' },
      },
    },
    'tempo-6000': {
      name: 'テンポ走6000m',
      description: '長めの閾値ペース持続走。乳酸処理能力と精神的タフネスを同時に養成。',
      selectionGuide: '4000mテンポ走の上位版。4000mでは余裕が出てきた選手や、eTPが低い（速い）選手に推奨。15周の持続走は精神的にもタフだが、3000m〜5000mレースの後半を想定した実戦的トレーニング。4000mとの選択基準は「4000mテンポ走を閾値ペースで安定して走りきれるか」。',
      limiterVariants: {
        cardio: { note: '4800m(12周)に短縮、ペース+2秒' },
        muscular: { note: '標準で実施、後半ペースアップ可' },
        balanced: { note: '標準で実施' },
      },
    },
    'cruise-1200x4': {
      name: 'クルーズ1200m×4',
      description: '1200mクルーズインターバル。テンポ走より短い回復で質の高い閾値刺激。',
      selectionGuide: '1600m×3と比べて1本が短く本数が多い。短い本数で集中しやすく、800m〜1500m選手に特に有効。テンポ走のような長時間の持続が苦手でも、分割することで閾値ペースの質を確保できる。1600m×3との選択基準は「1600mを閾値ペースで安定して走りきれるか」。まだ難しければこちらから。意識すべきポイントは「回復を短く保ち、次の本もペースを落とさない」こと。',
      limiterVariants: {
        cardio: { reps: 3, recoveryDistance: 600, note: '3本に減、回復600m' },
        muscular: { reps: 5, recoveryDistance: 400, note: '5本に増量' },
        balanced: { reps: 4, recoveryDistance: 400, note: '標準で実施' },
      },
    },
    'reps-300x8': {
      name: '300m×8レペティション',
      description: '300mレペティション。200mより長い距離でスピード持久力を養成。',
      selectionGuide: '200m×10と400m×6の中間。200mでは短すぎてスピード持久力が鍛えにくく、400mでは乳酸がきつすぎる場合に最適。800m〜1500m選手のラストスパート強化に特に有効。200m×10との違いは、後半100mで乳酸を感じながらフォームを維持する練習になること。意識すべきポイントは「250m通過以降でフォームが崩れないよう腕振りを意識する」こと。',
      limiterVariants: {
        cardio: { reps: 6, recoveryDistance: 400, note: '6本に減、回復400m' },
        muscular: { reps: 10, recoveryDistance: 200, note: '10本に増量' },
        balanced: { reps: 8, recoveryDistance: 300, note: '標準で実施' },
      },
    },
    'reps-400x6': {
      name: '400m×6レペティション',
      description: '400mレペティション。1周のスピード持久力とフォーム維持を養成。中距離選手に効果的。',
      selectionGuide: '神経筋系メニューの中で最も距離が長く、スピード持久力への負荷が最大。200mや300mのレペティションで余裕が出てきた段階のステップアップに。eTPが低い（速い）選手に自動推奨される。200m・300mとの違いは、1周全体を通じて乳酸を処理しながらスピードを維持する能力が求められる点。意識すべきポイントは「300m通過以降の減速を最小限に抑える」こと。',
      limiterVariants: {
        cardio: { reps: 5, recoveryDistance: 600, note: '5本に減、回復600m' },
        muscular: { reps: 8, recoveryDistance: 400, note: '8本に増量' },
        balanced: { reps: 6, recoveryDistance: 400, note: '標準で実施' },
      },
    },
    'pyramid': {
      name: 'ピラミッド',
      description: '段階的に距離を上げ下げするピラミッド。400→800→1200→800→400で多様なペース刺激。スピードと持久力を同時養成。',
      selectionGuide: '単一距離のインターバルやレペティションとは異なり、異なる距離・ペースを1セッションで経験できる。マンネリ防止やレース中のペース変化への対応力を養うのに有効。インターバルとレペティションどちらを選ぶか迷った場合の「いいとこ取り」メニュー。意識すべきポイントは「距離が変わってもゾーンに合ったペースを守ること」。',
      limiterVariants: {
        cardio: { note: '各回復を600mに延長' },
        muscular: { note: '1200mを1600mに延長' },
        balanced: { note: '標準で実施' },
      },
    },
    'short-200x12': {
      name: '200m×12ショートインターバル',
      description: 'VO2max〜Rペースでの高回転ショートインターバル。800m/1500m選手のスピード持久力を養成。レースペースへの適応に効果的。',
      selectionGuide: '',
      limiterVariants: {
        cardio: { reps: 10, recoveryDistance: 300, note: '10本に減、回復300m' },
        muscular: { reps: 14, recoveryDistance: 200, note: '14本に増量' },
        balanced: { reps: 12, recoveryDistance: 200, note: '標準で実施' },
      },
    },
    'sprint-150x8': {
      name: '150m×8スプリント',
      description: '最大スピードに近い短距離スプリント。ランニングフォームの改善とトップスピードの向上に。800m選手のラストスパート強化に効果的。',
      selectionGuide: '',
      limiterVariants: {
        cardio: { reps: 6, recoveryDistance: 400, note: '6本に減、回復400m' },
        muscular: { reps: 10, recoveryDistance: 200, note: '10本に増量' },
        balanced: { reps: 8, recoveryDistance: 250, note: '標準で実施' },
      },
    },
    'speed-300x6': {
      name: '300m×6スピード持久力',
      description: '300mをレペティションペースで。レースの中盤〜終盤のペース維持能力を養成。1500m選手のスピード持久力強化に最適。',
      selectionGuide: '',
      limiterVariants: {
        cardio: { reps: 5, recoveryDistance: 500, note: '5本に減、回復500m' },
        muscular: { reps: 8, recoveryDistance: 300, note: '8本に増量' },
        balanced: { reps: 6, recoveryDistance: 300, note: '標準で実施' },
      },
    },
    'windsprints': {
      name: 'ウインドスプリント（流し）',
      description: 'イージー走＋流し。イージー走の後に100m流しを入れることで、スピード刺激を加えつつ回復を確保。基礎期のスピード維持に。',
      selectionGuide: '',
      limiterVariants: {
        cardio: { note: '流し4本に減' },
        muscular: { note: '流し8本に増量' },
        balanced: { note: '標準で実施' },
      },
    },
    'speed-500x5': {
      name: '500m×5スピード持久力',
      description: '800m選手の特異的トレーニング。400mより長く乳酸耐性を鍛え、600mより短く1本あたりの質を維持できる。800mレースの前半〜中盤のペース感覚を養成。',
      selectionGuide: '800m選手のメインメニューの一つ。400m×6では短すぎてレース後半の乳酸耐性が鍛えにくく、600m×4ではペースが落ちやすい場合に最適。レースペースの95-100%で走り、残り100mでフォームが崩れないよう意識する。',
      limiterVariants: {
        cardio: { reps: 4, recoveryDistance: 500, note: '4本に減、回復500m' },
        muscular: { reps: 6, recoveryDistance: 300, note: '6本に増、回復300m' },
        balanced: { reps: 5, recoveryDistance: 400, note: '標準で実施' },
      },
    },
    'speed-600x4': {
      name: '600m×4レースモデル',
      description: '800mの3/4距離でのレースペース走。レース中盤の苦しい場面でのペース維持能力とメンタル強化に。800m選手のレースシミュレーションとして効果的。',
      selectionGuide: '800mレースの75%距離で実施するため、レースペースに近い強度で質の高い練習ができる。500m×5よりもレースに近い距離感で走れるため、試合前のシミュレーション練習に最適。最後の200mでのペースアップを意識する。',
      limiterVariants: {
        cardio: { reps: 3, recoveryDistance: 800, note: '3本に減、回復800m' },
        muscular: { reps: 5, recoveryDistance: 400, note: '5本に増、回復400m' },
        balanced: { reps: 4, recoveryDistance: 600, note: '標準で実施' },
      },
    },
    'set-200-400-200': {
      name: '(200+400+200)m×3セットインターバル',
      description: '変化走形式のセットインターバル。200m-400m-200mを1セットとし、800mのレースで起きるペース変化に対応する力を養成。400-800タイプの選手に特に効果的。',
      selectionGuide: '単一距離の反復では得られない、ペースの切り替え能力を鍛えるメニュー。スタートダッシュ(200m)→中盤の維持(400m)→ラストスパート(200m)という800mレースの展開をシミュレーション。各セット間は十分な回復を取り、質を維持する。',
      limiterVariants: {
        cardio: { reps: 2, recoveryDistance: 400, note: '2セットに減、セット間回復400m' },
        muscular: { reps: 4, recoveryDistance: 200, note: '4セットに増' },
        balanced: { reps: 3, recoveryDistance: 400, note: '標準で実施' },
      },
    },
    'speed-350x6': {
      name: '350m×6スピード持久力',
      description: '400-800タイプ向けのショートインターバル。400mより少し短い距離でレペティションペース以上の強度を維持。スプリント持久力の向上に特化。',
      selectionGuide: '300m×8と400m×6の間に位置するメニュー。300mでは少し短くて乳酸が十分溜まらず、400mではペースが落ちる選手に最適。400m的なスプリント持久力と800m的な乳酸耐性の両方を鍛えられる。意識すべきは「最後の50mまでフォームを崩さない」こと。',
      limiterVariants: {
        cardio: { reps: 5, recoveryDistance: 500, note: '5本に減、回復500m' },
        muscular: { reps: 8, recoveryDistance: 250, note: '8本に増、回復250m' },
        balanced: { reps: 6, recoveryDistance: 350, note: '標準で実施' },
      },
    },
    'sprint-150x10': {
      name: '150m×10ウインドスプリント',
      description: '最大スピードに近い短距離スプリントを10本。神経筋系の活性化と最大スピードの向上に特化。800m選手のトップスピード向上とラストスパート強化に効果的。',
      selectionGuide: '150m×8より本数を増やしたバージョン。トップスピードの絶対値を引き上げたい800m選手に推奨。力まずリラックスしたフォームで走ることが重要。2本目以降タイムが落ちるようなら回復を延長する。',
      limiterVariants: {
        cardio: { reps: 8, recoveryDistance: 350, note: '8本に減、回復350m' },
        muscular: { reps: 12, recoveryDistance: 200, note: '12本に増、回復200m' },
        balanced: { reps: 10, recoveryDistance: 250, note: '標準で実施' },
      },
    },
    'race-800': {
      name: '800mレース',
      description: '800mレース。W-up・C-downを含むレース日のメニュー。レペティション強度で記録。',
      selectionGuide: 'W-up 2000m → レース 800m → C-down 2000m のデフォルト構成。W-upやC-downの距離はカスタムメニューで調整可能。',
      limiterVariants: {
        cardio: { note: '標準で実施' },
        muscular: { note: '標準で実施' },
        balanced: { note: '標準で実施' },
      },
    },
    'race-1500': {
      name: '1500mレース',
      description: '1500mレース。W-up・C-downを含むレース日のメニュー。レペティション強度で記録。',
      selectionGuide: 'W-up 2000m → レース 1500m → C-down 2000m のデフォルト構成。W-upやC-downの距離はカスタムメニューで調整可能。',
      limiterVariants: {
        cardio: { note: '標準で実施' },
        muscular: { note: '標準で実施' },
        balanced: { note: '標準で実施' },
      },
    },
    'race-3000': {
      name: '3000mレース',
      description: '3000mレース。W-up・C-downを含むレース日のメニュー。VO2max（インターバル）強度で記録。',
      selectionGuide: 'W-up 2000m → レース 3000m → C-down 1600m のデフォルト構成。',
      limiterVariants: {
        cardio: { note: '標準で実施' },
        muscular: { note: '標準で実施' },
        balanced: { note: '標準で実施' },
      },
    },
    'race-5000': {
      name: '5000mレース',
      description: '5000mレース。W-up・C-downを含むレース日のメニュー。VO2max（インターバル）強度で記録。',
      selectionGuide: 'W-up 1600m → レース 5000m → C-down 1600m のデフォルト構成。',
      limiterVariants: {
        cardio: { note: '標準で実施' },
        muscular: { note: '標準で実施' },
        balanced: { note: '標準で実施' },
      },
    },
    'race-10000': {
      name: '10000mレース',
      description: '10000mレース。W-up・C-downを含むレース日のメニュー。閾値強度で記録（10000mのレースペースは閾値付近）。',
      selectionGuide: 'W-up 1600m → レース 10000m → C-down 1600m のデフォルト構成。',
      limiterVariants: {
        cardio: { note: '標準で実施' },
        muscular: { note: '標準で実施' },
        balanced: { note: '標準で実施' },
      },
    },
    'race-half': {
      name: 'ハーフマラソン',
      description: 'ハーフマラソン（21.0975km）。W-up・C-downを含むレース日のメニュー。閾値強度で記録（ハーフのレースペースは閾値付近）。',
      selectionGuide: 'W-up 1600m → レース 21097m → C-down 1600m のデフォルト構成。',
      limiterVariants: {
        cardio: { note: '標準で実施' },
        muscular: { note: '標準で実施' },
        balanced: { note: '標準で実施' },
      },
    },
    'race-full': {
      name: 'フルマラソン',
      description: 'フルマラソン（42.195km）。W-up・C-downを含むレース日のメニュー。マラソン強度で記録。',
      selectionGuide: 'W-up 1600m → レース 42195m → C-down 1600m のデフォルト構成。',
      limiterVariants: {
        cardio: { note: '標準で実施' },
        muscular: { note: '標準で実施' },
        balanced: { note: '標準で実施' },
      },
    },
  },

  // ============================================
  // ユーティリティ文字列
  // ============================================
  utils: {
    lapFormat: '{{laps}}周',
    lapFormatDecimal: '{{laps}}周',
    etpReason: 'ETP {{etp}}秒に基づく推奨',
    etpReasonWithAdj: '（属性により{{adj}}調整）',
    difficultyDown: '易しめ',
    difficultyUp: '難しめ',
    ageReason: '年齢: {{label}}',
    expReason: '競技歴: {{label}}',
    noTestYet: 'まだテストを実施していません',
    daysSinceTestRecommend: '前回のテストから{{days}}日経過 — 再測定をお勧めします',
    daysSinceTest: '前回のテストから{{days}}日経過',
    speedType: 'スピード型（中距離寄り）',
    balancedType: 'バランス型',
    enduranceType: '持久型（長距離寄り）',
    limiterTraining: 'このトレーニングはあなたの{{name}}プロファイルに適しています。',
    rampTestWeek: 'ETPテスト週。テストで現在のフィットネスとリミッタータイプを再測定し、以降のトレーニングに反映します。',
    recoveryWeek: '回復週。トレーニング負荷を軽減し、回復を促進して次の高負荷週に備えます。計画的な休息がパフォーマンス向上の鍵です。',
    phaseRationale: '{{purpose}}フェーズです。{{focus}}',
    subRaceHigh: '今週「{{name}}」があります。トレーニング負荷を軽減し、レースに向けてテーパーします。',
    subRaceMedium: '今週「{{name}}」があります。トレーニングの流れを維持しながら軽めのテーパーを行います。',
    subRaceLow: '今週「{{name}}」があります（練習レース）。通常のトレーニングを維持し、レースを実戦経験として活用します。',
  },
};

export default ja;
