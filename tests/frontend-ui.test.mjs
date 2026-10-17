import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(projectRoot, "public/index.html"), "utf8");
const app = readFileSync(path.join(projectRoot, "public/app.js"), "utf8");
const css = readFileSync(path.join(projectRoot, "public/social.css"), "utf8");

const enabledPublishers = [
  "BBC Burmese",
  "Democratic Voice of Burma",
  "Independent Mon News Agency - IMNA (မွန်သတင်းအေဂျင်စီ)",
  "Kachin News Group - KNG (ကချင်သတင်းဌာန)",
  "Kantarawaddy Times (ကန္တာရဝတီတိုင်း(မ်) - ကယား)",
  "Karen Information Center - KIC (ကရင်သတင်းဌာန)",
  "MPA",
  "Mekong News",
  "Myaelatt Athan (မြေလတ်အသံ)",
  "Myanmar Now",
  "Narinjara News (နိရဉ္စရာ သတင်းဌာန - ရခိုင်)",
  "Radio Free Asia Burmese",
  "Shan Herald Agency for News - SHAN (ရှမ်းသတင်းဌာန)",
  "Tachileik News Agency (တာချီလိတ်သတင်းအေဂျင်စီ)",
  "Than Lwin Times",
  "The Irrawaddy Burmese",
  "VOA Burmese"
];

test("home heading uses the requested copy and no longer shows a refresh button", () => {
  assert.match(app, /homeHeading: 'What’s happening in Myanmar'/);
  assert.doesNotMatch(html, /id="home-refresh"/);
  assert.doesNotMatch(app, /home-refresh/);
  const homeFeedHead = html.match(/<div class="feed-head social-feed-head">([\s\S]*?)<\/div>/)?.[1] || "";
  assert.doesNotMatch(homeFeedHead, /feed-caption/);
});

test("Global feed keeps its heading without the eyebrow, caption, or info banner", () => {
  const globalFeedHead = html.match(/<section id="global-panel"[\s\S]*?<div class="feed-head">([\s\S]*?)<\/div>/)?.[1] || "";
  assert.match(globalFeedHead, /<h1 id="global-heading" data-i18n="globalHeading">Global news<\/h1>/);
  assert.doesNotMatch(globalFeedHead, /eyebrow|feed-caption/);
  assert.doesNotMatch(html, /class="global-feed-note"/);
});

