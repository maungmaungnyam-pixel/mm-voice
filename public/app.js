(() => {
  const $ = (id) => document.getElementById(id);
  const newsList = $('news-list'), jobsList = $('jobs-list'), homeList = $('home-list'), globalList = $('global-list'), searchInput = $('search');
  const newsStatus = $('feed-status'), newsStatusText = $('feed-status-text'), jobsStatus = $('jobs-status'), jobsStatusText = $('jobs-status-text');
  const homeView = $('home-view'), globalView = $('global-panel'), publishersView = $('publishers-view'), newsView = $('news-panel'), jobsView = $('jobs-panel'), notificationsView = $('notifications-panel'), profileView = $('profile-view'), aboutView = $('about-view');
  const appShell = $('app'), siteHeader = $('site-header'), bottomNav = $('primary-tabs'), drawer = $('app-drawer'), drawerBackdrop = $('drawer-backdrop');
  const detail = $('detail-view'), searchPanel = $('search-panel');
  const photos = ['/images/mm-voice-logo.svg'];
  const roles = {
    worker: {label: 'အလုပ်လုပ်ဖို့', short: 'အလုပ်သမား', keywords: ['work permit', 'worker', 'labour', 'labor', 'visa', 'ci', 'အလုပ်', 'အလုပ်သမား', 'အလုပ်လုပ်ခွင့်', 'အလုပ်သမားအခွင့်အရေး', 'လုပ်ခ', 'လစာ', 'ရွှေ့ပြောင်း']},
    student: {label: 'ပညာသင်ဖို့', short: 'ကျောင်းသား/ကျောင်းသူ', keywords: ['student', 'university', 'education', 'scholarship', 'campus', 'study', 'ကျောင်း', 'တက္ကသိုလ်', 'ပညာရေး', 'ပညာသင်', 'ကျောင်းသား', 'ပညာသင်ဆု']},
    business: {label: 'စီးပွားရေး / ရင်းနှီးမြှုပ်နှံဖို့', short: 'စီးပွားရေးလုပ်ငန်းရှင်', keywords: ['business', 'investment', 'investor', 'company', 'startup', 'sme', 'trade', 'tax', 'business license', 'လုပ်ငန်း', 'စီးပွားရေး', 'ရင်းနှီးမြှုပ်နှံ', 'ကုမ္ပဏီ', 'အခွန်', 'လိုင်စင်']}
  };
  const notificationCopy = {
    my: {caption: 'မြန်မာ့သတင်းရင်းမြစ်များမှ အရေးကြီးသတင်းများကို ဒီမှာကြည့်ပါ။', empty: 'မြန်မာ့သတင်းထဲမှ အရေးကြီးသတင်းများ ရှိလာပါက ဒီမှာပေါ်လာပါမယ်။', unavailableTitle: 'အသိပေးချက်များကို မရနိုင်ပါ', unavailable: 'ခဏနေပြီး ပြန်လည်စစ်ဆေးပါ။', breaking: 'အရေးကြီးသတင်း', weather: 'ရာသီဥတုသတိပေးချက်'},
    en: {caption: 'Important stories from Myanmar-focused publishers.', empty: 'Important stories from Myanmar-focused publishers will appear here.', unavailableTitle: 'Notifications are unavailable', unavailable: 'Please check again in a little while.', breaking: 'Breaking news', weather: 'Weather alert'}
  };
  const messages = {
    my: {
      home: 'ပင်မ', news: 'သတင်း', jobs: 'အလုပ်', profile: 'ကိုယ်ရေး',
      searchPlaceholder: 'သတင်း ရှာဖွေမယ်…', searchLabel: 'သတင်း ရှာရန်', searchSubmitLabel: 'ရှာမယ်',
      welcomeEyebrow: 'MM VOICE သတင်း', welcomeTitle: 'မြန်မာ့သတင်းကို မြန်မာလို။', welcomeIntro: 'မြန်မာ့သတင်းရင်းမြစ်များမှ သတင်းအနှစ်ချုပ်များကို မူရင်းလင့်ခ်နှင့်အတူ ဖတ်ရှုပါ။', welcomeStart: 'စတင်မယ်', workerRole: 'အလုပ်လုပ်ဖို့', workerRoleShort: 'အလုပ်သမား', studentRole: 'ပညာသင်ဖို့', studentRoleShort: 'ကျောင်းသား/ကျောင်းသူ', businessRole: 'စီးပွားရေး / ရင်းနှီးမြှုပ်နှံဖို့', businessRoleShort: 'စီးပွားရေး', welcomeNote: 'မူရင်းသတင်းရင်းမြစ်ကို အမြဲဖွင့်ကြည့်နိုင်ပါတယ်။', noPreference: 'အခုထိ မရွေးရသေးပါ', notifications: 'အသိပေးချက်များ', notificationsHeading: 'အသိပေးချက်များ', notificationsCaption: 'အရေးကြီးတဲ့ အပ်ဒိတ်တွေကို ဒီနေရာမှာ ကြည့်ပါ။', noNotificationsTitle: 'အသိပေးချက် မရှိသေးပါ', drawerLabel: 'အဓိက မီနူး', drawerNavigation: 'မီနူး', mainNavigation: 'အဓိက လမ်းညွှန်', openMenuLabel: 'မီနူးဖွင့်ရန်', closeMenuLabel: 'မီနူးပိတ်ရန်', closeLabel: 'ပိတ်ရန်', searchClose: 'ရှာဖွေမှု ပိတ်ရန်',
      guestName: 'ဧည့်သည်', guestEmail: 'အကောင့်မလိုပါ', drawerWelcome: 'MM VOICE မှ ကြိုဆိုပါတယ်', drawerGuestCopy: 'အကောင့်ဖွင့်ရန်မလိုဘဲ လွတ်လပ်စွာ အသုံးပြုနိုင်ပါတယ်။', settingsMenu: 'ဆက်တင်များ', openSettings: 'ဆက်တင်များကို ကြည့်ရန်', communityTagline: 'မြန်မာ့သတင်းရင်းမြစ်များမှ မြန်မာလို အနှစ်ချုပ်များ',
      homeHeading: 'မြန်မာ့သတင်း နောက်ဆုံးရ', homeCaption: 'မြန်မာ့သတင်းရင်းမြစ်များမှ နောက်ဆုံးရသတင်းများ။',
      safetyReminder: 'အမြဲတမ်း သတိပေးချက်', public: 'အများမြင်', safetyTitle: 'အကို့သတိပေးချက်',
      safetyBody: 'ငွေကြိုတောင်းတဲ့ အလုပ်ကြော်ငြာတွေကို သေချာစစ်ပါ။ အလုပ်ရဖို့ ငွေကြိုမပေးပါနဲ့။',
      like: 'နှစ်သက်', comment: 'မှတ်ချက်', save: 'သိမ်းမယ်',
      broAlert: 'အကို့သတိပေးချက်', read: 'ကြည့်မယ်', sourceReminder: 'သတင်းတိုင်းအတွက် မူရင်းရင်းမြစ်ကို ဖွင့်ကြည့်နိုင်ပါတယ်။',
      latestNews: 'နောက်ဆုံးသတင်းများ', newsCaption: 'ယုံကြည်ရတဲ့ ရင်းမြစ်က သတင်းတွေကို အကိုက စုစည်းထားတယ်။ ၁၅ မိနစ်တစ်ကြိမ် အသစ်စစ်ဆေးသည်။',
      latestJobs: 'အလုပ်အကိုင်စာရင်း မပါဝင်ပါ', jobsCaption: 'MM VOICE သည် မြန်မာ့သတင်းများကိုသာ ဖော်ပြပါသည်။',
      jobSafetyTitle: 'MM VOICE သတင်းဝန်ဆောင်မှု', jobSafetyBody: 'ဤအက်ပ်တွင် မြန်မာ့သတင်းများကိုသာ ဖော်ပြပြီး အလုပ်အကိုင်စာရင်း မပါဝင်ပါ။', officialJobs: '',
      menuLabel: 'MENU', profileHeading: 'ကိုယ်ရေးနှင့် ဆက်တင်များ', profileIntro: 'ဘာသာစကား၊ အသွင်အပြင်နှင့် သိမ်းထားသောအကြောင်းအရာများကို စီမံပါ။',
      languageTitle: 'Language / ဘာသာစကား', languageHelp: 'အက်ပ်အင်တာဖေ့စ် ဘာသာစကားရွေးပါ', notificationSettings: 'အသိပေးချက်များ', notificationSettingsHelp: 'အရေးကြီးအပ်ဒိတ်များကို ဖွင့်ကြည့်ရန်',
      savedPosts: 'သိမ်းထားသော ပို့စ်များ', savedHelp: 'သိမ်းထားသည့်အကြောင်းအရာများကို ပြန်ကြည့်ရန်',
      personalize: 'သင့်အတွက် စိတ်ကြိုက်ပြင်မယ်', profileStored: 'သင်ရွေးထားတဲ့အကြောင်းအရာအမျိုးအစားကို ဒီစက်ထဲမှာပဲ သိမ်းထားပါတယ်။', clearPreference: 'အကြောင်းအရာအားလုံးပြမယ်', allTopics: 'အကြောင်းအရာအားလုံး', preferenceCleared: 'သတင်းအမျိုးအစားအားလုံးကို ပြပါမယ်။', change: 'ပြောင်းမယ်',
      aboutThaiBro: 'MM VOICE အကြောင်း', aboutIntro: 'မြန်မာနှင့် သက်ဆိုင်သော သတင်းများကို ယုံကြည်ရသော ရင်းမြစ်များမှ စုစည်းဖော်ပြသည်။', aboutUsHeading: 'ကျွန်ုပ်တို့အကြောင်း', aboutUsCopy: 'MM VOICE သည် မြန်မာ့သတင်းများကို စုစည်းပြီး မြန်မာလို အနှစ်ချုပ်ဖော်ပြသော လွတ်လပ်သည့် သတင်းဝန်ဆောင်မှုဖြစ်သည်။', aboutFeaturesHeading: 'ဒီမှာ တွေ့နိုင်တာများ', aboutFeaturesCopy: 'မြန်မာ့သတင်းရင်းမြစ်များမှ နောက်ဆုံးရသတင်း၊ မြန်မာလို အနှစ်ချုပ်နှင့် မူရင်းဆောင်းပါးလင့်ခ်များကို တွေ့နိုင်သည်။', aboutNoteHeading: 'အသုံးဝင်သော မှတ်ချက်',
      aboutDisclaimer: 'MM VOICE သည် လွတ်လပ်သော သတင်းစုစည်းမှုဝန်ဆောင်မှုဖြစ်သည်။ AI အနှစ်ချုပ်တွင် အမှားရှိနိုင်သဖြင့် အရေးကြီးသောအချက်အလက်များကို မူရင်းရင်းမြစ်တွင် အတည်ပြုပါ။',
      savedHeading: 'သိမ်းထားတဲ့အကြောင်းအရာ', backToSettings: 'ဆက်တင်များသို့', savedReadOnly: 'သိမ်းထားတဲ့ပို့စ်တွေကို ဒီစက်ထဲမှာပဲ လုံခြုံစွာ သိမ်းထားပါတယ်။',
      broGuide: 'အကို့လမ်းညွှန်', communityComments: 'ညီ/ညီမတို့ မှတ်ချက်များ', commentHelp: 'ဒီမှာရေးထားတဲ့ မှတ်ချက်တွေကို လူတိုင်းမြင်နိုင်ပါတယ်။',
      recent: 'မကြာသေးမီက', newsLoading: 'သတင်းတင်နေတယ်…', jobsLoading: 'အလုပ်တင်နေတယ်…',
      updated: 'နောက်ဆုံးအပ်ဒိတ်', newsUnavailable: 'သတင်းမရနိုင်ပါ', partialNews: 'အချို့သတင်း မရနိုင်ပါ',
      noNews: 'သတင်းမရှိသေးပါ', noJobs: 'အလုပ်အကိုင် မပါဝင်ပါ', soon: 'မကြာမီ', jobsUnavailable: 'အလုပ်စာရင်း မရနိုင်ပါ',
      noMatches: 'ကိုက်ညီတဲ့အကြောင်းအရာ မတွေ့ပါ', noJobMatches: 'ကိုက်ညီတဲ့အလုပ် မတွေ့ပါ',
      emptyText: 'ခဏနေပြီး ပြန်စစ်ကြည့်ပါနော်။', noComments: 'မှတ်ချက် မရှိသေးပါ',
      noCommentsText: 'အခုထိ မှတ်ချက်မရှိသေးပါ။',
      commentsUnavailable: 'မှတ်ချက်ကို ခဏမရနိုင်ပါ', tryAgain: 'နောက်မှပြန်စစ်ပါနော်။',
      unverified: 'အကိုက မစစ်ဆေးရသေးပါ', verified: 'အကိုက စစ်ဆေးအတည်ပြုထားသည်',
      scamTag: 'အကို့သတိပေးချက်', featuredFor: 'သင့်အတွက်', newsType: 'သတင်း', jobType: 'အလုပ်',
      publicPost: 'အများမြင် ပို့စ်', refreshDone: 'အခုပဲ အသစ်ပြန်တင်ပြီးပါပြီ', refreshingFeed: 'အသစ်ပြန်စစ်နေပါတယ်…', refreshFailed: 'လတ်တတလော အသစ်ပြန်စစ်မရပါ။', refreshLabel: 'ပြန်စစ်ရန်',
      pullHint: 'အောက်သို့ ဆွဲချပါ', pullRefresh: 'လွှတ်လိုက်ရင် အသစ်ပြန်စစ်မယ်', scamTail: '— ငွေကြိုတောင်းမှုကို သတိထားပြီး အရင်စစ်ပါ။'
    },
    en: {
      home: 'Home', news: 'News', jobs: 'Jobs', profile: 'Profile',
      searchPlaceholder: 'Search news…', searchLabel: 'Search news', searchSubmitLabel: 'Search',
      welcomeEyebrow: 'Independent Myanmar news', welcomeTitle: 'Myanmar news, in Burmese.', welcomeIntro: 'Clear Burmese summaries from Myanmar-focused sources, with original links.', workerRole: 'For work', workerRoleShort: 'Worker', studentRole: 'For study', studentRoleShort: 'Student', businessRole: 'For business or investment', businessRoleShort: 'Business', welcomeNote: 'Open the original source for full context.', noPreference: 'No preference selected', notifications: 'Notifications', notificationsHeading: 'Notifications', notificationsCaption: 'Important updates will appear here.', noNotificationsTitle: 'No notifications yet', drawerLabel: 'Main menu', drawerNavigation: 'Menu', mainNavigation: 'Main navigation', openMenuLabel: 'Open menu', closeMenuLabel: 'Close menu', closeLabel: 'Close', searchClose: 'Close search',
      guestName: 'Guest', guestEmail: 'No account needed', drawerWelcome: 'Welcome to MM VOICE', drawerGuestCopy: 'Browse freely — no account required.', welcomeStart: 'Start', settingsMenu: 'Settings', openSettings: 'Open settings', communityTagline: 'Myanmar news summarized in Burmese',
      homeHeading: 'Latest Myanmar news', homeCaption: 'Stories from Myanmar-focused publishers, summarized in Burmese.',
      safetyReminder: 'Safety reminder', public: 'Public', safetyTitle: 'A note from your Bro',
      safetyBody: 'Check job listings that ask for money upfront. Never pay an advance fee to get a job.',
      like: 'Like', comment: 'Comment', save: 'Save',
      broAlert: 'A note from your Bro', read: 'Read', sourceReminder: 'Open the original source for each news story.',
      latestNews: 'Latest news', newsCaption: 'Updates from trusted sources, checked every 6 minutes.',
      latestJobs: 'Job listings are not included', jobsCaption: 'MM VOICE covers Myanmar news only.',
      jobSafetyTitle: 'Myanmar news only', jobSafetyBody: 'MM VOICE covers Myanmar news only and does not include job listings.', officialJobs: '',
      menuLabel: 'MENU', profileHeading: 'Profile & settings', profileIntro: 'Manage your language, appearance, and saved content.',
      languageTitle: 'Language / ဘာသာစကား', languageHelp: 'Choose the app interface language', notificationSettings: 'Notifications', notificationSettingsHelp: 'Open the latest important alerts',
      savedPosts: 'Saved posts', savedHelp: 'Revisit saved content',
      personalize: 'Personalize your feed', profileStored: 'Your topic preference is saved only on this device.', clearPreference: 'Show all topics', allTopics: 'All topics', preferenceCleared: 'Your feed will now show all topics.', change: 'Change',
      aboutThaiBro: 'About MM VOICE', aboutIntro: 'Read Myanmar-focused news in Burmese, with links to the original reporting.', aboutUsHeading: 'About us', aboutUsCopy: 'MM VOICE collects Myanmar-focused reporting and presents concise Burmese summaries.', aboutFeaturesHeading: 'What you’ll find here', aboutFeaturesCopy: 'Find recent Myanmar news, Burmese summaries, and links to original publisher articles.', aboutNoteHeading: 'A helpful note',
      aboutDisclaimer: 'MM VOICE is an independent news aggregator. AI summaries may contain errors; read original sources to verify important details.',
      savedHeading: 'Saved content', backToSettings: 'Back to settings', savedReadOnly: 'Your saved posts are stored privately on this device.',
      broGuide: 'Your guide', communityComments: 'Community comments', commentHelp: 'Comments are public and visible to everyone.',
      recent: 'Recently', newsLoading: 'Loading news…', jobsLoading: 'Loading jobs…',
      updated: 'Updated', newsUnavailable: 'News unavailable', partialNews: 'Some news is unavailable',
      noNews: 'No news yet', noJobs: 'Not included', soon: 'Soon', jobsUnavailable: 'Jobs unavailable',
      noMatches: 'No matching stories found', noJobMatches: 'No matching jobs found',
      emptyText: 'Please check again in a little while.', noComments: 'No comments yet',
      noCommentsText: 'There are no comments yet.',
      commentsUnavailable: 'Comments are temporarily unavailable', tryAgain: 'Please try again later.',
      unverified: 'Not yet checked by MM VOICE', verified: 'Checked by MM VOICE',
      scamTag: 'Safety warning', featuredFor: 'For you', newsType: 'News', jobType: 'Job',
      publicPost: 'Public post', refreshDone: 'Just refreshed', refreshingFeed: 'Refreshing…', refreshFailed: 'Couldn’t refresh just now.', refreshLabel: 'Refresh',
      pullHint: 'Pull down to refresh', pullRefresh: 'Release to refresh', scamTail: '— watch for requests to pay money upfront.'
    }
  };
  let language = (() => { try { if (localStorage.getItem('mmvoice.default-english.migration.v1') !== 'done') { localStorage.setItem('mmvoice.language.v2', 'en'); localStorage.setItem('mmvoice.default-english.migration.v1', 'done'); return 'en'; } return localStorage.getItem('mmvoice.language.v2') === 'my' ? 'my' : 'en'; } catch { return 'en'; } })();
  const uiText = {
    my: {
      seeMore: 'ပိုမိုဖတ်ရှုရန်', seeLess: 'လျှော့ဖတ်ရန်', sourceBy: 'ရင်းမြစ် —', photoBy: 'ဓာတ်ပုံ —', views: 'ကြည့်ရှုမှု',
      themeTitle: 'လင်း/မှောင်စနစ်', themeHelp: 'သင့်မျက်နှာပြင်အတွက် အလင်း သို့မဟုတ် အမှောင် ရွေးပါ',
      back: 'နောက်သို့', authTagline: 'မြန်မာနိုင်ငံမှ ထိုင်းရောက်မိတ်ဆွေများအတွက် သတင်း၊ အလုပ်အကိုင်နှင့် အကူအညီများ',
      commentLoading: 'မှတ်ချက်များကို ဖွင့်နေပါတယ်…', noComments: 'မှတ်ချက် မရှိသေးပါ', commentPlaceholder: 'မှတ်ချက်ရေးပါ…', commentSubmit: 'တင်မယ်', commentPublicNotice: 'ဒီမှတ်ချက်ကို လူတိုင်းမြင်နိုင်ပါတယ်။', commentSent: 'မှတ်ချက်တင်ပြီးပါပြီ။', commentFailed: 'မှတ်ချက်တင်မရပါ။ နောက်မှ ထပ်ကြိုးစားပါ။', commentRateLimited: 'ခဏနားပြီး နောက်မှ ထပ်ကြိုးစားပါ။', likeAdded: 'နှစ်သက်မှုကို မှတ်တမ်းတင်ပြီးပါပြီ။', likeRemoved: 'နှစ်သက်မှုကို ဖယ်လိုက်ပါပြီ။', likeFailed: 'နှစ်သက်မှု မပြောင်းလဲနိုင်ပါ။ နောက်မှ ထပ်ကြိုးစားပါ။', like: 'နှစ်သက်သည်', saved: 'သိမ်းပြီးပါပြီ'
    },
    en: {
      seeMore: 'See more', seeLess: 'See less', sourceBy: 'Source by:', photoBy: 'Photo by:', views: 'views',
      themeTitle: 'Light / dark mode', themeHelp: 'Choose a light or dark appearance for your screen',
      back: 'Back', authTagline: 'Myanmar news, summarized in Burmese',
      commentLoading: 'Loading comments…', noComments: 'No comments yet', commentPlaceholder: 'Write a public comment…', commentSubmit: 'Post comment', commentPublicNotice: 'This comment will be visible to everyone.', commentSent: 'Comment posted.', commentFailed: 'Could not post the comment. Please try again.', commentRateLimited: 'Please wait a minute before posting more comments.', likeAdded: 'Like added.', likeRemoved: 'Like removed.', likeFailed: 'Could not update the like. Please try again.', like: 'Like', saved: 'Saved'
    }
  };
  const t = (key) => {
    const value = uiText[language][key] || messages[language][key] || uiText.my[key] || messages.my[key] || key;
    return typeof value === 'string' ? value.replaceAll('MM VOICE', 'MM VOICE') : value;
  };
  Object.assign(messages.my, {
    bottomHome: 'Home', bottomNoti: 'Noti',
    searchPlaceholder: 'မြန်မာ့သတင်း ရှာဖွေရန်…', searchLabel: 'မြန်မာ့သတင်း ရှာရန်', searchSubmitLabel: 'ရှာမယ်',
    welcomeEyebrow: 'မြန်မာ့သတင်းကို မြန်မာဘာသာဖြင့်', welcomeTitle: 'မြန်မာ့အသံ၊ မြန်မာ့သတင်း',
    welcomeIntro: 'မြန်မာနှင့် သက်ဆိုင်သော သတင်းများကို အနှစ်ချုပ်ဖတ်ပြီး မူရင်းရင်းမြစ်ကိုလည်း ဖွင့်ကြည့်ပါ။',
    drawerWelcome: 'MM VOICE မှ ကြိုဆိုပါတယ်', communityTagline: 'သတင်းရင်းမြစ်များမှ စုစည်းထားသော မြန်မာ့သတင်း',
    homeHeading: 'မြန်မာနှင့် သက်ဆိုင်သော နောက်ဆုံးသတင်းများ',
    homeCaption: 'မြန်မာ့သတင်းဌာနများမှသာ သတင်းများကို မူရင်းလင့်ခ်နှင့်အတူ ဖတ်ရှုပါ။',
    latestNews: 'နောက်ဆုံး မြန်မာ့သတင်းများ',
    newsCaption: 'မြန်မာနှင့် သက်ဆိုင်သော သတင်းများကို ၁၅ မိနစ်တစ်ကြိမ် စစ်ဆေးပြီး Gemini ဖြင့် အနှစ်ချုပ်ထားပါသည်။ မူရင်းရင်းမြစ်လင့်ခ်ကို ဖွင့်ကြည့်ပါ။',
    aboutIntro: 'သတင်းရင်းမြစ်များမှ မြန်မာနှင့် သက်ဆိုင်သော သတင်းများကို စုစည်းဖတ်ရှုနိုင်သည်။',
    aboutUsCopy: 'MM VOICE သည် သတင်းရင်းမြစ်များမှ မြန်မာနှင့် သက်ဆိုင်သော သတင်းများကို စုစည်းပြီး Gemini ဖြင့် မြန်မာလို အနှစ်ချုပ်ဖော်ပြသည်။',
    aboutFeaturesCopy: 'မြန်မာနှင့် သက်ဆိုင်သော သတင်းများ၊ ရရှိနိုင်ပါက သက်ဆိုင်ရာဓာတ်ပုံ သို့မဟုတ် ဗီဒီယိုနှင့် မူရင်းရင်းမြစ်လင့်ခ်။',
    aboutDisclaimer: 'MM VOICE သည် လွတ်လပ်သော သတင်းစုစည်းမှုဝန်ဆောင်မှုဖြစ်သည်။ AI အနှစ်ချုပ်တွင် အမှားရှိနိုင်သဖြင့် အရေးကြီးသောအချက်အလက်များအတွက် မူရင်းရင်းမြစ်ကို ဖတ်ရှုအတည်ပြုပါ။'
  });
  Object.assign(messages.en, {
    bottomHome: 'Home', bottomNoti: 'Noti',
    searchPlaceholder: 'Search Myanmar-related news…', searchLabel: 'Search Myanmar-related news',
    welcomeEyebrow: 'Myanmar news in Burmese', welcomeTitle: 'Your voice for Myanmar news.',
    welcomeIntro: 'Read Burmese summaries of Myanmar-related news, with links to the original sources.',
    drawerWelcome: 'Welcome to MM VOICE', communityTagline: 'Myanmar news with original source links',
    homeHeading: 'What’s happening in Myanmar',
    homeCaption: 'Stories from Myanmar publishers only, with links to original sources.',
    latestNews: 'Latest Myanmar news',
    newsCaption: 'Myanmar-related stories are checked every 6 minutes and summarized in Burmese with Gemini. Open the original source for full context.',
    aboutIntro: 'Read Myanmar-related news collected from local and international publishers.',
    aboutUsCopy: 'MM VOICE collects news related to Myanmar and uses Gemini to summarize it in Burmese.',
    aboutFeaturesCopy: 'Myanmar-related stories, relevant photos or videos when available, and a link to each original source.',
    aboutDisclaimer: 'MM VOICE is an independent news aggregator. AI summaries may contain errors; read the original source to verify important details.'
  });
  Object.assign(messages.my, {
    publisherLabel: 'သတင်း Page', publisherIntro: 'ဒီသတင်းဌာနက တင်ထားသော သတင်းများကို ကြည့်ရှုပါ။',
    publisherNewsHeading: 'ဤဌာနမှ သတင်းများ', publisherNoNews: 'ဒီသတင်း Page မှ သတင်း မရှိသေးပါ။',
    publisherUnavailable: 'ဒီသတင်း Page မှ သတင်းများကို ယခု မရနိုင်သေးပါ။', viewPublisherProfile: 'သတင်းရင်းမြစ် Profile ကို ကြည့်ရန်'
  });
  Object.assign(messages.en, {
    publisherLabel: 'News publisher', publisherIntro: 'Stories published by this news organization.',
    publisherNewsHeading: 'Stories from this publisher', publisherNoNews: 'No stories from this publisher yet.',
    publisherUnavailable: 'Stories from this publisher are temporarily unavailable.', viewPublisherProfile: 'View publisher profile'
  });
  Object.assign(messages.my, {
    bottomHome: 'Burma', bottomNoti: 'Global', publishersMenu: 'သတင်းဌာနများ', publishersHeading: 'သတင်းဌာနများ',
    publishersIntro: 'မြန်မာနှင့် နိုင်ငံတကာ သတင်းဌာနများကို ဒေသအလိုက် ကြည့်ရှုပါ။', publishersEyebrow: 'သတင်းရင်းမြစ်များ',
    publisherRegionLabel: 'သတင်းဌာန အမျိုးအစား', burmaTab: 'Burma', globalTab: 'Global',
    globalEyebrow: 'GLOBAL', globalHeading: 'ကမ္ဘာ့သတင်း နောက်ဆုံးရ', globalCaption: 'နိုင်ငံတကာ သတင်းဌာန ၃၀ မှ သတင်းများ။',
    globalNotice: 'Global သတင်းများကို Myanmar-only Burma feed မှ သီးခြားပြသထားပါသည်။', globalNoNews: 'ကမ္ဘာ့သတင်း မရရှိသေးပါ။',
    refreshGlobalLabel: 'ကမ္ဘာ့သတင်း ပြန်စစ်ရန်', noPublishers: 'ဒီဒေသအတွက် သတင်းဌာန မတွေ့ပါ။',
    publisherRegionBurma: 'မြန်မာ', publisherRegionGlobal: 'နိုင်ငံတကာ'
  });
  Object.assign(messages.en, {
    bottomHome: 'Burma', bottomNoti: 'Global', publishersMenu: 'Publishers', publishersHeading: 'Publishers',
    publishersIntro: 'Browse Myanmar and international publishers by region.', publishersEyebrow: 'NEWS SOURCES',
    publisherRegionLabel: 'Publisher region', burmaTab: 'Burma', globalTab: 'Global',
    globalEyebrow: 'GLOBAL', globalHeading: 'Global news', globalCaption: 'International reporting from 30 global publishers.',
    globalNotice: 'Global news is separate from the Burma feed, which remains focused on Myanmar.', globalNoNews: 'No global stories yet.',
    refreshGlobalLabel: 'Refresh global news', noPublishers: 'No publishers found for this region.',
    publisherRegionBurma: 'Myanmar publisher', publisherRegionGlobal: 'International publisher'
  });
  Object.assign(messages.my, {
    listenAudioHeading: 'ယနေ့သတင်းများကို အသံဖြင့်နားထောင်ရန်', listenBurmaToday: 'ယနေ့ မြန်မာသတင်းများကို နားထောင်မယ်', listenGlobalToday: 'ယနေ့ ကမ္ဘာ့သတင်းများကို နားထောင်မယ်',
    audioPlayerLabel: 'သတင်းအသံဖွင့်စက်', audioCloseLabel: 'အသံဖွင့်စက်ပိတ်ရန်', audioPreviousLabel: 'ယခင်သတင်း', audioNextLabel: 'နောက်သတင်း', audioPlayLabel: 'သတင်းအသံဖွင့်ရန်', audioPauseLabel: 'အသံခဏရပ်ရန်', audioProgressLabel: 'အသံဖွင့်တိုးတက်မှု', audioVolumeLabel: 'အသံအတိုးအကျယ်', audioMuteLabel: 'အသံပိတ်ရန်', audioUnmuteLabel: 'အသံပြန်ဖွင့်ရန်', audioMutedHint: 'အသံပိတ်ထားသည်။ အသံပြန်ဖွင့်ရန် ခလုတ်ကို နှိပ်ပါ။',
    audioRegionBurma: 'မြန်မာသတင်း', audioRegionGlobal: 'ကမ္ဘာ့သတင်း', audioLoading: 'ယနေ့သတင်းများကို ရှာဖွေနေပါတယ်…', audioPreparing: 'မူရင်းဆောင်းပါးအသံကို ပြင်ဆင်နေပါတယ်…', audioNoNews: 'ယနေ့အတွက် သတင်းမရှိသေးပါ။', audioStoryUnavailable: 'ဒီသတင်း၏ အသံကို ယခု မပြင်ဆင်နိုင်ပါ။ နောက်သတင်းကို ဖွင့်နေပါတယ်။', audioRateLimited: 'နေ့စဉ် TTS ခွင့်ပြုချက် ပြည့်သွားပါပြီ။ {delay} အကြာ ထပ်ကြိုးစားပါ။', audioComplete: 'ယနေ့သတင်းအားလုံး ပြီးပါပြီ။', audioTapToPlay: 'ဖွင့်ရန် ခလုတ်ကို နှိပ်ပါ။', audioQueueFailed: 'သတင်းအသံစာရင်းကို ယခု မရနိုင်ပါ။ နောက်မှပြန်ကြိုးစားပါ။'
  });
  Object.assign(messages.en, {
    listenAudioHeading: 'Listen to today’s news', listenBurmaToday: 'Listen to today’s Burma news', listenGlobalToday: 'Listen to today’s Global news',
    audioPlayerLabel: 'News audio player', audioCloseLabel: 'Close audio player', audioPreviousLabel: 'Previous story', audioNextLabel: 'Next story', audioPlayLabel: 'Play news audio', audioPauseLabel: 'Pause news audio', audioProgressLabel: 'Audio progress', audioVolumeLabel: 'Volume', audioMuteLabel: 'Mute audio', audioUnmuteLabel: 'Unmute audio', audioMutedHint: 'Audio is muted. Use the speaker button to turn sound on.',
    audioRegionBurma: 'Burma news', audioRegionGlobal: 'Global news', audioLoading: 'Finding today’s stories…', audioPreparing: 'Preparing the original article audio…', audioNoNews: 'There are no stories for today yet.', audioStoryUnavailable: 'This story’s audio could not be prepared. Moving to the next story.', audioRateLimited: 'Today’s TTS quota has been reached. Try again in about {delay}.', audioComplete: 'You’ve finished today’s news.', audioTapToPlay: 'Tap Play to begin audio.', audioQueueFailed: 'Today’s audio queue is unavailable. Please try again later.'
  });
  Object.assign(messages.my, {
    refreshAppLabel: 'Burma သတင်းဖိဒ်သို့ပြန်ပြီး အသစ်စစ်ရန်', notificationsUnreadLabel: 'မဖတ်ရသေးသော အသိပေးချက် {count} ခု',
    share: 'မျှဝေရန်', shareEyebrow: 'သတင်းမျှဝေရန်', shareTitle: 'ဤသတင်းကို မျှဝေရန်', shareFacebook: 'Facebook', shareMessenger: 'Messenger', shareTelegram: 'Telegram', copyLink: 'လင့်ခ်ကူးရန်', shareCloseLabel: 'မျှဝေမှုမီနူး ပိတ်ရန်', shareCopied: 'လင့်ခ်ကို ကူးပြီးပါပြီ။', shareMessengerFallback: 'လင့်ခ်ကို ကူးထားပါသည်။ Messenger ထဲတွင် ကူးထည့်ပါ။', shareFailed: 'လင့်ခ်ကို ကူး၍မရပါ။'
  });
  Object.assign(messages.en, {
    refreshAppLabel: 'Go to Burma feed and refresh', notificationsUnreadLabel: '{count} unread alerts',
    share: 'Share', shareEyebrow: 'SHARE STORY', shareTitle: 'Share this story', shareFacebook: 'Facebook', shareMessenger: 'Messenger', shareTelegram: 'Telegram', copyLink: 'Copy link', shareCloseLabel: 'Close sharing menu', shareCopied: 'Link copied.', shareMessengerFallback: 'The link is copied. Paste it into Messenger.', shareFailed: 'Could not copy the link.'
  });
  Object.assign(messages.my, {
    installApp: 'ဖုန်းထဲသို့ ထည့်ရန်', installEyebrow: 'ပင်မမျက်နှာပြင်သို့ ထည့်ရန်', installGuideTitle: 'MM VOICE ကို ဖုန်းတွင် ထည့်သွင်းရန်', installGuideIntro: 'ထည့်ပြီးနောက် ပင်မမျက်နှာပြင်မှ app လို တိုက်ရိုက်ဖွင့်နိုင်ပါသည်။', installGuideClose: 'ပိတ်ရန်',
    installIos1: 'Safari တွင် MM VOICE ကိုဖွင့်ပါ။', installIos2: 'Share (မျှဝေ) ခလုတ်ကိုနှိပ်ပါ။', installIos3: 'Add to Home Screen ကိုရွေးပါ။ မပေါ်ပါက Edit Actions မှ ထည့်ပါ။', installIos4: 'Open as Web App ကိုဖွင့်ပြီး Add ကိုနှိပ်ပါ။',
    installAndroid1: 'အခြား app အတွင်း browser မဟုတ်ဘဲ Chrome တွင် MM VOICE ကိုဖွင့်ပါ။', installAndroid2: 'ညာဘက်အပေါ်ရှိ ⋮ မီနူးကိုနှိပ်ပါ။', installAndroid3: 'Install app သို့မဟုတ် Add to Home screen ကိုရွေးပါ။', installAndroid4: 'Add သို့မဟုတ် Install ကို အတည်ပြုပါ။',
    installOther1: 'သင့် browser ၏ မီနူးကိုဖွင့်ပါ။', installOther2: 'Install app, Add to Home screen သို့မဟုတ် Create shortcut ကိုရွေးပါ။', installOther3: 'Add သို့မဟုတ် Install ကို အတည်ပြုပါ။', installGuideNote: 'ရွေးချယ်စရာမပေါ်ပါက အခြား app အတွင်း browser မဟုတ်ဘဲ Safari သို့မဟုတ် Chrome မှ ဖွင့်ပါ။'
  });
  Object.assign(messages.en, {
    installApp: 'Add to phone', installEyebrow: 'QUICK ACCESS', installGuideTitle: 'Add MM VOICE to your Home Screen', installGuideIntro: 'After adding it, launch MM VOICE from your phone’s Home Screen like an app.', installGuideClose: 'Close',
    installIos1: 'Open MM VOICE in Safari.', installIos2: 'Tap Share.', installIos3: 'Choose Add to Home Screen. If it is missing, add it from Edit Actions.', installIos4: 'Turn on Open as Web App, then tap Add.',
    installAndroid1: 'Open MM VOICE in Chrome (not inside another app’s browser).', installAndroid2: 'Tap the ⋮ menu in the top-right corner.', installAndroid3: 'Choose Install app or Add to Home screen.', installAndroid4: 'Confirm Add or Install.',
    installOther1: 'Open your browser’s menu.', installOther2: 'Choose Install app, Add to Home screen, or Create shortcut.', installOther3: 'Confirm Add or Install.', installGuideNote: 'If the option is missing, open MM VOICE in Safari or Chrome instead of an in-app browser.'
  });
  Object.assign(uiText.my, {sourceBy: 'ရင်းမြစ်:', authTagline: 'မြန်မာနှင့် သက်ဆိုင်သော သတင်းများကို မြန်မာဘာသာဖြင့် ဖတ်ရှုရန်'});
  Object.assign(uiText.en, {sourceBy: 'Source:', authTagline: 'Myanmar-related news summarized in Burmese with original source links'});
  let news = [], globalNews = [], jobs = [], notifications = [], publisherNews = [], publisherDirectory = {myanmar: [], global: []}, currentView = 'home', activePost = null, lastFocus = null;
  const notificationReadStorageKey = 'mmvoice.notifications.read.v1', audioQuotaStorageKey = 'mmvoice.audioQuotaUntil.v1';
  const notificationReadIds = new Set();
  try { for (const id of JSON.parse(localStorage.getItem(notificationReadStorageKey) || '[]')) notificationReadIds.add(String(id)); } catch {}
  const audioElement = $('audio-element'), audioPlayer = $('audio-player'), audioQueueCache = new Map();
  let audioQuotaUntil = 0, activeShareItem = null, lastShareTrigger = null;
  try { audioQuotaUntil = Number(localStorage.getItem(audioQuotaStorageKey)) || 0; if (audioQuotaUntil <= Date.now()) { audioQuotaUntil = 0; localStorage.removeItem(audioQuotaStorageKey); } } catch {}
  try {
    const storedVolume = localStorage.getItem('mmvoice.audioVolume.v1');
    if (storedVolume !== null && Number.isFinite(Number(storedVolume))) audioElement.volume = Math.max(0, Math.min(1, Number(storedVolume)));
    audioElement.muted = localStorage.getItem('mmvoice.audioMuted.v1') === 'true';
  } catch {}
  let audioQueue = [], audioIndex = -1, audioRegion = 'myanmar', audioRequestId = 0, audioSeeking = false;
  let toastTimer, pullStatusTimer, drawerCloseTimer, searchCloseTimer, refreshing = false, notificationsLoading = false, globalLoading = false, globalLoaded = false, publishersLoading = new Set(), publisherRegion = 'myanmar', publishersLoaded = {myanmar: false, global: false}, publishersErrors = {myanmar: false, global: false}, publisherMetadata = null, profile = null, profilePane = 'settings', previousView = 'home', aboutReturnView = 'home', currentPublisherName = '', publisherLoadToken = 0;
  let savedIds = new Set(), likedIds = new Set(), viewedPostKeys = new Set(), fallbackCommunityVisitorId = '';
  try { savedIds = new Set(JSON.parse(localStorage.getItem('mmvoice.savedStories.v2') || '[]').map(String)); } catch {}
  try { localStorage.removeItem('mmvoice.likedStories.v1'); } catch {}
  try { viewedPostKeys = new Set(JSON.parse(sessionStorage.getItem('mmvoice.viewedPosts.v1') || '[]').map(String)); } catch {}
  try { profile = JSON.parse(localStorage.getItem('mmvoice.profile.v1') || 'null'); } catch {}
  const roleKey = () => profile?.role && roles[profile.role] ? profile.role : null;
  const postKey = (item) => String(item.postKey || item.id || item.title || 'unknown');
  function createCommunityVisitorId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (part) => { const value = Math.floor(Math.random() * 16); return (part === 'x' ? value : (value & 3) | 8).toString(16); });
  }
  function communityVisitorId() {
    const storageKey = 'mmvoice.communityVisitor.v1';
    try {
      const existing = localStorage.getItem(storageKey) || '';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
      const created = createCommunityVisitorId(); localStorage.setItem(storageKey, created); return created;
    } catch {}
    if (!fallbackCommunityVisitorId) fallbackCommunityVisitorId = createCommunityVisitorId();
    return fallbackCommunityVisitorId;
  }
  function persistNotificationReadIds() {
    try { localStorage.setItem(notificationReadStorageKey, JSON.stringify([...notificationReadIds].slice(-200))); } catch {}
  }
  function notificationId(item) { return String(item.notificationId || item.id || item.postKey || ''); }
  function updateNotificationBadge() {
    const badge = $('notification-badge'), button = $('notification-toggle');
    if (!badge || !button) return;
    const unread = notifications.reduce((count, item) => count + (notificationId(item) && !notificationReadIds.has(notificationId(item)) ? 1 : 0), 0);
    const labelCount = unread > 9 ? '9+' : String(unread);
    badge.textContent = labelCount; badge.hidden = unread === 0;
    button.setAttribute('aria-label', unread ? t('notificationsUnreadLabel').replace('{count}', labelCount) : t('notifications'));
  }
  function markNotificationsRead() {
    for (const item of notifications) { const id = notificationId(item); if (id) notificationReadIds.add(id); }
    persistNotificationReadIds(); updateNotificationBadge();
  }
  const postType = (item) => item.type === 'job' ? 'job' : 'news';
  const postTitle = (item) => item.title || item.titleMm || (language === 'en' ? 'Story' : 'အကြောင်းအရာ');
  const postBody = (item) => item.body || item.summaryMm || item.description || '';
  const postCategory = (item) => item.category || item.categoryMm || (postType(item) === 'job' ? t('jobType') : t('newsType'));
  const postDate = (item) => item.createdAt || item.publishedAt || null;
  function publisherInitials(name) {
    const words = String(name || '').trim().split(/[\s-]+/u).filter(Boolean);
    return words.length > 1 ? words.slice(0, 2).map((word) => Array.from(word)[0]).join('').toLocaleUpperCase() : Array.from(String(name || '').trim()).slice(0, 2).join('').toLocaleUpperCase();
  }
  const normalizePublisherName = (name) => String(name || '').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const publisherLogoPaths = new Map([
    ['BBC Burmese', '/images/publishers/bbc-burmese-avatar.png'],
    ['Democratic Voice of Burma', '/images/publishers/democratic-voice-of-burma.png'],
    ['Independent Mon News Agency - IMNA (မွန်သတင်းအေဂျင်စီ)', '/images/publishers/imna.png'],
    ['Kachin News Group - KNG (ကချင်သတင်းဌာန)', '/images/publishers/kachin-news-group.png'],
    ['Kantarawaddy Times (ကန္တာရဝတီတိုင်း(မ်) - ကယား)', '/images/publishers/kantarawaddy-times.png'],
    ['Karen Information Center - KIC (ကရင်သတင်းဌာန)', '/images/publishers/karen-information-center-256.png'],
    ['MPA', '/images/publishers/mpa-256.png'],
    ['Mekong News', '/images/publishers/mekong-news-favicon.png'],
    ['Myaelatt Athan (မြေလတ်အသံ)', '/images/publishers/myaelatt-athan-256.png'],
    ['Myanmar Now', '/images/publishers/myanmar-now-256.png'],
    ['Narinjara News (နိရဉ္စရာ သတင်းဌာန - ရခိုင်)', '/images/publishers/narinjara.png'],
    ['Radio Free Asia Burmese', '/images/publishers/radio-free-asia.png'],
    ['Shan Herald Agency for News - SHAN (ရှမ်းသတင်းဌာန)', '/images/publishers/shan-herald-mark.png'],
    ['Tachileik News Agency (တာချီလိတ်သတင်းအေဂျင်စီ)', '/images/publishers/tachileik-news-agency.png'],
    ['Than Lwin Times', '/images/publishers/than-lwin-times.png'],
    ['The Irrawaddy Burmese', '/images/publishers/the-irrawaddy.png'],
    ['VOA Burmese', '/images/publishers/voa-burmese.png']
  ].map(([name, path]) => [normalizePublisherName(name), path]));
  const publisherDarkLogoKeys = new Set(['myanmar now']);
  function renderPublisherAvatar(avatar, name) {
    avatar.replaceChildren();
    avatar.setAttribute('aria-label', name);
    const publisherKey = normalizePublisherName(name);
    const path = publisherLogoPaths.get(publisherKey);
    avatar.classList.toggle('has-logo', Boolean(path));
    avatar.classList.toggle('logo-dark', publisherDarkLogoKeys.has(publisherKey));
    if (!path) { avatar.textContent = publisherInitials(name); return; }
    const image = document.createElement('img');
    image.src = path; image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
    image.addEventListener('error', () => { if (image.parentElement !== avatar) return; avatar.classList.remove('has-logo'); avatar.replaceChildren(); avatar.textContent = publisherInitials(name); }, {once: true});
    avatar.append(image);
  }
  function renderPublisherDirectoryAvatar(avatar, source) {
    const name = String(source.sourceName || '').trim(), key = normalizePublisherName(name);
    const localLogo = publisherLogoPaths.get(key) || '';
    let officialSite = '', officialFavicon = '';
    try {
      const site = new URL(String(source.websiteUrl || source.officialWebsite || ''), location.origin);
      if (site.protocol === 'https:') { officialSite = site.origin; officialFavicon = new URL('/favicon.ico', site.origin).href; }
    } catch {}
    avatar.replaceChildren(); avatar.setAttribute('aria-hidden', 'true');
    if (!localLogo && !officialFavicon) { avatar.classList.remove('has-logo'); avatar.textContent = publisherInitials(name); return; }
    avatar.classList.add('has-logo'); avatar.classList.toggle('logo-dark', publisherDarkLogoKeys.has(key)); avatar.textContent = '';
    const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => {
      if (image.dataset.googleFallback !== 'true' && officialSite) {
        image.dataset.googleFallback = 'true'; image.src = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(officialSite)}&sz=96`; return;
      }
      avatar.classList.remove('has-logo'); avatar.replaceChildren(); avatar.textContent = publisherInitials(name);
    });
    avatar.append(image); image.src = localLogo || officialFavicon;
  }
  function applyLanguage() {
    document.documentElement.lang = language === 'my' ? 'my' : 'en';
    document.title = language === 'my' ? 'MM VOICE — မြန်မာ့သတင်း' : 'MM VOICE — Myanmar news in Burmese';
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel)); });
    $('search-toggle').setAttribute('aria-label', t('searchLabel'));
    $('search-close').setAttribute('aria-label', t('searchClose'));
    $('refresh').setAttribute('aria-label', t('refreshLabel'));
    $('jobs-refresh').setAttribute('aria-label', t('refreshLabel'));
    $('search-submit').setAttribute('aria-label', t('searchSubmitLabel'));
    if (!$('pull-indicator').dataset.state || $('pull-indicator').dataset.state === 'pull') $('pull-indicator-text').textContent = t('pullHint');
    else if ($('pull-indicator').dataset.state === 'armed') $('pull-indicator-text').textContent = t('pullRefresh');
    $('notifications-caption').textContent = notificationCopy[language].caption;
    $('notifications-empty-copy').textContent = notificationCopy[language].empty;
    $('notifications-refresh').setAttribute('aria-label', t('refreshLabel'));
    $('global-refresh').setAttribute('aria-label', t('refreshGlobalLabel'));
    document.querySelectorAll('.language-option').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    updateProfilePreference();
    updateAudioPlayButton(); updateNotificationBadge();
    if (news.length || globalNews.length || jobs.length || notifications.length) renderCurrentFeed();
    if (currentView === 'publishers') renderPublishers();
    if (profilePane === 'publisher') renderPublisherProfile();
  }
  function dateLabel(value) {
    if (!value) return t('updated');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('updated');
    try { return new Intl.DateTimeFormat(language === 'my' ? 'my-MM' : 'en-US', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok'}).format(date); }
    catch { return date.toLocaleDateString(); }
  }
  function timeAgo(value) {
    if (!value) return t('recent');
    const date = new Date(value), seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (Number.isNaN(date.getTime())) return t('recent');
    const [unit, amount] = seconds < 60 ? ['second', seconds] : seconds < 3600 ? ['minute', Math.floor(seconds / 60)] : seconds < 86400 ? ['hour', Math.floor(seconds / 3600)] : seconds < 2592000 ? ['day', Math.floor(seconds / 86400)] : seconds < 31536000 ? ['month', Math.floor(seconds / 2592000)] : ['year', Math.floor(seconds / 31536000)];
    try { return new Intl.RelativeTimeFormat(language === 'my' ? 'my' : 'en', {numeric: 'auto'}).format(-amount, unit); }
    catch { return dateLabel(value); }
  }
  function setTheme(dark, persist = false) {
    const enabled = Boolean(dark);
    document.documentElement.dataset.theme = enabled ? 'dark' : 'light';
    document.documentElement.style.colorScheme = enabled ? 'dark' : 'light';
    document.querySelectorAll('.switch-control').forEach((toggle) => {
      toggle.setAttribute('aria-checked', String(enabled));
      toggle.setAttribute('aria-label', t('themeTitle'));
    });
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = enabled ? '#0F172A' : '#1A2B49';
    if (persist) { try { localStorage.setItem('mmvoice.theme.v1', enabled ? 'dark' : 'light'); } catch {} }
  }
  function formatCount(value) {
    const count = Number(value);
    return new Intl.NumberFormat(language === 'my' ? 'my-MM' : 'en-US').format(Number.isFinite(count) ? count : 0);
  }
  function showToast(text) {
    const node = $('toast'); node.textContent = text; node.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 2600);
  }
  function setPullStatus(text, state = 'pull') {
    const indicator = $('pull-indicator');
    clearTimeout(pullStatusTimer);
    indicator.dataset.state = state;
    indicator.classList.remove('is-hiding');
    indicator.classList.toggle('is-pulling', state === 'pull');
    indicator.classList.toggle('is-armed', state === 'armed');
    indicator.classList.toggle('is-loading', state === 'loading');
    indicator.classList.toggle('is-error', state === 'error');
    indicator.classList.toggle('is-success', state === 'success');
    indicator.setAttribute('aria-busy', String(state === 'loading'));
    $('pull-indicator-text').textContent = text;
    indicator.hidden = false;
    if (state !== 'pull' && state !== 'armed') indicator.style.setProperty('--pull-offset', '14px');
    if (state === 'success' || state === 'error') pullStatusTimer = setTimeout(dismissPullIndicator, 1900);
  }
  function dismissPullIndicator() {
    const indicator = $('pull-indicator');
    clearTimeout(pullStatusTimer);
    indicator.classList.remove('is-pulling', 'is-armed', 'is-loading', 'is-success', 'is-error');
    indicator.classList.add('is-hiding');
    indicator.setAttribute('aria-busy', 'false');
    pullStatusTimer = setTimeout(() => {
      indicator.hidden = true;
      indicator.dataset.state = '';
      indicator.classList.remove('is-hiding');
      indicator.style.removeProperty('--pull-offset');
      indicator.style.removeProperty('--pull-progress');
    }, 280);
  }
  async function api(path, options = {}) {
    const headers = {...(options.body ? {'content-type': 'application/json'} : {}), ...(options.headers || {})};
    const response = await fetch(path, {cache: 'no-store', credentials: 'same-origin', ...options, headers});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Request failed');
    return data;
  }
  function analyticsDayKey() {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }
  function trackAnonymousActivity() {
    let visit = true, active = true;
    try {
      const now = Date.now(), sessionKey = 'mmvoice.analytics.last-visit.v1', activeKey = 'mmvoice.analytics.active-day.v1';
      const last = Number(sessionStorage.getItem(sessionKey) || 0);
      visit = !last || now - last >= 30 * 60 * 1000;
      sessionStorage.setItem(sessionKey, String(now));
      const day = analyticsDayKey(); active = localStorage.getItem(activeKey) !== day;
      if (active) localStorage.setItem(activeKey, day);
    } catch {}
    if (!visit && !active) return;
    fetch('/api/analytics/visit', {method: 'POST', credentials: 'same-origin', headers: {'content-type': 'application/json'}, body: JSON.stringify({visit, active, visitorId: communityVisitorId()}), keepalive: true}).catch(() => {});
  }
  function makeViewCountBadge(item, detail = false, includeLabel = detail) {
    const badge = document.createElement('span'); badge.className = detail ? 'detail-view-count' : 'post-view-count';
    badge.dataset.postKey = postKey(item);
    const icon = document.createElement('span'); icon.className = 'view-eye'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = '👁️';
    const value = document.createElement('span'); value.className = detail ? 'detail-view-value' : 'post-view-value'; if (detail) value.id = 'detail-view-value'; value.textContent = formatCount(Number(item.viewCount || 0));
    badge.append(icon, value);
    if (includeLabel) { const label = document.createElement('span'); label.textContent = t('views'); badge.append(label); }
    badge.setAttribute('aria-label', `${value.textContent} ${t('views')}`);
    return badge;
  }
  function updatePostViewCount(item, count) {
    if (!item) return;
    const key = postKey(item), formatted = formatCount(count);
    item.viewCount = Number(count) || 0;
    document.querySelectorAll('.post-view-count').forEach((badge) => {
      if (badge.dataset.postKey !== key) return;
      const value = badge.querySelector('.post-view-value'); if (value) value.textContent = formatted;
      badge.setAttribute('aria-label', `${formatted} ${t('views')}`);
    });
    const detailBadge = $('detail-view-count');
    if (detailBadge && activePost && postKey(activePost) === key) {
      const value = $('detail-view-value'); if (value) value.textContent = formatted;
      detailBadge.dataset.postKey = key; detailBadge.hidden = postType(item) !== 'news';
      detailBadge.setAttribute('aria-label', `${formatted} ${t('views')}`);
    }
  }
  async function recordPostView(item) {
    if (!item || postType(item) !== 'news') return;
    const key = postKey(item);
    if (viewedPostKeys.has(key)) return;
    viewedPostKeys.add(key);
    try { sessionStorage.setItem('mmvoice.viewedPosts.v1', JSON.stringify([...viewedPostKeys])); } catch {}
    trackAnonymousActivity();
    try {
      const data = await api(`/api/posts/${encodeURIComponent(key)}/view`, {method: 'POST', body: JSON.stringify({visitorId: communityVisitorId()})});
      updatePostViewCount(item, Number(data.viewCount || 0));
    } catch { viewedPostKeys.delete(key); try { sessionStorage.setItem('mmvoice.viewedPosts.v1', JSON.stringify([...viewedPostKeys])); } catch {} }
  }
  function safeImage(item, index = 0) {
    const value = item.imageUrl || item.image || '';
    if (typeof value === 'string' && (/^\/images\/[A-Za-z0-9._/-]+$/.test(value) || /^https:\/\//i.test(value) || /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value))) return value;
    return '';
  }
  function isVideoEmbed(value) {
    try {
      const url = new URL(value, location.origin);
      if (url.protocol !== 'https:' || url.username || url.password) return false;
      if (url.hostname === 'www.youtube-nocookie.com' && /^\/embed\/[A-Za-z0-9_-]{11}\/?$/.test(url.pathname)) return true;
      return url.hostname === 'player.vimeo.com' && /^\/video\/\d+\/?$/.test(url.pathname);
    } catch { return false; }
  }
  function makeVideoEmbed(value, title, loading = 'lazy') {
    if (!isVideoEmbed(value)) return null;
    const frame = document.createElement('iframe');
    frame.className = 'post-video post-video-embed'; frame.src = value; frame.title = title;
    frame.loading = loading; frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    return frame;
  }
  function safeVideo(item) {
    const value = item.videoUrl || item.video_url || '';
    try {
      const url = new URL(value, location.origin);
      if (url.protocol !== 'https:' || url.username || url.password) return '';
      if (isVideoEmbed(url.href)) return url.href;
      if (!/\.(?:mp4|webm|ogv)$/i.test(url.pathname)) return '';
      return url.href;
    } catch { return ''; }
  }
  function normalizeManual(post) {
    return {...post, type: post.type || 'news', title: post.title || '', titleMm: post.title, categoryMm: post.category, summaryMm: post.body, body: post.body, image: post.image || post.imageUrl || '', imageUrl: post.imageUrl, sourceName: post.sourceName, sourceUrl: post.sourceUrl, postKey: post.id};
  }
  function sortNewest(items) {
    const unique = new Map();
    for (const item of items) {
      const source = safeSourceUrl(item.sourceUrl), key = source || postKey(item), previous = unique.get(key);
      if (!previous || (item.originalTitle && !previous.originalTitle)) unique.set(key, item);
    }
    return [...unique.values()].sort((a, b) => (Date.parse(postDate(b) || '') || 0) - (Date.parse(postDate(a) || '') || 0) || String(b.id || '').localeCompare(String(a.id || '')));
  }
  function safeSourceUrl(value) { try { const u = new URL(value, location.origin); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } }
  function emptyState(title, text) {
    const wrap = document.createElement('div'); wrap.className = 'empty-state';
    const inner = document.createElement('div'), strong = document.createElement('strong');
    strong.textContent = title; inner.append(strong); if (text) { const p = document.createElement('p'); p.textContent = text; inner.append(p); } wrap.append(inner); return wrap;
  }
  function isScam(item) { return Boolean(item.isScamAlert || item.is_scam_alert) || /(\bscam\b|\bfraudulent\b|advance[- ]fee scam|upfront[- ]fee scam|လိမ်လည်မှု|အလုပ်လိမ်လည်|အလုပ်အတု|အလိမ်အညာ)/i.test(`${item.title || ''} ${item.body || item.summaryMm || ''} ${item.category || item.categoryMm || ''}`); }
  function roleScore(item) {
    const key = roleKey(); if (!key) return 0;
    const text = `${postTitle(item)} ${postBody(item)} ${postCategory(item)} ${item.location || ''}`.toLocaleLowerCase();
    return roles[key].keywords.reduce((sum, word) => sum + (text.includes(word.toLocaleLowerCase()) ? 1 : 0), 0);
  }
  function getRoleMatch(items) {
    if (!roleKey()) return null;
    return [...items].filter((item) => roleScore(item) > 0).sort((a, b) => roleScore(b) - roleScore(a) || (Date.parse(postDate(b) || '') || 0) - (Date.parse(postDate(a) || '') || 0))[0] || null;
  }
  function addPublicIcon(parent) {
    const privacy = document.createElement('span'); privacy.className = 'public-privacy';
    privacy.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>';
    const label = document.createElement('span'); label.textContent = t('public'); privacy.append(label); parent.append(privacy);
  }
  function hydrateCounters(item, card) {
    if (!card.isConnected || card.dataset.countsLoaded === 'true') return;
    card.dataset.countsLoaded = 'true';
    api(`/api/engagement?postKey=${encodeURIComponent(postKey(item))}&visitorId=${encodeURIComponent(communityVisitorId())}`).then((data) => {
      if (card.isConnected) applyEngagement(postKey(item), data);
    }).catch(() => {
      if (!card.isConnected) return;
      const likes = card.querySelector('[data-like-count]'), comments = card.querySelector('[data-comment-count]'), likeAction = card.querySelector('[data-like-action]');
      likes.dataset.baseCount = '0'; likes.textContent = '0'; comments.textContent = '—';
      if (likeAction) likeAction.setAttribute('aria-pressed', 'false');
    });
  }
  const counterObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { const card = entry.target; counterObserver.unobserve(card); hydrateCounters(card._postItem, card); recordPostView(card._postItem); } });
  }, {rootMargin: '0px', threshold: 0.01}) : null;
  function setInlineExpanded(card, expanded) {
    const body = card.querySelector('.post-body-content'), button = card.querySelector('.see-more-button');
    if (!body || !button) return;
    const viewCountBadge = card.querySelector('.expanded-post-view-count');
    if (viewCountBadge) viewCountBadge.hidden = !expanded;
    if (expanded) {
      recordPostView(card._postItem);
      body.classList.add('is-expanded');
      body.style.maxHeight = `${body.scrollHeight}px`;
      button.textContent = t('seeLess'); button.setAttribute('aria-expanded', 'true');
      const credits = card.querySelector('.post-credits'); if (credits) credits.hidden = false;
      window.setTimeout(() => { if (body.classList.contains('is-expanded')) body.style.maxHeight = 'none'; }, 360);
    } else {
      body.style.maxHeight = `${body.scrollHeight}px`;
      body.classList.remove('is-expanded');
      requestAnimationFrame(() => { body.style.maxHeight = ''; });
      button.textContent = t('seeMore'); button.setAttribute('aria-expanded', 'false');
      const credits = card.querySelector('.post-credits'); if (credits) credits.hidden = !expanded;
    }
  }
  function expandInlinePost(item, scrollIntoView = false) {
    const key = postKey(item);
    let card = [...document.querySelectorAll('.post-card')].find((candidate) => candidate.dataset.postKey === key);
    if (!card) {
      const slot = $(postType(item) === 'job' ? 'personalized-jobs' : 'personalized-news');
      if (slot) {
        card = makeCard(item, 0, postType(item) === 'job');
        slot.append(card);
      }
    }
    if (card) {
      setInlineExpanded(card, true);
      if (scrollIntoView) card.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }
  function makeCommentNode(comment, inline) {
    const row = document.createElement('li'); row.className = inline ? 'inline-comment' : 'comment-item';
    const author = document.createElement('strong'), body = document.createElement('p'), time = document.createElement('time');
    author.textContent = comment.author || 'Community member'; body.textContent = comment.body || ''; time.textContent = dateLabel(comment.createdAt);
    row.append(author, time, body); return row;
  }
  function renderCommentList(items, list, inline) {
    list.replaceChildren();
    if (items?.length) { for (const comment of items) list.append(makeCommentNode(comment, inline)); return; }
    const empty = document.createElement('li'); empty.className = inline ? 'inline-comment-empty' : 'comment-empty'; empty.textContent = t('noComments'); list.append(empty);
  }
  function updateCommentCount(key, count) {
    document.querySelectorAll('.post-card').forEach((card) => {
      if (card.dataset.postKey !== key) return;
      const node = card.querySelector('[data-comment-count]'); if (node) node.textContent = formatCount(count);
    });
  }
  function createCommentForm(item, list, inline) {
    const form = document.createElement('form'); form.className = inline ? 'inline-comment-form' : 'comment-form'; form.dataset.postKey = postKey(item);
    const textarea = document.createElement('textarea'); textarea.name = 'body'; textarea.rows = 3; textarea.maxLength = 2000; textarea.required = true; textarea.minLength = 2; textarea.placeholder = t('commentPlaceholder'); textarea.setAttribute('aria-label', t('commentPlaceholder'));
    const button = document.createElement('button'); button.type = 'submit'; button.className = inline ? 'inline-comment-join' : 'comment-join'; button.textContent = t('commentSubmit');
    const notice = document.createElement('p'); notice.className = 'comment-loading'; notice.textContent = t('commentPublicNotice');
    form.append(textarea, button, notice);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); const body = textarea.value.trim(); if (body.length < 2) { textarea.focus(); return; }
      textarea.disabled = true; button.disabled = true;
      try {
        const data = await api('/api/comments', {method: 'POST', body: JSON.stringify({postKey: postKey(item), body, visitorId: communityVisitorId()})});
        if (!data.item) throw new Error('invalid_response');
        list.querySelector('.inline-comment-empty,.comment-empty,.empty-state')?.remove(); list.prepend(makeCommentNode(data.item, inline));
        if (Number.isFinite(Number(data.count))) updateCommentCount(postKey(item), Number(data.count));
        textarea.value = ''; showToast(t('commentSent'));
      } catch (error) { showToast(error.message === 'comment_rate_limited' ? t('commentRateLimited') : t('commentFailed')); }
      finally { textarea.disabled = false; button.disabled = false; }
    });
    return form;
  }
  async function loadInlineComments(item, card, panel) {
    if (panel.dataset.commentsLoaded === 'true') return;
    panel.dataset.commentsLoaded = 'true'; panel.replaceChildren();
    const status = document.createElement('p'); status.className = 'comment-loading'; status.textContent = t('commentLoading'); panel.append(status);
    try {
      const data = await api(`/api/comments?postKey=${encodeURIComponent(postKey(item))}`);
      if (!card.isConnected) return;
      panel.replaceChildren(); const heading = document.createElement('h3'); heading.textContent = t('communityComments'); panel.append(heading);
      const comments = document.createElement('ul'); comments.className = 'inline-comment-list'; renderCommentList(data.items, comments, true);
      panel.append(comments, createCommentForm(item, comments, true));
    } catch {
      if (!card.isConnected) return;
      panel.dataset.commentsLoaded = 'false'; panel.replaceChildren();
      const heading = document.createElement('h3'); heading.textContent = t('communityComments');
      const status = document.createElement('p'); status.className = 'comment-loading'; status.textContent = t('commentsUnavailable');
      const comments = document.createElement('ul'); comments.className = 'inline-comment-list'; renderCommentList([], comments, true);
      panel.append(heading, status, comments, createCommentForm(item, comments, true));
    }
  }
  function persistSavedIds() { try { localStorage.setItem('mmvoice.savedStories.v2', JSON.stringify([...savedIds])); } catch {} }
  function updateSavedButtons(key, saved) {
    document.querySelectorAll('.post-card').forEach((card) => {
      if (card.dataset.postKey !== key) return;
      const button = card.querySelector('[data-save-action]');
      if (button) { button.setAttribute('aria-pressed', String(saved)); const label = button.querySelector('.action-label'); if (label) label.textContent = t(saved ? 'saved' : 'save'); }
    });
    const detailButton = $('detail-bookmark');
    if (detailButton && activePost && postKey(activePost) === key) { detailButton.setAttribute('aria-pressed', String(saved)); const label = detailButton.querySelector('[data-i18n]'); if (label) label.textContent = t(saved ? 'saved' : 'save'); }
  }
  function toggleBookmark(item, button) {
    if (!item) return;
    recordPostView(item);
    const key = postKey(item), saved = !savedIds.has(key);
    if (saved) savedIds.add(key); else savedIds.delete(key);
    persistSavedIds(); updateSavedButtons(key, saved);
    if (button && button.id === 'detail-bookmark') { button.setAttribute('aria-pressed', String(saved)); const label = button.querySelector('[data-i18n]'); if (label) label.textContent = t(saved ? 'saved' : 'save'); }
    if (currentView === 'profile' && profilePane === 'saved') renderSaved();
    showToast(saved ? (language === 'en' ? 'Saved on this device.' : 'ဒီစက်ထဲမှာ သိမ်းပြီးပါပြီ။') : (language === 'en' ? 'Removed from saved posts.' : 'သိမ်းထားတာထဲက ဖယ်လိုက်ပါပြီ။'));
  }
  function applyEngagement(key, data) {
    const count = Number(data.count) || 0, liked = Boolean(data.liked);
    if (liked) likedIds.add(key); else likedIds.delete(key);
    document.querySelectorAll('.post-card').forEach((card) => {
      if (card.dataset.postKey !== key) return;
      const likeAction = card.querySelector('[data-like-action]'), likes = card.querySelector('[data-like-count]');
      if (likes) { likes.dataset.baseCount = String(count); likes.textContent = formatCount(count); }
      if (likeAction) likeAction.setAttribute('aria-pressed', String(liked));
    });
    if (Number.isFinite(Number(data.commentCount))) updateCommentCount(key, Number(data.commentCount));
    const detailLike = $('detail-like'), detailCount = $('like-count');
    if (detailLike && activePost && postKey(activePost) === key) {
      detailLike.setAttribute('aria-pressed', String(liked));
      if (detailCount) { detailCount.dataset.baseCount = String(count); detailCount.textContent = formatCount(count); }
    }
  }
  function engagementPath(item) { return `/api/engagement?postKey=${encodeURIComponent(postKey(item))}&visitorId=${encodeURIComponent(communityVisitorId())}`; }
  async function toggleLike(item, button) {
    if (!item) return;
    recordPostView(item);
    const key = postKey(item), controls = [...document.querySelectorAll('.post-card')].filter((card) => card.dataset.postKey === key).map((card) => card.querySelector('[data-like-action]')).filter(Boolean);
    const detailLike = $('detail-like'); if (detailLike && activePost && postKey(activePost) === key) controls.push(detailLike);
    if (button && !controls.includes(button)) controls.push(button);
    controls.forEach((control) => { control.disabled = true; });
    try {
      const current = await api(engagementPath(item)); applyEngagement(key, current);
      const data = await api('/api/likes', {method: 'POST', body: JSON.stringify({postKey: key, visitorId: communityVisitorId(), liked: !Boolean(current.liked)})});
      applyEngagement(key, data); showToast(t(data.liked ? 'likeAdded' : 'likeRemoved'));
    } catch { showToast(t('likeFailed')); }
    finally { controls.forEach((control) => { control.disabled = false; }); }
  }
  function makeCard(item, index = 0, isJob = false) {
    const card = document.createElement('article'); card.className = 'post-card'; card.dataset.postKey = postKey(item); card.dataset.postType = postType(item); card._postItem = item;
    const header = document.createElement('div'); header.className = 'post-header';
    const avatar = document.createElement('span'); avatar.className = 'post-avatar';
    const publisherName = !isJob ? String(item.sourceName || item.sourceTitle || '').trim() : '';
    if (publisherName) {
      avatar.classList.add('publisher-avatar');
      renderPublisherAvatar(avatar, publisherName);
      avatar.setAttribute('aria-hidden', 'true');
    } else {
      const avatarImage = document.createElement('img'); avatarImage.src = '/images/mm-voice-logo.svg'; avatarImage.alt = ''; avatar.append(avatarImage);
    }
    const author = document.createElement(publisherName ? 'button' : 'div'); author.className = `post-author${publisherName ? ' publisher-profile-button' : ''}`;
    if (publisherName) {
      author.type = 'button'; author.setAttribute('aria-label', `${t('viewPublisherProfile')}: ${publisherName}`);
      author.addEventListener('click', (event) => { event.stopPropagation(); openPublisherProfile(publisherName); });
    }
    const name = document.createElement('strong'); name.textContent = publisherName || 'MM VOICE';
    const meta = document.createElement('div'); meta.className = 'post-meta';
    const time = document.createElement('time'); time.dateTime = postDate(item) || ''; time.textContent = timeAgo(postDate(item)); meta.append(time, document.createTextNode(' · '));
    addPublicIcon(meta);
    author.append(name, meta); header.append(avatar, author); card.append(header);

    const copy = document.createElement('div'); copy.className = 'post-copy';
    const title = document.createElement('h2'); title.className = 'post-title';
    const titleButton = document.createElement('button'); titleButton.type = 'button'; titleButton.className = 'post-title-button'; titleButton.textContent = postTitle(item);
    titleButton.addEventListener('click', (event) => { event.stopPropagation(); openPost(item); });
    title.append(titleButton); copy.append(title); card.append(copy);

    const imageUrl = safeImage(item, index), videoUrl = safeVideo(item);
    let imageWrap = null;
    const sourceName = String(item.sourceName || '').trim();
    const sourceUrl = safeSourceUrl(item.sourceUrl);
    let photoCredit = String(item.photoCredit || item.imageCredit || item.photographer || '').trim();
    if (!photoCredit && imageUrl && sourceName && sourceUrl) {
      try {
        const imageHost = new URL(imageUrl, location.origin).hostname.toLowerCase().split('.').slice(-2).join('.');
        const sourceHost = new URL(sourceUrl).hostname.toLowerCase().split('.').slice(-2).join('.');
        if (imageHost === sourceHost) photoCredit = sourceName;
      } catch {}
    }
    const bodyText = postBody(item).trim();
    const hasDescription = bodyText && bodyText !== postTitle(item);
    const hasCredits = Boolean(sourceName || (photoCredit && imageUrl));
    let sourceCredits = null;
    if (hasDescription || hasCredits) {
      const bodyArea = document.createElement('div'); bodyArea.className = 'post-body-area';
      const body = document.createElement('div'); body.className = 'post-body-content';
      if (hasDescription) body.append(document.createTextNode(bodyText));
      bodyArea.append(body);
      const longText = bodyText.length > 260 || bodyText.split(/\n/).length > 4;
      if (longText) body.classList.add('has-more');
      if (longText || hasCredits) {
        const more = document.createElement('button'); more.type = 'button'; more.className = 'see-more-button'; more.textContent = t('seeMore'); more.setAttribute('aria-expanded', 'false');
        more.addEventListener('click', () => setInlineExpanded(card, !body.classList.contains('is-expanded'))); bodyArea.append(more);
      }
      if (longText && postType(item) === 'news') {
        const expandedViewCount = makeViewCountBadge(item, false, true);
        expandedViewCount.classList.add('expanded-post-view-count'); expandedViewCount.hidden = true; bodyArea.append(expandedViewCount);
      }
      if (hasCredits) {
        sourceCredits = document.createElement('p'); sourceCredits.className = 'post-credits'; sourceCredits.hidden = true;
        if (sourceName) {
          const label = document.createElement('span'); label.textContent = t('sourceBy'); sourceCredits.append(label, document.createTextNode(' '));
          if (sourceUrl) { const link = document.createElement('a'); link.href = sourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = sourceName; sourceCredits.append(link); }
          else sourceCredits.append(document.createTextNode(sourceName));
        }
        if (photoCredit && imageUrl) {
          if (sourceName) sourceCredits.append(document.createTextNode(' · '));
          const label = document.createElement('span'); label.textContent = t('photoBy'); sourceCredits.append(label, document.createTextNode(` ${photoCredit}`));
        }
        bodyArea.append(sourceCredits);
      }
      card.append(bodyArea);
    }
    if (imageUrl || videoUrl) {
      imageWrap = document.createElement('div'); imageWrap.className = 'post-image-wrap';
      if (videoUrl) {
        const embed = makeVideoEmbed(videoUrl, postTitle(item));
        if (embed) imageWrap.append(embed);
        else {
          const video = document.createElement('video'); video.className = 'post-video'; video.src = videoUrl; video.controls = true; video.playsInline = true; video.preload = 'none'; video.title = postTitle(item);
          if (imageUrl) video.poster = imageUrl;
          video.addEventListener('click', (event) => event.stopPropagation());
          video.onerror = () => { if (!imageUrl) imageWrap.remove(); };
          imageWrap.append(video);
        }
        const inlineVideo = imageWrap.querySelector('video');
        const viewerButton = document.createElement('button'); viewerButton.type = 'button'; viewerButton.className = 'video-viewer-button';
        const viewerLabel = language === 'en' ? 'Open video viewer' : 'ဗီဒီယိုကို ကြီးကြီးကြည့်ရန်';
        viewerButton.setAttribute('aria-label', viewerLabel); viewerButton.title = viewerLabel;
        viewerButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/></svg>';
        viewerButton.addEventListener('click', (event) => {
          event.stopPropagation();
          const playback = inlineVideo ? {time: Number(inlineVideo.currentTime) || 0, resume: !inlineVideo.paused && !inlineVideo.ended} : null;
          inlineVideo?.pause(); openPost(item, true, playback);
        });
        imageWrap.append(viewerButton);
      } else {
        const image = document.createElement('img'); image.className = 'post-image'; image.src = imageUrl; image.alt = item.imageAlt || (language === 'en' ? 'Story image' : 'သတင်းပုံ'); image.loading = 'lazy'; image.onerror = () => imageWrap.remove(); imageWrap.append(image);
        if (item.illustrative) { const note = document.createElement('span'); note.className = 'image-note'; note.textContent = language === 'en' ? 'Illustrative image' : 'ကိုယ်စားပြုပုံ'; imageWrap.append(note); }
      }
      card.append(imageWrap);
    }

    const tags = document.createElement('div'); tags.className = 'post-label-row';
    if (isJob) { const category = document.createElement('span'); category.className = 'post-tag'; category.textContent = postCategory(item); tags.append(category); }
    if (isScam(item)) { const warning = document.createElement('span'); warning.className = 'post-tag scam'; warning.textContent = `⚠ ${t('scamTag')}`; tags.append(warning); }
    if (isJob) { const verified = document.createElement('span'); verified.className = `post-tag ${item.isVerified ? 'verified' : 'unverified'}`; verified.textContent = item.isVerified ? `✓ ${t('verified')}` : `⚠ ${t('unverified')}`; tags.append(verified); }
    if (tags.childElementCount) card.append(tags);

    const actions = document.createElement('div'); actions.className = 'post-action-row';
    const actionIcons = {
      like: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10.1-8.8 10.1S3.2 14 3.2 8.8A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 8.8 1.7Z"/></svg>',
      comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 9 9 0 0 1-4-.9L4 20l1.3-3.2A7 7 0 0 1 4 12c0-4.2 3.6-7.5 8-7.5s8 3.1 8 7Z"/></svg>',
      save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21z"/></svg>',
      share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4.2"/></svg>'
    };
    const makeAction = (icon, label, countKey, handler) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'post-action';
      if (icon === 'like') { button.dataset.likeAction = 'true'; button.setAttribute('aria-pressed', String(likedIds.has(postKey(item)))); }
      if (icon === 'save') { button.dataset.saveAction = 'true'; button.setAttribute('aria-pressed', String(savedIds.has(postKey(item)))); }
      const symbol = document.createElement('span'); symbol.className = 'action-icon'; symbol.innerHTML = actionIcons[icon];
      const text = document.createElement('span'); text.className = 'action-label'; text.textContent = label; button.append(symbol, text);
      if (countKey) { const count = document.createElement('span'); count.className = 'action-count'; count.dataset[countKey] = ''; count.textContent = '…'; button.append(count); }
      button.addEventListener('click', (event) => { event.stopPropagation(); handler(button); }); return button;
    };
    const commentPanel = document.createElement('section'); commentPanel.className = 'inline-comments'; commentPanel.hidden = true;
    const likeButton = makeAction('like', t('like'), 'likeCount', (button) => toggleLike(item, button));
    const commentButton = makeAction('comment', t('comment'), 'commentCount', (button) => {
      const open = commentPanel.hidden; commentPanel.hidden = !open; button.setAttribute('aria-expanded', String(open));
      if (open) { recordPostView(item); loadInlineComments(item, card, commentPanel); }
    });
    commentButton.setAttribute('aria-expanded', 'false');
    const saveButton = makeAction('save', t(savedIds.has(postKey(item)) ? 'saved' : 'save'), null, (button) => toggleBookmark(item, button));
    const shareButton = makeAction('share', t('share'), null, (button) => openShareSheet(item, button));
    actions.append(likeButton, commentButton, saveButton, shareButton);
    if (imageWrap) imageWrap.after(actions, commentPanel); else card.append(actions, commentPanel);
    if (counterObserver) counterObserver.observe(card); else { hydrateCounters(item, card); recordPostView(item); }
    return card;
  }
  function openShareSheet(item, trigger) {
    if (!item) return;
    activeShareItem = item; lastShareTrigger = trigger || document.activeElement;
    $('share-story-title').textContent = postTitle(item);
    $('share-status').textContent = '';
    const dialog = $('share-sheet');
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => document.querySelector('.share-option[data-share-destination="facebook"]')?.focus());
  }
  function closeShareSheet() {
    const dialog = $('share-sheet');
    if (dialog.open) dialog.close(); else dialog.removeAttribute('open');
  }
  function shareUrlFor(item) {
    const type = postType(item) === 'job' ? 'job' : 'news';
    const id = String(item.id || '').trim();
    if (id) return `${location.origin}/#/${type}/${encodeURIComponent(id)}`;
    return safeSourceUrl(item.sourceUrl) || location.href;
  }
  async function copyShareUrl(url) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const field = document.createElement('textarea'); field.value = url; field.setAttribute('readonly', '');
        field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field); field.select();
        const copied = document.execCommand('copy'); field.remove(); if (!copied) throw new Error('clipboard_unavailable');
      }
      return true;
    } catch { return false; }
  }
  async function shareCurrentPost(destination) {
    const item = activeShareItem;
    if (!item) return;
    const url = shareUrlFor(item), title = postTitle(item);
    if (destination === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
      closeShareSheet(); return;
    }
    if (destination === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'noopener,noreferrer');
      closeShareSheet(); return;
    }
    if (destination === 'messenger' && typeof navigator.share === 'function') {
      const sharing = navigator.share({title, text: title, url}).catch(() => {});
      closeShareSheet(); await sharing; return;
    }
    if (destination === 'messenger') window.open('https://www.messenger.com/', '_blank', 'noopener,noreferrer');
    const copied = await copyShareUrl(url);
    if (copied) {
      $('share-status').textContent = destination === 'messenger' ? t('shareMessengerFallback') : t('shareCopied');
    } else $('share-status').textContent = t('shareFailed');
  }
  function renderPersonalized(slotId, items, isJob) {
    const slot = $(slotId); slot.replaceChildren(); const matched = getRoleMatch(items); if (!matched) return;
    const card = document.createElement('article'); card.className = 'featured-card'; card.tabIndex = 0; card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `${t('featuredFor')}: ${postTitle(matched)}`);
    const imgWrap = document.createElement('div'); imgWrap.className = 'story-image-wrap';
    if (matched.imageUrl || matched.image) { const img = document.createElement('img'); img.className = 'story-image'; img.loading = 'lazy'; img.alt = ''; img.src = safeImage(matched, 0); img.onerror = () => imgWrap.remove(); imgWrap.append(img); }
    const copy = document.createElement('div'); copy.className = 'story-copy';
    const tag = document.createElement('span'); tag.className = 'featured-tag'; tag.textContent = `✦ ${t('featuredFor')} · ${t(`${roleKey()}RoleShort`)}`;
    const title = document.createElement('div'); title.className = 'story-title'; title.textContent = postTitle(matched); copy.append(tag, title);
    if (isJob) { const trust = document.createElement('div'); trust.className = matched.isVerified ? 'story-verified' : 'story-unverified'; trust.textContent = matched.isVerified ? `✓ ${t('verified')}` : `⚠ ${t('unverified')}`; copy.append(trust); }
    if (isScam(matched)) { const warning = document.createElement('div'); warning.className = 'story-scam-label'; warning.textContent = `⚠ ${t('scamTag')}`; copy.append(warning); }
    const arrow = document.createElement('span'); arrow.className = 'featured-arrow'; arrow.textContent = '›'; card.append(imgWrap, copy, arrow);
    card.addEventListener('click', () => expandInlinePost(matched, true)); card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); expandInlinePost(matched, true); } }); slot.append(card);
  }
  function visibleForSearch(items, isJob = false) {
    const query = searchInput.value.trim().toLocaleLowerCase();
    return items.filter((item) => { const text = `${postTitle(item)} ${postBody(item)} ${item.sourceName || ''} ${item.location || ''} ${item.salary || ''} ${postCategory(item)}`.toLocaleLowerCase(); return !query || text.includes(query); });
  }
  function renderHome() {
    if (!homeList) return; homeList.replaceChildren(); homeList.setAttribute('aria-busy', 'false');
    const visible = visibleForSearch(sortNewest([...news, ...jobs]));
    if (!visible.length) { homeList.append(emptyState(searchInput.value.trim() ? t('noMatches') : `${t('noNews')} · ${t('noJobs')}`, t('emptyText'))); return; }
    visible.forEach((item, index) => homeList.append(makeCard(item, index, postType(item) === 'job')));
  }
  function renderNews() {
    newsList.replaceChildren(); newsList.setAttribute('aria-busy', 'false');
    const visible = visibleForSearch(news);
    renderPersonalized('personalized-news', visible, false);
    if (!visible.length) { newsList.append(emptyState(searchInput.value.trim() ? t('noMatches') : t('noNews'), t('emptyText'))); return; }
    const featured = getRoleMatch(visible), chronological = featured ? visible.filter((item) => postKey(item) !== postKey(featured)) : visible;
    chronological.forEach((item, index) => newsList.append(makeCard(item, index, false)));
  }
  function renderGlobal() {
    if (!globalList) return;
    globalList.replaceChildren(); globalList.setAttribute('aria-busy', 'false');
    const visible = visibleForSearch(globalNews);
    if (!visible.length) { globalList.append(emptyState(searchInput.value.trim() ? t('noMatches') : t('globalNoNews'), t('emptyText'))); return; }
    visible.forEach((item, index) => globalList.append(makeCard(item, index, false)));
  }
  function renderJobs() {
    jobsList.replaceChildren(); jobsList.setAttribute('aria-busy', 'false');
    const visible = visibleForSearch(jobs, true);
    renderPersonalized('personalized-jobs', visible, true);
    if (!visible.length) { jobsList.append(searchInput.value.trim() ? emptyState(t('noJobMatches'), t('emptyText')) : emptyState(t('soon'), '')); return; }
    const featured = getRoleMatch(visible), chronological = featured ? visible.filter((item) => postKey(item) !== postKey(featured)) : visible;
    chronological.forEach((item, index) => jobsList.append(makeCard(item, index, true)));
  }
  function renderSaved() {
    const list = $('saved-list'); list.replaceChildren();
    const saved = [...news, ...jobs].filter((item) => savedIds.has(postKey(item)));
    if (!saved.length) { list.append(emptyState(t('savedHeading'), t('savedReadOnly'))); return; }
    sortNewest(saved).forEach((item, index) => list.append(makeCard(item, index, postType(item) === 'job')));
  }
  function renderPublisherLinks(publisher = publisherMetadata) {
    const container = $('publisher-links');
    if (!container) return;
    container.replaceChildren();
    const addLink = (urlValue, label, icon, className) => {
      let url;
      try { url = new URL(String(urlValue || '')); } catch { return; }
      if (url.protocol !== 'https:' || url.username || url.password) return;
      if (className === 'facebook-link' && !['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'www.fb.com'].includes(url.hostname.toLowerCase())) return;
      const link = document.createElement('a'); link.className = `publisher-profile-link ${className}`;
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.innerHTML = `${icon}<span>${label}</span>`;
      container.append(link);
    };
    addLink(publisher?.websiteUrl, 'Website', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>', 'website-link');
    addLink(publisher?.facebookUrl, 'Facebook', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.4 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.2V13H10v8z"/></svg>', 'facebook-link');
    container.hidden = !container.childElementCount;
  }
  function renderPublisherProfile() {
    const list = $('publisher-list');
    if (!list) return;
    $('publisher-name').textContent = currentPublisherName;
    renderPublisherAvatar($('publisher-avatar'), currentPublisherName);
    renderPublisherLinks(publisherMetadata);
    $('publisher-intro').textContent = t('publisherIntro');
    $('publisher-stories-heading').textContent = t('publisherNewsHeading');
    list.replaceChildren(); list.setAttribute('aria-busy', 'false');
    const visible = visibleForSearch(sortNewest(publisherNews));
    if (!visible.length) { list.append(emptyState(searchInput.value.trim() ? t('noMatches') : t('publisherNoNews'), t('emptyText'))); return; }
    visible.forEach((item, index) => list.append(makeCard(item, index, false)));
  }
  function renderPublishers() {
    const list = $('publishers-list');
    if (!list) return;
    list.replaceChildren();
    document.querySelectorAll('[data-publisher-region]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.publisherRegion === publisherRegion)));
    if (!publishersLoaded[publisherRegion]) {
      list.setAttribute('aria-busy', 'true'); list.append(emptyState(t('newsLoading'), '')); return;
    }
    list.setAttribute('aria-busy', 'false');
    const sources = publisherDirectory[publisherRegion] || [];
    if (!sources.length) { list.append(emptyState(publishersErrors[publisherRegion] ? t('publisherUnavailable') : t('noPublishers'), t('emptyText'))); return; }
    for (const source of sources) {
      const card = document.createElement('button'); card.type = 'button'; card.className = 'publisher-directory-card';
      const avatar = document.createElement('span'); avatar.className = 'publisher-directory-initial'; renderPublisherDirectoryAvatar(avatar, source);
      const copy = document.createElement('span'); copy.className = 'publisher-directory-copy';
      const name = document.createElement('strong'); name.textContent = source.sourceName;
      const region = document.createElement('small'); region.textContent = t(publisherRegion === 'global' ? 'publisherRegionGlobal' : 'publisherRegionBurma');
      copy.append(name, region);
      const arrow = document.createElement('span'); arrow.className = 'publisher-directory-arrow'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '›';
      card.append(avatar, copy, arrow); card.setAttribute('aria-label', `${t('viewPublisherProfile')}: ${source.sourceName}`);
      card.addEventListener('click', () => openPublisherProfile(source.sourceName)); list.append(card);
    }
  }
  async function loadPublishers(region = publisherRegion) {
    if (!['myanmar', 'global'].includes(region) || publishersLoaded[region] || publishersLoading.has(region)) { renderPublishers(); return; }
    publishersLoading.add(region); publishersErrors[region] = false;
    if (region === publisherRegion) renderPublishers();
    try {
      const data = await api(`/api/publishers?region=${encodeURIComponent(region)}`);
      publisherDirectory[region] = Array.isArray(data.items) ? data.items : [];
      publishersLoaded[region] = true;
    } catch {
      publisherDirectory[region] = []; publishersErrors[region] = true;
    } finally {
      publishersLoading.delete(region);
      if (region === publisherRegion && currentView === 'publishers') renderPublishers();
    }
  }
  function choosePublisherRegion(region) {
    if (!['myanmar', 'global'].includes(region)) return;
    publisherRegion = region; renderPublishers(); loadPublishers(region);
  }
  async function openPublisherProfile(name, updateRoute = true) {
    const sourceName = String(name || '').trim();
    if (!sourceName) return;
    if (currentView !== 'profile') setView('profile');
    showProfilePane('publisher');
    currentPublisherName = sourceName; publisherNews = []; publisherMetadata = null;
    $('publisher-name').textContent = currentPublisherName;
    renderPublisherAvatar($('publisher-avatar'), currentPublisherName);
    $('publisher-intro').textContent = t('publisherIntro');
    $('publisher-stories-heading').textContent = t('publisherNewsHeading');
    renderPublisherLinks(null);
    const list = $('publisher-list'); list.replaceChildren(emptyState(t('newsLoading'), '')); list.setAttribute('aria-busy', 'true');
    if (updateRoute) {
      const hash = `#/publisher/${encodeURIComponent(sourceName)}`;
      if (location.hash !== hash) history.pushState({publisherName: sourceName}, '', `${location.pathname}${location.search}${hash}`);
    }
    const loadToken = ++publisherLoadToken;
    try {
      const [metadata, data] = await Promise.all([
        api(`/api/publishers?sourceName=${encodeURIComponent(sourceName)}`),
        api(`/api/posts?type=news&sourceName=${encodeURIComponent(sourceName)}`)
      ]);
      if (loadToken !== publisherLoadToken || currentPublisherName !== sourceName) return;
      publisherMetadata = metadata.publisher || null;
      publisherNews = sortNewest(data.items.map(normalizeManual)); renderPublisherProfile();
    } catch {
      if (loadToken !== publisherLoadToken || currentPublisherName !== sourceName) return;
      list.replaceChildren(emptyState(t('publisherUnavailable'), t('emptyText'))); list.setAttribute('aria-busy', 'false');
    }
  }
  function renderNotifications() {
    const list = $('notifications-list'), empty = $('notifications-empty');
    list.replaceChildren(); list.setAttribute('aria-busy', 'false');
    empty.querySelector('strong').textContent = t('noNotificationsTitle');
    $('notifications-empty-copy').textContent = notificationCopy[language].empty;
    if (!notifications.length) { empty.hidden = false; return; }
    empty.hidden = true;
    for (const item of notifications) {
      const card = document.createElement('button'); card.type = 'button';
      card.className = `notification-card notification-card-${item.kind === 'weather' ? 'weather' : 'breaking'}`;
      if (notificationId(item) && !notificationReadIds.has(notificationId(item))) card.classList.add('is-unread');
      const label = document.createElement('span'); label.className = 'notification-kind';
      label.textContent = notificationCopy[language][item.kind === 'weather' ? 'weather' : 'breaking'];
      const title = document.createElement('strong'); title.className = 'notification-title'; title.textContent = item.title || item.originalTitle || '';
      const body = document.createElement('span'); body.className = 'notification-summary';
      const summary = String(item.body || '').trim(); body.textContent = summary.length > 260 ? `${summary.slice(0, 257).trimEnd()}…` : summary;
      const meta = document.createElement('span'); meta.className = 'notification-meta';
      const source = document.createElement('span'); source.textContent = item.sourceName || '';
      const date = document.createElement('time'); date.dateTime = item.notificationCreatedAt || item.createdAt || '';
      date.textContent = dateLabel(item.notificationCreatedAt || item.createdAt); meta.append(source, date);
      card.append(label, title, body, meta);
      card.addEventListener('click', () => openPost({...item, type: 'news', postKey: item.postKey || item.id}));
      list.append(card);
    }
  }
  async function loadNotifications() {
    if (notificationsLoading) return true;
    notificationsLoading = true;
    const list = $('notifications-list'); list.setAttribute('aria-busy', 'true');
    try {
      const data = await api('/api/notifications?limit=50');
      notifications = Array.isArray(data.items) ? data.items : [];
      if (currentView === 'notifications') markNotificationsRead(); else updateNotificationBadge();
      renderNotifications(); return true;
    } catch {
      updateNotificationBadge();
      if (!notifications.length) {
        renderNotifications();
        const empty = $('notifications-empty'); empty.hidden = false;
        empty.querySelector('strong').textContent = notificationCopy[language].unavailableTitle;
        $('notifications-empty-copy').textContent = notificationCopy[language].unavailable;
      }
      return false;
    } finally { notificationsLoading = false; }
  }

  function renderCurrentFeed() {
    if (currentView === 'home') renderHome();
    else if (currentView === 'global') renderGlobal();
    else if (currentView === 'publishers') renderPublishers();
    else if (currentView === 'news') renderNews();
    else if (currentView === 'jobs') renderJobs();
    else if (currentView === 'notifications') renderNotifications();
    else if (currentView === 'profile' && profilePane === 'saved') renderSaved();
    else if (currentView === 'profile' && profilePane === 'publisher') renderPublisherProfile();
  }
  function showProfilePane(pane) {
    profilePane = ['settings', 'saved', 'publisher'].includes(pane) ? pane : 'settings';
    $('profile-settings').hidden = profilePane !== 'settings';
    $('saved-view').hidden = profilePane !== 'saved';
    $('publisher-profile').hidden = profilePane !== 'publisher';
    if (profilePane === 'saved') renderSaved();
    if (profilePane === 'publisher') renderPublisherProfile();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
  function backFromProfile() {
    if (profilePane === 'publisher') {
      const backView = previousView || 'home';
      if (location.hash.startsWith('#/publisher/')) history.replaceState(null, '', location.pathname + location.search);
      setView(backView); return;
    }
    if (profilePane !== 'settings') { showProfilePane('settings'); return; }
    setView(previousView || 'home');
  }
  function backFromAbout() {
    const view = ['home', 'global', 'publishers', 'news', 'jobs', 'notifications', 'profile'].includes(aboutReturnView) ? aboutReturnView : 'home';
    setView(view);
    const focusTarget = view === 'profile' ? $('profile-back') : document.querySelector(`.nav-button[data-view="${view}"]`) || $('drawer-toggle');
    focusTarget?.focus();
  }
  function setView(view) {
    if (!['home', 'global', 'publishers', 'news', 'jobs', 'notifications', 'profile', 'about'].includes(view)) return;
    if ((view !== 'profile' || (currentView === 'profile' && profilePane === 'publisher')) && location.hash.startsWith('#/publisher/')) history.replaceState(null, '', location.pathname + location.search);
    if (view === 'profile' && currentView !== 'profile') previousView = currentView;
    if (view === 'about' && currentView !== 'about') aboutReturnView = currentView;
    currentView = view;
    document.querySelectorAll('.nav-button[data-view]').forEach((button) => { if (button.dataset.view === view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
    homeView.hidden = view !== 'home'; globalView.hidden = view !== 'global'; publishersView.hidden = view !== 'publishers'; newsView.hidden = view !== 'news'; jobsView.hidden = view !== 'jobs'; notificationsView.hidden = view !== 'notifications'; profileView.hidden = view !== 'profile'; aboutView.hidden = view !== 'about';
    if (view === 'profile') showProfilePane('settings');
    renderCurrentFeed(); if (view === 'notifications') loadNotifications(); if (view === 'global') loadGlobalNews(); if (view === 'publishers') loadPublishers(); appShell.classList.toggle('about-mode', view === 'about'); setChromeHidden(false);
    const activeView = view === 'home' ? homeView : view === 'global' ? globalView : view === 'publishers' ? publishersView : view === 'news' ? newsView : view === 'jobs' ? jobsView : view === 'notifications' ? notificationsView : view === 'profile' ? profileView : aboutView;
    activeView.classList.remove('view-enter'); requestAnimationFrame(() => activeView.classList.add('view-enter'));
    window.setTimeout(() => activeView.classList.remove('view-enter'), 320);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
  async function loadNews(showLoading = true) {
    if (showLoading) { newsStatus.classList.remove('error'); newsStatusText.textContent = t('newsLoading'); newsList.setAttribute('aria-busy', 'true'); }
    let failed = false;
    try {
      const data = await api('/api/posts?type=news');
      if (!Array.isArray(data.items)) throw new Error('invalid_news_response');
      news = sortNewest(data.items.map(normalizeManual));
    } catch { failed = true; news = []; }
    newsStatus.classList.toggle('error', failed);
    newsStatusText.textContent = failed ? (news.length ? t('partialNews') : t('newsUnavailable')) : (news.length ? t('updated') : t('noNews'));
    renderNews(); if (currentView === 'home') renderHome(); return !failed;
  }
  async function loadGlobalNews(showLoading = true) {
    if (globalLoading) return true;
    globalLoading = true;
    if (showLoading) { $('global-status').classList.remove('error'); $('global-status-text').textContent = t('newsLoading'); globalList.setAttribute('aria-busy', 'true'); }
    let failed = false;
    try {
      const data = await api('/api/posts?type=news&region=global');
      if (!Array.isArray(data.items)) throw new Error('invalid_global_news_response');
      globalNews = sortNewest(data.items.map((item) => ({...normalizeManual(item), region: 'global'})));
      globalLoaded = true;
    } catch { failed = true; globalNews = []; globalLoaded = false; }
    $('global-status').classList.toggle('error', failed);
    $('global-status-text').textContent = failed ? t('newsUnavailable') : (globalNews.length ? t('updated') : t('globalNoNews'));
    renderGlobal(); return !failed;
  }
  async function fetchTodayAudioQueue(region, force = false) {
    const cached = audioQueueCache.get(region);
    if (!force && cached && cached.expiresAt > Date.now()) return cached.items;
    const data = await api(`/api/audio/queue?region=${encodeURIComponent(region)}`);
    if (!Array.isArray(data.items)) throw new Error('invalid_audio_queue');
    audioQueueCache.set(region, {items: data.items, expiresAt: Date.now() + 300000});
    return data.items;
  }
  async function checkAudioQuotaStatus() {
    try {
      const status = await api('/api/audio/quota-status');
      if (status.unavailable) setAudioQuotaUnavailable(true, status.retryAfterSeconds);
      else if (audioQuotaUntil <= Date.now()) setAudioQuotaUnavailable(false);
    } catch {}
  }
  function preloadAudioQueues() {
    for (const region of ['myanmar', 'global']) fetchTodayAudioQueue(region).catch(() => {});
  }
  function formatAudioTime(value) {
    const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    const minutes = Math.floor(seconds / 60), remainder = seconds % 60;
    return minutes >= 60 ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${minutes}:${String(remainder).padStart(2, '0')}`;
  }
  function updateAudioPlayButton() {
    const button = $('audio-play');
    const playing = !audioElement.paused;
    button.setAttribute('aria-label', t(playing ? 'audioPauseLabel' : 'audioPlayLabel'));
    button.innerHTML = playing
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg>';
  }
  function setAudioQuotaUnavailable(unavailable = false, retryAfterSeconds = 0) {
    if (unavailable) {
      const seconds = Math.max(60, Math.min(86400, Math.floor(Number(retryAfterSeconds) || 86400)));
      audioQuotaUntil = Date.now() + seconds * 1000;
      try { localStorage.setItem(audioQuotaStorageKey, String(audioQuotaUntil)); } catch {}
    } else if (audioQuotaUntil <= Date.now()) {
      audioQuotaUntil = 0;
      try { localStorage.removeItem(audioQuotaStorageKey); } catch {}
    }
    const blocked = audioQuotaUntil > Date.now();
    $('audio-play').hidden = blocked;
    $('audio-quota-message').hidden = !blocked;
    $('audio-quota-message').textContent = 'ဒီနေ့အတွက် အသံနဲ့နားထောင်မရတော့ပါ';
    $('audio-player-controls').classList.toggle('is-quota-unavailable', blocked);
    audioPlayer.classList.toggle('is-quota-unavailable', blocked);
    if (blocked) {
      audioElement.pause(); $('audio-previous').disabled = true; $('audio-next').disabled = true;
      $('audio-progress').disabled = true; $('audio-player-status').textContent = '';
    }
    return blocked;
  }
  function updateAudioVolumeControl() {
    const percent = Math.round(Math.max(0, Math.min(1, audioElement.volume)) * 100);
    const muted = audioElement.muted || percent === 0;
    $('audio-volume').value = String(percent);
    $('audio-volume').setAttribute('aria-valuetext', `${percent}%`);
    $('audio-volume-level').textContent = `${percent}%`;
    $('audio-mute').setAttribute('aria-label', t(muted ? 'audioUnmuteLabel' : 'audioMuteLabel'));
    $('audio-mute').innerHTML = muted
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4zm12-1 5 6m0-6-5 6"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4zm12-2a6 6 0 0 1 0 8"/></svg>';
  }
  updateAudioVolumeControl();
  function updateAudioMediaSession(item = audioQueue[audioIndex]) {
    const session = navigator.mediaSession;
    if (!session) return;
    try {
      if (item && typeof MediaMetadata === 'function') {
        session.metadata = new MediaMetadata({title: item.title || t('newsType'), artist: item.sourceName || 'MM VOICE', album: t(audioRegion === 'global' ? 'audioRegionGlobal' : 'audioRegionBurma')});
      }
      session.playbackState = audioElement.paused ? (audioQueue.length ? 'paused' : 'none') : 'playing';
    } catch {}
  }
  function setAudioStatusForCurrentStory() {
    const item = audioQueue[audioIndex];
    if (!item) return;
    $('audio-player-title').textContent = item.title || t('newsType');
    $('audio-player-status').textContent = language === 'my' ? `သတင်း ${audioIndex + 1} / ${audioQueue.length}` : `Story ${audioIndex + 1} of ${audioQueue.length}`;
    $('audio-player-region').textContent = t(audioRegion === 'global' ? 'audioRegionGlobal' : 'audioRegionBurma');
    updateAudioMediaSession(item);
  }
  async function playAudioAtIndex(requestId = audioRequestId) {
    if (setAudioQuotaUnavailable(false)) return;
    if (requestId !== audioRequestId || audioIndex < 0 || audioIndex >= audioQueue.length) return;
    const item = audioQueue[audioIndex];
    audioElement.pause();
    audioElement.src = `/api/audio/tts/${encodeURIComponent(item.id)}?region=${encodeURIComponent(audioRegion)}`;
    audioElement.load();
    $('audio-player-title').textContent = item.title || t('newsType');
    $('audio-player-region').textContent = t(audioRegion === 'global' ? 'audioRegionGlobal' : 'audioRegionBurma');
    $('audio-player-status').textContent = t('audioPreparing');
    $('audio-progress').value = '0'; $('audio-progress').disabled = true;
    $('audio-current-time').textContent = '0:00'; $('audio-duration').textContent = '0:00';
    updateAudioPlayButton(); updateAudioMediaSession(item);
    try { await audioElement.play(); }
    catch { if (requestId === audioRequestId) $('audio-player-status').textContent = t('audioTapToPlay'); }
  }
  async function startTodayAudio(region) {
    if (!['myanmar', 'global'].includes(region)) return;
    closeDrawer(false);
    const requestId = ++audioRequestId;
    audioRegion = region; audioQueue = []; audioIndex = -1;
    audioElement.pause(); audioElement.removeAttribute('src'); audioElement.load();
    audioPlayer.hidden = false;
    $('audio-player-region').textContent = t(region === 'global' ? 'audioRegionGlobal' : 'audioRegionBurma');
    $('audio-player-title').textContent = t('listenAudioHeading');
    if (setAudioQuotaUnavailable(false)) { $('audio-player-status').textContent = ''; updateAudioMediaSession(null); return; }
    $('audio-player-status').textContent = t('audioLoading');
    $('audio-progress').disabled = true; $('audio-next').disabled = true; $('audio-previous').disabled = true;
    updateAudioPlayButton(); updateAudioMediaSession(null);
    try {
      const queue = await fetchTodayAudioQueue(region);
      if (requestId !== audioRequestId) return;
      audioQueue = queue;
      if (!audioQueue.length) {
        $('audio-player-title').textContent = t(region === 'global' ? 'audioRegionGlobal' : 'audioRegionBurma');
        $('audio-player-status').textContent = t('audioNoNews');
        return;
      }
      audioIndex = 0; $('audio-next').disabled = false; $('audio-previous').disabled = false;
      await playAudioAtIndex(requestId);
    } catch {
      if (requestId === audioRequestId) $('audio-player-status').textContent = t('audioQueueFailed');
    }
  }
  function nextAudioStory() {
    if (!audioQueue.length) return;
    if (audioIndex + 1 < audioQueue.length) { audioIndex++; void playAudioAtIndex(); return; }
    audioElement.pause(); $('audio-player-status').textContent = t('audioComplete');
    $('audio-player-title').textContent = audioQueue[audioIndex]?.title || t('newsType');
    updateAudioPlayButton(); updateAudioMediaSession(audioQueue[audioIndex]);
  }
  function previousAudioStory() {
    if (!audioQueue.length) return;
    if (audioElement.currentTime > 4) { audioElement.currentTime = 0; return; }
    if (audioIndex > 0) { audioIndex--; void playAudioAtIndex(); }
  }
  function toggleAudioPlayback() {
    if (!audioQueue.length) return;
    if (audioElement.paused && audioElement.ended) { audioIndex = 0; void playAudioAtIndex(); return; }
    if (audioElement.paused) audioElement.play().catch(() => { $('audio-player-status').textContent = t('audioTapToPlay'); });
    else audioElement.pause();
  }
  $('audio-volume').addEventListener('input', () => {
    const percent = Math.max(0, Math.min(100, Number($('audio-volume').value)));
    audioElement.volume = percent / 100;
    if (percent > 0 && audioElement.muted) audioElement.muted = false;
    updateAudioVolumeControl();
  });
  $('audio-mute').addEventListener('click', () => {
    if (audioElement.muted || audioElement.volume === 0) {
      audioElement.muted = false;
      if (audioElement.volume === 0) audioElement.volume = 1;
    } else audioElement.muted = true;
    updateAudioVolumeControl();
  });
  function closeAudioPlayer() {
    audioRequestId++; audioElement.pause(); audioElement.removeAttribute('src'); audioElement.load();
    audioQueue = []; audioIndex = -1; audioPlayer.hidden = true;
    $('audio-progress').value = '0'; $('audio-progress').disabled = true;
    try { if (navigator.mediaSession) { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none'; } } catch {}
  }
  audioElement.addEventListener('play', () => { updateAudioPlayButton(); updateAudioMediaSession(); setAudioStatusForCurrentStory(); });
  audioElement.addEventListener('pause', () => { updateAudioPlayButton(); updateAudioMediaSession(); });
  audioElement.addEventListener('volumechange', () => {
    updateAudioVolumeControl();
    try { localStorage.setItem('mmvoice.audioVolume.v1', String(audioElement.volume)); localStorage.setItem('mmvoice.audioMuted.v1', String(audioElement.muted)); } catch {}
  });
  audioElement.addEventListener('ended', nextAudioStory);
  audioElement.addEventListener('loadedmetadata', () => {
    const duration = Number.isFinite(audioElement.duration) ? audioElement.duration : 0;
    $('audio-duration').textContent = formatAudioTime(duration); $('audio-progress').disabled = !(duration > 0);
  });
  audioElement.addEventListener('timeupdate', () => {
    const duration = Number.isFinite(audioElement.duration) ? audioElement.duration : 0;
    if (!audioSeeking && duration > 0) $('audio-progress').value = String(Math.round((audioElement.currentTime / duration) * 1000));
    $('audio-current-time').textContent = formatAudioTime(audioElement.currentTime);
  });
  async function handleAudioElementError(failedItem, requestId) {
    let errorStatus = null;
    try {
      const response = await fetch(`/api/audio/status/${encodeURIComponent(failedItem.id)}?region=${encodeURIComponent(audioRegion)}`, {cache: 'no-store', headers: {accept: 'application/json'}});
      if (response.ok) errorStatus = await response.json();
    } catch {}
    if (requestId !== audioRequestId || audioQueue[audioIndex]?.id !== failedItem.id || audioPlayer.hidden) return;
    if (errorStatus?.error === 'tts_rate_limited') {
      setAudioQuotaUnavailable(true, errorStatus.retryAfterSeconds || 86400);
      updateAudioPlayButton(); updateAudioMediaSession(failedItem);
      return;
    }
    $('audio-player-status').textContent = t('audioStoryUnavailable');
    window.setTimeout(() => { if (requestId === audioRequestId && audioQueue[audioIndex]?.id === failedItem.id) nextAudioStory(); }, 1500);
  }
  audioElement.addEventListener('error', () => {
    const failedItem = audioQueue[audioIndex];
    if (!failedItem || audioPlayer.hidden) return;
    const requestId = audioRequestId;
    $('audio-player-status').textContent = t('audioStoryUnavailable');
    void handleAudioElementError(failedItem, requestId);
  });
  if (navigator.mediaSession) {
    for (const [action, handler] of [['play', toggleAudioPlayback], ['pause', () => audioElement.pause()], ['previoustrack', previousAudioStory], ['nexttrack', nextAudioStory]]) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    }
  }
  async function loadJobs() {
    jobsStatus.classList.remove('error'); jobs = []; jobsStatusText.textContent = t('noJobs'); jobsList.setAttribute('aria-busy', 'false');
    renderJobs(); if (currentView === 'home') renderHome(); return true;
  }
  async function refreshAll() {
    if (refreshing) return; refreshing = true;
    const button = currentView === 'notifications' ? $('notifications-refresh') : currentView === 'global' ? $('global-refresh') : currentView === 'jobs' ? $('jobs-refresh') : currentView === 'news' ? $('refresh') : null;
    if (button) button.disabled = true;
    try {
      if (currentView === 'notifications') { const ok = await loadNotifications(); setPullStatus(ok ? t('refreshDone') : notificationCopy[language].unavailable, ok ? 'success' : 'error'); return; }
      setPullStatus(t('refreshingFeed'), 'loading');
      let succeeded = false;
      if (currentView === 'global') succeeded = await loadGlobalNews();
      else if (currentView === 'publishers') { publishersLoaded[publisherRegion] = false; await loadPublishers(publisherRegion); succeeded = !publishersErrors[publisherRegion]; }
      else if (currentView === 'home' || currentView === 'profile') {
        const results = await Promise.allSettled([loadNews(false), loadJobs()]);
        succeeded = results.every((result) => result.status === 'fulfilled' && result.value === true);
      } else if (currentView === 'jobs') succeeded = await loadJobs();
      else succeeded = await loadNews();
      if (currentView === 'profile' && profilePane === 'saved') renderSaved();
      setPullStatus(t(succeeded ? 'refreshDone' : 'refreshFailed'), succeeded ? 'success' : 'error');
    } finally { if (button) button.disabled = false; refreshing = false; }
  }
  async function refreshAppQuietly() {
    if (refreshing) return;
    refreshing = true;
    const button = $('brand-refresh'); button.classList.add('is-refreshing'); button.setAttribute('aria-busy', 'true');
    const statusSnapshot = [
      [newsStatusText, newsStatus],
      [$('global-status-text'), $('global-status')],
      [jobsStatusText, jobsStatus]
    ].map(([textNode, statusNode]) => ({textNode, text: textNode?.textContent, statusNode, hadError: statusNode?.classList.contains('error')}));
    try {
      if (currentView === 'global') await loadGlobalNews(false);
      else if (currentView === 'publishers') {
        try {
          const data = await api(`/api/publishers?region=${encodeURIComponent(publisherRegion)}`);
          publisherDirectory[publisherRegion] = Array.isArray(data.items) ? data.items : [];
          publishersLoaded[publisherRegion] = true; publishersErrors[publisherRegion] = false; renderPublishers();
        } catch {}
      } else if (currentView === 'notifications') await loadNotifications();
      else if (currentView === 'news') await loadNews(false);
      else if (currentView === 'jobs') await loadJobs();
      else if (currentView === 'profile' && profilePane === 'publisher' && currentPublisherName) {
        try {
          const [metadata, data] = await Promise.all([
            api(`/api/publishers?sourceName=${encodeURIComponent(currentPublisherName)}`),
            api(`/api/posts?type=news&sourceName=${encodeURIComponent(currentPublisherName)}`)
          ]);
          publisherMetadata = metadata.publisher || null; publisherNews = sortNewest(data.items.map(normalizeManual)); renderPublisherProfile();
        } catch {}
      } else {
        await Promise.allSettled([loadNews(false), loadJobs()]);
        if (currentView === 'profile' && profilePane === 'saved') renderSaved();
      }
    } catch {}
    finally {
      for (const snapshot of statusSnapshot) {
        if (snapshot.textNode && snapshot.text !== undefined) snapshot.textNode.textContent = snapshot.text;
        if (snapshot.statusNode) snapshot.statusNode.classList.toggle('error', Boolean(snapshot.hadError));
      }
      button.setAttribute('aria-busy', 'false');
      window.setTimeout(() => button.classList.remove('is-refreshing'), 220);
      refreshing = false;
    }
  }
  function updateProfilePreference() {
    const summary = $('profile-summary'), reset = $('clear-profile');
    if (!summary || !reset) return;
    summary.textContent = profile && roles[roleKey()] ? t(`${roleKey()}Role`) : t('allTopics');
    reset.hidden = !profile;
  }
  function clearProfilePreference() {
    profile = null;
    try { localStorage.removeItem('mmvoice.profile.v1'); } catch {}
    updateProfilePreference(); renderCurrentFeed(); showToast(t('preferenceCleared'));
  }
  function startWelcome() {
    const overlay = $('welcome-overlay');
    if (currentView !== 'home') setView('home');
    overlay.classList.add('is-exiting'); appShell.classList.add('welcome-entering');
    try { localStorage.setItem('mmvoice.welcome.started.v1', 'true'); } catch {}
    $('welcome-start').disabled = true;
    window.setTimeout(() => { overlay.hidden = true; overlay.classList.remove('is-exiting'); appShell.classList.remove('welcome-entering'); document.body.style.overflow = ''; window.scrollTo({top: 0, behavior: 'auto'}); }, 620);
  }
  function openPost(item, updateRoute = true, playback = null) {
    if (!item) return;
    activePost = item; lastFocus = document.activeElement;
    $('detail-title').textContent = postTitle(item);
    $('detail-category').textContent = postCategory(item);
    const detailDate = $('detail-date'); detailDate.dateTime = postDate(item) || ''; detailDate.textContent = dateLabel(postDate(item));
    const cover = $('detail-cover'), coverUrl = safeImage(item, 0), video = $('detail-video'), videoFrame = $('detail-video-embed'), videoUrl = safeVideo(item);
    detail.classList.toggle('video-theater-view', Boolean(videoUrl));
    detail.classList.remove('video-comments-open'); $('detail-comment').setAttribute('aria-expanded', 'false');
    video.pause(); video.removeAttribute('src'); video.removeAttribute('poster'); video.hidden = true; video.load();
    if (videoFrame) { videoFrame.removeAttribute('src'); videoFrame.hidden = true; }
    if (coverUrl) { cover.src = coverUrl; cover.alt = postTitle(item); cover.hidden = false; cover.onerror = () => { cover.hidden = true; }; }
    else { cover.removeAttribute('src'); cover.alt = ''; cover.hidden = true; }
    if (videoUrl) {
      cover.hidden = true;
      if (isVideoEmbed(videoUrl) && videoFrame) { videoFrame.src = videoUrl; videoFrame.title = postTitle(item); videoFrame.hidden = false; }
      else {
        video.src = videoUrl; video.title = postTitle(item); if (coverUrl) video.poster = coverUrl; video.hidden = false; video.load();
        if (playback) {
          const restorePlayback = () => {
            if (activePost !== item || detail.hidden) return;
            try { video.currentTime = Math.max(0, Number(playback.time) || 0); } catch {}
            if (playback.resume) video.play().catch(() => {});
          };
          if (video.readyState >= 1) restorePlayback(); else video.addEventListener('loadedmetadata', restorePlayback, {once: true});
        }
      }
    }
    const source = $('detail-source'), sourceUrl = safeSourceUrl(item.sourceUrl);
    source.textContent = item.sourceName || item.sourceTitle || ''; source.href = sourceUrl || '#'; source.hidden = !sourceUrl || !source.textContent;
    const verified = $('detail-verified'); verified.hidden = !(postType(item) === 'job' && item.isVerified); verified.textContent = `✓ ${t('verified')}`;
    $('detail-warning').hidden = !isScam(item);
    const summary = $('detail-summary'), summaryText = String(item.summary || '').trim();
    summary.textContent = summaryText; summary.hidden = !summaryText || summaryText === postBody(item).trim();
    $('detail-body').textContent = postBody(item);
    const attribution = $('detail-source-attribution'); attribution.replaceChildren();
    const attributionName = String(item.sourceName || item.sourceTitle || '').trim();
    if (postType(item) === 'news' && (attributionName || sourceUrl)) {
      const label = document.createElement('strong'); label.textContent = t('sourceBy'); attribution.append(label, document.createTextNode(' '));
      if (sourceUrl) { const link = document.createElement('a'); link.href = sourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = attributionName || new URL(sourceUrl).hostname; attribution.append(link); }
      else attribution.append(document.createTextNode(attributionName));
      attribution.hidden = false;
    } else attribution.hidden = true;
    const contact = $('detail-contact'); contact.replaceChildren();
    if (postType(item) === 'job') {
      const labels = language === 'en'
        ? {company: 'Company', location: 'Location', salary: 'Pay', requirements: 'Requirements', contact: 'Contact', application: 'How to apply', phone: 'Phone', line: 'LINE', posted: 'Posted'}
        : {company: 'ကုမ္ပဏီ', location: 'အလုပ်နေရာ', salary: 'လစာ', requirements: 'လိုအပ်ချက်များ', contact: 'ဆက်သွယ်ရန်', application: 'လျှောက်ထားပုံ', phone: 'ဖုန်း', line: 'LINE', posted: 'တင်သည့်ရက်'};
      for (const [label, value] of [
        [labels.company, item.companyName], [labels.location, item.location], [labels.salary, item.salary],
        [labels.requirements, item.jobRequirements], [labels.contact, item.contactInfo],
        [labels.application, item.applicationMethod], [labels.phone, item.phone], [labels.line, item.lineId],
        [labels.posted, item.postedAt ? dateLabel(item.postedAt) : '']
      ]) {
        if (!value) continue; const row = document.createElement('p'), strong = document.createElement('strong'); strong.textContent = `${label}: `; row.append(strong, document.createTextNode(String(value))); contact.append(row);
      }
      if (item.applicationUrl) {
        const applyUrl = safeSourceUrl(item.applicationUrl);
        if (applyUrl) {
          const row = document.createElement('p'), link = document.createElement('a');
          link.href = applyUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
          link.textContent = language === 'en' ? 'Open application page' : 'လျှောက်ထားရန် စာမျက်နှာဖွင့်ရန်';
          row.append(link); contact.append(row);
        }
      }
    }
    const sourceFull = $('detail-source-full'); sourceFull.replaceChildren(); sourceFull.classList.add('hidden');
    const priorBadge = document.querySelector('.detail-view-count.dynamic-view-count'); if (priorBadge) priorBadge.remove();
    const newBadge = makeViewCountBadge(item, true); newBadge.classList.add('dynamic-view-count'); newBadge.id = 'detail-view-count'; newBadge.hidden = postType(item) !== 'news';
    const detailContent = document.querySelector('.detail-content'); detailContent.append(newBadge);
    updatePostViewCount(item, Number(item.viewCount || 0));
    detail.hidden = false; document.body.style.overflow = 'hidden';
    if (updateRoute) {
      const routeType = postType(item) === 'job' ? 'job' : 'news', id = String(item.id || postKey(item));
      const hash = `#/${routeType}/${encodeURIComponent(id)}`;
      if (location.hash !== hash) history.pushState({postKey: postKey(item)}, '', `${location.pathname}${location.search}${hash}`);
    }
    loadEngagement(item); loadComments(item); recordPostView(item);
    requestAnimationFrame(() => $('detail-close').focus());
  }
  function closePost(updateRoute = true) {
    const video = $('detail-video'); video.pause(); video.removeAttribute('src'); video.removeAttribute('poster'); video.hidden = true; video.load();
    const videoFrame = $('detail-video-embed'); if (videoFrame) { videoFrame.removeAttribute('src'); videoFrame.hidden = true; }
    detail.hidden = true; detail.classList.remove('video-theater-view'); activePost = null; document.body.style.overflow = '';
    if (updateRoute && location.hash.startsWith('#/')) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus?.focus) lastFocus.focus();
  }
  async function loadEngagement(item) {
    try { const data = await api(engagementPath(item)); applyEngagement(postKey(item), data); }
    catch { if (activePost && postKey(activePost) === postKey(item)) { $('like-count').dataset.baseCount = '0'; $('like-count').textContent = '0'; $('detail-like').setAttribute('aria-pressed', 'false'); } }
  }
  async function loadComments(item) {
    const list = $('comment-list'), parent = list.parentElement; list.replaceChildren(); parent.querySelector('.comment-form')?.remove();
    try {
      const data = await api(`/api/comments?postKey=${encodeURIComponent(postKey(item))}`);
      if (activePost !== item) return; renderCommentList(data.items, list, false);
    } catch { if (activePost !== item) return; const empty = document.createElement('li'); empty.className = 'comment-empty'; empty.textContent = t('commentsUnavailable'); list.append(empty); }
    if (activePost === item) parent.append(createCommentForm(item, list, false));
  }
  async function restoreRoute() {
    const publisherMatch = location.hash.match(/^#\/publisher\/(.+)$/);
    if (publisherMatch) {
      let publisherName = ''; try { publisherName = decodeURIComponent(publisherMatch[1]); } catch { return; }
      await openPublisherProfile(publisherName, false); return;
    }
    const match = location.hash.match(/^#\/(news|job)\/(.+)$/);
    if (!match) {
      if (!detail.hidden) closePost(false);
      if (currentView === 'profile' && profilePane === 'publisher') setView(previousView || 'home');
      return;
    }
    const type = match[1]; let id = ''; try { id = decodeURIComponent(match[2]); } catch { return; }
    let post = [...news, ...globalNews, ...jobs].find((item) => String(item.id) === id && postType(item) === (type === 'job' ? 'job' : 'news'));
    if (!post && /^[0-9a-f-]{30,40}$/i.test(id)) { try { post = normalizeManual((await api(`/api/posts/${encodeURIComponent(id)}`)).item); } catch {} }
    if (!post) { if (type === 'news') { await loadNews(false); await loadGlobalNews(false); } else await loadJobs(); post = [...news, ...globalNews, ...jobs].find((item) => String(item.id) === id && postType(item) === (type === 'job' ? 'job' : 'news')); }
    if (!post) return;
    const targetView = postType(post) === 'job' ? 'jobs' : post.region === 'global' ? 'global' : 'news';
    if (currentView !== targetView) setView(targetView);
    openPost(post, false);
  }
  function setLanguage(next) {
    if (!['my', 'en'].includes(next)) return; language = next;
    try { localStorage.setItem('mmvoice.language.v2', language); } catch {}
    applyLanguage();
  }
  document.querySelectorAll('.nav-button[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  function openSearch() {
    if (drawer.classList.contains('is-open')) closeDrawer(false);
    clearTimeout(searchCloseTimer); searchPanel.hidden = false; searchPanel.inert = false;
    requestAnimationFrame(() => searchPanel.classList.add('is-open'));
    $('search-toggle').setAttribute('aria-expanded', 'true'); searchInput.focus();
  }
  function closeSearch(restoreFocus = true) {
    if (searchPanel.hidden) return;
    searchPanel.classList.remove('is-open'); searchPanel.inert = true; $('search-toggle').setAttribute('aria-expanded', 'false');
    clearTimeout(searchCloseTimer); searchCloseTimer = setTimeout(() => { if (!searchPanel.classList.contains('is-open')) searchPanel.hidden = true; }, 240);
    if (restoreFocus) $('search-toggle').focus();
  }
  $('notification-toggle').addEventListener('click', () => setView('notifications'));
  $('brand-refresh').addEventListener('click', () => { closeDrawer(false); closeSearch(false); setView('home'); void refreshAppQuietly(); });
  const shareSheet = $('share-sheet');
  $('share-sheet-close').addEventListener('click', closeShareSheet);
  shareSheet.addEventListener('close', () => {
    activeShareItem = null;
    const trigger = lastShareTrigger; lastShareTrigger = null;
    if (trigger?.isConnected) trigger.focus();
  });
  shareSheet.addEventListener('click', (event) => { if (event.target === shareSheet) closeShareSheet(); });
  document.querySelectorAll('[data-share-destination]').forEach((button) => button.addEventListener('click', () => { void shareCurrentPost(button.dataset.shareDestination); }));
  $('search-toggle').addEventListener('click', () => searchPanel.hidden ? openSearch() : closeSearch());
  $('search-close').addEventListener('click', () => closeSearch());
  $('search-form').addEventListener('submit', (event) => { event.preventDefault(); renderCurrentFeed(); searchInput.blur(); });
  document.querySelectorAll('.language-option').forEach((button) => button.addEventListener('click', () => { setLanguage(button.dataset.language); updateAudioVolumeControl(); }));
  function openDrawer() { if (!searchPanel.hidden) closeSearch(false); clearTimeout(drawerCloseTimer); setChromeHidden(false); drawerBackdrop.hidden = false; requestAnimationFrame(() => drawerBackdrop.classList.add('is-visible')); drawer.classList.add('is-open'); drawer.inert = false; drawer.setAttribute('aria-hidden', 'false'); $('drawer-toggle').setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('drawer-close').focus(); }
  function closeDrawer(restoreFocus = true) { if (!drawer.classList.contains('is-open')) return; drawer.classList.remove('is-open'); drawerBackdrop.classList.remove('is-visible'); setChromeHidden(false); drawer.inert = true; drawer.setAttribute('aria-hidden', 'true'); $('drawer-toggle').setAttribute('aria-expanded', 'false'); document.body.style.overflow = detail.hidden ? '' : 'hidden'; clearTimeout(drawerCloseTimer); drawerCloseTimer = setTimeout(() => { if (!drawer.classList.contains('is-open')) drawerBackdrop.hidden = true; }, 280); if (restoreFocus) $('drawer-toggle').focus(); }
  const installButton = $('drawer-install-app'), installGuide = $('install-guide');
  let deferredInstallPrompt = null;
  function isAppInstalled() {
    const standalone = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
    return standalone || navigator.standalone === true;
  }
  function showInstallGuide() {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const platform = isIOS ? 'ios' : /Android/i.test(navigator.userAgent) ? 'android' : 'other';
    document.querySelectorAll('[data-install-steps]').forEach((steps) => { steps.hidden = steps.dataset.installSteps !== platform; });
    if (typeof installGuide.showModal === 'function') installGuide.showModal();
    else installGuide.setAttribute('open', '');
    $('install-guide-close').focus();
  }
  window.addEventListener('beforeinstallprompt', (event) => {
    if (isAppInstalled()) return;
    event.preventDefault();
    deferredInstallPrompt = event;
  });
  window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; installButton.hidden = true; });
  installButton.hidden = isAppInstalled();
  installButton.addEventListener('click', async () => {
    closeDrawer(false);
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') installButton.hidden = true;
      } catch { showInstallGuide(); }
      return;
    }
    showInstallGuide();
  });
  function closeInstallGuide() {
    if (typeof installGuide.close === 'function') installGuide.close();
    else { installGuide.removeAttribute('open'); $('drawer-toggle').focus(); }
  }
  $('install-guide-close').addEventListener('click', closeInstallGuide);
  installGuide.addEventListener('click', (event) => { if (event.target === installGuide) closeInstallGuide(); });
  installGuide.addEventListener('close', () => $('drawer-toggle').focus());
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((error) => console.warn('MM VOICE service worker registration failed:', error));
  }
  $('drawer-toggle').addEventListener('click', openDrawer); $('drawer-close').addEventListener('click', () => closeDrawer()); drawerBackdrop.addEventListener('click', () => closeDrawer());
  $('drawer-toggle').addEventListener('click', preloadAudioQueues);
  $('drawer-audio-myanmar').addEventListener('click', () => startTodayAudio('myanmar'));
  $('drawer-audio-global').addEventListener('click', () => startTodayAudio('global'));
  $('audio-player-close').addEventListener('click', closeAudioPlayer);
  $('audio-play').addEventListener('click', toggleAudioPlayback);
  $('audio-previous').addEventListener('click', previousAudioStory);
  $('audio-next').addEventListener('click', nextAudioStory);
  $('audio-progress').addEventListener('input', () => {
    const duration = Number.isFinite(audioElement.duration) ? audioElement.duration : 0;
    if (duration > 0) { audioSeeking = true; audioElement.currentTime = (Number($('audio-progress').value) / 1000) * duration; }
  });
  $('audio-progress').addEventListener('change', () => { audioSeeking = false; });
  $('drawer-open-settings').addEventListener('click', () => { closeDrawer(false); setView('profile'); });
  $('drawer-saved').addEventListener('click', () => { closeDrawer(false); setView('profile'); $('saved-shortcut').click(); });
  $('drawer-publishers').addEventListener('click', () => { closeDrawer(false); setView('publishers'); });
  document.querySelectorAll('[data-publisher-region]').forEach((button) => button.addEventListener('click', () => choosePublisherRegion(button.dataset.publisherRegion)));
  $('profile-back').addEventListener('click', backFromProfile);
  $('publisher-back').addEventListener('click', backFromProfile);
  $('drawer-about').addEventListener('click', () => { closeDrawer(false); setView('about'); $('about-back').focus(); });
  $('about-back').addEventListener('click', backFromAbout);
  $('notification-settings').addEventListener('click', () => setView('notifications'));
  $('drawer-notification-settings').addEventListener('click', () => { closeDrawer(false); setView('notifications'); });
  $('notifications-refresh').addEventListener('click', loadNotifications);
  $('global-refresh').addEventListener('click', refreshAll);
  window.setInterval(() => { if (!document.hidden) loadNotifications(); }, 300000);
  window.setInterval(() => { if (currentView === 'global' && !document.hidden) loadGlobalNews(false); }, 300000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { loadNotifications(); if (currentView === 'global') loadGlobalNews(false); } });
  $('saved-shortcut').addEventListener('click', () => showProfilePane('saved'));
  $('saved-back').addEventListener('click', () => showProfilePane('settings'));
  document.querySelectorAll('.switch-control').forEach((button) => button.addEventListener('click', () => setTheme(document.documentElement.dataset.theme !== 'dark', true)));
  searchInput.addEventListener('input', renderCurrentFeed);
  $('refresh').addEventListener('click', refreshAll); $('jobs-refresh').addEventListener('click', refreshAll);
  $('welcome-start').addEventListener('click', startWelcome);
  $('clear-profile').addEventListener('click', clearProfilePreference);
  document.querySelectorAll('.about-accordion').forEach((section) => section.addEventListener('toggle', () => { if (section.open) document.querySelectorAll('.about-accordion').forEach((other) => { if (other !== section) other.open = false; }); }));
  $('detail-close').addEventListener('click', () => closePost(true));
  detail.addEventListener('click', (event) => { if (event.target === detail) closePost(true); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    else if (event.key === 'Escape' && !searchPanel.hidden) closeSearch(false);
    else if (event.key === 'Escape' && !detail.hidden) closePost(true);
  });
  $('detail-like').addEventListener('click', (event) => toggleLike(activePost, event.currentTarget));
  $('detail-bookmark').addEventListener('click', (event) => toggleBookmark(activePost, event.currentTarget));
  $('detail-comment').addEventListener('click', () => {
    recordPostView(activePost);
    if (detail.classList.contains('video-theater-view') && window.matchMedia('(max-width:760px)').matches) {
      const open = !detail.classList.contains('video-comments-open');
      detail.classList.toggle('video-comments-open', open); $('detail-comment').setAttribute('aria-expanded', String(open));
      if (open) requestAnimationFrame(() => $('detail-comments-heading').scrollIntoView({behavior: 'smooth', block: 'start'}));
      else $('detail-panel').scrollTo({top: 0, behavior: 'smooth'});
      return;
    }
    $('detail-comments-heading').scrollIntoView({behavior: 'smooth', block: 'start'});
  });
  window.addEventListener('hashchange', restoreRoute); window.addEventListener('popstate', restoreRoute);
  let lastScrollY = window.scrollY, scrollFrame = 0;
  function setChromeHidden(hidden) {
    if (hidden && (siteHeader.contains(document.activeElement) || bottomNav.contains(document.activeElement) || drawer.classList.contains('is-open') || !detail.hidden)) hidden = false;
    appShell.classList.toggle('chrome-hidden', hidden); siteHeader.inert = hidden; siteHeader.setAttribute('aria-hidden', String(hidden)); bottomNav.inert = hidden; bottomNav.setAttribute('aria-hidden', String(hidden));
  }
  function releaseChromeFocus(event) {
    if (!siteHeader.contains(event.target) && !bottomNav.contains(event.target) &&
        (siteHeader.contains(document.activeElement) || bottomNav.contains(document.activeElement))) document.activeElement.blur();
  }
  document.addEventListener('pointerdown', releaseChromeFocus, {passive: true});
  window.addEventListener('wheel', releaseChromeFocus, {passive: true});
  window.addEventListener('scroll', () => {
    if (scrollFrame) return; scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; const currentY = window.scrollY, delta = currentY - lastScrollY;
      if (currentY < 56) setChromeHidden(false); else if (delta > 7) setChromeHidden(true); else if (delta < -7) setChromeHidden(false); lastScrollY = currentY;
    });
  }, {passive: true});
  $('search-toggle').addEventListener('click', () => { if (!searchPanel.hidden) setChromeHidden(false); });
  let touchStartY = null, touchAllowed = false, pullArmed = false;
  let backSwipeStart = null;
  document.addEventListener('touchstart', (event) => { if (event.touches.length === 1) backSwipeStart = {x: event.touches[0].clientX, y: event.touches[0].clientY}; }, {passive: true});
  document.addEventListener('touchend', (event) => {
    if (!backSwipeStart || !event.changedTouches.length) return;
    const end = event.changedTouches[0], dx = end.clientX - backSwipeStart.x, dy = Math.abs(end.clientY - backSwipeStart.y);
    if (dy < 70 && drawer.classList.contains('is-open') && dx < -90) closeDrawer();
    else if (dy < 70 && backSwipeStart.x < 26 && dx > 100 && currentView === 'profile') backFromProfile();
    backSwipeStart = null;
  }, {passive: true});
  document.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1 || refreshing || !detail.hidden || drawer.classList.contains('is-open') || !searchPanel.hidden) return;
    if (event.target instanceof Element && event.target.closest('button,a,input,textarea,select,[contenteditable="true"]')) return;
    touchStartY = event.touches[0].clientY; touchAllowed = window.scrollY <= 2 && ['home', 'global', 'news', 'jobs', 'notifications'].includes(currentView); pullArmed = false;
  }, {passive: true});
  document.addEventListener('touchmove', (event) => {
    if (touchStartY === null || !touchAllowed || !event.touches.length) return;
    const dy = event.touches[0].clientY - touchStartY;
    if (dy <= 0 || window.scrollY > 2) { pullArmed = false; dismissPullIndicator(); return; }
    if (dy < 8) return;
    event.preventDefault();
    pullArmed = dy >= 72;
    const indicator = $('pull-indicator');
    indicator.style.setProperty('--pull-offset', `${Math.min(48, dy * 0.52)}px`);
    indicator.style.setProperty('--pull-progress', String(Math.min(1, dy / 72)));
    indicator.style.setProperty('--pull-rotation', `${Math.round(Math.min(1, dy / 72) * 240)}deg`);
    setPullStatus(t(pullArmed ? 'pullRefresh' : 'pullHint'), pullArmed ? 'armed' : 'pull');
  }, {passive: false});
  document.addEventListener('touchend', () => {
    const armed = pullArmed; touchStartY = null; touchAllowed = false; pullArmed = false;
    if (armed) { $('pull-indicator').style.setProperty('--pull-offset', '14px'); refreshAll(); }
    else dismissPullIndicator();
  }, {passive: true});
  document.addEventListener('touchcancel', () => { touchStartY = null; touchAllowed = false; pullArmed = false; dismissPullIndicator(); }, {passive: true});
  // Keep publisher full text on its source page; MM VOICE shows its own report and attribution link.
  setTheme((() => { try { return localStorage.getItem('mmvoice.theme.v1') === 'dark'; } catch { return false; } })());
  trackAnonymousActivity();
  applyLanguage(); updateProfilePreference();
  let welcomeAlreadyStarted = false; try { welcomeAlreadyStarted = localStorage.getItem('mmvoice.welcome.started.v1') === 'true'; } catch {}
  if (welcomeAlreadyStarted) $('welcome-overlay').hidden = true;
  else { document.body.style.overflow = 'hidden'; window.setTimeout(() => $('welcome-start').focus(), 80); }
  void checkAudioQuotaStatus();
  Promise.allSettled([loadNews(), loadJobs(), loadNotifications()]).then(restoreRoute);
})();
