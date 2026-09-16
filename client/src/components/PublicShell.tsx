import type { ReactNode } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

function Logo() {
  return <a href="/" className="public-logo" aria-label="Dicript home"><span className="brand-mark"><span /></span><span><strong>dicript</strong><small>writing intelligence</small></span></a>;
}

export default function PublicShell({ children, eyebrow = "Dicript / 2026" }: { children: ReactNode; eyebrow?: string }) {
  const [open, setOpen] = useState(false);
  return <div className="public-page"><header className="public-header"><Logo /><span className="public-eyebrow desktop-only">{eyebrow}</span><nav className={`public-nav ${open ? "open" : ""}`}><a href="/">Detector</a><a href="/rooms">Rooms</a><a href="/about">About</a><a href="/#privacy">Privacy</a><a href="/login" className="public-login">Sign in <ArrowRight /></a></nav><button className="public-menu mobile-menu" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button></header>{children}<footer className="public-footer"><Logo /><span>Probability is a signal, not a verdict.</span><div><a href="/about">About</a><a href="/#privacy">Privacy</a><a href="/rooms">Rooms</a></div></footer></div>;
}
