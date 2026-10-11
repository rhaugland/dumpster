"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Mode = "bull" | "devil" | "wizard" | "lol" | "silence" | "riff";

interface Message {
  role: "user" | "assistant" | "divider";
  content: string;
}

type Topic = "work" | "relationships" | "life" | "school" | "emotions" | "sports" | "myself" | null;

const TOPICS: { id: Topic; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "relationships", label: "Relationships" },
  { id: "life", label: "Life" },
  { id: "school", label: "School" },
  { id: "emotions", label: "Emotions" },
  { id: "sports", label: "Sports" },
  { id: "myself", label: "Myself" },
];

const QUICK_SCENARIOS: Record<string, string[]> = {
  work: [
    "My boss is driving me insane",
    "I got passed over for a promotion",
    "A coworker threw me under the bus",
    "I'm completely burned out",
    "I hate my job but can't quit",
    "Meeting that should've been an email",
  ],
  relationships: [
    "We got in a huge fight",
    "I think they're losing interest",
    "My ex reached out",
    "I keep getting ghosted",
    "My partner doesn't listen to me",
    "I caught them in a lie",
  ],
  life: [
    "I feel completely stuck",
    "Money is stressing me out",
    "I don't know what I'm doing with my life",
    "Everything is falling apart at once",
    "I made a huge mistake",
    "I can't catch a break",
  ],
  school: [
    "My professor is the worst",
    "Group project nightmare",
    "I bombed an exam",
    "I'm drowning in assignments",
    "I don't even know why I'm here",
    "Student loans are crushing me",
  ],
  emotions: [
    "I'm so angry I can't think straight",
    "I feel lonely even around people",
    "I can't stop overthinking everything",
    "I'm anxious and I don't know why",
    "I'm sad and don't want to talk about it",
    "I feel numb",
  ],
  sports: [
    "My team just blew a huge lead",
    "The refs completely robbed us",
    "They traded my favorite player",
    "Fantasy league is ruining my life",
    "We lost to our biggest rival",
    "The coach has no idea what they're doing",
  ],
  myself: [
    "I keep getting in my own way",
    "I don't like who I'm becoming",
    "I can't stop comparing myself to everyone",
    "I feel like I'm not enough",
    "I keep making the same mistakes",
    "I don't recognize myself anymore",
  ],
};

const DAILY_PROMPTS = [
  "What's the thing you've been avoiding thinking about?",
  "If you could say one thing without consequences, what would it be?",
  "What's making you clench your jaw right now?",
  "Who disappointed you this week?",
  "What's the lie you keep telling yourself?",
  "What would you scream into a void right now?",
  "What conversation are you replaying in your head?",
  "What do you wish someone would just understand already?",
  "What's the thing that's 'fine' but actually isn't?",
  "What's keeping you up at night?",
  "Who do you need to forgive but can't?",
  "What are you pretending doesn't bother you?",
  "What would you do differently if you could rewind this week?",
  "What's the heaviest thing you're carrying right now?",
];

function getDailyPrompt(): string {
  if (typeof window === "undefined") return DAILY_PROMPTS[0];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

interface BurnEntry {
  date: number;
  mode: Mode;
  topic?: string;
  messageCount: number;
  moodBefore?: number;
  moodAfter?: number;
}

interface BurnLog {
  burns: BurnEntry[];
}

function getBurnLog(email: string): BurnLog {
  try {
    const raw = localStorage.getItem(`dumpster-burnlog-${email}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { burns: [] };
}

function saveBurnLog(email: string, log: BurnLog) {
  localStorage.setItem(`dumpster-burnlog-${email}`, JSON.stringify(log));
}

function getBurnStats(log: BurnLog) {
  const total = log.burns.length;
  const modeCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  log.burns.forEach(b => {
    modeCounts[b.mode] = (modeCounts[b.mode] || 0) + 1;
    if (b.topic) topicCounts[b.topic] = (topicCounts[b.topic] || 0) + 1;
  });
  const topMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0];
  const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0];
  const lastWeek = log.burns.filter(b => b.date > Date.now() - 7 * 86400000).length;
  const totalMessages = log.burns.reduce((s, b) => s + b.messageCount, 0);

  // Calculate streak
  let streak = 0;
  if (log.burns.length > 0) {
    const days = new Set(log.burns.map(b => new Date(b.date).toDateString()));
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.toDateString())) streak++;
      else if (i > 0) break;
    }
  }

  // Mood improvement rate
  const withMood = log.burns.filter(b => b.moodBefore != null && b.moodAfter != null);
  const improved = withMood.filter(b => b.moodAfter! > b.moodBefore!).length;
  const moodRate = withMood.length > 0 ? Math.round((improved / withMood.length) * 100) : null;

  return { total, topMode: topMode?.[0] as Mode | undefined, topModeCount: topMode?.[1] || 0, topTopic: topTopic?.[0], lastWeek, totalMessages, streak, moodRate };
}

/* ── Achievements ── */
interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (stats: ReturnType<typeof getBurnStats>, log: BurnLog) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first-torch", name: "First Torch", desc: "Torched your first conversation", icon: "M12 2C8 6 6 9 6 12.5C6 16 8.7 19 12 19C15.3 19 18 16 18 12.5C18 9 16 6 12 2Z", check: (s) => s.total >= 1 },
  { id: "five-burns", name: "Getting Warmer", desc: "Torched 5 conversations", icon: "M12 2C8 6 6 9 6 12.5C6 16 8.7 19 12 19C15.3 19 18 16 18 12.5C18 9 16 6 12 2Z", check: (s) => s.total >= 5 },
  { id: "streak-3", name: "On a Roll", desc: "3-day burn streak", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", check: (s) => s.streak >= 3 },
  { id: "streak-7", name: "Week of Fire", desc: "7-day burn streak", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", check: (s) => s.streak >= 7 },
  { id: "rage-machine", name: "Rage Machine", desc: "10 sessions with Bull", icon: "M20 35 Q10 15 25 20", check: (_, log) => log.burns.filter(b => b.mode === "bull").length >= 10 },
  { id: "devils-disciple", name: "Devil's Disciple", desc: "10 sessions with Devil", icon: "M28 32 Q22 8 30 18", check: (_, log) => log.burns.filter(b => b.mode === "devil").length >= 10 },
  { id: "wise-one", name: "Wise One", desc: "10 sessions with Wizard", icon: "M25 50 L50 5 L75 50", check: (_, log) => log.burns.filter(b => b.mode === "wizard").length >= 10 },
  { id: "lol-pain", name: "LOL Through the Pain", desc: "10 sessions with LOL", icon: "M32 56 Q50 78 68 56", check: (_, log) => log.burns.filter(b => b.mode === "lol").length >= 10 },
  { id: "silent-type", name: "The Silent Type", desc: "10 sessions with Silence", icon: "M36 60 L64 60", check: (_, log) => log.burns.filter(b => b.mode === "silence").length >= 10 },
  { id: "all-modes", name: "Full Spectrum", desc: "Used every mode at least once", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", check: (_, log) => { const modes = new Set(log.burns.map(b => b.mode)); return modes.size >= 5; } },
  { id: "vent-50", name: "Dumpster Diver", desc: "Sent 50 messages total", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", check: (s) => s.totalMessages >= 50 },
  { id: "mood-boost", name: "Feeling Better", desc: "Felt better after 5 sessions", icon: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", check: (_, log) => log.burns.filter(b => b.moodAfter != null && b.moodBefore != null && b.moodAfter! > b.moodBefore!).length >= 5 },
];

function getUnlockedAchievements(email: string): string[] {
  try {
    const raw = localStorage.getItem(`dumpster-achievements-${email}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveUnlockedAchievements(email: string, ids: string[]) {
  localStorage.setItem(`dumpster-achievements-${email}`, JSON.stringify(ids));
}

/* ── Sound Effects ── */
function playSound(type: "send" | "torch" | "lock" | "unlock" | "achieve") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "send") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "torch") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      // Add crackle noise
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.06, ctx.currentTime);
      noise.connect(ng);
      ng.connect(ctx.destination);
      noise.start(ctx.currentTime);
    } else if (type === "lock") {
      osc.type = "square";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "unlock") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "achieve") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24);
      osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {}
}

/* ── SVG Characters ── */

function BullSVG({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M20 35 Q10 15 25 20 Q30 22 30 30" fill="#c9a040" stroke="#444" strokeWidth="3" strokeLinecap="round"/>
      <path d="M80 35 Q90 15 75 20 Q70 22 70 30" fill="#c9a040" stroke="#444" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="50" cy="52" rx="28" ry="26" fill="#cc4444" stroke="#444" strokeWidth="3"/>
      <ellipse cx="50" cy="62" rx="16" ry="11" fill="#dd7777" stroke="#444" strokeWidth="2.5"/>
      <ellipse cx="44" cy="63" rx="3" ry="4" fill="#444"/>
      <ellipse cx="56" cy="63" rx="3" ry="4" fill="#444"/>
      <ellipse cx="38" cy="45" rx="6" ry="7" fill="white" stroke="#444" strokeWidth="2"/>
      <ellipse cx="62" cy="45" rx="6" ry="7" fill="white" stroke="#444" strokeWidth="2"/>
      <ellipse cx="40" cy="46" rx="3.5" ry="4" fill="#444"/>
      <ellipse cx="64" cy="46" rx="3.5" ry="4" fill="#444"/>
      <line x1="30" y1="34" x2="44" y2="38" stroke="#444" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="70" y1="34" x2="56" y2="38" stroke="#444" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="14" cy="38" r="4" fill="#eee" stroke="#444" strokeWidth="1.5"/>
      <circle cx="10" cy="30" r="3" fill="#eee" stroke="#444" strokeWidth="1.5"/>
      <circle cx="86" cy="38" r="4" fill="#eee" stroke="#444" strokeWidth="1.5"/>
      <circle cx="90" cy="30" r="3" fill="#eee" stroke="#444" strokeWidth="1.5"/>
    </svg>
  );
}

