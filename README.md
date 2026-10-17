# MM VOICE

မြန်မာဘာသာသတင်းဖတ်ရှုခြင်း၊ အသံထုတ်ပေးခြင်းနှင့် သတင်း feed လုပ်ဆောင်ချက်များပါဝင်သော Cloudflare Worker app ဖြစ်သည်။ Static files များကို `public/` မှပေးပြီး data ကို Cloudflare D1 (`DB` binding) တွင် သိမ်းဆည်းသည်။

## လိုအပ်ချက်များ

- Node.js 22 နှင့် npm
- Local development အတွက် Wrangler CLI (`npx wrangler` ဖြင့် အသုံးပြုနိုင်သည်)
- Cloudflare account နှင့် D1 database — Cloudflare တွင် ကိုယ်ပိုင် deploy ပြုလုပ်မည့်အခါ
- Gemini, admin login နှင့် social login တို့အတွက် သက်ဆိုင်ရာ credentials — အသုံးပြုမည့် feature များအလိုက်

## Local setup

Project root မှ အောက်ပါအတိုင်းလုပ်ပါ။

```sh
npm ci
cp wrangler.example.toml wrangler.toml
cp .env.example .dev.vars
```

`.dev.vars` ကို ကိုယ့် local တန်ဖိုးများဖြင့် ဖြည့်ပါ။ `wrangler.toml` ထဲတွင် `AUTH_PUBLIC_ORIGIN` ကို local origin အဖြစ်ထားပြီး Firebase သုံးမည်ဆိုလျှင် project ID နှင့် feature flags ကို သတ်မှတ်ပါ။ Firebase feature များကို မသုံးပါက sample ထဲက `false` တန်ဖိုးများအတိုင်းထားနိုင်သည်။

Local D1 schema/migrations ကို အသုံးပြုရန်၊ စမ်းသပ်မှုများနှင့် Worker ကို စတင်ရန်:

```sh
npx wrangler d1 migrations apply DB --local
npm test
npx wrangler dev
```

`wrangler.example.toml` ထဲရှိ D1 ID သည် local အသုံးပြုမှုအတွက် နမူနာတန်ဖိုးသာဖြစ်သည်။ ကိုယ်ပိုင် Cloudflare D1 database သို့ deploy မလုပ်မီ ကိုယ်ပိုင် database ID ဖြင့် အစားထိုးပါ။

## Configuration နှင့် secrets

### Local development

`.env.example` သည် ဖြည့်စရာအမည်များကို ပြသသည့် template ဖြစ်သည်။ Cloudflare Worker runtime က `.env` သို့မဟုတ် `.env.example` ကို အလိုအလျောက် မဖတ်ပါ။ Local Wrangler အတွက် `.env.example` ကို `.dev.vars` သို့ကူးပြီး အမှန်တကယ်တန်ဖိုးများကို `.dev.vars` ထဲတွင်သာ ထည့်ပါ။ `.dev.vars` နှင့် `.env` ကို Git ထဲသို့ မထည့်ပါနှင့်။

| Secret variable | အသုံးပြုပုံ |
| --- | --- |
| `ADMIN_PASSWORD` | Admin panel ဝင်ရောက်ရန် သီးသန့်၊ ရှည်လျားသော password |
| `GEMINI_API_KEY` | သတင်း pipeline ၏ Gemini လုပ်ဆောင်ချက်များ |
| `GEMINI_TTS_API_KEY` | မြန်မာအသံထုတ်ပေးသည့် Gemini TTS လုပ်ဆောင်ချက် |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google social login — နှစ်ခုလုံးရှိမှ သက်ဆိုင်ရာ provider ကို အသုံးပြုနိုင်သည် |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | Facebook social login — နှစ်ခုလုံးလိုအပ်သည် |
| `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` | LINE Login — နှစ်ခုလုံးလိုအပ်သည် |

Gemini integration မသုံးပါက သက်ဆိုင်ရာ key များကို မဖြည့်နိုင်ပါ။ Social login provider များသည် သက်ဆိုင်ရာ ID နှင့် secret နှစ်ခုလုံးရှိမှသာ ဖွင့်မည်။ API key တစ်ခုကို TTS နှင့် news pipeline နှစ်ခုလုံးအတွက် အသုံးပြုမည်ဆိုလျှင် မိမိ၏ Google/Gemini project ထဲတွင် လိုအပ်သော access ရှိကြောင်း သေချာစေပါ။

### အများမြင်ရသော၊ လျှို့ဝှက်မဟုတ်သည့် settings

အောက်ပါ settings များသည် secret မဟုတ်သော app configuration ဖြစ်ပြီး `wrangler.toml` ၏ `[vars]` ထဲတွင် ထည့်ရသည်။

