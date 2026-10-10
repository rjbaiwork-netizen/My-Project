"use client";

import Link from "next/link";
import MobileAppShell from "../../../../../components/layout/MobileAppShell";

const groups = [
  {
    title: "Chat Core",
    items: [
      "নতুন conversation তৈরি ও message পাঠানো",
      "History থেকে conversation reopen ও rename",
      "Refresh-এর পর conversation ও message persistence",
      "API error, timeout ও retry UI",
    ],
  },
  {
    title: "Knowledge ও Memory",
    items: [
      "Knowledge create/update/search",
      "Memory save/update/search",
      "আগের তথ্য পরবর্তী Chat-এ retrieve হওয়া",
      "Chat ও manual page-এ একই state দেখা",
    ],
  },
  {
    title: "Agent ও Automation",
    items: [
      "Agent নির্বাচন, execution ও run history",
      "Automation approval থেকে final status",
      "Execution failure ও retry আচরণ",
      "Confirmation ছাড়া সংবেদনশীল action প্রত্যাখ্যান",
    ],
  },
  {
    title: "Provider ও Production",
    items: [
      "Provider health ও routing status",
      "নিরাপদ simulated provider failure/fallback",
      "Desktop ও Android browser E2E",
      "Production deployment ও non-destructive smoke tests",
    ],
  },
];

const phases = [
  {
    number: "01",
    title: "বর্তমান অবস্থা স্থির করা ও Audit",
    items: [
      "GitHub main, সর্বশেষ commit, deployment এবং production API যাচাই",
      "Chat Interface ও সংশ্লিষ্ট API route-গুলোর বর্তমান কোড পর্যালোচনা",
      "Implemented, tested ও unverified ফিচারের পৃথক তালিকা তৈরি",
    ],
    exit: "প্রতিটি ফিচারের বাস্তব অবস্থা ও প্রমাণ নথিভুক্ত।",
  },
  {
    number: "02",
    title: "Chat API ও Authentication একীভূত করা",
    items: [
      "Conversation, message, history ও control request-এর API flow পর্যালোচনা",
      "Server-side proxy, authentication, permission ও error handling সামঞ্জস্যপূর্ণ করা",
      "Timeout, duplicate submission ও invalid response-এর আচরণ নির্ধারণ",
    ],
    exit: "Chat-এর সব request নির্ধারিত নিরাপদ API পথ ব্যবহার করে।",
  },
  {
    number: "03",
    title: "Core Chat Functional Testing",
    items: [
      "নতুন conversation তৈরি ও message পাঠানো",
      "Conversation history, rename, reopen এবং persistence",
      "Loading, timeout, retry ও error recovery",
      "Knowledge/Memory context পুনরুদ্ধার",
    ],
    exit: "একজন ব্যবহারকারী সম্পূর্ণ Chat workflow শেষ করতে পারেন।",
  },
  {
    number: "04",
    title: "প্রতিটি Control Integration সম্পূর্ণ করা",
    items: [
      "Agent: select → run → result → history",
      "Knowledge: create/update → search → Chat retrieval",
      "Memory: save/update → retrieval → persistence",
      "Automation: configure → approval → execute → final status",
      "Provider Router: status → selection → fallback → event history",
    ],
    exit: "প্রতিটি action-এর বাস্তব ফল ও database state যাচাই করা হয়েছে।",
  },
  {
    number: "05",
    title: "Confirmation ও Security Testing",
    items: [
      "Destructive বা সংবেদনশীল action-এর আগে confirmation",
      "অননুমোদিত request প্রত্যাখ্যান",
      "ভুল বা অস্পষ্ট command-এ নিরাপদ আচরণ",
      "একই action বারবার পাঠালে duplicate পরিবর্তন ঠেকানো",
    ],
    exit: "অনিচ্ছাকৃত পরিবর্তন, অননুমোদিত action ও ভুল success status প্রতিরোধ করা।",
  },
  {
    number: "06",
    title: "Browser E2E ও Production Deployment",
    items: [
      "Desktop এবং Android/mobile browser-এ বাস্তব UI পরীক্ষা",
      "GitHub CI, frontend/backend build এবং deployment যাচাই",
      "Production-এ non-destructive smoke test",
      "PASS/FAIL, log ও অবশিষ্ট সমস্যা-সহ চূড়ান্ত রিপোর্ট",
    ],
    exit: "Deployed version-এই পরীক্ষা সফল; শুধু local build বা API response-এর ওপর নির্ভর নয়।",
  },
];