function DevilSVG({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M28 32 Q22 8 30 18 Q34 24 33 32" fill="#6b3a82" stroke="#444" strokeWidth="3" strokeLinecap="round"/>
      <path d="M72 32 Q78 8 70 18 Q66 24 67 32" fill="#6b3a82" stroke="#444" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="50" cy="55" rx="26" ry="25" fill="#8e5ea2" stroke="#444" strokeWidth="3"/>
      <path d="M35 48 Q38 42 44 48" stroke="#444" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M56 48 Q60 42 66 48" stroke="#444" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <circle cx="39" cy="47" r="2" fill="#444"/>
      <circle cx="61" cy="47" r="2" fill="#444"/>
      <path d="M38 62 Q50 72 62 62" stroke="#444" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M46 72 Q50 82 54 72" fill="#6b3a82" stroke="#444" strokeWidth="2.5"/>
      <line x1="82" y1="90" x2="82" y2="55" stroke="#c9a040" strokeWidth="3" strokeLinecap="round"/>
      <path d="M75 58 L82 48 L89 58" stroke="#c9a040" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="75" y1="58" x2="75" y2="52" stroke="#c9a040" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="89" y1="58" x2="89" y2="52" stroke="#c9a040" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function WizardSVG({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M25 50 L50 5 L75 50" fill="#4a90b8" stroke="#444" strokeWidth="3"/>
      <ellipse cx="50" cy="50" rx="28" ry="6" fill="#3a7a9e" stroke="#444" strokeWidth="2.5"/>
      <polygon points="50,18 52,25 59,25 53,29 55,36 50,32 45,36 47,29 41,25 48,25" fill="#ddb844" stroke="#444" strokeWidth="1.5"/>
      <ellipse cx="50" cy="65" rx="20" ry="18" fill="#f0c48a" stroke="#444" strokeWidth="3"/>
      <ellipse cx="42" cy="62" rx="4" ry="5" fill="white" stroke="#444" strokeWidth="2"/>
      <ellipse cx="58" cy="62" rx="4" ry="5" fill="white" stroke="#444" strokeWidth="2"/>
      <circle cx="43" cy="63" r="2.5" fill="#444"/>
      <circle cx="59" cy="63" r="2.5" fill="#444"/>
      <path d="M36 56 Q42 52 48 56" stroke="#444" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M52 56 Q58 52 64 56" stroke="#444" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M32 74 Q35 90 50 95 Q65 90 68 74" fill="#ddd" stroke="#444" strokeWidth="2.5"/>
      <path d="M38 78 Q50 82 62 78" stroke="#ccc" strokeWidth="1.5" fill="none"/>
      <path d="M40 84 Q50 88 60 84" stroke="#ccc" strokeWidth="1.5" fill="none"/>
      <path d="M44 74 Q50 78 56 74" stroke="#444" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function LolSVG({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="32" fill="#d48b2e" stroke="#444" strokeWidth="3"/>
      <path d="M30 42 Q37 36 44 42" stroke="#444" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M56 42 Q63 36 70 42" stroke="#444" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M72 44 Q76 52 72 56" fill="#6ea8d0" stroke="#444" strokeWidth="1.5"/>
      <path d="M28 44 Q24 52 28 56" fill="#6ea8d0" stroke="#444" strokeWidth="1.5"/>
      <path d="M32 56 Q50 78 68 56" fill="#444" stroke="#444" strokeWidth="3"/>
      <path d="M32 56 Q50 62 68 56" fill="white" stroke="none"/>
      <ellipse cx="50" cy="68" rx="8" ry="5" fill="#cc6666"/>
      <text x="10" y="22" fill="#444" fontSize="11" fontWeight="900" fontFamily="sans-serif" transform="rotate(-15 10 22)">HA</text>
      <text x="72" y="18" fill="#444" fontSize="9" fontWeight="900" fontFamily="sans-serif" transform="rotate(12 72 18)">HA</text>
    </svg>
  );
}

function SilenceSVG({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="30" fill="#8899a4" stroke="#444" strokeWidth="3"/>
      <path d="M34 46 Q40 42 46 46" stroke="#bbb" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M54 46 Q60 42 66 46" stroke="#bbb" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <line x1="36" y1="60" x2="64" y2="60" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="40" y1="56" x2="40" y2="64" stroke="#bbb" strokeWidth="1.5"/>
      <line x1="46" y1="56" x2="46" y2="64" stroke="#bbb" strokeWidth="1.5"/>
      <line x1="52" y1="56" x2="52" y2="64" stroke="#bbb" strokeWidth="1.5"/>
      <line x1="58" y1="56" x2="58" y2="64" stroke="#bbb" strokeWidth="1.5"/>
    </svg>
  );
}

function RiffSVG({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="30" fill="#5ea88e" stroke="#444" strokeWidth="3"/>
      <ellipse cx="40" cy="45" rx="5" ry="6" fill="white" stroke="#444" strokeWidth="2"/>
      <ellipse cx="60" cy="45" rx="5" ry="6" fill="white" stroke="#444" strokeWidth="2"/>
      <circle cx="41" cy="46" r="2.5" fill="#444"/>
      <circle cx="61" cy="46" r="2.5" fill="#444"/>
      <path d="M38 60 Q50 68 62 60" stroke="#444" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M30 28 Q32 20 38 24" stroke="#444" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M62 24 Q68 20 70 28" stroke="#444" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M25 55 Q18 50 20 58" stroke="#5ea88e" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M75 55 Q82 50 80 58" stroke="#5ea88e" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <circle cx="32" cy="55" r="4" fill="#4a9078" opacity="0.5"/>
      <circle cx="68" cy="55" r="4" fill="#4a9078" opacity="0.5"/>
    </svg>
  );
}

function DumpsterLogo() {
  return (
    <svg width="80" height="80" viewBox="0 0 120 110" fill="none">
      <rect x="25" y="38" width="70" height="50" rx="4" fill="#7a8e6e" stroke="#444" strokeWidth="3"/>
      <rect x="22" y="33" width="76" height="10" rx="3" fill="#8a9e7e" stroke="#444" strokeWidth="2.5"/>
      <rect x="40" y="44" width="3.5" height="38" fill="#6a7e5e" rx="1"/>
      <rect x="58" y="44" width="3.5" height="38" fill="#6a7e5e" rx="1"/>
      <rect x="74" y="44" width="3.5" height="38" fill="#6a7e5e" rx="1"/>
      <path d="M30 88 L28 98 M90 88 L92 98" stroke="#6a7e5e" strokeWidth="4" strokeLinecap="round"/>
      <rect x="24" y="24" width="72" height="9" rx="3" fill="#9aae8e" stroke="#444" strokeWidth="2.5" transform="rotate(-6 60 28)"/>
      <path d="M48 20 Q50 12 52 20" stroke="#c0b8a8" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M58 16 Q60 8 62 16" stroke="#c0b8a8" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M68 19 Q70 11 72 19" stroke="#c0b8a8" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

const CHARACTER_MAP: Record<Mode, React.FC<{ size?: number }>> = {
  bull: BullSVG,
  devil: DevilSVG,
  wizard: WizardSVG,
  lol: LolSVG,
  silence: SilenceSVG,
  riff: RiffSVG,
};

const MODES: {
  id: Mode;
  label: string;
  tagline: string;
  color: string;
  preview: string;
}[] = [
  { id: "bull", label: "Bull", tagline: "Rages with you", color: "#cc4444", preview: "THAT IS ABSOLUTELY UNACCEPTABLE AND I AM LIVID FOR YOU" },
  { id: "devil", label: "Devil", tagline: "Plays devil's advocate", color: "#8e5ea2", preview: "But have you considered that maybe you're the problem here..." },
  { id: "wizard", label: "Wizard", tagline: "Gives you advice", color: "#4a90b8", preview: "Here's what I'd do if I were in your shoes right now..." },
  { id: "lol", label: "LOL", tagline: "Makes light of it", color: "#d48b2e", preview: "Ok that's terrible but also kind of hilarious because..." },
  { id: "silence", label: "Silence", tagline: "Just let it rip", color: "#8899a4", preview: "..." },
  { id: "riff", label: "Riff", tagline: "Just vibing", color: "#5ea88e", preview: "Alright, here's one — what's your most unhinged take on..." },
];

const MOOD_FACES = ["Awful", "Bad", "Meh", "Okay", "Good"];

export default function Home() {
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [showIconGuide, setShowIconGuide] = useState(true);
  const [showGuardrails, setShowGuardrails] = useState(false);
  const [inkMode, setInkMode] = useState(false);
  const [topic, setTopic] = useState<Topic>(null);
  const [guardrails, setGuardrails] = useState<string[]>([]);
  const [newGuardrail, setNewGuardrail] = useState("");
  const [inkMessages, setInkMessages] = useState<Set<number>>(new Set());
  const [revealedMessages, setRevealedMessages] = useState<Set<number>>(new Set());
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState("");
  const messageTimes = useRef<number[]>([]);
  const [mobileTab, setMobileTab] = useState<"chats" | "profile">("chats");
  const [isMobile, setIsMobile] = useState(false);

  // New feature states
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isBurning, setIsBurning] = useState(false);
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [showMoodAfter, setShowMoodAfter] = useState(false);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [pendingBurnEntry, setPendingBurnEntry] = useState<BurnEntry | null>(null);
  const [showModeSwitcher, setShowModeSwitcher] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  // Disposal system
  type DisposalMethod = "torch" | "crumple" | "swish" | "fieldgoal" | "shred";
  const [showDisposalPicker, setShowDisposalPicker] = useState(false);
  const [disposalMethod, setDisposalMethod] = useState<DisposalMethod | null>(null);
  const [disposalPhase, setDisposalPhase] = useState<"crumpling" | "ready" | "launched" | "scored" | null>(null);

  const playSfx = useCallback((type: "send" | "torch" | "lock" | "unlock" | "achieve") => {
    if (soundEnabled) playSound(type);
  }, [soundEnabled]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (activeMode) inputRef.current?.focus(); }, [activeMode]);

  // Auto-start riff mode
  useEffect(() => {
    if (activeMode === "riff" && messages.length === 0 && !isLoading) {
      startRiff();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Dark mode init + toggle
  useEffect(() => {
    const saved = localStorage.getItem("dumpster-dark");
    if (saved === "true") { setDarkMode(true); document.documentElement.classList.add("dark"); }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) { document.documentElement.classList.add("dark"); } else { document.documentElement.classList.remove("dark"); }
    localStorage.setItem("dumpster-dark", String(next));
  };

  // Sound pref init
  useEffect(() => {
    const saved = localStorage.getItem("dumpster-sound");
    if (saved === "false") setSoundEnabled(false);
  }, []);

  // Check if icon guide was dismissed
  useEffect(() => {
    if (localStorage.getItem("dumpster-guide-dismissed")) setShowIconGuide(false);
  }, []);

  // Clean up any expired saved messages on load
  useEffect(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("dumpster-msgs-")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "");
          if (data.expiresAt && data.expiresAt < Date.now()) localStorage.removeItem(key);
        } catch { localStorage.removeItem(key!); }
      }
    }
  }, []);

  useEffect(() => {
    const session = localStorage.getItem("dumpster-session");
    if (!session) return;
    try {
      const parsed = JSON.parse(session);
      if (parsed.expiresAt > Date.now()) {
        setIsLoggedIn(true);
        setEmail(parsed.email);
        try {
          const profile = localStorage.getItem(`dumpster-profile-${parsed.email}`);
          if (profile) { const p = JSON.parse(profile); setFirstName(p.firstName || ""); setLastName(p.lastName || ""); }
        } catch {}
        try {
          const gr = localStorage.getItem(`dumpster-guardrails-${parsed.email}`);
          if (gr) setGuardrails(JSON.parse(gr));
        } catch {}
        const saved = localStorage.getItem(`dumpster-msgs-${parsed.email}`);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.expiresAt > Date.now()) { setMessages(data.messages); setActiveMode(data.mode); }
          else localStorage.removeItem(`dumpster-msgs-${parsed.email}`);
        }
      } else localStorage.removeItem("dumpster-session");
    } catch { localStorage.removeItem("dumpster-session"); }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = lockedUntil - Date.now();
      if (remaining <= 0) { setLockedUntil(null); setLockCountdown(""); messageTimes.current = []; playSfx("unlock"); return; }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setLockCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil, playSfx]);

  // Achievement toast auto-dismiss
  useEffect(() => {
    if (!newAchievement) return;
    const id = setTimeout(() => setNewAchievement(null), 4000);
    return () => clearTimeout(id);
  }, [newAchievement]);

  const DECOMPRESS_TIPS = [
    "Step outside for 5 minutes — even just standing in the doorway counts.",
    "Put your phone down, close your eyes, and take 10 slow breaths.",
    "Splash cold water on your face. Resets more than you'd think.",
    "Put on a song you love and just listen. Don't do anything else.",
    "Write it on paper — the physical kind. Then crumple it up.",
    "Do 20 jumping jacks. Sounds dumb. Works anyway.",
    "Text someone you trust and say 'I'm having a rough one.'",
    "Drink a glass of water. You're probably dehydrated and angry.",
  ];

  const checkIntensity = (text: string): boolean => {
    if (lockedUntil && lockedUntil > Date.now()) return true;
    const now = Date.now();
    messageTimes.current.push(now);
    messageTimes.current = messageTimes.current.filter(t => now - t < 120000);
    let score = 0;
    const recentCount = messageTimes.current.length;
    if (recentCount >= 8) score += 3;
    else if (recentCount >= 5) score += 1;
    if (text.length > 300) score += 2;
    else if (text.length > 150) score += 1;
    const letters = text.replace(/[^a-zA-Z]/g, "");
    if (letters.length > 5) {
      const capsRatio = (text.replace(/[^A-Z]/g, "").length) / letters.length;
      if (capsRatio > 0.6) score += 3;
      else if (capsRatio > 0.3) score += 1;
    }
    const bangs = (text.match(/[!?]{2,}/g) || []).length;
    if (bangs >= 3) score += 2;
    else if (bangs >= 1) score += 1;
    if (/(.)\1{4,}/i.test(text)) score += 1;
    if (score >= 5) {
      setLockedUntil(Date.now() + 5 * 60 * 1000);
      playSfx("lock");
      return true;
    }
    return false;
  };

  const saveMessages = useCallback((msgs: Message[], mode: Mode | null) => {
    if (isLoggedIn && email && mode) {
      localStorage.setItem(`dumpster-msgs-${email}`, JSON.stringify({ messages: msgs, mode, expiresAt: Date.now() + 86400000 }));
    }
  }, [isLoggedIn, email]);

  const fetchResponse = async (msgs: Message[], mode: Mode) => {
    setIsLoading(true);
    try {
      const apiMsgs = msgs.filter(m => m.role !== "divider");
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: apiMsgs, mode, topic, guardrails: guardrails.length > 0 ? guardrails : undefined }) });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const withResponse = [...msgs, { role: "assistant" as const, content: data.content }];
      setMessages(withResponse);
      saveMessages(withResponse, mode);
    } catch {
      setMessages([...msgs, { role: "assistant" as const, content: "Dumpster is taking a break. Try again." }]);
    } finally { setIsLoading(false); }
  };

  // Riff mode: auto-fetch first prompt when entering
  const startRiff = useCallback(async () => {
    if (!activeMode || activeMode !== "riff") return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "Throw me something to riff on." }], mode: "riff" }) });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.content }]);
    } catch {
      setMessages([{ role: "assistant", content: "Alright, what's your most controversial food opinion? Like, the one that would get you uninvited from a dinner party." }]);
    } finally { setIsLoading(false); }
  }, [activeMode]);

  const passRiff = async () => {
    if (activeMode !== "riff" || isLoading) return;
    const passMsg: Message = { role: "user", content: "Pass — give me another one." };
    const newMessages = [...messages, passMsg];
    setMessages(newMessages);
    playSfx("send");
    await fetchResponse(newMessages, "riff");
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeMode || lockedUntil) return;
    const text = input.trim();
    if (checkIntensity(text)) { setInput(""); return; }
    playSfx("send");
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    const msgIndex = newMessages.length - 1;
    setMessages(newMessages);
    setInput("");
    if (inkMode) {
      setInkMessages(prev => new Set([...prev, msgIndex]));
      saveMessages(newMessages, activeMode);
      return;
    }
    if (activeMode === "silence") { saveMessages(newMessages, activeMode); return; }
    await fetchResponse(newMessages, activeMode);
  };

  const revealMessage = async (index: number) => {
    if (!inkMessages.has(index) || revealedMessages.has(index)) return;
    setRevealedMessages(prev => new Set([...prev, index]));
    if (activeMode && activeMode !== "silence") {
      await fetchResponse(messages, activeMode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleAuth = () => {
    if (!email.trim() || !password.trim()) { setAuthError("Fill in both fields"); return; }
    if (authMode === "signup") {
      if (!firstName.trim() || !lastName.trim()) { setAuthError("Please enter your name"); return; }
      if (localStorage.getItem(`dumpster-user-${email}`)) { setAuthError("Account already exists"); return; }
      localStorage.setItem(`dumpster-user-${email}`, password);
      localStorage.setItem(`dumpster-profile-${email}`, JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }));
    } else {
      const stored = localStorage.getItem(`dumpster-user-${email}`);
      if (!stored || stored !== password) { setAuthError("Wrong email or password"); return; }
      // Load name from profile
      try {
        const profile = localStorage.getItem(`dumpster-profile-${email}`);
        if (profile) { const p = JSON.parse(profile); setFirstName(p.firstName || ""); setLastName(p.lastName || ""); }
      } catch {}
    }
    localStorage.setItem("dumpster-session", JSON.stringify({ email, expiresAt: Date.now() + 86400000 }));
    setIsLoggedIn(true); setShowLogin(false); setAuthError("");
    if (messages.length > 0 && activeMode) saveMessages(messages, activeMode);
  };

  const checkAchievements = useCallback((logEmail: string) => {
    const log = getBurnLog(logEmail);
    const stats = getBurnStats(log);
    const unlocked = getUnlockedAchievements(logEmail);
    for (const a of ACHIEVEMENTS) {
      if (!unlocked.includes(a.id) && a.check(stats, log)) {
        unlocked.push(a.id);
        saveUnlockedAchievements(logEmail, unlocked);
        setNewAchievement(a);
        playSfx("achieve");
        break; // Show one at a time
      }
    }
  }, [playSfx]);

  const startDisposal = (method: DisposalMethod) => {
    setShowDisposalPicker(false);
    setDisposalMethod(method);

    if (method === "torch") {
      // Existing flow: check if logged in for mood
      if (isLoggedIn && email && activeMode && messages.length > 0) {
        const entry: BurnEntry = {
          date: Date.now(), mode: activeMode, topic: topic || undefined,
          messageCount: messages.filter(m => m.role === "user").length,
          moodBefore: moodBefore ?? undefined,
        };
        setPendingBurnEntry(entry);
        setShowMoodAfter(true);
        return;
      }
      executeBurn("torch");
    } else if (method === "shred") {
      // Shred is non-interactive, just animate
      saveBurnEntry();
      executeBurn("shred");
    } else {
      // Interactive: crumple, swish, fieldgoal — first crumple messages
      saveBurnEntry();
      setDisposalPhase("crumpling");
      setTimeout(() => setDisposalPhase("ready"), 600);
    }
  };

  const saveBurnEntry = () => {
    if (isLoggedIn && email && activeMode && messages.length > 0) {
      const log = getBurnLog(email);
      log.burns.push({
        date: Date.now(), mode: activeMode, topic: topic || undefined,
        messageCount: messages.filter(m => m.role === "user").length,
        moodBefore: moodBefore ?? undefined,
      });
      saveBurnLog(email, log);
      setTimeout(() => checkAchievements(email), 300);
    }
  };

  const launchDisposal = () => {
    setDisposalPhase("launched");
    playSfx("torch");
    setTimeout(() => {
      setDisposalPhase("scored");
      playSfx("achieve");
    }, 800);
    setTimeout(() => {
      clearMessages();
      setDisposalMethod(null);
      setDisposalPhase(null);
    }, 2000);
  };

  const completeBurnWithMood = (afterMood: number | null) => {
    if (pendingBurnEntry && email) {
      const entry = { ...pendingBurnEntry, moodAfter: afterMood ?? undefined };
      const log = getBurnLog(email);
      log.burns.push(entry);
      saveBurnLog(email, log);
      setPendingBurnEntry(null);
      setMoodAfter(null);
      setShowMoodAfter(false);
      setTimeout(() => checkAchievements(email), 300);
    }
    executeBurn(disposalMethod || "torch");
  };

  const executeBurn = (method: DisposalMethod) => {
    playSfx("torch");
    setIsBurning(true);
    setShowDisposalPicker(false);
    const duration = method === "shred" ? 800 : 700;
    setTimeout(() => {
      clearMessages();
      setIsBurning(false);
      setDisposalMethod(null);
      setDisposalPhase(null);
    }, duration);
  };

  const clearMessages = () => {
    setMessages([]);
    setInkMessages(new Set());
    setRevealedMessages(new Set());
    setMoodBefore(null);
    if (isLoggedIn && email) localStorage.removeItem(`dumpster-msgs-${email}`);
  };

  const switchMode = (newMode: Mode) => {
    if (newMode === activeMode) return;
    if (messages.length > 0) {
      setMessages(prev => [...prev, { role: "divider" as const, content: `switched to ${MODES.find(m => m.id === newMode)?.label}` }]);
    }
    setActiveMode(newMode);
    setShowModeSwitcher(false);
  };

  const addGuardrail = () => {
    if (!newGuardrail.trim()) return;
    const updated = [...guardrails, newGuardrail.trim()];
    setGuardrails(updated);
    setNewGuardrail("");
    if (email) localStorage.setItem(`dumpster-guardrails-${email}`, JSON.stringify(updated));
  };

  const removeGuardrail = (index: number) => {
    const updated = guardrails.filter((_, i) => i !== index);
    setGuardrails(updated);
    if (email) localStorage.setItem(`dumpster-guardrails-${email}`, JSON.stringify(updated));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("dumpster-sound", String(next));
  };

  const currentMode = MODES.find((m) => m.id === activeMode);
  const CurrentCharacter = activeMode ? CHARACTER_MAP[activeMode] : null;

  /* ─── MOOD CHECK-IN ─── */
  const MoodPicker = ({ value, onChange, label }: { value: number | null; onChange: (v: number) => void; label: string }) => (
    <div className="text-center">
      <p className="text-sm font-medium text-foreground/70 mb-3">{label}</p>
      <div className="flex justify-center gap-3">
        {MOOD_FACES.map((face, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className="flex flex-col items-center gap-1 cursor-pointer transition-all animate-pop"
            style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg transition-all"
              style={{
                background: value === i + 1 ? currentMode?.color || "#666" : darkMode ? "#333" : "#f0ebe3",
                color: value === i + 1 ? "#fff" : darkMode ? "#aaa" : "#888",
                transform: value === i + 1 ? "scale(1.15)" : "scale(1)",
              }}
            >
              {[":(", ":/", ":|", ":)", ":D"][i]}
            </div>
            <span className="text-[10px] text-foreground/40">{face}</span>
          </button>
        ))}
      </div>
    </div>
  );

  /* ─── PROFILE VIEW (mobile) ─── */
  const ProfileView = () => {
    const stats = isLoggedIn && email ? getBurnStats(getBurnLog(email)) : null;
    const unlockedIds = email ? getUnlockedAchievements(email) : [];
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto">
          {/* Profile header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#aaa" : "#666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <p className="font-semibold text-foreground">{firstName && lastName ? `${firstName} ${lastName}` : email}</p>
            {firstName && lastName && <p className="text-xs text-muted">{email}</p>}
            <button
              onClick={() => { localStorage.removeItem("dumpster-session"); setIsLoggedIn(false); setEmail(""); setPassword(""); setFirstName(""); setLastName(""); setMobileTab("chats"); }}
              className="text-xs text-muted hover:text-foreground cursor-pointer mt-1"
            >
              sign out
            </button>
          </div>

          {/* Settings row */}
          <div className="flex gap-3 mb-4">
            <button onClick={toggleDarkMode} className="flex-1 flex items-center justify-center gap-2 bg-white border border-border rounded-xl py-3 cursor-pointer text-sm font-medium text-foreground/70 hover:text-foreground">
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
              {darkMode ? "Light" : "Dark"}
            </button>
            <button onClick={toggleSound} className="flex-1 flex items-center justify-center gap-2 bg-white border border-border rounded-xl py-3 cursor-pointer text-sm font-medium text-foreground/70 hover:text-foreground">
              {soundEnabled ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              )}
              Sound {soundEnabled ? "On" : "Off"}
            </button>
          </div>

          {/* Stats */}
          {stats && stats.total > 0 && (
            <div className="bg-white border border-border rounded-2xl p-5 mb-4">
              <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-3">Burn log</p>
              <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div className="bg-background rounded-xl py-3">
                  <p className="text-2xl font-black text-foreground">{stats.total}</p>
                  <p className="text-[11px] text-foreground/40">torched</p>
                </div>
                <div className="bg-background rounded-xl py-3">
                  <p className="text-2xl font-black text-foreground">{stats.lastWeek}</p>
                  <p className="text-[11px] text-foreground/40">this week</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-background rounded-xl py-3">
                  <p className="text-lg font-black" style={{ color: MODES.find(m => m.id === stats.topMode)?.color }}>
                    {MODES.find(m => m.id === stats.topMode)?.label || "---"}
                  </p>
                  <p className="text-[10px] text-foreground/40">top mode</p>
                </div>
                <div className="bg-background rounded-xl py-3">
                  <p className="text-lg font-black text-foreground">{stats.totalMessages}</p>
                  <p className="text-[10px] text-foreground/40">messages</p>
                </div>
                <div className="bg-background rounded-xl py-3">
                  <p className="text-lg font-black text-foreground">{stats.streak}</p>
                  <p className="text-[10px] text-foreground/40">day streak</p>
                </div>
              </div>
              {stats.moodRate !== null && (
                <p className="text-xs text-foreground/40 mt-3 text-center">
                  You felt better after <span className="font-medium text-foreground/60">{stats.moodRate}%</span> of sessions.
                </p>
              )}
              {stats.topTopic && (
                <p className="text-xs text-foreground/40 mt-1 text-center">
                  You dump about <span className="font-medium text-foreground/60">{stats.topTopic}</span> the most.
                </p>
              )}
            </div>
          )}

          {stats && stats.total === 0 && (
            <div className="bg-white border border-border rounded-2xl p-6 mb-4 text-center">
              <p className="text-sm text-muted/60">No burns yet</p>
              <p className="text-xs text-muted/40 mt-1">Start a chat and torch it to see your stats here.</p>
            </div>
          )}

          {/* Achievements */}
          <div className="bg-white border border-border rounded-2xl p-5 mb-4">
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-3">Achievements</p>
            <div className="grid grid-cols-4 gap-3">
              {ACHIEVEMENTS.map(a => {
                const unlocked = unlockedIds.includes(a.id);
                return (
                  <div key={a.id} className="text-center" title={unlocked ? `${a.name}: ${a.desc}` : "???"}>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-1 transition-all"
                      style={{
                        background: unlocked ? (darkMode ? "#3a3a40" : "#f0ebe3") : (darkMode ? "#2a2a30" : "#f8f6f2"),
                        opacity: unlocked ? 1 : 0.35,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={unlocked ? "#d48b2e" : "#ccc"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={a.icon} />
                      </svg>
                    </div>
                    <p className="text-[9px] text-foreground/50 leading-tight">{unlocked ? a.name : "???"}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guardrails */}
          <div className="bg-white border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#aaa" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Guardrails</p>
            </div>
            <p className="text-xs text-muted mb-4">Things you don&apos;t want to spiral into.</p>
            {guardrails.length > 0 && (
              <div className="space-y-2 mb-4">
                {guardrails.map((gr, i) => (
                  <div key={i} className="flex items-start gap-2 bg-background rounded-xl px-3 py-2.5 text-sm text-foreground/80">
                    <span className="flex-1">{gr}</span>
                    <button onClick={() => removeGuardrail(i)} className="shrink-0 text-muted hover:text-bull cursor-pointer text-xs mt-0.5">&times;</button>
                  </div>
                ))}
              </div>
            )}
            {guardrails.length === 0 && (
              <div className="bg-background rounded-xl px-4 py-5 text-center mb-4">
                <p className="text-sm text-muted/60 italic">No guardrails yet</p>
                <p className="text-xs text-muted/40 mt-1">e.g. &ldquo;Don&apos;t let me spiral into planning revenge&rdquo;</p>
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={newGuardrail} onChange={(e) => setNewGuardrail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGuardrail()}
                placeholder="Don't let me..." className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-muted" />
              <button onClick={addGuardrail} disabled={!newGuardrail.trim()}
                className="px-4 py-2.5 bg-foreground text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">Add</button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-3">About</p>
            <div className="space-y-2 text-xs text-foreground/50">
              <p>Everything auto-deletes in 24 hours.</p>
              <p>Your trash is your trash. We don&apos;t dig through it.</p>
              <p>We never save what you say --- just how often you torch it.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ─── MOBILE BOTTOM NAV ─── */
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border z-50 sm:hidden">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button onClick={() => { setMobileTab("chats"); if (activeMode) { setActiveMode(null); } }} className="flex flex-col items-center gap-0.5 px-6 py-1 cursor-pointer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mobileTab === "chats" && !activeMode ? (darkMode ? "#e0ddd8" : "#333") : "#aaa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-[10px] font-medium" style={{ color: mobileTab === "chats" && !activeMode ? (darkMode ? "#e0ddd8" : "#333") : "#aaa" }}>Chats</span>
        </button>
        <button onClick={() => { setMobileTab("profile"); setActiveMode(null); }} className="flex flex-col items-center gap-0.5 px-6 py-1 cursor-pointer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mobileTab === "profile" ? (darkMode ? "#e0ddd8" : "#333") : "#aaa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-[10px] font-medium" style={{ color: mobileTab === "profile" ? (darkMode ? "#e0ddd8" : "#333") : "#aaa" }}>Profile</span>
        </button>
      </div>
    </div>
  );

  /* ─── ACHIEVEMENT TOAST ─── */
  const AchievementToast = () => {
    if (!newAchievement) return null;
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-up">
        <div className="bg-white border border-border rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: darkMode ? "#3a3a40" : "#f0ebe3" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d48b2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={newAchievement.icon} />
            </svg>
          </div>
          <div>
            <p className="text-xs text-foreground/40 uppercase tracking-wide font-medium">Achievement unlocked</p>
            <p className="text-sm font-semibold text-foreground">{newAchievement.name}</p>
          </div>
        </div>
      </div>
    );
  };

  /* ─── LANDING ─── */
  if (!activeMode) {
    // Mobile profile tab
    if (isMobile && isLoggedIn && mobileTab === "profile") {
      return (
        <div className="min-h-screen flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-white/80 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-center">Profile</h2>
          </div>
          <ProfileView />
          <MobileNav />
          <AchievementToast />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col">
        {/* Auth corner */}
        <div className={`fixed top-4 right-4 z-50 ${isMobile && isLoggedIn ? "hidden" : ""}`}>
          {isLoggedIn ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <button onClick={toggleDarkMode} className="text-muted hover:text-foreground cursor-pointer" title={darkMode ? "Light mode" : "Dark mode"}>
                {darkMode ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>
              <button onClick={() => setShowGuardrails(true)} className="text-muted hover:text-foreground cursor-pointer" title="Guardrails">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </button>
              <span>{email}</span>
              <button onClick={() => { localStorage.removeItem("dumpster-session"); setIsLoggedIn(false); setEmail(""); setPassword(""); setFirstName(""); setLastName(""); }} className="text-muted hover:text-foreground cursor-pointer">logout</button>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-xs text-foreground/40 mb-0.5">see what you keep burning</p>
              <button onClick={() => { setShowLogin(true); setAuthMode("login"); }} className="text-sm text-foreground/60 hover:text-foreground cursor-pointer font-medium">sign in</button>
              <span className="text-foreground/30 mx-1">or</span>
              <button onClick={() => { setShowLogin(true); setAuthMode("signup"); }} className="text-sm text-foreground/60 hover:text-foreground cursor-pointer font-medium">sign up</button>
            </div>
          )}
        </div>

        {showLogin && !isLoggedIn && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-md border border-border">
              <h3 className="text-lg font-semibold mb-1">{authMode === "login" ? "Welcome back" : "Create account"}</h3>
              <p className="text-sm text-muted mb-6">We never save what you say &mdash; just how often you torch it, and where.</p>
              {authError && <p className="text-sm text-bull mb-4">{authError}</p>}
              {authMode === "signup" && (
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="first name" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-muted" />
                  <input type="text" placeholder="last name" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-muted" />
                </div>
              )}
              <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-3 text-sm focus:outline-none focus:border-muted" />
              <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-4 text-sm focus:outline-none focus:border-muted" />
              <button onClick={handleAuth} className="w-full bg-foreground text-white rounded-lg py-3 text-sm font-medium hover:opacity-90 cursor-pointer">
                {authMode === "login" ? "Sign in" : "Create account"}
              </button>
              <p className="text-sm text-muted text-center mt-4">
                {authMode === "login"
                  ? <>No account? <button onClick={() => { setAuthMode("signup"); setAuthError(""); }} className="text-foreground hover:underline cursor-pointer">Sign up</button></>
                  : <>Have an account? <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className="text-foreground hover:underline cursor-pointer">Sign in</button></>}
              </p>
              <button onClick={() => { setShowLogin(false); setAuthError(""); }} className="absolute top-3 right-4 text-muted hover:text-foreground cursor-pointer text-xl">&times;</button>
            </div>
          </div>
        )}

        {/* Guardrails modal (desktop) */}
        {showGuardrails && isLoggedIn && !isMobile && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl p-8 w-full max-w-md shadow-md border border-border">
              <div className="flex items-center gap-2 mb-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#aaa" : "#444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <h3 className="text-lg font-semibold">Guardrails</h3>
              </div>
              <p className="text-sm text-muted mb-5">Things you don&apos;t want to spiral into. Dumpster will steer you away.</p>
              {guardrails.length > 0 && (
                <div className="space-y-2 mb-4">
                  {guardrails.map((gr, i) => (
                    <div key={i} className="flex items-start gap-2 bg-background rounded-xl px-3 py-2.5 text-sm text-foreground/80">
                      <span className="flex-1">{gr}</span>
                      <button onClick={() => removeGuardrail(i)} className="shrink-0 text-muted hover:text-bull cursor-pointer text-xs mt-0.5">&times;</button>
                    </div>
                  ))}
                </div>
              )}
              {guardrails.length === 0 && (
                <div className="bg-background rounded-xl px-4 py-6 text-center mb-4">
                  <p className="text-sm text-muted/60 italic">No guardrails yet</p>
                  <p className="text-xs text-muted/40 mt-1">e.g. &ldquo;Don&apos;t let me spiral into planning revenge&rdquo;</p>
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={newGuardrail} onChange={(e) => setNewGuardrail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGuardrail()}
                  placeholder="Don't let me..." className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-muted" />
                <button onClick={addGuardrail} disabled={!newGuardrail.trim()}
                  className="px-4 py-2.5 bg-foreground text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">Add</button>
              </div>
              <button onClick={() => setShowGuardrails(false)} className="absolute top-3 right-4 text-muted hover:text-foreground cursor-pointer text-xl">&times;</button>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className={`flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-8 sm:pt-10 ${isMobile && isLoggedIn ? "pb-24" : "pb-6"}`}>
          <DumpsterLogo />
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-3 mb-2 text-foreground">Dumpster</h1>
          <p className="text-muted text-sm sm:text-base mb-4 sm:mb-6">toss it. torch it. move on.</p>

          {/* Daily prompt */}
          <div className="w-full max-w-lg mb-8 sm:mb-10">
            <p className="text-center text-sm italic text-foreground/40">&ldquo;{getDailyPrompt()}&rdquo;</p>
          </div>

          {/* Chat list */}
          <div className="w-full max-w-lg space-y-2.5 sm:space-y-3">
            {MODES.map((mode, i) => {
              const Character = CHARACTER_MAP[mode.id];
              return (
                <button
                  key={mode.id}
                  onClick={() => { setActiveMode(mode.id); setMessages([]); setMobileTab("chats"); setTopic(null); setMoodBefore(null); if (mode.id === "riff") setTopic("life"); }}
                  className="w-full flex items-center gap-3 sm:gap-4 bg-white border border-border rounded-2xl p-3 sm:p-4 text-left hover:shadow-md hover:border-muted/40 transition-all duration-150 cursor-pointer group"
                  style={{ animationDelay: `${i * 60}ms`, animation: "fadeUp 0.35s ease-out forwards", opacity: 0 }}
                >
                  <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center" style={{ background: `${mode.color}12` }}>
                    <Character size={isMobile ? 38 : 46} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm" style={{ color: mode.color }}>{mode.label}</span>
                      <span className="text-xs text-foreground/60">{mode.tagline}</span>
                    </div>
                    <p className="text-xs text-foreground/40 truncate italic hidden sm:block">{mode.preview}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" className="shrink-0 group-hover:stroke-muted transition-colors">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Burn log stats (desktop) */}
          {isLoggedIn && email && !isMobile && (() => {
            const stats = getBurnStats(getBurnLog(email));
            if (stats.total === 0) return null;
            const modeLabel = MODES.find(m => m.id === stats.topMode)?.label;
            return (
              <div className="w-full max-w-lg mt-8 bg-white border border-border rounded-2xl p-5">
                <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-3">Your burn log</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-black text-foreground">{stats.total}</p>
                    <p className="text-[11px] text-foreground/40">{stats.total === 1 ? "conversation" : "conversations"} torched</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-foreground">{stats.lastWeek}</p>
                    <p className="text-[11px] text-foreground/40">this week</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black" style={{ color: MODES.find(m => m.id === stats.topMode)?.color }}>{modeLabel || "---"}</p>
                    <p className="text-[11px] text-foreground/40">most used</p>
                  </div>
                </div>
                {stats.moodRate !== null && (
                  <p className="text-xs text-foreground/40 mt-3 text-center">
                    Felt better after <span className="font-medium text-foreground/60">{stats.moodRate}%</span> of sessions.
                  </p>
                )}
              </div>
            );
          })()}

          {!isLoggedIn && (
            <div className="w-full max-w-lg mt-8 bg-white/60 border border-border rounded-2xl px-5 py-4 text-center">
              <p className="text-sm text-foreground/50">You&apos;re in guest mode --- just the basics.</p>
              <p className="text-xs text-foreground/40 mt-1">
                Create an account to unlock burn stats, streaks, achievements, guardrails, and 24-hour save.
              </p>
            </div>
          )}

          <p className="text-xs mt-10 text-muted/40">everything auto-deletes in 24 hours</p>
          <p className="text-xs mt-1.5 text-muted/40">your trash is your trash. we don&apos;t dig through it.</p>
        </div>

        {isMobile && isLoggedIn && <MobileNav />}
        <AchievementToast />
      </div>
    );
  }

  /* ─── CHAT ─── */
  return (
    <div className="h-screen flex flex-col relative">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border bg-white/80 backdrop-blur-sm">
        <button onClick={() => { if (!isLoggedIn) setMessages([]); setActiveMode(null); }}
          className="text-sm text-muted hover:text-foreground cursor-pointer flex items-center gap-1.5 font-medium">
          <span>&larr;</span> back
        </button>
        {/* Mode switcher */}
        <button onClick={() => setShowModeSwitcher(!showModeSwitcher)} className="flex items-center gap-2 cursor-pointer group">
          {CurrentCharacter && <CurrentCharacter size={isMobile ? 22 : 26} />}
          <span className="font-bold text-sm" style={{ color: currentMode?.color }}>{currentMode?.label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={currentMode?.color} strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-y-0.5 transition-transform">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isLoggedIn ? (
          <span className="text-xs text-muted w-14 text-right truncate hidden sm:block">{email}</span>
        ) : (
          <div className="text-right">
            <button onClick={() => { setShowLogin(true); setAuthMode("login"); }} className="text-xs text-foreground/60 hover:text-foreground cursor-pointer font-medium">sign in</button>
            <span className="text-foreground/30 mx-1 text-xs">or</span>
            <button onClick={() => { setShowLogin(true); setAuthMode("signup"); }} className="text-xs text-foreground/60 hover:text-foreground cursor-pointer font-medium">sign up</button>
          </div>
        )}
      </div>

      {/* Mode switcher dropdown */}
      {showModeSwitcher && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-white border border-border rounded-2xl shadow-lg p-2 w-56">
          {MODES.filter(m => m.id !== activeMode).map(mode => {
            const Character = CHARACTER_MAP[mode.id];
            return (
              <button
                key={mode.id}
                onClick={() => switchMode(mode.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background cursor-pointer transition-colors"
              >
                <Character size={24} />
                <div>
                  <span className="text-sm font-medium" style={{ color: mode.color }}>{mode.label}</span>
                  <span className="text-[11px] text-foreground/40 ml-2">{mode.tagline}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Icon guide */}
      {showIconGuide && (
        <div className="border-b border-border bg-white/60 px-4 py-2.5">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-5 text-[11px] text-foreground/50">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                invisible ink
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8 6 6 9 6 12.5C6 16 8.7 19 12 19C15.3 19 18 16 18 12.5C18 9 16 6 12 2Z" fill="#e25a3e" opacity="0.5" stroke="#cc4444" strokeWidth="1.5"/>
                  <path d="M12 9C10.5 11 10 12.5 10 13.5C10 15 10.9 16 12 16C13.1 16 14 15 14 13.5C14 12.5 13.5 11 12 9Z" fill="#f5b731" stroke="#e09a28" strokeWidth="1"/>
                </svg>
                torch it
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
                send
              </div>
            </div>
            <button onClick={() => { setShowIconGuide(false); localStorage.setItem("dumpster-guide-dismissed", "true"); }}
              className="text-foreground/30 hover:text-foreground/60 cursor-pointer text-sm leading-none ml-4">&times;</button>
          </div>
        </div>
      )}

      {/* Login modal */}
      {showLogin && !isLoggedIn && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-md border border-border">
            <h3 className="text-lg font-semibold mb-1">{authMode === "login" ? "Welcome back" : "Create account"}</h3>
            <p className="text-sm text-muted mb-6">We never save what you say &mdash; just how often you torch it, and where.</p>
            {authError && <p className="text-sm text-bull mb-4">{authError}</p>}
            {authMode === "signup" && (
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="first name" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-muted" />
                <input type="text" placeholder="last name" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-muted" />
              </div>
            )}
            <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-3 text-sm focus:outline-none focus:border-muted" />
            <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-4 text-sm focus:outline-none focus:border-muted" />
            <button onClick={handleAuth} className="w-full bg-foreground text-white rounded-lg py-3 text-sm font-medium hover:opacity-90 cursor-pointer">
              {authMode === "login" ? "Sign in" : "Create account"}
            </button>
            <p className="text-sm text-muted text-center mt-4">
              {authMode === "login"
                ? <>No account? <button onClick={() => { setAuthMode("signup"); setAuthError(""); }} className="text-foreground hover:underline cursor-pointer">Sign up</button></>
                : <>Have an account? <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className="text-foreground hover:underline cursor-pointer">Sign in</button></>}
            </p>
            <button onClick={() => { setShowLogin(false); setAuthError(""); }} className="absolute top-3 right-4 text-muted hover:text-foreground cursor-pointer text-xl">&times;</button>
          </div>
        </div>
      )}

      {/* Topic selector — hidden for riff mode */}
      {topic && activeMode !== "riff" && (
        <div className="border-b border-border bg-white/40 px-3 sm:px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <span className="text-[11px] text-foreground/40 shrink-0 hidden sm:inline">dumping about</span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {TOPICS.map(t => (
                <button key={t.id}
                  onClick={() => {
                    if (topic === t.id) return;
                    if (messages.length > 0) setMessages(prev => [...prev, { role: "divider" as const, content: t.label! }]);
                    setTopic(t.id);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full cursor-pointer transition-all font-medium shrink-0"
                  style={topic === t.id ? { background: currentMode?.color, color: "#fff" } : { background: "transparent", border: "1px solid var(--color-border)", color: darkMode ? "#aaa" : "#888" }}
                >{t.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mood check-in (before chatting) — hidden for riff mode */}
      {isLoggedIn && messages.length === 0 && moodBefore === null && topic && activeMode !== "riff" && (
        <div className="border-b border-border bg-white/40 px-4 py-4">
          <div className="max-w-md mx-auto">
            <MoodPicker value={moodBefore} onChange={(v) => setMoodBefore(v)} label="How are you feeling right now?" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6" onClick={() => showModeSwitcher && setShowModeSwitcher(false)}>
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-6 sm:py-10">
              {CurrentCharacter && <div className="flex justify-center mb-3 sm:mb-4"><CurrentCharacter size={isMobile ? 56 : 72} /></div>}
              <p className="text-lg font-semibold mb-1" style={{ color: currentMode?.color }}>{currentMode?.label}</p>
              <p className="text-sm text-muted mb-4 sm:mb-6">{activeMode === "silence" ? "Type whatever you need to. No one's listening." : activeMode === "riff" ? "Hang tight, cooking up a prompt..." : "Start typing, or pick one."}</p>

              {topic && activeMode !== "riff" && QUICK_SCENARIOS[topic] && (
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {QUICK_SCENARIOS[topic].map((scenario) => (
                    <button
                      key={scenario}
                      onClick={() => {
                        setInput(scenario);
                        setTimeout(() => {
                          const userMsg: Message = { role: "user", content: scenario };
                          const newMessages = [userMsg];
                          setMessages(newMessages);
                          setInput("");
                          if (activeMode === "silence") { saveMessages(newMessages, activeMode); return; }
                          fetchResponse(newMessages, activeMode!);
                        }, 0);
                      }}
                      className="text-xs px-3 py-2 rounded-full bg-white border border-border hover:border-muted/50 hover:shadow-sm cursor-pointer transition-all text-foreground/60 hover:text-foreground"
                    >{scenario}</button>
                  ))}
                </div>
              )}

              {!topic && activeMode !== "silence" && activeMode !== "riff" && (
                <p className="text-xs text-muted/50 mt-2">pick a topic below for quick starts</p>
              )}
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.role === "divider") {
              return (
                <div key={i} className="animate-fade-up flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-foreground/40 font-medium shrink-0" style={{ color: currentMode?.color }}>
                    {msg.content}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              );
            }
            const isInk = inkMessages.has(i);
            const isRevealed = revealedMessages.has(i);
            const isHidden = inkMode || (isInk && !isRevealed);
            return (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${isBurning && disposalMethod === "shred" ? "animate-shred" : isBurning && disposalMethod === "torch" ? "animate-burn" : disposalPhase === "crumpling" ? "animate-crumple" : "animate-fade-up"}`}
                style={isBurning || disposalPhase === "crumpling" ? { animationDelay: `${(messages.length - 1 - i) * 80}ms` } : undefined}>
                {msg.role === "assistant" && CurrentCharacter && <div className="shrink-0 mr-2 mt-1"><CurrentCharacter size={26} /></div>}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isHidden ? "cursor-pointer select-none" : ""}`}
                  style={{
                    ...(msg.role === "user"
                      ? { background: darkMode ? "#3a3530" : "#ede8df", color: darkMode ? "#e0ddd8" : "#333" }
                      : { background: darkMode ? "var(--color-surface)" : "#fff", border: `1.5px solid ${currentMode?.color}30`, color: darkMode ? "#e0ddd8" : "#333" }),
                    ...(isHidden ? { filter: "blur(8px)", transition: "filter 0.4s ease" } : { transition: "filter 0.4s ease" }),
                  }}
                  onClick={() => isHidden && revealMessage(i)}
                >
                  {msg.content}
                  {isHidden && <span className="block text-[10px] mt-1 opacity-0">tap to reveal</span>}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start animate-fade-up">
              {CurrentCharacter && <div className="shrink-0 mr-2 mt-1"><CurrentCharacter size={26} /></div>}
              <div className="rounded-2xl px-4 py-3" style={{ background: darkMode ? "var(--color-surface)" : "#fff", border: `1.5px solid ${currentMode?.color}30` }}>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="w-2 h-2 rounded-full" style={{ backgroundColor: currentMode?.color, animation: `typing-dot 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Disposal picker */}
      {showDisposalPicker && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-md border border-border">
            <p className="font-semibold text-foreground text-center mb-1">How do you want to get rid of it?</p>
            <p className="text-xs text-muted text-center mb-4">Gone forever. No undo.</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {([
                { id: "torch" as DisposalMethod, label: "Torch", icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8 6 6 9 6 12.5C6 16 8.7 19 12 19C15.3 19 18 16 18 12.5C18 9 16 6 12 2Z" fill="#e25a3e" stroke="#cc4444" strokeWidth="1.5"/>
                    <path d="M12 9C10.5 11 10 12.5 10 13.5C10 15 10.9 16 12 16C13.1 16 14 15 14 13.5C14 12.5 13.5 11 12 9Z" fill="#f5b731" stroke="#e09a28" strokeWidth="1"/>
                  </svg>
                )},
                { id: "crumple" as DisposalMethod, label: "Toss", icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 20h16M8 16h8v4H8zM12 12l-2 2M12 12l2 2M12 12V6M9 6h6" />
                  </svg>
                )},
                { id: "swish" as DisposalMethod, label: "Swish", icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8" stroke="#e07020" strokeWidth="1.5" fill="none"/>
                    <path d="M7 12h10M12 7v10" stroke="#e07020" strokeWidth="1" />
                    <path d="M8 8c2 1 4 1 6 0" stroke="#333" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  </svg>
                )},
                { id: "fieldgoal" as DisposalMethod, label: "Kick", icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="6" y1="4" x2="6" y2="20" />
                    <line x1="18" y1="4" x2="18" y2="20" />
                    <line x1="6" y1="6" x2="18" y2="6" />
                    <path d="M12 18l-2-3h4l-2 3z" fill="#8B4513" stroke="none" />
                  </svg>
                )},
                { id: "shred" as DisposalMethod, label: "Shred", icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="5" y="3" width="14" height="8" rx="1" />
                    <line x1="5" y1="11" x2="19" y2="11" />
                    <line x1="8" y1="14" x2="8" y2="21" strokeDasharray="2 2" />
                    <line x1="12" y1="14" x2="12" y2="21" strokeDasharray="2 2" />
                    <line x1="16" y1="14" x2="16" y2="21" strokeDasharray="2 2" />
                  </svg>
                )},
              ]).map(d => (
                <button key={d.id} onClick={() => startDisposal(d.id)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl cursor-pointer hover:bg-background transition-colors active:scale-95">
                  {d.icon}
                  <span className="text-[10px] font-medium text-foreground/60">{d.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowDisposalPicker(false)} className="w-full py-2 text-sm text-muted hover:text-foreground cursor-pointer">Never mind</button>
          </div>
        </div>
      )}

      {/* Interactive disposal overlay */}
      {disposalPhase && disposalMethod && disposalMethod !== "torch" && disposalMethod !== "shred" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: darkMode ? "rgba(26,26,31,0.95)" : "rgba(250,246,240,0.95)" }}>
          {/* Target */}
          <div className="mb-8">
            {disposalMethod === "crumple" && (
              <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                <rect x="20" y="30" width="60" height="55" rx="4" fill={darkMode ? "#3a3a40" : "#d6d0c4"} stroke={darkMode ? "#555" : "#b0a898"} strokeWidth="3"/>
                <rect x="17" y="25" width="66" height="10" rx="3" fill={darkMode ? "#444" : "#c0b8a8"} stroke={darkMode ? "#555" : "#b0a898"} strokeWidth="2"/>
                {disposalPhase === "scored" && <text x="50" y="65" textAnchor="middle" fill={darkMode ? "#e0ddd8" : "#666"} fontSize="16" fontWeight="bold">IN!</text>}
              </svg>
            )}
            {disposalMethod === "swish" && (
              <svg width="100" height="80" viewBox="0 0 120 100" fill="none">
                <rect x="45" y="10" width="30" height="4" rx="2" fill={darkMode ? "#666" : "#999"} />
                <ellipse cx="60" cy="14" rx="22" ry="4" stroke="#e07020" strokeWidth="3" fill="none"/>
                <path d="M42 18 L42 45 M78 18 L78 45" stroke="#eee" strokeWidth="1.5" strokeDasharray="3 4" />
                {disposalPhase === "scored" && (
                  <g style={{ animation: "netWobble 0.5s ease-out" }}>
                    <path d="M42 18 Q48 30 42 45 M78 18 Q72 30 78 45 M42 28 Q60 35 78 28" stroke="#eee" strokeWidth="1" fill="none" />
                  </g>
                )}
                {disposalPhase === "scored" && <text x="60" y="75" textAnchor="middle" fill="#e07020" fontSize="18" fontWeight="bold">SWISH!</text>}
              </svg>
            )}
            {disposalMethod === "fieldgoal" && (
              <svg width="120" height="80" viewBox="0 0 140 100" fill="none">
                <line x1="30" y1="10" x2="30" y2="90" stroke={darkMode ? "#aaa" : "#666"} strokeWidth="4" strokeLinecap="round" />
                <line x1="110" y1="10" x2="110" y2="90" stroke={darkMode ? "#aaa" : "#666"} strokeWidth="4" strokeLinecap="round" />
                <line x1="30" y1="15" x2="110" y2="15" stroke={darkMode ? "#aaa" : "#666"} strokeWidth="4" strokeLinecap="round" />
                {disposalPhase === "scored" && (
                  <text x="70" y="60" textAnchor="middle" fill="#4a90b8" fontSize="16" fontWeight="bold" style={{ animation: "goalFlash 0.6s ease-out" }}>IT&apos;S GOOD!</text>
                )}
              </svg>
            )}
          </div>

          {/* Ball/object to flick */}
          {disposalPhase === "ready" && (
            <button onClick={launchDisposal} className="cursor-pointer animate-pulse-hint">
              {disposalMethod === "crumple" && (
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: darkMode ? "#555" : "#d6d0c4" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#ccc" : "#888"} strokeWidth="1.5">
                    <path d="M4 6l4 2 4-3 4 2 4-1M4 12l3-1 5 3 4-2 4 1M6 18l4-2 4 3 4-1" />
                  </svg>
                </div>
              )}
              {disposalMethod === "swish" && (
                <div className="w-16 h-16 rounded-full" style={{ background: "#e07020", border: "2px solid #333" }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M15 32h34M32 15v34" stroke="#333" strokeWidth="1.5" />
                    <path d="M18 22c5 3 10 3 15 0" stroke="#333" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <path d="M31 42c5 3 10 3 15 0" stroke="#333" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              )}
              {disposalMethod === "fieldgoal" && (
                <div className="w-14 h-9 flex items-center justify-center" style={{ background: "#8B4513", borderRadius: "50% / 40%", border: "2px solid #5a3010" }}>
                  <svg width="30" height="16" viewBox="0 0 30 16" fill="none">
                    <path d="M2 8h26M15 1v14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <p className="text-xs text-foreground/40 mt-3 text-center">
                {disposalMethod === "crumple" && "tap to toss"}
                {disposalMethod === "swish" && "tap to shoot"}
                {disposalMethod === "fieldgoal" && "tap to kick"}
              </p>
            </button>
          )}

          {/* Launched animation */}
          {disposalPhase === "launched" && (
            <div className={disposalMethod === "crumple" ? "animate-toss" : disposalMethod === "swish" ? "animate-swish" : "animate-kick"}>
              {disposalMethod === "crumple" && (
                <div className="w-16 h-16 rounded-full" style={{ background: darkMode ? "#555" : "#d6d0c4" }} />
              )}
              {disposalMethod === "swish" && (
                <div className="w-16 h-16 rounded-full" style={{ background: "#e07020", border: "2px solid #333" }} />
              )}
              {disposalMethod === "fieldgoal" && (
                <div className="w-14 h-9" style={{ background: "#8B4513", borderRadius: "50% / 40%" }} />
              )}
            </div>
          )}

          {/* Cancel */}
          {disposalPhase === "ready" && (
            <button onClick={() => { setDisposalMethod(null); setDisposalPhase(null); }}
              className="mt-8 text-xs text-foreground/30 hover:text-foreground/50 cursor-pointer">cancel</button>
          )}
        </div>
      )}

      {/* Mood after torch */}
      {showMoodAfter && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-md border border-border">
            <MoodPicker value={moodAfter} onChange={setMoodAfter} label="How are you feeling now?" />
            <div className="flex gap-3 mt-5">
              <button onClick={() => completeBurnWithMood(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted hover:text-foreground cursor-pointer">Skip</button>
              <button onClick={() => completeBurnWithMood(moodAfter)} disabled={moodAfter === null}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-30" style={{ background: currentMode?.color }}>Torch it</button>
            </div>
          </div>
        </div>
      )}

      {/* Cooldown lock screen */}
      {lockedUntil && (
        <div className="flex-1 absolute inset-0 z-30 bg-background/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center px-6 max-w-sm">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            <p className="text-lg font-semibold text-foreground mb-1">Take a breather</p>
            <p className="text-sm text-muted mb-4">Things were getting pretty intense. Come back in a bit.</p>
            <p className="text-2xl font-mono font-semibold mb-6" style={{ color: currentMode?.color }}>{lockCountdown}</p>
            <div className="bg-white rounded-xl border border-border p-4 text-left">
              <p className="text-[11px] text-foreground/40 uppercase tracking-wide font-medium mb-2">try this instead</p>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {DECOMPRESS_TIPS[Math.floor((lockedUntil / 1000) % DECOMPRESS_TIPS.length)]}
              </p>
            </div>
            <button onClick={() => { setLockedUntil(null); messageTimes.current = []; playSfx("unlock"); }}
              className="mt-5 text-xs text-foreground/30 hover:text-foreground/50 cursor-pointer">I&apos;m good, let me back in</button>
          </div>
        </div>
      )}

      <div className="border-t border-border bg-white/80 backdrop-blur-sm p-3 sm:p-4">
        <p className="max-w-2xl mx-auto text-[11px] text-muted/50 mb-2">auto-deletes in 24 hours</p>
        <div className="max-w-2xl mx-auto flex items-end bg-white border border-border rounded-2xl overflow-hidden" style={{ minHeight: "48px" }}>
          {!topic && activeMode !== "riff" ? (
            <div className="flex-1 px-3 sm:px-4 py-3">
              <p className="text-[12px] text-foreground/40 mb-2">what are you dumping about?</p>
              <div className="flex gap-1.5 flex-wrap">
                {TOPICS.map(t => (
                  <button key={t.id} onClick={() => setTopic(t.id)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full cursor-pointer transition-all font-medium hover:shadow-sm active:scale-95"
                    style={{ background: "transparent", border: "1px solid var(--color-border)", color: darkMode ? "#aaa" : "#888" }}
                  >{t.label}</button>
                ))}
              </div>
            </div>
          ) : (
          <textarea
            ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={activeMode === "silence" ? "Let it out..." : "What's on your mind?"}
            rows={1}
            className="flex-1 bg-transparent px-4 py-3 text-sm resize-none focus:outline-none placeholder:text-muted/50 border-none"
            style={{ minHeight: "48px", maxHeight: "120px", color: inkMode ? "transparent" : undefined, caretColor: inkMode ? "#5b8a72" : undefined, textShadow: inkMode ? "0 0 8px rgba(0,0,0,0.25)" : undefined }}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
          />
          )}
          {(topic || activeMode === "riff") && (<>
          {/* Pass button for riff mode */}
          {activeMode === "riff" && (
            <button
              onClick={passRiff}
              disabled={isLoading}
              className="shrink-0 h-10 px-3 mb-1 flex items-center justify-center transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed rounded-xl hover:bg-surface-hover text-xs font-medium"
              style={{ color: "#5ea88e" }}
              title="Pass — get a new prompt"
            >
              pass
            </button>
          )}
          {/* Invisible ink toggle */}
          <button
            onClick={async () => {
              if (inkMode) {
                const unrevealed = [...inkMessages].filter(i => !revealedMessages.has(i));
                if (unrevealed.length > 0) {
                  setRevealedMessages(prev => new Set([...prev, ...unrevealed]));
                  if (activeMode && activeMode !== "silence") await fetchResponse(messages, activeMode);
                }
              }
              setInkMode(!inkMode);
            }}
            className="shrink-0 h-10 w-10 mb-1 flex items-center justify-center transition-all cursor-pointer group rounded-xl"
            style={{ background: inkMode ? "#5b8a72" : "transparent" }}
            title={inkMode ? "Invisible ink on" : "Invisible ink off"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="group-hover:scale-110 transition-transform">
              {inkMode ? (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#fff" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth="2" fill="none"/>
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#999" strokeWidth="1.5" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="#999" strokeWidth="1.5" fill="none"/>
                  <line x1="4" y1="4" x2="20" y2="20" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
                </>
              )}
            </svg>
          </button>
          {/* Dispose button */}
          <button
            onClick={() => messages.length > 0 ? setShowDisposalPicker(true) : null}
            className="shrink-0 h-10 w-10 mb-1 flex items-center justify-center transition-all cursor-pointer group"
            style={{ opacity: messages.length > 0 ? 1 : 0.35 }}
            title="Get rid of it"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="group-hover:scale-115 transition-transform">
              <path d="M12 2C8 6 6 9 6 12.5C6 16 8.7 19 12 19C15.3 19 18 16 18 12.5C18 9 16 6 12 2Z" fill="#e25a3e" stroke="#cc4444" strokeWidth="1.5"/>
              <path d="M12 9C10.5 11 10 12.5 10 13.5C10 15 10.9 16 12 16C13.1 16 14 15 14 13.5C14 12.5 13.5 11 12 9Z" fill="#f5b731" stroke="#e09a28" strokeWidth="1"/>
            </svg>
          </button>
          {/* Send button */}
          <button
            onClick={sendMessage} disabled={!input.trim() || isLoading}
            className="shrink-0 h-10 w-10 mb-1 mr-1 flex items-center justify-center transition-all disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              stroke={input.trim() ? currentMode?.color : "#ccc"}>
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
          </>)}
        </div>
      </div>
      {isMobile && isLoggedIn && <MobileNav />}
      <AchievementToast />
    </div>
  );
}
