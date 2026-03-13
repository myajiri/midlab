// ============================================
// English Translation - MidLab
// ============================================

const en = {
  // ============================================
  // タブ
  // ============================================
  tabs: {
    home: 'Home',
    test: 'Test',
    plan: 'Plan',
    workout: 'Workout',
    settings: 'Settings',
  },

  // ============================================
  // 共通
  // ============================================
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    done: 'Done',
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    close: 'Close',
    confirm: 'Confirm',
    error: 'Error',
    reset: 'Reset',
    update: 'Update',
    create: 'Create',
    edit: 'Edit',
    ok: 'OK',
    add: 'Add',
    notSet: 'Not set',
    example: 'e.g.',
    seconds: 's',
    secondsPer400m: 's/400m',
    perKm: '/km',
    meters: 'm',
    km: 'km',
    laps: 'laps',
    all: 'All',
    today: 'Today',
    dayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    dayNamesShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    dayNamesFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    estimated: 'Estimated',
    measured: 'Measured',
    default: 'Default',
    recommended: 'Recommended',
    halfMarathon: 'Half Marathon',
    fullMarathon: 'Marathon',
    custom: 'Custom',
    customDistance: 'Custom distance',
  },

  // ============================================
  // ホーム画面
  // ============================================
  home: {
    // ウェルカム画面
    welcomeTitle: 'Welcome to MidLab',
    welcomeSubtitle: 'Find your optimal training with the ETP Test',
    step1Title: 'Set up your profile',
    step1Desc: 'Register basic info and personal bests',
    step2Title: 'Take the ETP Test',
    step2Desc: 'Measure your endurance type',
    step3Title: 'Start training',
    step3Desc: 'Train at your optimal paces',
    setupProfile: 'Set Up Profile',
    setupHint: 'Takes about 1 minute',

    // ダッシュボード
    dashboard: 'Dashboard',
    estimated: 'Estimated',
    measured: 'Measured',
    default: 'Default',
    etpSeconds: '{{seconds}}s',
    etpSourceEstimated: 'Estimated',
    etpSourceMeasured: 'Measured',
    etpSourceDefault: 'Default',
    etpValue: '{{etp}}s',

    // リミッター
    limiterCardio: 'Cardiopulmonary Limiter',
    limiterMuscular: 'Muscular Endurance Limiter',
    limiterBalanced: 'Balanced',

    // メトリクス
    level: 'Level',
    estimatedVO2max: 'Est. VO2max',
    lastTest: 'Last test: {{date}}',

    // 次のステップ
    nextSteps: 'Next Steps',
    runEtpTest: 'Take ETP Test',
    runEtpTestDesc: 'Measure your exact ETP and limiter type',
    recommended: 'Recommended',
    createPlan: 'Create Training Plan',
    createPlanDesc: 'Auto-generate a weekly plan for your target race',

    // 計画カード
    targetRace: 'Target Race',
    halfMarathon: 'Half Marathon',
    marathon: 'Marathon',
    todayWorkout: "Today's Workout",
    tapForDetails: 'Tap for details \u2192',

    // 週間進捗
    weekProgress: 'This Week',
    ofWorkouts: 'of {{total}} workouts',
    weekProgressSubtitle: 'of {{total}} workouts',

    // レース予測
    racePredictions: 'Race Predictions & PB',
    pbLabel: 'PB: {{time}}',

    // ゾーン
    trainingZones: 'Training Zones',
    etpBadge: 'ETP: {{pace}} ({{seconds}}s/400m)',
    pacePerLap: '{{seconds}}s/400m',
  },

  // ============================================
  // オンボーディング
  // ============================================
  onboarding: {
    // ウェルカム
    appName: 'MidLab',
    tagline: 'Training app for\nmiddle-distance runners',
    featureEtp: 'ETP Test',
    featureEtpDesc: 'Scientifically determine your endurance type',
    featureZones: 'Zone Calculation',
    featureZonesDesc: 'Automatically calculate optimal paces',
    featurePersonalize: 'Personalize',
    featurePersonalizeDesc: 'Training tailored to you',
    feature1Title: 'ETP Test',
    feature1Desc: 'Scientifically determine your endurance type',
    feature2Title: 'Zone Calculation',
    feature2Desc: 'Automatically calculate optimal paces',
    feature3Title: 'Personalize',
    feature3Desc: 'Training tailored to you',
    getStarted: 'Get Started',
    start: 'Get Started',
    skip: 'Skip',

    // セットアップ
    setupTitle: 'Quick Setup',
    setupSubtitle: 'Just two quick questions',
    quickSetup: 'Quick Setup',
    twoQuestions: 'Just two quick questions',
    ageLabel: 'Age',
    experienceLabel: 'Running Experience',
    pbLabel: 'Personal Bests (optional)',
    estimatedEtp: 'Estimated ETP: {{pace}} ({{seconds}}s/400m)',
    pbEstimatedEtp: 'Estimated ETP: {{kmPace}} ({{etp}}s/400m)',
    monthlyMileageLabel: 'Monthly Mileage Cap (optional)',
    mileagePlaceholder: 'e.g. 200',
    mileageHint: 'Enter the maximum monthly distance (km) you can run during your training period. Workouts will be generated to stay within this limit. Base phase will be near the cap, then gradually adjusted.',
    monthlyMileagePlaceholder: 'e.g. 200',
    monthlyMileageHint: 'Enter the maximum monthly distance (km) you can run during your training period. Workouts will be generated to stay within this limit. Base phase will be near the cap, then gradually adjusted.',
    complete: 'Done',
    bestTime: 'Best Time',

    // PBタイトル
    pbTitle: {
      m200: '200m Best Time',
      m400: '400m Best Time',
      m800: '800m Best Time',
      m1500: '1500m Best Time',
      m3000: '3000m Best Time',
      m5000: '5000m Best Time',
    },

    // 結果
    resultReady: 'All Set!',
    resultEstimated: 'ETP estimated from PBs',
    resultNeedTest: 'Take the ETP Test to measure your ETP',
    estimatedEtpLabel: 'Estimated ETP',
    etpSecPer400m: '{{seconds}}s/400m',
    nextStepsTitle: 'Next Steps',
    nextStepTest: 'Take the ETP Test on the Test tab',
    nextStepHome: 'Check your zones on Home',
    nextStepTrain: 'Start training',
    startApp: 'Start App',
    goBack: 'Back',
  },

  // ============================================
  // テスト画面
  // ============================================
  test: {
    // メイン
    title: 'ETP Test',
    subtitle: 'Measure your ETP and calculate training zones',
    pageTitle: 'ETP Test',
    pageSubtitle: 'Measure your ETP and calculate training zones',

    // PB推定
    pbEstimateTitle: 'Estimate ETP from PBs',
    pbEstimateDesc: 'You can estimate your ETP from personal bests without taking the test',

    // スタートカード
    runTest: 'Take the Test',
    runTestHint: 'Perform on a 400m track',
    startTest: 'Take the Test',
    startTestHint: 'Perform on a 400m track',
    levelSelect: 'Select Level',
    startPace: 'Starting Pace',
    maxLaps: 'Max Laps',
    lapsCount: '{{count}} laps',
    maxLapsValue: '{{laps}} laps',
    acceleration: 'Acceleration',
    perLapDecrement: '-{{seconds}}s per lap',
    accelerationValue: '-{{increment}}s per lap',
    inputResults: 'Enter Test Results',
    enterResults: 'Enter Test Results',
    secondsSuffix: 's',
    secPer400m: 's/400m',

    // 進行表
    scheduleTitle: 'Level {{level}} Schedule',
    lap: 'Lap',
    pacePerKm: 'Pace/km',
    tableHeaderLap: 'Lap',
    tableHeaderPaceKm: 'Pace/km',
    tableHeaderPace400: '400m',

    // 履歴
    pastResults: 'Past Results',

    // ガイド
    guideTitle: 'How the Test Works',
    guideStep1: 'Select a level and check the starting pace',
    guideStep2: 'Maintain the target pace for each lap on a 400m track',
    guideStep3: 'Stop when more than 2s behind target, then enter results',

    // 位置づけ説明
    disclaimerTitle: 'About the ETP Test',
    disclaimerText1: 'The ETP Test is adapted from the cycling ramp test for running. Its value lies not in absolute accuracy, but in tracking changes over time by repeating the same protocol.',
    disclaimerText2: 'Perform the test regularly (recommended every 4 weeks) to monitor training effects.',

    // 入力画面
    inputTitle: 'Enter Results',
    executedLevel: 'Test Level',
    completedLaps: 'Laps Completed',
    inputLevel: 'Test Level',
    inputLaps: 'Laps Completed',
    lastPace: 'Last Pace: {{pace}} ({{seconds}}s/400m)',
    whyStopped: 'Why did you stop?',
    reasonBreath: 'Breathing',
    reasonLegs: 'Legs',
    reasonBoth: 'Both',
    breathHard: 'Breathing',
    legsHeavy: 'Legs',
    both: 'Both',
    recoveryTime: 'Time to catch breath',
    recoveryUnder30: 'Under 30s',
    recovery30to60: '30-60s',
    recoveryOver60: 'Over 60s',
    breathRecovery: 'Time to catch breath',
    breathRecoveryUnder30: 'Under 30s',
    breathRecovery3060: '30-60s',
    breathRecoveryOver60: 'Over 60s',
    calculateResult: 'Calculate Results',
    calculateResults: 'Calculate Results',

    // 結果画面
    resultTitle: 'Test Results',
    testComplete: 'Test Complete',
    yourEtp: 'Your ETP',
    trainingZones: 'Training Zones',
    racePredictions: 'Race Predictions',
    etpSuffix: 's',
  },

  // ============================================
  // 計画画面
  // ============================================
  plan: {
    // 作成画面
    pageTitle: 'Training Plan',
    pageSubtitle: 'Set your most important race (target race) within 6 months.\nIntermediate races can be added after plan creation.',
    createTitle: 'Training Plan',
    createSubtitle: 'Set your most important race (target race) within 6 months.\nIntermediate races can be added after plan creation.',
    raceName: 'Race Name',
    raceNamePlaceholder: 'e.g. Regional Championships',
    raceDate: 'Race Date',
    selectDate: 'Select date',
    raceDistance: 'Race Distance',
    event: 'Race Distance',
    customDistancePlaceholder: 'Enter distance in meters (e.g. 1000)',
    trainingDays: 'Training Days',
    restDay: 'Rest Day',
    restDayFrequency: 'Rest Day Frequency',
    keyWorkoutDays: 'Key Workout Days',
    monthlyMileage: 'Monthly Mileage Cap (km)',
    monthlyMileageLabel: 'Monthly Mileage Cap (km)',
    mileagePlaceholder: 'e.g. 200',
    mileageHint: 'Workout volume will be automatically adjusted',
    monthlyMileagePlaceholder: 'e.g. 200',
    monthlyMileageHint: 'Workout volume will be automatically adjusted',
    createPlan: 'Create Plan',
    generate: 'Create Plan',
    selectRaceDate: 'Select Race Date',
    featureName: 'Training Plan',
    premiumFeatureName: 'Training Plan',

    // 曜日
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',

    // バリデーション
    errorPastDate: 'Date is in the past',
    errorMinDate: 'Select a date at least 4 weeks from now',
    errorMaxDate: 'Set a race within 6 months. For races further out, create a plan when the time is closer.',
    errorFillAll: 'Please fill in all fields',
    errorCustomDistance: 'Please enter a custom distance',

    // 概要画面
    noPlan: 'No Plan Yet',
    noPlanSubtitle: 'Set a target race and\ncreate a training plan',
    emptyTitle: 'No Plan Yet',
    emptySubtitle: 'Set a target race and\ncreate a training plan',
    noData: 'No data',
    deletePlan: 'Delete Plan',
    deletePlanConfirm: 'Are you sure you want to delete this plan?',
    newPlan: 'Create New Plan',
    newPlanDesc: 'Create a new plan by overwriting the current one. Training logs and test results will be preserved.',
    newPlanConfirm: 'Create a new plan by overwriting the current one. Training logs and test results will be preserved.',
    newPlanAction: 'Create',
    create: 'Create',

    // メニュー更新
    updateMenu: 'Update Menu',
    updateMenuDesc: 'Regenerate the plan with the latest menus. Completion marks will be preserved.',
    updateAction: 'Update',
    update: 'Update',
    menuUpdated: 'Menu Updated',
    menuUpdatedDesc: 'Updated workout menus are available',
    later: 'Later',

    // 週間表示
    weekLabel: 'Week {{number}}',
    weekNumber: 'Week {{week}}',
    weeklySchedule: 'Weekly Schedule',
    weekProgress: 'Week {{current}} / {{total}}',
    weekPhase: 'Week {{week}} {{phase}}',
    weekDayLabel: 'Week {{week}} {{day}}',
    weekGoal: "This Week's Focus",
    keyBadge: 'Key',
    restLabel: 'Rest',
    etpTestLabel: 'ETP Test',
    easyPreRace: 'Easy (pre-race)',
    recoveryPreRace: 'Recovery (pre-race)',
    mPacePreRace: 'M-pace stimulus 8-10km + WS (pre-race)',
    raceLabel: 'Race',
    thisWeek: 'This Week',
    today: 'Today',
    phaseLabel: '{{phase}}',
    recoveryWeek: 'Recovery Week',
    testWeek: 'ETP Test Week',
    trainingPhase: 'Training Phase',
    daysUntilRace: '{{days}} days to go',

    // 体感
    feeling: {
      great: 'Great',
      good: 'Good',
      normal: 'Normal',
      tough: 'Tough',
      bad: 'Off',
    },
    feelingGreat: 'Great',
    feelingGood: 'Good',
    feelingNormal: 'Normal',
    feelingTough: 'Tough',
    feelingBad: 'Off',

    // レース距離ラベル
    customDistance: 'Custom Distance',
    halfMarathon: 'Half Marathon',
    marathon: 'Marathon',
    distanceHalf: 'Half',
    distanceMarathon: 'Marathon',
    distanceCustom: 'Custom',

    // 分析期間
    periodAll: 'All Time',
    period30d: '30 Days',
    period7d: '7 Days',

    // トレーニングログ
    trainingLog: 'Training Log',
    trainingRecord: 'Training Record',
    recordCount: '{{count}} records',
    logCount: '{{count}} records',
    logCompleted: 'Completed',
    logSkipped: 'Skipped',
    logPlanned: 'Planned',
    todayPlanned: "Today's Plan",
    addMenu: 'Add Workout',
    skip: 'Skip',
    skipConfirm: 'Skip this workout?',
    recordsUntilRace: 'Records until race',
    allRecords: 'All records',
    noRecords: 'No records',
    noRecordsHint: 'Start recording your training',
    deleteRecord: 'Delete Record',
    deleteRecordConfirm: 'Delete this record and mark as incomplete?',
    deleteRecordCompleted: 'Delete completed record and mark as incomplete?',
    deleteRecordRevert: 'Delete and revert',
    deleteRecordConfirmGeneral: 'Delete this record?',
    recordDeleted: 'Record deleted',
    recordUpdated: 'Record updated',
    recordNotePlaceholder: 'Notes on how you felt, pacing, etc.',
    statusCompleted: 'Completed',
    statusSkipped: 'Skipped',
    statusPlanned: 'Planned',
    completionHint: 'Check button to complete, long press to record details',
    actualDataHint: 'You can enter actual distances per zone (optional)',
    planned: 'Planned: {{distance}}m',
    durationFormat: '{{min}}m {{sec}}s',
    record: 'Record',
    recordAndComplete: 'Record & Complete',
    completeWithoutRecord: 'Complete without recording',
    editRecord: 'Edit Record',
    selectRecordDate: 'Select Record Date',
    customWorkout: 'Custom',

    // 分析
    allPeriod: 'All',
    thirtyDays: '30 days',
    sevenDays: '7 days',
    trainingAnalytics: 'Training Analytics',
    weeklyKm: 'Weekly km',
    monthlyKm: 'Monthly km',
    completionRate: 'Completion Rate',
    overallProgress: 'Overall Progress',
    zoneStimulus: 'Zone Stimulus',
    zoneRatio: 'Zone Ratio',
    targetLine100: '100% target',
    all: 'All',

    // レーススケジュール
    raceSchedule: 'Race Schedule',
    targetRace: 'Target Race',
    finished: 'Finished',

    // サブレース
    addRace: 'Add Race',
    subRace: 'Intermediate Race',
    subRaceEmptyText: 'No intermediate races added yet',
    subRacePriorityHigh: 'Important',
    subRacePriorityMedium: 'Moderate',
    subRacePriorityLow: 'Practice Race',
    priorityHigh: 'Important',
    priorityMedium: 'Moderate',
    priorityLow: 'Practice Race',
    priority: 'Priority',
    subRacePriorityHighDesc: 'Race you want to peak for',
    subRacePriorityMediumDesc: 'Light taper before racing',
    subRacePriorityLowDesc: 'No taper, treat as training',
    subRaceNamePlaceholder: 'e.g. Prefectural Championships',
    subRaceDaysLeft: '{{days}} days left',
    subRaceEnded: 'Ended',
    deleteSubRace: 'Delete Intermediate Race',
    deleteSubRaceConfirm: 'Delete "{{name}}"?',
    subRaceErrorPast: 'Cannot set an intermediate race on a past date.\nPlease select a future date.',
    subRaceErrorCompleted: 'This day already has a completed workout.\nCannot set an intermediate race on a completed day.',
    subRaceErrorBeforePlan: 'Cannot set a date before the plan start date',
    subRaceErrorAfterTarget: 'Cannot set a date on or after the target race date',
    subRaceErrorCustomDistance: 'Please enter a custom distance',
    errorSubRacePast: 'Cannot set an intermediate race on a past date',
    errorSubRaceCompleted: 'This day already has a completed workout',
    errorSubRaceBeforeStart: 'Cannot set a date before the plan start date',
    errorSubRaceAfterTarget: 'Cannot set a date on or after the target race date',

    // 結果記録モーダル
    recordResult: 'Record Result',
    recordResultTitle: '{{title}}',
    distance: 'Distance (m)',
    distanceLabel: 'Distance (m)',
    durationLabel: 'Duration',
    minuteLabel: 'min',
    secondLabel: 'sec',
    feelingSectionLabel: 'Feeling',
    feelingLabel: 'How did it feel?',
    notes: 'Notes',
    notesLabel: 'Notes',
    notesPlaceholder: 'Thoughts on the workout, pacing, etc.',
    deleteAndRevert: 'Delete Record',
    deleteAndRevertConfirm: 'Delete this record and mark as incomplete?',
    date: 'Date',

    // 曜日表示
    dayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },

  // ============================================
  // ワークアウト画面
  // ============================================
  workout: {
    // メイン
    pageTitle: 'Workout',
    replaceTitle: 'Change Menu',
    premiumFeatureName: 'Workout',

    // カテゴリ
    categoryAll: 'All',
    categoryVO2max: 'VO2max',
    categoryThreshold: 'Lactate Threshold',
    categorySpeed: 'Speed & Sprint',
    categoryAerobic: 'Aerobic Base',
    categoryGeneral: 'General',
    categoryRace: 'Race',
    categoryOriginal: 'Original',

    // ゾーン表示
    zoneJog: 'Recovery',
    zoneEasy: 'Easy',
    zoneMarathon: 'Marathon',
    zoneThreshold: 'Threshold',
    zoneInterval: 'Interval',
    zoneRepetition: 'Repetition',

    // リミッター
    limiterCardio: 'Cardiopulmonary Limiter',
    limiterMuscular: 'Muscular Endurance Limiter',
    limiterBalanced: 'Balanced',

    // 詳細画面
    selectionGuide: 'Selection Guide',
    limiterAdjustments: 'Limiter Adjustments',
    whyThisWorkout: 'Why this workout?',
    segments: 'Segments',
    recovery: 'Recovery',
    totalDistance: 'Total',
    selectForTraining: 'Select for Training',
    addedToLog: 'Added to training log on the Plan tab',
    replaceWorkout: 'Change to {{dayLabel}} to this workout',
    replaceWorkoutDefault: 'Change to this workout',
    replacedWorkout: 'Changed {{dayLabel}} to "{{workoutName}}"',
    customMenu: 'Custom workout',

    // オリジナルメニュー作成
    createNew: 'Create New',
    createTitle: 'New Workout',
    editTitle: 'Edit Workout',
    namePlaceholder: 'e.g. 500m x 5 Speed Endurance',
    descriptionPlaceholder: 'Purpose and description of the workout',
    categoryLabel: 'Category',
    segmentZone: 'Zone',
    segmentDistance: 'Distance (m)',
    segmentLabel: 'Label (e.g. W-up 4 laps)',
    segmentReps: 'Reps',
    segmentRecoveryLabel: 'Recovery',
    segmentRecovery: 'Recovery (m)',
    addSegment: 'Add Segment',
    needOneSegment: 'At least one segment is required',
    workoutUpdated: 'Workout updated',
    workoutCreated: 'Workout created',
    deleteWorkout: 'Delete Workout',
    deleteWorkoutConfirm: 'Delete "{{name}}"?',
    lapGuide: 'Lap Guide',
    selectReplacementMenu: 'Select a workout for {{dayLabel}}',
  },

  // ============================================
  // 設定画面
  // ============================================
  settings: {
    title: 'Settings',

    // サブスクリプション
    premiumMember: 'Premium Member',
    freePlan: 'Free Plan',
    restorePurchase: 'Restore Purchase',
    restoreSuccess: 'Purchase restored',
    restoreResult: 'Restore Result',
    restoreSuccessMsg: 'Your purchase has been restored',
    restoreFailMsg: 'No purchases to restore',

    // プロフィール
    profile: 'Profile',
    age: 'Age',
    experience: 'Running Experience',
    personalBests: 'Personal Bests (PB)',
    estimatedEtp: 'Estimated ETP: {{kmPace}} ({{etp}}s/400m)',
    speedIndex: 'Speed Index: {{value}} \u2192 {{reason}} (auto-set)',
    limiterType: 'Limiter Type',
    testDetermined: 'Test Determined',
    monthlyMileage: 'Monthly Mileage Cap (km)',
    monthlyMileagePlaceholder: 'e.g. 200',
    monthlyMileageHint: 'Workout volume will be automatically adjusted',
    limiterCardio: 'Cardio',
    limiterBalanced: 'Balanced',
    limiterMuscular: 'Muscular',

    // 用語ヘルプ
    glossary: 'Glossary',
    helpEtpTerm: 'ETP (Estimated Threshold Pace)',
    helpEtpDesc: 'Estimated threshold pace per 400m (seconds). Calculated from the ETP test or personal bests. A lower value indicates higher fitness.',
    helpLimiterTerm: 'Limiter Type',
    helpLimiterDesc: 'Classifies endurance limiting factors into 3 types: Cardiopulmonary (breathing limits first), Muscular Endurance (legs limit first), and Balanced (even). Training emphasis varies by type.',
    helpZoneTerm: 'Training Zones',
    helpZoneDesc: '6-level intensity bands calculated from ETP: Recovery, Easy, Marathon, Threshold, Interval, and Repetition zones for training.',
    helpVO2maxTerm: 'Estimated VO2max',
    helpVO2maxDesc: 'Estimated maximum oxygen uptake (ml/kg/min). A rough indicator of aerobic capacity derived from ETP. For reference only.',
    helpTestTerm: 'ETP Test',
    helpTestDesc: 'A field test where you repeat 400m at increasing paces for your level. Results automatically determine your limiter type and training zones.',
    helpPhaseTerm: 'Phases (Base, Build, Peak, Taper)',
    helpPhaseDesc: 'Training plan phases. Base builds the foundation, Build increases intensity, Peak specializes for the race, and Taper removes fatigue before race day.',

    // トレーニング哲学
    philosophy: 'Training Philosophy',
    philosophyIntro: 'The theoretical background behind MidLab\'s training design',

    // データ管理
    dataManagement: 'Data Management',
    testResultCount: 'Test results: {{count}}',
    deleteAllData: 'Delete All Data',
    resetDataTitle: 'Reset Data',
    resetDataMessage: 'All data will be deleted.',

    // 年齢オプション
    ageJuniorHigh: 'Junior High',
    ageHighSchool: 'High School',
    ageCollegiate: 'College',
    ageSenior: 'Adult',
    ageMasters40: '40s',
    ageMasters50: '50s',
    ageMasters60: '60+',

    // 経験オプション
    expBeginner: 'Beginner',
    expIntermediate: 'Intermediate',
    expAdvanced: 'Advanced',

    // PBタイトル
    pbTitle200m: '200m Best Time',
    pbTitle400m: '400m Best Time',
    pbTitle800m: '800m Best Time',
    pbTitle1500m: '1500m Best Time',
    pbTitle3000m: '3000m Best Time',
    pbTitle5000m: '5000m Best Time',
    bestTime: 'Best Time',

    // 言語設定
    language: 'Language',
    languageSystem: 'System Language',

    // 法的情報
    legal: 'Legal',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
  },

  // ============================================
  // アップグレード画面
  // ============================================
  upgrade: {
    premiumFeatures: [
      { icon: 'calendar', text: 'Training Plans' },
      { icon: 'barbell', text: 'Workouts' },
      { icon: 'analytics', text: 'Race Predictions' },
      { icon: 'trending-up', text: 'Progress Analysis' },
    ],
    unlockAll: 'Unlock all features',
    planNotFound: 'No available plans found',
    purchaseComplete: 'Successfully upgraded to Premium!',
    purchaseFailed: 'Could not complete the purchase',
    purchaseError: 'An error occurred during purchase',
    restoreSuccess: 'Purchase restored',
    restoreNone: 'No purchases found to restore',
    restoreError: 'An error occurred during restore',
    autoRenewNotice: 'After the free trial ends, auto-renews at {{price}} {{period}}.\nYou can cancel anytime from {{store}} settings.',
    yearly: 'yearly',
    monthly: 'monthly',
    yearlyPrice: '\u00a59,800/year',
    monthlyPrice: '\u00a5980/month',
  },

  // ============================================
  // 定数の翻訳
  // ============================================
  constants: {
    levels: {
      SS: { description: 'Under 3:30 for 1500m' },
      S: { description: '1500m 3:30-4:00' },
      A: { description: '1500m 4:00-4:30' },
      B: { description: '1500m 4:30-5:00' },
      C: { description: '1500m 5:00 or slower' },
    },

    zones: {
      jog: { name: 'Recovery', label: 'Recovery', description: 'Recovery pace' },
      easy: { name: 'Easy', label: 'Easy', description: 'Below VT1 / Aerobic base' },
      marathon: { name: 'Marathon', label: 'Marathon', description: 'Marathon pace' },
      threshold: { name: 'Threshold', label: 'Threshold', description: 'Lactate threshold' },
      interval: { name: 'Interval', label: 'Interval', description: 'VO2max' },
      repetition: { name: 'Repetition', label: 'Repetition', description: 'Speed' },
    },

    ageCategories: {
      junior_high: { label: 'Junior High', desc: 'Ages 12-15' },
      high_school: { label: 'High School', desc: 'Ages 15-18' },
      collegiate: { label: 'College', desc: 'Ages 18-22' },
      senior: { label: 'Adult', desc: 'Ages 22-39' },
      masters_40: { label: 'Masters 40s', desc: 'Ages 40-49' },
      masters_50: { label: 'Masters 50s', desc: 'Ages 50-59' },
      masters_60: { label: 'Masters 60+', desc: 'Ages 60+' },
    },

    gender: {
      male: 'Male',
      female: 'Female',
      other: 'Prefer not to say',
      femaleNote: 'Consider menstrual cycle when scheduling tests',
    },

    restDayFrequency: {
      weekly: { label: 'Weekly', desc: 'One full rest day per week (recommended for beginners)' },
      biweekly: { label: 'Biweekly', desc: 'One full rest day every two weeks' },
      monthly: { label: '1-2x/month', desc: 'One to two full rest days per month (for advanced runners)' },
      auto: { label: 'Auto', desc: 'Automatically determined from experience and monthly mileage' },
    },

    experience: {
      beginner: { label: 'Beginner', desc: 'Under 2 years' },
      intermediate: { label: 'Intermediate', desc: '2-5 years' },
      advanced: { label: 'Advanced', desc: '5+ years' },
      elite: { label: 'Elite', desc: 'National-level competitor' },
    },

    phases: {
      base: { name: 'Base Phase', label: 'Base' },
      build: { name: 'Build Phase', label: 'Build' },
      peak: { name: 'Peak Phase', label: 'Peak' },
      taper: { name: 'Taper', label: 'Taper' },
    },

    limiters: {
      cardio: { name: 'Cardiopulmonary Limiter', label: 'Cardio' },
      muscular: { name: 'Muscular Endurance Limiter', label: 'Muscular' },
      balanced: { name: 'Balanced', label: 'Balanced' },
    },

    focusCategories: {
      aerobic: {
        name: 'Aerobic Base',
        description: 'Capillary development & mitochondrial growth',
      },
      threshold: {
        name: 'Lactate Threshold',
        description: 'Improved lactate clearance',
      },
      vo2max: {
        name: 'VO2max',
        description: 'Improved maximal oxygen uptake',
      },
      speed: {
        name: 'Speed & Sprint',
        description: 'Speed endurance & running economy',
      },
    },

    categories: {
      all: 'All',
      VO2max: 'VO2max',
      lactateThreshold: 'Lactate Threshold',
      speedSprint: 'Speed & Sprint',
      aerobicBase: 'Aerobic Base',
      general: 'General',
      race: 'Race',
      original: 'Original',
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

  // ============================================
  // 404ページ
  // ============================================
  notFound: {
    title: 'Page Not Found',
    goHome: 'Go Home',
  },

  // ============================================
  // 共通UIコンポーネント
  // ============================================
  ui: {
    // TimePickerModal
    selectTime: 'Select Time',
    minutes: 'min',
    seconds: 'sec',
    secondsUnit: 's',
    select: 'Select',

    // DatePickerModal
    selectDate: 'Select Date',
    weekdaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    yearMonth: '{{month}} {{year}}',
    goToToday: 'Go to Today',

    // EtpTrendChart
    trend: 'Trend',
  },

  // ============================================
  // プレミアム・サブスクリプション
  // ============================================
  premium: {
    // PremiumGate
    featureTitle: 'Premium Feature',
    featureGateDesc: '"{{feature}}" is available with a Premium plan.',
    viewPlans: 'View Plans',

    // アップグレード画面 - 機能リスト
    featurePlan: 'Training Plans',
    featureWorkout: 'Workouts',
    featureRace: 'Race Predictions',
    featureAnalysis: 'Progress Analysis',

    // アップグレード画面 - ヘッダー
    title: 'MidLab Premium',
    featureExclusive: '"{{feature}}" is a Premium-only feature',
    unlockAll: 'Unlock all features',

    // プレミアム会員
    memberTitle: 'Premium Member',
    memberDesc: 'You have access to all Premium features.',
    manageSubscription: 'Manage Subscription',

    // プラン選択
    recommended: 'Recommended',
    yearlyPlan: 'Yearly Plan',
    yearlyPrice: '¥9,800',
    perYear: '/year',
    yearlySaving: 'Save 2 months',
    monthlyPlan: 'Monthly Plan',
    monthlyPrice: '¥980',
    perMonth: '/month',

    // 購入ボタン
    freeTrial: '7-day free trial',
    startFreeTrial: 'Start Free Trial',
    restorePurchase: 'Restore Purchase',
    unavailable: 'Currently unavailable',

    // トースト
    noPlanAvailable: 'No available plans found',
    upgradeSuccess: 'Successfully upgraded to Premium!',
    purchaseFailed: 'Could not complete the purchase',
    purchaseError: 'An error occurred during purchase',
    restoreSuccess: 'Purchase restored',
    restoreNotFound: 'No purchases found to restore',
    restoreError: 'An error occurred during restore',

    // 法的情報
    legalPrefix: 'By continuing, you agree to our ',
    terms: 'Terms of Service',
    legalSeparator: ' and ',
    privacy: 'Privacy Policy',
    legalSuffix: '.',
    autoRenewNote: 'After the free trial ends, auto-renews at {{price}}. You can cancel anytime from {{store}} settings.',
    yearlyPriceLabel: '¥9,800/year',
    monthlyPriceLabel: '¥980/month',
  },
};

export default en;