- `AUTH_PUBLIC_ORIGIN` — app အသုံးပြုမည့် local သို့မဟုတ် deployed origin
- `AUTH_FIREBASE_PROJECT_ID` — Firebase project ID
- `AUTH_FIREBASE_EMAIL_ENABLED` — Firebase email login ကို ဖွင့်/ပိတ်ရန် (`"true"` သို့မဟုတ် `"false"`)
- `AUTH_FIREBASE_GOOGLE_ENABLED` — Firebase Google login ကို ဖွင့်/ပိတ်ရန် (`"true"` သို့မဟုတ် `"false"`)

Google, Facebook, LINE OAuth အတွက် callback URL များကို သက်ဆိုင်ရာ provider developer console တွင် ကိုယ်ပိုင် app origin နှင့် ကိုက်ညီအောင် ပြင်ဆင်ပါ။ Client ID / App ID / Channel ID များသည် API secret မဟုတ်သော်လည်း ဥပမာဖိုင်များတွင် placeholder များသာ အသုံးပြုထားသည်။

### Cloudflare Worker secrets နှင့် D1

Cloudflare Worker တွင် `.env` ဖိုင်တင်ထားရုံဖြင့် production runtime က ၎င်းကို အလိုအလျောက် မဖတ်ပါ။ Secret များကို Worker ၏ secret store ထဲသို့ ထည့်ပါ။ `wrangler.toml` ကို ကိုယ်ပိုင် account နှင့် app origin အတွက် ပြင်ဆင်ပြီး အောက်ပါ command တစ်ခုချင်းကို run လုပ်ပါ။ တောင်းလာသည့်အခါ secret တန်ဖိုးကို prompt ထဲတွင် ထည့်ပါ။

```sh
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GEMINI_TTS_API_KEY
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put FACEBOOK_APP_ID
npx wrangler secret put FACEBOOK_APP_SECRET
npx wrangler secret put LINE_CHANNEL_ID
npx wrangler secret put LINE_CHANNEL_SECRET
```

အသုံးပြုမည့် feature နှင့် provider အတွက် လိုအပ်သော secret များကိုသာ သတ်မှတ်ပါ။ လျှို့ဝှက်တန်ဖိုးများကို `wrangler.toml`, `wrangler.example.toml`, source code သို့မဟုတ် Git commit ထဲသို့ မထည့်ပါနှင့်။

D1 သည် database password ကို မသုံးပါ။ Worker က `wrangler.toml` ဖိုင်ရှိ `[[d1_databases]]` အောက်တွင် သတ်မှတ်ထားသော `DB` binding မှတစ်ဆင့် ချိတ်ဆက်သည်။ Local database state သည် `.wrangler/` အတွင်းတွင်ရှိပြီး Git မှ လျစ်လျူရှုထားသည်။ Cloudflare တွင် ကိုယ်ပိုင် D1 database ဖန်တီးပြီး Wrangler ပြသသည့် ID ကို `database_id` ထဲသို့ ထည့်ပါ။ ထို့နောက် ကိုယ်ပိုင် database တွင် migrations ကို စစ်ဆေးပြီး အသုံးပြုပါ။

```sh
npx wrangler d1 create mm-voice
# အထက်ပါ command မှရသော ID ကို wrangler.toml ထဲသို့ ထည့်ပြီးနောက်:
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
```

`--remote` သည် Cloudflare D1 ကို ပြောင်းလဲမည်ဖြစ်သောကြောင့် ကိုယ်ပိုင် database ID မှန်ကန်ကြောင်း စစ်ပြီးမှသာ run ပါ။

## စမ်းသပ်မှုများ

```sh
npm test
```

## Git နှင့် လျှို့ဝှက်ချက်များ

`.gitignore` သည် `.env`, `.dev.vars`, `wrangler.toml`, Wrangler local state၊ dependencies နှင့် production verification artifacts များကို ကာကွယ်ထားသည်။ `.env.example` နှင့် `wrangler.example.toml` တွင် placeholder များသာ ပါဝင်သည်။ Initial commit မလုပ်မီ Git ထဲသို့ ထည့်မည့်ဖိုင်များကို စစ်ဆေးပါ။ `.gitignore` သည် ယခင်က commit လုပ်ပြီးသားဖိုင်ကို history ထဲမှ မဖယ်ရှားနိုင်ပါ။ Secret တစ်ခု public Git history ထဲ ရောက်ဖူးပါက ဖိုင်မှဖယ်ရှားရုံမက မူရင်း key/password ကိုလည်း ပြောင်းလဲပါ။

## Open-source license

ဤ project ကို MIT License အောက်တွင် ဖြန့်ချိထားသည်။ အသေးစိတ်ကို [LICENSE](LICENSE) ဖိုင်တွင် ကြည့်ပါ။