test("welcome screen uses the exact Burmese copy and local publisher marks", () => {
  const welcome = html.match(/<section id="welcome-overlay"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(welcome, /<h1 id="welcome-title">MM VOICE<\/h1>/);
  assert.match(welcome, /<p class="welcome-description" lang="my">ဤ Website တွင် မည်သည့်ကြော်ညာမှမပါဘဲ ပြည်တွင်းပြည်ပသတင်းအစုံကို ဖတ်ရှုနိုင်ပါပြီ။<\/p>/);
  assert.match(welcome, /id="welcome-start" class="welcome-start"[^>]*><span>ဖတ်ရှုမည်<\/span><svg/);
  assert.match(welcome, /class="welcome-network"/);
  for (const logo of ["bbc-burmese-avatar.png", "democratic-voice-of-burma.png", "radio-free-asia.png", "mpa-256.png", "the-irrawaddy.png", "voa-burmese.png", "kachin-news-group.png", "myaelatt-athan-256.png"]) {
    assert.ok(welcome.includes(`/images/publishers/${logo}`), `missing welcome logo ${logo}`);
  }
  assert.doesNotMatch(welcome, /mm-voice-logo\.svg|welcome-brand-mark/);
});

test("view counts stay hidden collapsed and appear at the bottom after See more", () => {
  assert.doesNotMatch(app, /meta\.append\(makeViewCountBadge\(item\)\)/);
  assert.match(app, /makeViewCountBadge\(item, false, true\)/);
  assert.match(app, /expandedViewCount\.hidden = true/);
  assert.match(app, /viewCountBadge\.hidden = !expanded/);
  assert.match(app, /makeViewCountBadge\(item, true\)/);
  assert.match(app, /detailContent\.append\(newBadge\)/);
  assert.doesNotMatch(app, /meta\.append\(newBadge\)/);
  assert.match(app, /recordPostView\(card\._postItem\)/);
  assert.match(css, /expanded-post-view-count\[hidden\]/);
  assert.match(css, /detail-content>\.detail-view-count\.dynamic-view-count/);
});

test("pull-to-refresh has an accessible indicator and smooth reduced-motion-aware animation", () => {
  assert.match(html, /id="pull-indicator"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(app, /touchmove'[\s\S]*?event\.preventDefault\(\)[\s\S]*?passive: false/);
  assert.match(app, /pullArmed \? 'pullRefresh' : 'pullHint'/);
  assert.match(css, /@keyframes mmvoice-pull-spin/);
  assert.match(css, /@keyframes mmvoice-pull-ripple/);
  assert.match(css, /prefers-reduced-motion:reduce[^}]*pull-indicator/);
});

test("all enabled publishers are wired to local logo assets used by feed and profile avatars", () => {
  const registry = app.match(/const publisherLogoPaths = new Map\(\[([\s\S]*?)\]\.map/);
  assert.ok(registry, "publisher logo path registry should exist");
  const entries = [...registry[1].matchAll(/\['([^']+)', '([^']+)'\]/g)].map((match) => [match[1], match[2]]);
  assert.equal(entries.length, enabledPublishers.length);
  const logoPaths = new Map(entries);
  for (const publisher of enabledPublishers) {
    assert.ok(logoPaths.has(publisher), `missing logo mapping for ${publisher}`);
    const logoPath = logoPaths.get(publisher);
    assert.match(logoPath, /^\/images\/publishers\/[a-z0-9-]+\.png$/);
    assert.ok(existsSync(path.join(projectRoot, "public", logoPath.replace(/^\//, ""))), `missing local logo for ${publisher}`);
  }
  assert.equal(logoPaths.get("BBC Burmese"), "/images/publishers/bbc-burmese-avatar.png");
  assert.ok(statSync(path.join(projectRoot, "public/images/publishers/bbc-burmese-avatar.png")).size > 5000, "BBC Burmese logo should be a real wordmark image, not a placeholder");
  assert.match(app, /renderPublisherAvatar\(avatar, publisherName\)/);
  assert.ok(app.includes("renderPublisherAvatar($('publisher-avatar'), currentPublisherName);"));
});

test("About menu opens a dedicated reading page with the supplied Burmese copy and no menu chrome", () => {
  assert.match(html, /<section id="about-view" class="page-view about-page" hidden aria-labelledby="about-title">/);
  assert.match(html, /<h1 id="about-title">MM Voice အကြောင်း \(About MM Voice\)<\/h1>/);
  assert.equal((html.match(/class="about-copy"/g) || []).length, 1);
  const requiredCopy = [
    "MM Voice သည် သတင်းဌာနတစ်ခု မဟုတ်ပါ။ ပြည်တွင်းပြည်ပမှ မြန်မာ့သတင်းများကို ပြည်သူများ တစ်နေရာတည်းတွင် လွယ်ကူစွာ ဖတ်ရှုနိုင်ရန် စုစည်းတင်ဆက်ပေးထားသော အက်ပ် (App) တစ်ခုသာ ဖြစ်ပါသည်။",
    "ဤအက်ပ်တွင် ပါဝင်သော သတင်းများသည် မူရင်းသတင်းဌာနများ၏ တင်ဆက်မှုများကို အချိန်တိုအတွင်း ဖတ်ရှုနိုင်ရန် အနှစ်ချုပ်ဖော်ပြပေးခြင်းနှင့် မူရင်းသတင်းစာမျက်နှာများထံသို့ တိုက်ရိုက်လမ်းညွှန် ချိတ်ဆက်ပေးခြင်းတို့ကိုသာ လုပ်ဆောင်ပေးပါသည်။ ကျွန်ုပ်တို့၏ အဓိကရည်ရွယ်ချက်မှာ ယုံကြည်စိတ်ချရသော သတင်းအချက်အလက်များကို ပြည်သူလူထုထံသို့ အချိန်နှင့်တစ်ပြေးညီ လွယ်ကူလျင်မြန်စွာ ရောက်ရှိစေရန် ကူညီချိတ်ဆက်ပေးသော ပေါင်းကူးတံတားတစ်စင်းအဖြစ် ရပ်တည်ရန် ဖြစ်ပါသည်။",
    "MM Voice သည် မည်သည့်စီးပွားရေး အကျိုးအမြတ်ကိုမျှ ရယူထားခြင်းမရှိသော (Non-profit) အက်ပ်တစ်ခု ဖြစ်ပါသည်။ ထို့ကြောင့် အသုံးပြုသူများအနေဖြင့် ကြော်ငြာများ (Ads) ၏ အနှောင့်အယှက်ကင်းစွာဖြင့် သတင်းများကို လွတ်လပ်စွာ အခမဲ့ ဖတ်ရှုနိုင်မည် ဖြစ်ပါသည်။",
    "အသုံးပြုသူ မိဘပြည်သူများအားလုံး စိတ်နှလုံးချမ်းမြေ့ကြပါစေခင်ဗျာ။"
  ];
  for (const paragraph of requiredCopy) assert.ok(html.includes(`<p>${paragraph}</p>`), `missing supplied paragraph: ${paragraph}`);
  assert.match(app, /\$\('drawer-about'\)\.addEventListener\('click', \(\) => \{ closeDrawer\(false\); setView\('about'\); \$\('about-back'\)\.focus\(\); \}\)/);
  assert.match(app, /aboutView\.hidden = view !== 'about'/);
  assert.match(app, /aboutReturnView = currentView/);
  assert.match(css, /\.app\.about-mode #site-header,\.app\.about-mode #primary-tabs\{display:none\}/);
  assert.doesNotMatch(html, /id="about-card"|class="about-accordion"/);
});

test("About page ends with a discreet creator credit", () => {
  assert.match(html, /<p class="about-creator">Created by @kanmaungnyo<\/p>/);
  assert.match(css, /\.about-creator\{[^}]*font-size:11px[^}]*text-align:center/);
});

test("news cards place four social actions under media and reveal attribution only on See more", () => {
  assert.match(html, /class="myanmar-map-icon"/);
  assert.match(app, /if \(isJob\) \{ const category = document\.createElement\('span'\)/);
  assert.match(app, /sourceCredits\.hidden = true/);
  assert.match(app, /credits\.hidden = !expanded/);
  assert.match(app, /actions\.append\(likeButton, commentButton, saveButton, shareButton\)/);
  assert.match(app, /imageWrap\.after\(actions, commentPanel\)/);
  for (const destination of ["facebook", "messenger", "telegram", "copy"]) assert.ok(html.includes(`data-share-destination="${destination}"`));
  assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});

test("only the MM VOICE text is clickable and it returns to Burma before refreshing", () => {
  assert.match(html, /id="brand-refresh" class="brand"/);
  const brandButton = html.match(/<button id="brand-refresh" class="brand"[\s\S]*?<\/button>/)?.[0];
  assert.ok(brandButton, "MM VOICE text should be the global navigation button");
  assert.match(brandButton, />MM VOICE<\/button>/);
  assert.doesNotMatch(brandButton, /brand-mark|brand-profile-icon|<svg/);
  assert.doesNotMatch(html, /brand-profile-icon/);
  assert.match(app, /\$\('brand-refresh'\)\.addEventListener\('click', \(\) => \{ closeDrawer\(false\); closeSearch\(false\); setView\('home'\); void refreshAppQuietly\(\); \}\);/);
  assert.match(css, /mmvoice-equalizer/);
  const quietRefresh = app.match(/async function refreshAppQuietly\(\) \{([\s\S]*?)\n  \}\n  function updateProfilePreference/);
  assert.ok(quietRefresh, "quiet refresh function should be present");
  assert.doesNotMatch(quietRefresh[1], /showToast|setPullStatus|refreshDone|refreshingFeed/);
});

test("notification badge caps at 9+ and quota exhaustion replaces the Play button", () => {
  assert.match(html, /id="notification-badge" class="notification-badge"/);
  assert.match(app, /unread > 9 \? '9\+'/);
  assert.match(app, /notificationReadStorageKey/);
  assert.match(app, /setInterval\(\(\) => \{ if \(!document\.hidden\) loadNotifications\(\)/);
  assert.match(html, /id="audio-quota-message"[^>]*>ဒီနေ့အတွက် အသံနဲ့နားထောင်မရတော့ပါ<\/div>/);
  assert.match(app, /setAudioQuotaUnavailable\(true, errorStatus\.retryAfterSeconds/);
  assert.match(app, /api\/audio\/quota-status/);
});

test("publisher directory renders brand images with a resilient official-site fallback", () => {
  assert.match(app, /renderPublisherDirectoryAvatar\(avatar, source\)/);
  assert.match(app, /favicon\.ico/);
  assert.match(app, /google\.com\/s2\/favicons/);
  assert.match(app, /const publisherDarkLogoKeys = new Set\(\['myanmar now'\]\)/);
  assert.match(app, /classList\.toggle\('logo-dark', publisherDarkLogoKeys\.has\(key\)\)/);
  assert.equal(statSync(path.join(projectRoot, "public/images/publishers/mekong-news-favicon.png")).size > 1000, true);
  assert.match(readFileSync(path.join(projectRoot, "public/publishers.css"), "utf8"), /publisher-directory-initial\.has-logo\.logo-dark/);
});