export default function ChatInterfaceWorkPlanPage() {
  return (
    <MobileAppShell theme="dark">
      <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/aisystem/chat-interface"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            ← Chat Interface-এ ফিরে যান
          </Link>

          <header className="mt-6 rounded-2xl border border-blue-400/20 bg-slate-900/80 p-6">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">
              My-Project / Persistent Work Plan
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              My-Project — Chat Interface: বর্তমান অবস্থা, ঘাটতি ও কাজের ধারাবাহিকতা
            </h1>
            <p className="mt-4 leading-7 text-slate-300">
              এই পেজটি Chat Interface-এর স্থায়ী কাজের রেফারেন্স। নতুন কাজ শুরু করার আগে এখানে
              বর্তমান অবস্থা, ঘাটতি, অগ্রাধিকার ও যাচাইয়ের শর্ত মিলিয়ে নিতে হবে। কোনো ফিচারকে
              সম্পূর্ণ বলা হবে না যতক্ষণ না কোড, integration, বাস্তব ফলাফল এবং পরীক্ষার প্রমাণ মেলে।
            </p>
          </header>

          <section className="mt-6 rounded-2xl border border-blue-400/25 bg-blue-400/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-300">Phase 02 Security Implementation · 2026-10-10</p>
            <h2 className="mt-2 text-xl font-bold">কোড-স্তরের ফলো-আপ</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
              <li>Backend AI route-এ bearer-token authorization-এর missing token, wrong token ও valid token test যোগ করা হয়েছে; CI workflow-তে security test চালানো যুক্ত হয়েছে।</li>
              <li>Admin login-এ প্রতি client key-তে ১৫ মিনিটে ৫টি failed attempt-এর পর 429/Retry-After যোগ হয়েছে; সঠিক login হলে ওই key-এর failure counter reset হয়। এটি process-local limiter, তাই multi-instance/edge-level rate limit-এর বিকল্প নয়।</li>
              <li>Chat Interface-এ logout control যোগ হয়েছে; Cancel চাপলে server-side pending confirmation consumed/revoked হয়। Confirmation-এর exact action server-side record থেকেই execute হয় এবং একবারই consume করা যায়।</li>
              <li>GitHub Actions Run #18 PASS: shared/frontend/backend build, backend bearer-auth tests, confirmation replay/concurrency/expiry unit tests, login rate-limit tests এবং Prisma schema validation। <a href="https://github.com/rjbaiwork-netizen/My-Project/actions/runs/38073461954" className="text-blue-300 underline">Run #18-এর ফলাফল দেখুন</a>। Browser E2E, real-database migration/integration test এবং production smoke test এখনো বাকি।</li>
              <li>Render/Railway secrets বা migration পরিবর্তন করা হয়নি; main-এ merge এবং production deployment করা হয়নি।</li>
            </ul>
          </section>

          <section className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-amber-300">Phase 01 Audit Record · 2026-10-10</p>
            <h2 className="mt-2 text-xl font-bold">প্রাথমিক অডিটের ফলাফল</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              GitHub main-এর Chat UI, control-chat proxy, AI controller, aiRoutes, adminAuth ও AI control planner কোড পর্যালোচনা করা হয়েছে।
              Render deployment log-এ Work Plan commit-এর service live হওয়ার বার্তা আছে। তবে এই অডিট পরিবেশ থেকে public URL-এ সরাসরি browser/HTTP access DNS ব্যর্থতার কারণে যাচাই করা যায়নি।
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3">
                <p className="font-semibold text-red-200">P0 — Confirmation action-এর সঙ্গে বাঁধা নয়</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">UI pending action সংরক্ষণ করলেও Confirm-এ শুধু মূল message আবার পাঠানো হয়; backend action পুনরায় পরিকল্পনা করে এবং confirm=true হলে নতুন action execute করতে পারে। Fix: preview-তে দেখানো একই action/parameters-কে server-side signed বা stored confirmation token দিয়ে bind করতে হবে।</p>
              </div>
              <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3">
                <p className="font-semibold text-red-200">P0 — AI management API authentication audit blocker</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">aiRoutes-এ requireAdminAuth কেবল providers ও control-chat route group-এ দৃশ্যমান; Knowledge, Memory, Agent ও Automation-এর বহু route-এ route-level protection দেখা যায়নি। Production-এ unauthorized request দিয়ে পরীক্ষা করা হয়নি। Mutation endpoint-গুলোকে protected বলে প্রমাণিত না করা পর্যন্ত security verification অসম্পূর্ণ।</p>
              </div>
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3">
                <p className="font-semibold text-amber-100">P1 — Control planner failure সাধারণ Chat-এ fallback করে</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">Planner error হলে action=null ফেরে; UI সাধারণ Chat-এ চলে যেতে পারে। Control intent ব্যর্থ হলে স্পষ্ট error ও retry path দেখাতে হবে।</p>
              </div>
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3">
                <p className="font-semibold text-amber-100">P1 — Control action history স্থায়ী নয়</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">Preview ও execution result local UI message হিসেবে যোগ হয়; সাধারণ conversation/message persistence-এর সঙ্গে যুক্ত নয়। Refresh/reopen-এ action history হারাতে পারে।</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-semibold">Production test evidence</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">GitHub Actions run 38062358285-এর বিদ্যমান রিপোর্টে CMS smoke test, AI Agent execution, Knowledge/Memory/Chat API E2E ও provider diagnostics PASS ছিল। এটি Work Plan deployment-এর আগের run এবং browser-level Chat confirmation/security test নয়।</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-200">
              <strong>পরবর্তী gate:</strong> প্রথমে AI mutation route-গুলোর authentication boundary যাচাই ও সুরক্ষিত করা; তারপর confirmation-কে exact action-এর সঙ্গে bind করা। এর আগে production-এ destructive control action চালিয়ে পরীক্ষা করা যাবে না।
            </p>
          </section>

          <section className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-200">Phase 02 · Implementation update · 2026-10-10</p>
            <h2 className="mt-2 text-xl font-bold">Confirmation এখন preview করা action-এর সঙ্গেই বাঁধা</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
              <li>Prisma schema ও migration-এ server-side <code>AIControlConfirmation</code> record যোগ করা হয়েছে। Preview-তে action parameters database-এ সংরক্ষিত হয় এবং confirmation ID ফেরত আসে।</li>
              <li>Confirmation record-এর মেয়াদ ৫ মিনিট; confirm request-এ natural-language message পুনরায় plan করা হয় না—শুধু সংরক্ষিত action execute হয়।</li>
              <li>Database-এর conditional <code>updateMany</code> দিয়ে confirmation একবার consume করা হয়; expired/replayed ID প্রত্যাখ্যান করা হয়। Execution ব্যর্থ হলে একই confirmation পুনরায় চালানো যায় না।</li>
              <li>Chat UI এখন preview response-এর confirmation ID pending state-এ রাখে এবং Confirm-এ সেটিই পাঠায়।</li>
            </ul>
            <p className="mt-3 text-sm leading-6 text-amber-100"><strong>এখনও যাচাই বাকি:</strong> GitHub build/CI, Prisma validate/generate, migration apply, concurrency/replay tests এবং authenticated frontend proxy। এই পরিবর্তনগুলো draft PR branch-এ আছে; main বা production-এ deploy করা হয়নি।</p>
          </section>

          <section className="mt-6 rounded-2xl border border-blue-400/25 bg-blue-400/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">Phase 02 · Admin session implementation · 2026-10-10</p>
            <h2 className="mt-2 text-xl font-bold">Server-side admin session ও control proxy যুক্ত</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
              <li><code>/admin-login</code> page এবং <code>/api/admin/login</code>, <code>/api/admin/logout</code>, <code>/api/admin/session</code> endpoint যোগ করা হয়েছে।</li>
              <li>Session token HMAC-SHA256 দিয়ে server-side sign হয়; cookie HttpOnly, Secure, SameSite=Strict এবং ৮ ঘণ্টা মেয়াদি। Origin check আছে।</li>
              <li>AI Control proxy এখন session যাচাই করে, server-side <code>ADMIN_API_TOKEN</code> দিয়ে backend-এ অনুরোধ পাঠায়; browser-এ token প্রকাশ করা হয় না।</li>
              <li>Environment variable template-এ <code>ADMIN_LOGIN_PASSWORD</code>, <code>ADMIN_SESSION_SECRET</code>, <code>ADMIN_API_TOKEN</code> ও <code>ADMIN_CONTROL_PROXY_ENABLED</code> নথিভুক্ত। কোনো বাস্তব secret repository-তে যোগ করা হয়নি।</li>
            </ul>
            <p className="mt-3 text-sm leading-6 text-amber-100"><strong>Deploy-এর আগে বাধ্যতামূলক:</strong> Render frontend ও Railway backend-এ matching secrets configure করতে হবে, তারপর <code>ADMIN_CONTROL_PROXY_ENABLED=true</code> দিতে হবে। এই পরিবর্তন এখনও draft PR branch-এ; TypeScript/build/CI ও deployed login-flow verification বাকি।</p>
          </section>

          <section className="mt-6 rounded-2xl border border-blue-400/25 bg-blue-400/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">Phase 02 · API access coverage · 2026-10-10</p>
            <h2 className="mt-2 text-xl font-bold">AI API-র সব route-এ server-side authorization</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
              <li>Backend <code>/api/ai/*</code> router-এর সব endpoint-এ <code>requireAdminAuth</code> প্রয়োগ করা হয়েছে—conversation/history, chat, agents, memory, knowledge, automation ও provider route-সহ।</li>
              <li>Frontend Chat Interface-এর API call এখন একই-origin <code>/api/ai/*</code> proxy ব্যবহার করে। Proxy signed admin session যাচাই করে এবং server-side bearer token backend-এ পাঠায়।</li>
              <li>Unauthenticated direct backend request প্রত্যাখ্যাত হওয়ার কথা; frontend token browser JavaScript-এ প্রকাশ করে না।</li>
            </ul>
            <p className="mt-3 text-sm leading-6 text-amber-100"><strong>পরবর্তী যাচাই:</strong> build/typecheck, missing/invalid token tests, login-cookie tests, all Chat/History/Agent flows, backend readiness এবং deployed smoke tests। Proxy ব্যবহার করতে Render-এ সঠিক secret configure করতে হবে; deployment-এর আগে কোনো secret commit করা যাবে না।</p>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="text-xl font-bold">মূল দিকনির্দেশনা</h2>
            <p className="mt-3 leading-7 text-slate-300">
              নতুন ফিচার যোগ করার আগে Chat Interface-এর বর্তমান ফিচার, সংযুক্ত সিস্টেম, API এবং
              বাস্তব কার্যকারিতা—এই চারটি স্তরকে একই পরীক্ষার কাঠামোর মধ্যে আনতে হবে।
              ধারাবাহিকতা হবে:
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {["Integration", "Functional Verification", "End-to-End Testing", "Production Validation"].map((x) => (
                <div key={x} className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-3 text-center text-sm font-semibold">
                  {x}
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              API সফলভাবে সাড়া দিলেই ব্যবহারকারীর পুরো workflow সফল হয়েছে ধরে নেওয়া যাবে না।
              রিপোর্টে PASS থাকা এবং বর্তমান production-এ আবার পরীক্ষা করে PASS পাওয়াও এক বিষয় নয়।
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-2xl font-bold">১. Chat Interface-এ বর্তমানে কী কী রয়েছে?</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">কোডে রয়েছে</p>
                <h3 className="mt-2 text-lg font-bold">Conversation ও Chat</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                  <li>নতুন conversation ও আগের conversation-এর history</li>
                  <li>বার্তা পাঠানো ও AI-এর উত্তর পাওয়ার ব্যবস্থা</li>
                  <li>Conversation rename ও delete</li>
                  <li>Conversation ও message persistence-এর backend ব্যবস্থা</li>
                </ul>
                <p className="mt-3 text-sm text-slate-400">যাচাই: create → send → reopen → history/context বজায় থাকা।</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Backend সমর্থন রয়েছে</p>
                <h3 className="mt-2 text-lg font-bold">Knowledge ও Memory context</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                  <li>AI উত্তরের সময় Knowledge থেকে প্রাসঙ্গিক তথ্য খোঁজা</li>
                  <li>Memory থেকে প্রাসঙ্গিক তথ্য আনা</li>
                  <li>কথোপকথনে প্রাসঙ্গিক তথ্য ব্যবহারের ভিত্তি</li>
                </ul>
                <p className="mt-3 text-sm text-slate-400">যাচাই: create/update করা তথ্য পরবর্তী Chat-এ সঠিকভাবে উদ্ধার হচ্ছে কি না।</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-300">সমর্থন আছে; পূর্ণ যাচাই দরকার</p>
                <h3 className="mt-2 text-lg font-bold">Agent execution</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                  <li>Chat-এর সঙ্গে Agent execution যুক্ত করার ব্যবস্থা</li>
                  <li>Agent চালানো ও execution result-এর backend ভিত্তি</li>
                  <li>Agent run history-র সঙ্গে সংযোগের ভিত্তি</li>
                </ul>
                <p className="mt-3 text-sm text-slate-400">যাচাই: নির্বাচন, প্রকৃত execution, ফলাফল ও ব্যর্থতার স্পষ্ট বার্তা।</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-300">Control bridge যুক্ত</p>
                <h3 className="mt-2 text-lg font-bold">Unified AI Control Chat</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                  <li>Agent, Knowledge, Memory, Automation ও Provider Router-এর action planning</li>
                  <li>কিছু action-এর জন্য confirmation</li>
                  <li>Action execute ও ফলাফলের summary তৈরির backend logic</li>
                  <li>Frontend-এর <code>/api/ai/control-chat</code> proxy</li>
                </ul>
                <p className="mt-3 text-sm text-slate-400">যাচাই: preview → confirmation → execution → UI result—প্রতিটি ধাপ।</p>
              </article>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">২. কোন কাজগুলো এখনো সম্পূর্ণ করা বা যাচাই করা দরকার?</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="bg-white/5 text-slate-200">
                  <tr><th className="p-3">ক্ষেত্র</th><th className="p-3">বর্তমান মূল্যায়ন</th><th className="p-3">পরবর্তী কাজ</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-300">
                  {[
                    ["Chat conversation", "মূল ব্যবস্থা আছে", "Browser-level পূর্ণ flow পরীক্ষা"],
                    ["Knowledge", "Search/context ভিত্তি আছে", "Create/update/search ও Chat retrieval একসঙ্গে পরীক্ষা"],
                    ["Memory", "Retrieval ভিত্তি আছে", "Save/update ও পরবর্তী Chat-এ retrieval যাচাই"],
                    ["Agent", "Execution integration আছে", "নির্বাচন, চালানো, ফলাফল ও run history যাচাই"],
                    ["Automation", "Control/diagnostic integration আছে", "Approval/run/final-status lifecycle যাচাই"],
                    ["Provider Router", "Configuration/control ভিত্তি আছে", "Health, routing, failure ও fallback যাচাই"],
                    ["Confirmation", "কিছু action-এর জন্য আছে", "ঝুঁকিপূর্ণ action-এ preview ও confirmation বাধ্যতামূলক করা"],
                    ["API/auth", "একাধিক API path ব্যবহৃত হচ্ছে", "সামঞ্জস্যপূর্ণ request/error handling"],
                    ["Chat UI", "বিদ্যমান পেজ আছে", "Loading, empty, timeout, error ও mobile পরীক্ষা"],
                  ].map((r) => <tr key={r[0]}><td className="p-3 font-semibold">{r[0]}</td><td className="p-3">{r[1]}</td><td className="p-3">{r[2]}</td></tr>)}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              “বাকি” মানে সব ফিচার অনুপস্থিত নয়। কিছু ফিচারের কোড ও integration আছে; ঘাটতি মূলত
              end-to-end নির্ভরযোগ্যতা এবং পরীক্ষার প্রমাণে। পুনরায় পরীক্ষা ছাড়া কোনো live failure নিশ্চিত ধরে নেওয়া যাবে না।
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">৩. বর্তমানে আমাদের মূল ভুল কোথায়?</h2>
            <div className="mt-4 space-y-3">
              {[
                ["ভুল ১ — একাধিক integration যুক্ত হয়েছে, কিন্তু একক প্রবাহে যাচাই করা হয়নি", "Chat, Control Chat, Agent, Knowledge, Memory এবং Automation আলাদাভাবে কাজ করলেও একটি কথোপকথন থেকে শেষ পর্যন্ত কাজ সম্পন্ন হচ্ছে কি না, তা আলাদা পরীক্ষা দাবি করে। সংশোধন: বিচ্ছিন্ন পরীক্ষা ও পূর্ণ Chat-to-result পরীক্ষা—দুটিই বাধ্যতামূলক।"],
                ["ভুল ২ — Chat-এর API request-এর পথ একরকম নয়", "পূর্ববর্তী কোড পর্যালোচনায় conversation history ও /api/ai/chat সরাসরি backend URL ব্যবহার করে, কিন্তু control action /api/ai/control-chat proxy দিয়ে যায়। এতে auth, CORS, timeout ও error handling আলাদা হতে পারে। সংশোধন: এক সুসংগত frontend API layer; secret token কখনো browser-এ নয়।"],
                ["ভুল ৩ — পরিকল্পনা, অনুমোদন ও বাস্তব execution-এর সীমা স্পষ্ট নয়", "Action পরিকল্পনা তৈরি, confirmation এবং কাজ সফল হওয়া—তিনটি পৃথক অবস্থা। সংশোধন: Preview → Confirmation → Executing → Success/Failed অবস্থা দেখাতে হবে।"],
                ["ভুল ৪ — এক সিস্টেমের পরিবর্তন অন্য সিস্টেমে প্রতিফলিত হচ্ছে কি না যথেষ্ট যাচাই করা হয়নি", "Chat থেকে Memory তৈরি হলেও পরে উদ্ধার না হওয়া বা Dashboard-এ পুরোনো Automation state দেখা যাওয়ার মতো cross-system সমস্যা হতে পারে। সংশোধন: একই backend/database state Chat, manual page ও API—তিন দিক থেকে মিলিয়ে দেখা।"],
                ["ভুল ৫ — API test-কে সম্পূর্ণ functional test হিসেবে ধরা", "API 200 দিলেও UI ভুল ফল দেখাতে বা context হারাতে পারে। সংশোধন: API test, integration test, browser E2E ও production smoke test আলাদা স্তর হিসেবে চালানো।"],
              ].map((x) => <article key={x[0]} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><h3 className="font-bold">{x[0]}</h3><p className="mt-2 text-sm leading-7 text-slate-300">{x[1]}</p></article>)}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">৪. এখন থেকে কাজের সঠিক ধারাবাহিকতা</h2>
            <div className="mt-4 space-y-3">
              {phases.map((p) => (
                <article key={p.number} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="flex items-start gap-3"><span className="rounded-lg bg-blue-400/10 px-3 py-2 font-bold text-blue-300">{p.number}</span><h3 className="pt-1 text-lg font-bold">{p.title}</h3></div>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">{p.items.map((item) => <li key={item}>{item}</li>)}</ul>
                  <p className="mt-4 border-l-2 border-blue-400/40 pl-3 text-sm text-slate-400"><strong>সম্পন্ন হওয়ার শর্ত:</strong> {p.exit}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">৫. Chat Interface-এর কাঙ্ক্ষিত চূড়ান্ত আচরণ</h2>
            <p className="mt-3 leading-7 text-slate-300">
              Chat হবে একটি Unified AI Control Interface। এটি বিদ্যমান manual pages-এর বিকল্প নয়;
              Chat ও manual UI একই backend/database state পরিচালনা করবে।
            </p>
            <div className="mt-4 rounded-2xl border border-blue-400/20 bg-slate-900/80 p-5">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"><strong>Chat Interface</strong><p className="mt-1 text-sm text-slate-400">User request • Conversation context • Action preview</p></div>
              <div className="py-2 text-center text-blue-300">↓</div>
              <div className="rounded-xl border border-white/10 p-4 text-center"><strong>Control & Safety Layer</strong><p className="mt-1 text-sm text-slate-400">Intent → Permission → Confirmation → Execution</p></div>
              <div className="py-2 text-center text-blue-300">↓</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {["Agents — run/history","Knowledge — create/search","Memory — save/retrieve","Automation — approval/run","Provider Router — routing/fallback","Shared State — database/history"].map((x) => <div key={x} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center text-sm">{x}</div>)}
              </div>
              <div className="py-2 text-center text-blue-300">↓</div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-center"><strong>Verified result</strong><p className="mt-1 text-sm text-slate-400">Chat response • Updated state • Audit/event history • Clear error if failed</p></div>
            </div>
            <h3 className="mt-5 text-lg font-bold">উদাহরণ: “একটি Agent চালাও এবং ফলাফল দেখাও”</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-300">
              <li>অনুরোধের অর্থ ও অনুমোদিত Agent শনাক্ত করা।</li>
              <li>প্রয়োজন হলে action-এর preview দেখানো।</li>
              <li>অনুমোদন দরকার হলে confirmation নেওয়া।</li>
              <li>Backend-এ Agent চালিয়ে প্রকৃত run status যাচাই করা।</li>
              <li>ফলাফল, ব্যর্থতা ও run history Chat-এ দেখানো।</li>
              <li>Agent Dashboard-এ একই ফলাফল প্রতিফলিত হচ্ছে কি না নিশ্চিত করা।</li>
            </ol>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">৬. Verification checklist</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              এই তালিকাগুলো পরীক্ষার সময় প্রমাণসহ PASS/FAIL হিসেবে চিহ্নিত করতে হবে। এখনই PASS হওয়ার দাবি নয়।
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {groups.map((g) => (
                <article key={g.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <h3 className="font-bold">{g.title}</h3>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
                    {g.items.map((item) => <li key={item} className="flex gap-2"><span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-slate-500" aria-hidden="true" /><span>{item}</span></li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5">
            <h2 className="text-xl font-bold">৭. চূড়ান্ত নীতি ও অগ্রাধিকার</h2>
            <p className="mt-3 leading-7 text-slate-300">
              নতুন ফিচার যোগ করার চেয়ে বর্তমান Chat Interface-কে নির্ভরযোগ্য, নিরাপদ ও পরীক্ষিত কেন্দ্রীয়
              পরিচালনা ব্যবস্থা হিসেবে সম্পূর্ণ করা অগ্রাধিকার।
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-200">
              <li>Chat API ও authentication flow একীভূত এবং যাচাই।</li>
              <li>Conversation, Knowledge ও Memory-এর সম্পূর্ণ end-to-end পরীক্ষা।</li>
              <li>Agent, Automation ও Provider Router-এর action lifecycle সম্পূর্ণ করা।</li>
              <li>Confirmation, permission, error recovery ও browser-level পরীক্ষা।</li>
              <li>Production deployment, live verification এবং প্রমাণসহ চূড়ান্ত রিপোর্ট।</li>
            </ol>
            <p className="mt-4 border-t border-white/10 pt-4 font-semibold leading-7 text-white">
              কোনো কাজকে “সম্পূর্ণ” বলা হবে তখনই, যখন তার কোড, integration, বাস্তব ফলাফল এবং পরীক্ষার প্রমাণ—চারটিই মেলে।
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
            <h2 className="text-xl font-bold">৮. Phase 02 Security ও Verification — চলমান</h2>
            <p className="mt-3 leading-7 text-slate-300">
              Branch <code>phase-02/ai-control-security</code>-এ admin session, same-origin API proxy,
              backend AI-route bearer authorization এবং database-backed one-time confirmation-এর code যোগ করা হয়েছে।
              এই পরিবর্তনগুলো draft PR #42-এ আছে; main branch বা production deployment-এ merge করা হয়নি।
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-200">
              <li>GitHub Actions-এ non-deploying Phase 02 validation workflow shared/frontend/backend build, security unit tests এবং Prisma schema validation চালায়। সর্বশেষ Run #32 PASS।</li>
              <li>Workflow-এ শুধু placeholder DATABASE_URL ব্যবহৃত হবে; কোনো production database connection বা data mutation নয়।</li>
              <li>GitHub Actions Phase 02 Security Branch Validation run #32-এ shared package build, frontend build, backend build, backend bearer-auth tests, signed-session integrity/expiry tests, same-origin checks, AI proxy authorization/forwarding tests, confirmation expiry/replay/concurrency tests, login rate-limit tests এবং Prisma schema validation—মোট ১৮টি security test PASS হয়েছে। এটি automated unit/build/schema validation; browser E2E, live API integration এবং বাস্তব database migration এখনও যাচাই করা হয়নি।</li>
              <li>Production চালুর আগে Render-এ ADMIN_LOGIN_PASSWORD, ADMIN_SESSION_SECRET (কমপক্ষে ৩২ অক্ষর), ADMIN_API_TOKEN এবং Railway-তে একই ADMIN_API_TOKEN configure করতে হবে। Secret কখনো GitHub-এ commit করা যাবে না।</li>
              <li>Login endpoint-এ প্রতি IP-তে ১৫ মিনিটে ৫টি failed attempt-এর পর HTTP 429/Retry-After rate limiting এবং Chat Interface-এ Log out control যোগ করা হয়েছে। Rate limiter process-local, তাই একাধিক instance-এ এটি best-effort; production multi-instance setup-এ shared-store/edge rate limit দরকার।</li>
            </ul>
            <p className="mt-4 border-t border-white/10 pt-4 font-semibold leading-7 text-white">
              বর্তমান অবস্থা: Run #32-এর automated validation PASS; ১৮/১৮ security unit tests সফল। AI proxy-তে transient 5xx/timeout-এর পর control POST স্বয়ংক্রিয়ভাবে পুনরায় পাঠানো বন্ধ করা হয়েছে, যাতে সম্ভাব্য duplicate action না ঘটে; control proxy disabled থাকলে কেবল non-confirmed ordinary chat-এ fallback হয়।
              <li>Live configuration audit: Render-এর My Workspace-এ My-Project service আছে, main branch-এ auto-deploy চালু এবং বর্তমানে live deploy-এর commit 012df68f414818b5c919cbd26e6af68916014b97। ফলে Phase 02 draft branch-এর security code production-এ নেই। Render workspace-এ কোনো Render Postgres instance পাওয়া যায়নি।</li>
              <li>Railway production-এ My-Project backend ও Postgres service live এবং backend deployment SUCCESS; backend URL my-project-production-9cd9.up.railway.app। Connector variable names দেখায়, কিন্তু secret values withheld; তাই DATABASE_URL reference ও ADMIN_API_TOKEN matching নিশ্চিত করা যায়নি।</li>
              <li>Branch audit: Chat Interface-এর conversations/history/agents request same-origin /api/ai/* proxy দিয়ে পাঠানো হয়; backend AI router-এ bearer authorization যোগ করা হয়েছে। Main branch-এ এখনো আগের direct-request code এবং control POST retry behavior আছে—এই fix PR #42 merge/deploy না হওয়া পর্যন্ত production-এ কার্যকর নয়।</li>
              বাকি gated verification হলো বাস্তব browser E2E, database connection ও target যাচাই করে migration apply, Render/Railway secrets configure, এবং non-destructive deployed smoke test। এই পর্যায়ে production secrets পরিবর্তন, database migration, merge বা deployment করা হয়নি। Merge/deploy-এর আগে আলাদা অনুমোদন নেওয়া হবে।
            </p>
          </section>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-slate-400">
            <span>Work plan reference: Chat Interface</span>
            <Link href="/aisystem/chat-interface" className="font-semibold text-blue-300 hover:text-blue-200">Chat Interface খুলুন →</Link>
          </footer>
        </div>
      </main>
    </MobileAppShell>
  );
}
