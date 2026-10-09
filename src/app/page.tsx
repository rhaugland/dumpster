"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Mode = "bull" | "devil" | "wizard" | "lol" | "silence";

interface Message {
  role: "user" | "assistant";
  content: string;
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
];

export default function Home() {
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [showTorchConfirm, setShowTorchConfirm] = useState(false);
  const [showIconGuide, setShowIconGuide] = useState(true);
  const [inkMode, setInkMode] = useState(false);
  const [inkMessages, setInkMessages] = useState<Set<number>>(new Set());
  const [revealedMessages, setRevealedMessages] = useState<Set<number>>(new Set());

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (activeMode) inputRef.current?.focus(); }, [activeMode]);

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
        const saved = localStorage.getItem(`dumpster-msgs-${parsed.email}`);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.expiresAt > Date.now()) { setMessages(data.messages); setActiveMode(data.mode); }
          else localStorage.removeItem(`dumpster-msgs-${parsed.email}`);
        }
      } else localStorage.removeItem("dumpster-session");
    } catch { localStorage.removeItem("dumpster-session"); }
  }, []);

  const saveMessages = useCallback((msgs: Message[], mode: Mode | null) => {
    if (isLoggedIn && email && mode) {
      localStorage.setItem(`dumpster-msgs-${email}`, JSON.stringify({ messages: msgs, mode, expiresAt: Date.now() + 86400000 }));
    }
  }, [isLoggedIn, email]);

  const fetchResponse = async (msgs: Message[], mode: Mode) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs, mode }) });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const withResponse = [...msgs, { role: "assistant" as const, content: data.content }];
      setMessages(withResponse);
      saveMessages(withResponse, mode);
    } catch {
      setMessages([...msgs, { role: "assistant" as const, content: "Dumpster is taking a break. Try again." }]);
    } finally { setIsLoading(false); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeMode) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    const msgIndex = newMessages.length - 1;
    setMessages(newMessages);
    setInput("");

    if (inkMode) {
      setInkMessages(prev => new Set([...prev, msgIndex]));
      saveMessages(newMessages, activeMode);
      return; // Don't send to AI until revealed
    }

    if (activeMode === "silence") { saveMessages(newMessages, activeMode); return; }
    await fetchResponse(newMessages, activeMode);
  };

  const revealMessage = async (index: number) => {
    if (!inkMessages.has(index) || revealedMessages.has(index)) return;
    setRevealedMessages(prev => new Set([...prev, index]));
    // Now trigger AI response if this mode normally responds
    if (activeMode && activeMode !== "silence") {
      // Build the message history up to this revealed message for context
      await fetchResponse(messages, activeMode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleAuth = () => {
    if (!email.trim() || !password.trim()) { setAuthError("Fill in both fields"); return; }
    if (authMode === "signup") {
      if (localStorage.getItem(`dumpster-user-${email}`)) { setAuthError("Account already exists"); return; }
      localStorage.setItem(`dumpster-user-${email}`, password);
    } else {
      const stored = localStorage.getItem(`dumpster-user-${email}`);
      if (!stored || stored !== password) { setAuthError("Wrong email or password"); return; }
    }
    localStorage.setItem("dumpster-session", JSON.stringify({ email, expiresAt: Date.now() + 86400000 }));
    setIsLoggedIn(true); setShowLogin(false); setAuthError("");
    if (messages.length > 0 && activeMode) saveMessages(messages, activeMode);
  };

  const torchIt = () => {
    setMessages([]);
    setInkMessages(new Set());
    setRevealedMessages(new Set());
    if (isLoggedIn && email) localStorage.removeItem(`dumpster-msgs-${email}`);
    setShowTorchConfirm(false);
  };

  const currentMode = MODES.find((m) => m.id === activeMode);
  const CurrentCharacter = activeMode ? CHARACTER_MAP[activeMode] : null;

  /* ─── LANDING ─── */
  if (!activeMode) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Auth corner */}
        <div className="fixed top-4 right-4 z-50">
          {isLoggedIn ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <span>{email}</span>
              <button onClick={() => { localStorage.removeItem("dumpster-session"); setIsLoggedIn(false); setEmail(""); setPassword(""); }} className="text-muted hover:text-foreground cursor-pointer">logout</button>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-xs text-foreground/40 mb-0.5">want to come back later?</p>
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
              <p className="text-sm text-muted mb-6">Save your sessions for 24 hours</p>
              {authError && <p className="text-sm text-bull mb-4">{authError}</p>}
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

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-10 pb-6">
          <DumpsterLogo />
          <h1 className="text-5xl font-black tracking-tight mt-3 mb-2 text-foreground">Dumpster</h1>
          <p className="text-muted text-base mb-14">toss it. torch it. move on.</p>

          {/* Chat list */}
          <div className="w-full max-w-lg space-y-3">
            {MODES.map((mode, i) => {
              const Character = CHARACTER_MAP[mode.id];
              return (
                <button
                  key={mode.id}
                  onClick={() => { setActiveMode(mode.id); setMessages([]); }}
                  className="w-full flex items-center gap-4 bg-white border border-border rounded-2xl p-4 text-left hover:shadow-md hover:border-muted/40 transition-all duration-150 cursor-pointer group"
                  style={{ animationDelay: `${i * 60}ms`, animation: "fadeUp 0.35s ease-out forwards", opacity: 0 }}
                >
                  <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${mode.color}12` }}>
                    <Character size={46} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm" style={{ color: mode.color }}>{mode.label}</span>
                      <span className="text-xs text-foreground/60">{mode.tagline}</span>
                    </div>
                    <p className="text-xs text-foreground/40 truncate italic">{mode.preview}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" className="shrink-0 group-hover:stroke-muted transition-colors">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              );
            })}
          </div>

          <p className="text-xs mt-10 text-muted/40">everything auto-deletes in 24 hours</p>
          <p className="text-xs mt-1.5 text-muted/40">your trash is your trash. we don&apos;t dig through it.</p>
        </div>
      </div>
    );
  }

  /* ─── CHAT ─── */
  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white/80 backdrop-blur-sm">
        <button onClick={() => { if (!isLoggedIn) setMessages([]); setActiveMode(null); }}
          className="text-sm text-muted hover:text-foreground cursor-pointer flex items-center gap-1.5 font-medium">
          <span>&larr;</span> back
        </button>
        <div className="flex items-center gap-2">
          {CurrentCharacter && <CurrentCharacter size={26} />}
          <span className="font-bold text-sm" style={{ color: currentMode?.color }}>{currentMode?.label}</span>
        </div>
        {isLoggedIn ? (
          <span className="text-xs text-muted w-14 text-right truncate">{email}</span>
        ) : (
          <div className="text-right">
            <p className="text-[10px] text-foreground/40 mb-0.5">want to come back later?</p>
            <button onClick={() => { setShowLogin(true); setAuthMode("login"); }} className="text-xs text-foreground/60 hover:text-foreground cursor-pointer font-medium">sign in</button>
            <span className="text-foreground/30 mx-1 text-xs">or</span>
            <button onClick={() => { setShowLogin(true); setAuthMode("signup"); }} className="text-xs text-foreground/60 hover:text-foreground cursor-pointer font-medium">sign up</button>
          </div>
        )}
      </div>

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
            <button
              onClick={() => { setShowIconGuide(false); localStorage.setItem("dumpster-guide-dismissed", "true"); }}
              className="text-foreground/30 hover:text-foreground/60 cursor-pointer text-sm leading-none ml-4"
            >&times;</button>
          </div>
        </div>
      )}

      {/* Login modal (chat view) */}
      {showLogin && !isLoggedIn && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-md border border-border">
            <h3 className="text-lg font-semibold mb-1">{authMode === "login" ? "Welcome back" : "Create account"}</h3>
            <p className="text-sm text-muted mb-6">Save your sessions for 24 hours</p>
            {authError && <p className="text-sm text-bull mb-4">{authError}</p>}
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

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              {CurrentCharacter && <div className="flex justify-center mb-4"><CurrentCharacter size={72} /></div>}
              <p className="text-lg font-semibold mb-1" style={{ color: currentMode?.color }}>{currentMode?.label}</p>
              <p className="text-sm text-muted">{activeMode === "silence" ? "Type whatever you need to. No one's listening." : "Start typing. Let it out."}</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isInk = inkMessages.has(i);
            const isRevealed = revealedMessages.has(i);
            const isHidden = inkMode || (isInk && !isRevealed);
            return (
              <div key={i} className={`animate-fade-up flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && CurrentCharacter && <div className="shrink-0 mr-2 mt-1"><CurrentCharacter size={26} /></div>}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isHidden ? "cursor-pointer select-none" : ""}`}
                  style={{
                    ...(msg.role === "user"
                      ? { background: "#ede8df", color: "#333" }
                      : { background: "#fff", border: `1.5px solid ${currentMode?.color}30`, color: "#333" }),
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
              <div className="bg-white rounded-2xl px-4 py-3" style={{ border: `1.5px solid ${currentMode?.color}30` }}>
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

      {/* Torch confirm */}
      {showTorchConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-md border border-border text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3">
              <path d="M12 2C8 6 6 9 6 12.5C6 16 8.7 19 12 19C15.3 19 18 16 18 12.5C18 9 16 6 12 2Z" fill="#cc4444" opacity="0.2" stroke="#cc4444" strokeWidth="1.5"/>
              <path d="M12 9C10.5 11 10 12.5 10 13.5C10 15 10.9 16 12 16C13.1 16 14 15 14 13.5C14 12.5 13.5 11 12 9Z" fill="#e08c38" stroke="#d48b2e" strokeWidth="1"/>
            </svg>
            <p className="font-semibold text-foreground mb-1">Torch this conversation?</p>
            <p className="text-sm text-muted mb-5">Gone forever. No undo.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowTorchConfirm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted hover:text-foreground cursor-pointer">Never mind</button>
              <button onClick={torchIt} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer" style={{ background: "#cc4444" }}>Torch it</button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border bg-white/80 backdrop-blur-sm p-4">
        <p className="max-w-2xl mx-auto text-[11px] text-muted/50 mb-2">auto-deletes in 24 hours</p>
        <div className="max-w-2xl mx-auto flex items-end bg-white border border-border rounded-2xl overflow-hidden" style={{ minHeight: "48px" }}>
          <textarea
            ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={activeMode === "silence" ? "Let it out..." : "What's on your mind?"}
            rows={1}
            className="flex-1 bg-transparent px-4 py-3 text-sm resize-none focus:outline-none placeholder:text-muted/50 border-none"
            style={{ minHeight: "48px", maxHeight: "120px", color: inkMode ? "transparent" : undefined, caretColor: inkMode ? "#5b8a72" : undefined, textShadow: inkMode ? "0 0 8px rgba(0,0,0,0.25)" : undefined }}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
          />
          {/* Invisible ink toggle */}
          <button
            onClick={async () => {
              if (inkMode) {
                // Turning off: reveal all hidden ink messages
                const unrevealed = [...inkMessages].filter(i => !revealedMessages.has(i));
                if (unrevealed.length > 0) {
                  setRevealedMessages(prev => new Set([...prev, ...unrevealed]));
                  // Trigger AI response for the last unrevealed message if mode responds
                  if (activeMode && activeMode !== "silence") {
                    await fetchResponse(messages, activeMode);
                  }
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
          {/* Torch button */}
          <button
            onClick={() => messages.length > 0 ? setShowTorchConfirm(true) : null}
            className="shrink-0 h-10 w-10 mb-1 flex items-center justify-center transition-all cursor-pointer group"
            style={{ opacity: messages.length > 0 ? 1 : 0.35 }}
            title="Torch it"
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
        </div>
      </div>
    </div>
  );
}
