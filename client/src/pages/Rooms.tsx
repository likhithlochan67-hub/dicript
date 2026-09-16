import { ArrowUpRight, BarChart3, Check, FileText, Languages, PenLine, ScanText, Sparkles } from "lucide-react";
import PublicShell from "@/components/PublicShell";

const rooms = [
  { icon: ScanText, title: "AI Detector", tag: "Available now", copy: "Understand AI-like signals, sentence rhythm, and the writing patterns behind a score.", href: "/", active: true, accent: "coral" },
  { icon: PenLine, title: "Humanizer", tag: "Coming soon", copy: "Explore alternate phrasing while keeping the intent, point of view, and texture of the draft.", href: "#", accent: "mint" },
  { icon: Languages, title: "Paraphraser", tag: "Coming soon", copy: "Shift clarity, structure, and tone without flattening the writer behind the words.", href: "#", accent: "blue" },
  { icon: Check, title: "Grammar room", tag: "Coming soon", copy: "Catch the small things that distract from a strong idea—quietly and in context.", href: "#", accent: "yellow" },
  { icon: BarChart3, title: "Writing insights", tag: "Coming soon", copy: "Compare drafts over time and see how your writing profile changes with every revision.", href: "#", accent: "violet" },
  { icon: Sparkles, title: "Prompt studio", tag: "Coming soon", copy: "Turn a rough intention into a useful starting point with prompts that keep your voice visible.", href: "#", accent: "peach" },
];

export default function Rooms() {
  return <PublicShell eyebrow="Dicript / Rooms"><main className="public-main rooms-main"><section className="rooms-hero"><div className="section-label"><span className="section-dot" />The Dicript rooms</div><h1>One home for every <em>writing state.</em></h1><p>Move from first thought to final polish without switching between tools that forget the person behind the draft.</p></section><section className="room-grid">{rooms.map(({ icon: Icon, title, tag, copy, href, active, accent }) => <article className={`room-card room-${accent} ${active ? "room-active" : ""}`} key={title}><div className="room-card-top"><span className="room-icon"><Icon /></span><span className="room-tag">{tag}</span></div><h2>{title}</h2><p>{copy}</p>{active ? <a className="room-link" href={href}>Open room <ArrowUpRight /></a> : <button className="room-link" onClick={() => undefined}>Join the waitlist <ArrowUpRight /></button>}<div className="room-index">{String(rooms.findIndex((room) => room.title === title) + 1).padStart(2, "0")}</div></article>)}</section><section className="room-quote"><FileText /><blockquote>“The best writing tool is the one that gives you enough information to make your own call.”</blockquote><span>— Dicript field guide</span></section></main></PublicShell>;
}
