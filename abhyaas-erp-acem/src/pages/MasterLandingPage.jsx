import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config/apiConfig';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import ChatbotRobot from '../components/ChatbotRobot';

// ─── Data Arrays ──────────────────────────────────────────────────────────────
const PROGRAMS = [
  { id: 'pre-primary', name: 'Pre-Primary', desc: 'Nursery – UKG',    icon: '🎨', bg: '#fff7ed', accent: '#f97316' },
  { id: 'primary',     name: 'Primary',     desc: 'Classes I – V',     icon: '🎒', bg: '#f0fdf4', accent: '#22c55e' },
  { id: 'middle',      name: 'Middle',      desc: 'Classes VI – VIII', icon: '🔬', bg: '#eff6ff', accent: '#3b82f6' },
  { id: 'high',        name: 'High School', desc: 'Classes IX – X',    icon: '🎓', bg: '#fdf4ff', accent: '#a855f7' },
];

const STATS = [
  { icon: '🧑‍🎓', label: 'Students Enrolled', value: '1,500+', color: '#1e3a8a', bg: '#eff6ff' },
  { icon: '👩‍🏫', label: 'Qualified Faculty',  value: '80+',    color: '#0284c7', bg: '#e0f2fe' },
  { icon: '🏆',  label: 'Board Toppers',       value: '150+',   color: '#4f46e5', bg: '#eef2ff' },
  { icon: '📅',  label: 'Years of Excellence', value: '25+',    color: '#ea580c', bg: '#fff7ed' },
];

const WHY_ITEMS = [
  { icon: '👩‍🏫', title: 'Caring Educators',   desc: "Dedicated to nurturing every child's growth.",  color: '#1e3a8a' },
  { icon: '📚',  title: 'Strong Foundations', desc: 'Focus on Math, Science & Languages.',            color: '#0ea5e9' },
  { icon: '🎨',  title: 'Holistic Dev',        desc: 'Equal weight on sports & extracurriculars.',     color: '#8b5cf6' },
  { icon: '🛡️', title: 'Safe Campus',         desc: 'Modern, secure campus with smart classrooms.',   color: '#10b981' },
];

const NOTICES = [
  { type: 'Important', color: '#e11d48', bg: '#fff1f2', title: 'Mid-Term Exams',    body: 'Examinations begin Jan 10. Collect admit cards from the school office.' },
  { type: 'General',   color: '#1e3a8a', bg: '#eff6ff', title: 'Winter Break',      body: 'School closed Dec 24 – Jan 5. Happy Holidays to all!' },
  { type: 'Event',     color: '#7c3aed', bg: '#fdf4ff', title: 'Annual Sports Day', body: 'Feb 15 — Sports Meet. Registration open for all students.' },
  { type: 'Deadline',  color: '#ea580c', bg: '#fff7ed', title: 'Fee Submission',    body: 'Last date for 2nd Term fee is Jan 30. Avoid late charges.' },
];

const CLASSES = ['Nursery', 'LKG', 'UKG', 'Class I', 'Class II', 'Class III', 'Class IV', 'Class V', 'Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X'];

const ACADEMIC_LINKS = ['Pre-Primary (Nursery–UKG)', 'Primary (I–V)', 'Middle School (VI–VIII)', 'High School (IX–X)', 'Exam Schedule', 'Results'];

const SOCIAL = [
  { icon: '💬', label: 'WhatsApp',  color: '#25d366', bg: '#f0fdf4', href: 'https://wa.me/919876543210' },
  { icon: '📸', label: 'Instagram', color: '#e1306c', bg: '#fff0f6', href: 'https://instagram.com' },
  { icon: '👍', label: 'Facebook',  color: '#1877f2', bg: '#eff6ff', href: 'https://facebook.com' },
  { icon: '▶️', label: 'YouTube',   color: '#ff0000', bg: '#fff1f2', href: 'https://youtube.com' },
];

// ─── Captcha ──────────────────────────────────────────────────────────────────
function genCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const ops = ['+', '-', 'x'];
  const op  = ops[Math.floor(Math.random() * ops.length)];
  let ans;
  if (op === '+') ans = a + b;
  else if (op === '-') ans = Math.abs(a - b);
  else ans = a * b;
  const big = Math.max(a, b), sml = Math.min(a, b);
  const q   = op === '-' ? `${big} − ${sml}` : `${a} ${op} ${b}`;
  return { q, ans };
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Nunito:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:   #0a192f;
    --navy2:  #172554;
    --blue:   #1e3a8a;
    --blue2:  #3b82f6;
    --orange: #f97316;
    --orange2:#ea580c;
    --bg:     #f8fafc;
    --white:  #ffffff;
    --text:   #0f172a;
    --muted:  #64748b;
    --bdr:    #e2e8f0;
    --r:      16px;
    --sh:     0 2px 16px rgba(14,30,74,0.09);
    --sh2:    0 10px 40px rgba(14,30,74,0.18);
  }

  body { font-family: 'Nunito', sans-serif; background: var(--bg); color: var(--text); overflow-x: hidden; }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(26px) } to { opacity:1; transform:none } }
  @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes popIn   { from { opacity:0; transform:scale(0.93) } to { opacity:1; transform:scale(1) } }
  @keyframes pulse   { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.7} }
  @keyframes floatY  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes shimmer { 0%{background-position:200%} 100%{background-position:-200%} }

  /* ════════ NAVBAR ════════ */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 500;
    height: 72px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 3rem;
    background: transparent;
    transition: background 0.35s, box-shadow 0.35s;
  }
  .nav.solid {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 2px 24px rgba(14,30,74,0.10);
    border-bottom: 1px solid rgba(30,58,138,0.08);
  }

  .nav-brand { display:flex; align-items:center; gap:12px; cursor:pointer; }
  .nav-logo {
    height:46px; width:46px; object-fit:contain;
    border-radius:10px; border:1.5px solid rgba(255,255,255,0.30);
    box-shadow:0 2px 12px rgba(0,0,0,0.25);
    transition:border-color 0.3s;
  }
  .nav.solid .nav-logo { border-color:rgba(30,58,138,0.20); }
  .nav-logo-fb {
    display:none; width:46px; height:46px; border-radius:10px;
    background:linear-gradient(135deg,var(--blue),var(--blue2));
    align-items:center; justify-content:center;
    color:#fff; font-weight:900; font-size:1.2rem;
    box-shadow:0 3px 12px rgba(30,58,138,0.35);
  }
  .nav-brand-name { font-family:'Playfair Display',serif; font-weight:800; font-size:1.05rem; color:#fff; line-height:1.15; transition:color 0.3s; }
  .nav-brand-sub  { font-size:0.60rem; font-weight:700; color:rgba(255,255,255,0.70); letter-spacing:0.12em; text-transform:uppercase; transition:color 0.3s; }
  .nav.solid .nav-brand-name { color:var(--navy); }
  .nav.solid .nav-brand-sub  { color:var(--blue2); }

  .nav-links { display:flex; align-items:center; gap:2px; }
  .nav-lnk {
    background:none; border:none; cursor:pointer;
    padding:7px 14px; border-radius:9px;
    font-family:'Nunito',sans-serif; font-size:0.88rem; font-weight:700;
    color:rgba(255,255,255,0.85);
    transition:background 0.16s, color 0.16s;
  }
  .nav.solid .nav-lnk { color:var(--muted); }
  .nav-lnk:hover { background:rgba(255,255,255,0.12); color:#fff; }
  .nav.solid .nav-lnk:hover { background:rgba(30,58,138,0.07); color:var(--blue); }

  .nav-login-btn {
    margin-left:6px; padding:10px 24px; border:none; border-radius:10px;
    background:linear-gradient(135deg,var(--orange),var(--orange2));
    font-family:'Nunito',sans-serif; font-weight:800; font-size:0.88rem;
    color:#fff; cursor:pointer;
    box-shadow:0 4px 18px rgba(249,115,22,0.40);
    display:flex; align-items:center; gap:7px;
    transition:transform 0.18s, box-shadow 0.18s;
  }
  .nav-login-btn:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(249,115,22,0.50); }

  /* ════════ HERO ════════ */
  .hero {
    position:relative; min-height:100vh;
    display:flex; align-items:center; justify-content:center;
    text-align:center; padding:110px 2rem 80px;
    overflow:hidden;
  }

  .hero-vid { position:absolute; inset:0; z-index:0; overflow:hidden; }
  .hero-vid video {
    width:100%; height:100%; object-fit:cover;
    filter:brightness(0.45) saturate(0.80);
  }

  .hero-ov {
    position:absolute; inset:0; z-index:1;
    background:linear-gradient(
      180deg,
      rgba(10,25,47,0.78)  0%,
      rgba(10,25,47,0.30)  28%,
      rgba(10,25,47,0.22)  55%,
      rgba(10,25,47,0.72)  82%,
      rgba(10,25,47,0.95)  100%
    );
  }

  .hero-blob1 { position:absolute; width:500px; height:500px; top:-140px; left:-100px; border-radius:50%; background:rgba(30,58,138,0.22); filter:blur(90px); pointer-events:none; z-index:2; }
  .hero-blob2 { position:absolute; width:380px; height:380px; bottom:-60px; right:-80px; border-radius:50%; background:rgba(249,115,22,0.14); filter:blur(80px); pointer-events:none; z-index:2; animation:floatY 9s ease-in-out infinite; }

  .hero-content { position:relative; z-index:3; max-width:820px; animation:fadeUp 0.9s ease both; }

  .hero-badge {
    display:inline-flex; align-items:center; gap:8px;
    padding:7px 20px; border-radius:99px; margin-bottom:1.6rem;
    background:rgba(255,255,255,0.12);
    backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
    border:1px solid rgba(255,255,255,0.28);
    font-size:0.75rem; font-weight:800; color:#fff;
    letter-spacing:0.09em; text-transform:uppercase;
    box-shadow:0 4px 20px rgba(0,0,0,0.20);
  }
  .badge-dot { width:8px; height:8px; border-radius:50%; background:#fbbf24; animation:pulse 2s infinite; box-shadow:0 0 8px rgba(251,191,36,0.8); }

  .hero h1 {
    font-family:'Playfair Display',serif;
    font-size:clamp(2.8rem,6vw,5rem);
    font-weight:800; color:#fff;
    line-height:1.08; margin-bottom:1.3rem;
    letter-spacing:-0.01em;
    text-shadow:0 2px 6px rgba(0,0,0,0.55),0 4px 24px rgba(0,0,0,0.40);
  }
  .hero h1 .highlight {
    font-style:italic;
    background:linear-gradient(90deg,#fbbf24,#f97316,#fbbf24);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text;
    animation:shimmer 4s linear infinite;
    filter:drop-shadow(0 0 18px rgba(249,115,22,0.55));
  }

  .hero p {
    font-size:1.1rem; font-weight:500; color:rgba(255,255,255,0.88);
    line-height:1.80; max-width:560px; margin:0 auto 2.6rem;
    text-shadow:0 1px 10px rgba(0,0,0,0.45);
  }

  /* Single centred CTA */
  .hero-btns { display:flex; align-items:center; justify-content:center; }

  .btn-hero-p {
    padding:16px 48px; border:none; border-radius:14px;
    background:linear-gradient(135deg,var(--orange),var(--orange2));
    color:#fff; font-family:'Nunito',sans-serif; font-weight:800; font-size:1.08rem;
    cursor:pointer; box-shadow:0 8px 28px rgba(249,115,22,0.50);
    transition:transform 0.18s, box-shadow 0.18s;
    letter-spacing:0.01em;
  }
  .btn-hero-p:hover { transform:translateY(-3px); box-shadow:0 14px 36px rgba(249,115,22,0.55); }

  .hero-scroll {
    position:absolute; bottom:2.2rem; left:50%; transform:translateX(-50%);
    z-index:3; display:flex; flex-direction:column; align-items:center; gap:5px;
    color:rgba(255,255,255,0.50); font-size:0.70rem; font-weight:700;
    letter-spacing:0.12em; text-transform:uppercase;
    animation:floatY 3s ease-in-out infinite;
  }

  /* ════════ STATS BAR ════════ */
  .stats-bar {
    background:linear-gradient(135deg,var(--navy) 0%,var(--blue) 100%);
    padding:2.2rem 3rem;
    display:flex; justify-content:center; flex-wrap:wrap;
    box-shadow:0 6px 32px rgba(10,25,47,0.30);
  }
  .sc {
    text-align:center; padding:0.5rem 3rem;
    border-right:1px solid rgba(255,255,255,0.14);
    animation:fadeUp 0.6s ease both;
  }
  .sc:last-child { border-right:none; }
  .sc-val { font-family:'Playfair Display',serif; font-size:2.4rem; font-weight:800; color:#fff; line-height:1; }
  .sc-lbl { font-size:0.70rem; font-weight:700; color:rgba(255,255,255,0.65); text-transform:uppercase; letter-spacing:0.10em; margin-top:4px; }

  /* ════════ SECTIONS ════════ */
  .sec { padding:5.5rem 3rem; }
  .sec-in { max-width:1140px; margin:0 auto; }

  .chip {
    display:inline-flex; align-items:center; gap:6px;
    padding:5px 16px; border-radius:99px;
    background:rgba(30,58,138,0.08); border:1px solid rgba(30,58,138,0.18);
    font-size:0.71rem; font-weight:800; color:var(--blue);
    letter-spacing:0.10em; text-transform:uppercase; margin-bottom:0.85rem;
  }
  .sec-h {
    font-family:'Playfair Display',serif;
    font-size:clamp(2rem,3.5vw,2.8rem); font-weight:800;
    color:var(--text); line-height:1.12; margin-bottom:0.6rem;
  }
  .sec-p { font-size:0.97rem; color:var(--muted); line-height:1.78; max-width:560px; font-weight:500; }

  /* ════════ BENTO GRID ════════ */
  .bento { display:grid; gap:1.1rem; margin-top:2.4rem; }
  .b4 { grid-template-columns:repeat(4,1fr); }
  .b3 { grid-template-columns:repeat(3,1fr); }
  .b2 { grid-template-columns:1fr 1fr; }

  /* Unified white card — lights up on hover with its accent color */
  .gc {
    background:#ffffff;
    border:1.5px solid #e2e8f0;
    border-radius:var(--r);
    box-shadow:var(--sh);
    padding:1.7rem;
    transition:transform 0.24s cubic-bezier(.34,1.56,.64,1), box-shadow 0.24s, border-color 0.24s, background 0.24s;
    cursor:default; position:relative; overflow:hidden;
  }
  .gc:hover {
    transform:translateY(-7px) scale(1.015);
    box-shadow:var(--sh2);
  }

  /* Each card lights up with its own data-accent color on hover — set via inline style */
  .gc::after {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent);
    pointer-events:none;
  }

  .c-ico  { width:54px; height:54px; border-radius:15px; display:flex; align-items:center; justify-content:center; font-size:1.6rem; margin-bottom:14px; transition:background 0.24s; }
  .c-val  { font-family:'Playfair Display',serif; font-size:2.3rem; font-weight:800; line-height:1; margin-bottom:5px; color:var(--text); transition:color 0.24s; }
  .c-name { font-weight:800; font-size:1rem; color:var(--text); margin-bottom:4px; transition:color 0.24s; }
  .c-desc { font-size:0.82rem; color:var(--muted); line-height:1.60; font-weight:500; transition:color 0.24s; }
  .c-lbl  { font-size:0.72rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.09em; transition:color 0.24s; }

  .why-dot { width:11px; height:11px; border-radius:50%; flex-shrink:0; margin-top:5px; transition:background 0.24s; }

  /* ════════ NOTICES ════════ */
  .notices-row { display:flex; gap:1.1rem; overflow-x:auto; padding-bottom:8px; margin-top:2.2rem; scrollbar-width:thin; scrollbar-color:rgba(30,58,138,0.2) transparent; }
  .nc {
    min-width:270px; flex-shrink:0;
    background:#ffffff; border:1.5px solid #e2e8f0;
    border-radius:var(--r); padding:1.4rem 1.6rem;
    border-left-width:4px !important;
    transition:transform 0.22s, box-shadow 0.22s;
  }
  .nc:hover { transform:translateY(-5px); box-shadow:var(--sh2); }
  .nc-type  { font-size:0.68rem; font-weight:800; letter-spacing:0.09em; text-transform:uppercase; margin-bottom:6px; }
  .nc-title { font-weight:800; font-size:0.96rem; color:var(--text); margin-bottom:5px; }
  .nc-body  { font-size:0.80rem; color:var(--muted); line-height:1.60; font-weight:500; }

  /* ════════ FOOTER ════════ */
  .footer { background:var(--navy); color:rgba(255,255,255,0.75); }

  .footer-top {
    max-width:1140px; margin:0 auto;
    padding:4rem 3rem 2.5rem;
    display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:3rem;
  }

  .ft-logo-row { display:flex; align-items:center; gap:12px; margin-bottom:1.2rem; }
  .ft-logo { height:44px; width:44px; object-fit:contain; border-radius:10px; border:1.5px solid rgba(255,255,255,0.18); }
  .ft-logo-name { font-family:'Playfair Display',serif; font-weight:800; font-size:1rem; color:#fff; line-height:1.2; }
  .ft-logo-sub  { font-size:0.60rem; font-weight:700; color:rgba(255,255,255,0.50); letter-spacing:0.12em; text-transform:uppercase; }

  .ft-desc { font-size:0.84rem; line-height:1.75; color:rgba(255,255,255,0.55); font-weight:500; margin-bottom:1.5rem; }

  .ft-contact-item { display:flex; align-items:flex-start; gap:10px; margin-bottom:0.8rem; font-size:0.83rem; color:rgba(255,255,255,0.62); font-weight:500; }
  .ft-contact-ico  { font-size:1rem; flex-shrink:0; margin-top:1px; }

  .ft-col-title { font-weight:800; font-size:0.90rem; color:#fff; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:1.2rem; padding-bottom:0.6rem; border-bottom:1px solid rgba(255,255,255,0.10); }
  .ft-link {
    display:block; font-size:0.83rem; color:rgba(255,255,255,0.58); font-weight:500;
    margin-bottom:0.6rem; cursor:pointer; background:none; border:none; text-align:left;
    text-decoration:none; transition:color 0.16s;
    font-family:'Nunito',sans-serif;
  }
  .ft-link:hover { color:var(--orange); }

  /* Social buttons */
  .social-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:4px; }
  .social-btn {
    display:flex; align-items:center; gap:10px;
    padding:10px 14px; border-radius:12px;
    border:1.5px solid rgba(255,255,255,0.10);
    background:rgba(255,255,255,0.06);
    cursor:pointer; text-decoration:none;
    transition:background 0.18s, border-color 0.18s, transform 0.18s;
  }
  .social-btn:hover { background:rgba(255,255,255,0.13); border-color:rgba(255,255,255,0.28); transform:translateY(-2px); }
  .social-ico { font-size:1.2rem; flex-shrink:0; }
  .social-label { font-size:0.82rem; font-weight:700; color:rgba(255,255,255,0.80); font-family:'Nunito',sans-serif; }

  .footer-bottom {
    border-top:1px solid rgba(255,255,255,0.08);
    padding:1.2rem 3rem;
    display:flex; align-items:center; justify-content:space-between;
    max-width:1140px; margin:0 auto;
    font-size:0.79rem; color:rgba(255,255,255,0.40); font-weight:600;
  }
  .footer-bottom-links { display:flex; gap:1.5rem; }
  .footer-bottom-lnk { color:rgba(255,255,255,0.40); cursor:pointer; background:none; border:none; font-family:'Nunito',sans-serif; font-size:0.79rem; font-weight:600; transition:color 0.16s; }
  .footer-bottom-lnk:hover { color:var(--orange); }

  /* ════════ MODAL ════════ */
  .mo {
    position:fixed; inset:0; z-index:600;
    background:rgba(10,25,47,0.60);
    backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
    display:flex; align-items:center; justify-content:center;
    padding:1rem; animation:fadeIn 0.2s ease;
  }
  .mb {
    background:#fff;
    border:1.5px solid rgba(30,58,138,0.12);
    border-radius:22px;
    box-shadow:0 32px 90px rgba(10,25,47,0.28),0 8px 24px rgba(0,0,0,0.10);
    width:100%; max-width:480px; max-height:95vh; overflow-y:auto;
    animation:popIn 0.28s cubic-bezier(.34,1.56,.64,1);
  }
  .mb.wide  { max-width:700px; }
  .mb.xwide { max-width:900px; }

  .mh { display:flex; justify-content:space-between; align-items:flex-start; padding:1.8rem 2rem 0; }
  .mt { font-family:'Playfair Display',serif; font-size:1.45rem; font-weight:800; color:var(--text); }
  .ms { font-size:0.81rem; color:var(--muted); margin-top:4px; font-weight:500; }
  .mbody { padding:1.4rem 2rem 2rem; }

  .mcls {
    width:34px; height:34px; border-radius:50%; flex-shrink:0; margin-left:12px;
    background:#f1f5f9; border:none; cursor:pointer; font-size:0.95rem; color:var(--muted);
    display:flex; align-items:center; justify-content:center;
    transition:background 0.16s, color 0.16s;
  }
  .mcls:hover { background:#e2e8f0; color:var(--text); }

  /* Login modal header */
  .lhdr {
    background:linear-gradient(135deg,var(--navy) 0%,var(--blue) 100%);
    border-radius:22px 22px 0 0; padding:2rem 2rem 1.8rem; text-align:center;
    position:relative; overflow:hidden;
  }
  .lhdr::after {
    content:''; position:absolute; inset:0;
    background:radial-gradient(circle at 70% 30%,rgba(255,255,255,0.10) 0%,transparent 65%);
    pointer-events:none;
  }
  .l-logo {
    width:72px; height:72px; border-radius:18px; margin:0 auto 1rem;
    background:rgba(255,255,255,0.16); border:2px solid rgba(255,255,255,0.32);
    display:flex; align-items:center; justify-content:center; overflow:hidden;
    position:relative; z-index:1; box-shadow:0 4px 20px rgba(0,0,0,0.20);
  }
  .l-logo img { width:100%; height:100%; object-fit:contain; }
  .l-title { font-family:'Playfair Display',serif; font-size:1.25rem; font-weight:800; color:#fff; position:relative; z-index:1; }
  .l-sub   { font-size:0.77rem; color:rgba(255,255,255,0.72); margin-top:4px; font-weight:600; position:relative; z-index:1; }
  .lbody   { padding:1.3rem 1.8rem 1.6rem; }

  .lp-step-bar { display:flex; gap:5px; margin-bottom:1rem; }
  .lp-step-seg { flex:1; height:3px; border-radius:3px; transition:background 0.3s; }

  .forgot-link {
    background:none; border:none; color:#1e3a8a; font-size:0.78rem;
    font-weight:700; cursor:pointer; padding:0; font-family:'Nunito',sans-serif;
    transition:color 0.16s;
  }
  .forgot-link:hover { color:#f97316; }

  .cancel-link {
    display:block; text-align:center; margin-top:0.8rem;
    color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer;
    transition:color 0.16s; font-family:'Nunito',sans-serif;
  }
  .cancel-link:hover { color:#374151; }

  .otp-input {
    text-align:center; letter-spacing:0.5em; font-size:1.15rem !important; font-weight:800 !important;
  }

  /* Form */
  .fg { margin-bottom:0.9rem; }
  .fl { display:block; font-size:0.71rem; font-weight:800; color:#374151; text-transform:uppercase; letter-spacing:0.09em; margin-bottom:7px; }
  .fi {
    width:100%; padding:12px 16px;
    background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px;
    font-family:'Nunito',sans-serif; font-size:0.95rem; color:#0f172a; font-weight:600;
    outline:none; transition:border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }
  .fi::placeholder { color:#94a3b8; font-weight:500; }
  .fi:focus { border-color:var(--blue); background:#fff; box-shadow:0 0 0 4px rgba(30,58,138,0.10); }

  .cap-row { display:flex; align-items:center; gap:10px; }
  .cap-pill {
    padding:12px 18px; border-radius:12px; flex-shrink:0;
    background:linear-gradient(135deg,rgba(30,58,138,0.07),rgba(59,130,246,0.09));
    border:1.5px solid rgba(30,58,138,0.22);
    font-size:1.15rem; font-weight:900; color:var(--blue);
    letter-spacing:0.15em; font-family:monospace; user-select:none; white-space:nowrap;
  }
  .cap-ref {
    width:42px; height:42px; flex-shrink:0;
    background:rgba(30,58,138,0.07); border:1.5px solid rgba(30,58,138,0.18);
    border-radius:11px; cursor:pointer; font-size:1.15rem;
    display:flex; align-items:center; justify-content:center; color:var(--blue);
    transition:background 0.16s, transform 0.28s;
  }
  .cap-ref:hover { background:rgba(30,58,138,0.14); transform:rotate(90deg); }

  .err-box {
    background:#fef2f2; border:1.5px solid #fecaca; color:#b91c1c;
    padding:10px 14px; border-radius:12px; font-size:0.83rem;
    margin-bottom:1rem; font-weight:600;
    display:flex; align-items:center; gap:8px;
  }
  .success-box {
    background:#f0fdf4; border:1.5px solid #bbf7d0; color:#15803d;
    padding:10px 14px; border-radius:12px; font-size:0.83rem;
    margin-bottom:1rem; font-weight:600;
    display:flex; align-items:center; gap:8px;
  }
  .sbtn {
    width:100%; padding:14px; border:none; border-radius:12px;
    background:linear-gradient(135deg,var(--orange),var(--orange2));
    color:#fff; font-family:'Nunito',sans-serif; font-weight:800; font-size:1rem;
    cursor:pointer; box-shadow:0 6px 24px rgba(249,115,22,0.35);
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  }
  .sbtn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 32px rgba(249,115,22,0.45); }
  .sbtn:disabled { opacity:0.55; cursor:not-allowed; }

  /* ════════ RESPONSIVE ════════ */
  @media (max-width:1024px) {
    .footer-top { grid-template-columns:1fr 1fr; }
    .footer-top > *:first-child { grid-column:span 2; }
  }
  @media (max-width:960px) {
    .b4,.b3 { grid-template-columns:1fr 1fr; }
    .nav     { padding:0 1.4rem; }
    .sec     { padding:3.5rem 1.5rem; }
    .stats-bar { padding:1.8rem 1rem; }
    .sc      { padding:0.5rem 1.5rem; }
    .footer-top { padding:3rem 1.5rem 2rem; gap:2rem; }
    .footer-bottom { padding:1.2rem 1.5rem; }
  }
  @media (max-width:620px) {
    .b4,.b3,.b2 { grid-template-columns:1fr; }
    .nav-lnk    { display:none; }
    .footer-top { grid-template-columns:1fr; }
    .footer-top > *:first-child { grid-column:span 1; }
    .footer-bottom { flex-direction:column; gap:0.8rem; text-align:center; }
    .social-grid { grid-template-columns:1fr 1fr; }
  }

  /* ════════ CHATBOT ════════ */
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
`;

// ─── Generic Modal ─────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, size = '' }) {
  return (
    <div className="mo" onClick={onClose}>
      <div className={`mb ${size}`} onClick={e => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mt">{title}</div>
            {subtitle && <div className="ms">{subtitle}</div>}
          </div>
          <button className="mcls" onClick={onClose}>✕</button>
        </div>
        <div className="mbody">{children}</div>
      </div>
    </div>
  );
}

// ─── Hoverable Card (lights up with accent color) ─────────────────────────────
function HoverCard({ accent, bg, children, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="gc"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   hovered ? accent : '#ffffff',
        borderColor:  hovered ? accent : '#e2e8f0',
        boxShadow:    hovered ? `0 10px 40px ${accent}40` : undefined,
        ...style,
      }}
    >
      {/* pass hovered down via cloneElement so children can adapt */}
      {typeof children === 'function' ? children(hovered) : children}
    </div>
  );
}

// ─── Page Component ────────────────────────────────────────────────────────────
export default function MasterLandingPage() {
  const [activeModal, setActiveModal] = useState(null);

  // Login state
  const [loginId,   setLoginId]   = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr,  setLoginErr]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [captcha,   setCaptcha]   = useState(genCaptcha);
  const [capVal,    setCapVal]    = useState('');
  const [capErr,    setCapErr]    = useState(false);

  // Forgot-password flow: 'login' | 'forgot' | 'verify' | 'reset'
  const [loginMode,     setLoginMode]     = useState('login');
  const [fpOtp,         setFpOtp]         = useState('');
  const [fpNewPass,     setFpNewPass]     = useState('');
  const [fpConfPass,    setFpConfPass]    = useState('');
  const [fpMsg,         setFpMsg]         = useState({ text: '', type: '' }); // type: 'err'|'ok'

  // Admission form state
  const [admForm,    setAdmForm]    = useState({ parentName: '', mobile: '', studentName: '', className: '', message: '' });
  const [admLoading, setAdmLoading] = useState(false);
  const [admSuccess, setAdmSuccess] = useState(false);
  const [admErr,     setAdmErr]     = useState('');

  const [scrolled, setScrolled] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setLoginErr(''); setCapVal(''); setCapErr(false);
    setLoginMode('login'); setFpOtp(''); setFpNewPass(''); setFpConfPass('');
    setFpMsg({ text: '', type: '' });
    setAdmForm({ parentName: '', mobile: '', studentName: '', className: '', message: '' });
    setAdmSuccess(false); setAdmErr('');
  }, []);

  // ── Forgot Password handlers ───────────────────────────────────────────────
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setFpMsg({ text: '', type: '' });
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setFpMsg({ text: 'OTP sent! Check the server console log (dev mode).', type: 'ok' });
      setLoginMode('verify');
    } catch (err) {
      setFpMsg({ text: err.message || 'Failed to send OTP', type: 'err' });
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFpMsg({ text: '', type: '' });
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, otp: fpOtp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setFpMsg({ text: 'OTP verified! Set your new password.', type: 'ok' });
      setLoginMode('reset');
    } catch (err) {
      setFpMsg({ text: err.message || 'Invalid OTP', type: 'err' });
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (fpNewPass !== fpConfPass) { setFpMsg({ text: 'Passwords do not match', type: 'err' }); return; }
    if (fpNewPass.length < 6)     { setFpMsg({ text: 'Password must be at least 6 characters', type: 'err' }); return; }
    setFpMsg({ text: '', type: '' });
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, otp: fpOtp, newPassword: fpNewPass }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setFpMsg({ text: 'Password reset! You can now sign in.', type: 'ok' });
      setTimeout(() => {
        setLoginMode('login');
        setFpOtp(''); setFpNewPass(''); setFpConfPass('');
        setFpMsg({ text: '', type: '' });
      }, 2000);
    } catch (err) {
      setFpMsg({ text: err.message || 'Reset failed', type: 'err' });
    }
    setLoading(false);
  };

  const refresh = () => { setCaptcha(genCaptcha()); setCapVal(''); setCapErr(false); };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); setLoginErr(''); setCapErr(false);
    if (parseInt(capVal, 10) !== captcha.ans) { setCapErr(true); refresh(); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      dispatch(setCredentials({ user: data.user, token: data.token }));
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(`/dashboard/${data.user.role.toLowerCase()}`);
    } catch (err) { setLoginErr(err.message); refresh(); }
    finally { setLoading(false); }
  };

  // ── Admission enquiry ──────────────────────────────────────────────────────
  const handleAdmission = async (e) => {
    e.preventDefault();
    setAdmErr(''); setAdmSuccess(false);
    if (!admForm.parentName || !admForm.mobile || !admForm.className) {
      setAdmErr('Please fill in all required fields.'); return;
    }
    if (!/^\d{10}$/.test(admForm.mobile)) {
      setAdmErr('Please enter a valid 10-digit mobile number.'); return;
    }
    setAdmLoading(true);
    try {
      const resp = await fetch(`${API_URL}/admissions/enquiry`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admForm),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || 'Failed to submit enquiry');
      setAdmSuccess(true);
      setAdmForm({ parentName: '', mobile: '', studentName: '', className: '', message: '' });
    } catch (err) {
      setAdmErr(err.message || 'Something went wrong. Please try again.');
    }
    setAdmLoading(false);
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav className={`nav${scrolled ? ' solid' : ''}`}>
        <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/abhyaas-logo.jpeg" alt="Abhyaas" className="nav-logo"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
          <div className="nav-logo-fb">A</div>
          <div>
            <div className="nav-brand-name">Abhyaas</div>
            <div className="nav-brand-sub">International School</div>
          </div>
        </div>

        <div className="nav-links">
          <button className="nav-lnk" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</button>
          <button className="nav-lnk" onClick={() => setActiveModal('programs')}>Programs</button>
          <button className="nav-lnk" onClick={() => setActiveModal('why')}>Why Us</button>
          <button className="nav-lnk" onClick={() => setActiveModal('notices')}>Notices</button>
          <button className="nav-lnk" onClick={() => setActiveModal('contact')}>Contact</button>
          <button className="nav-login-btn" onClick={() => setActiveModal('login')}>
            🔑 Login ERP
          </button>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero">
        <div className="hero-vid">
          <video autoPlay muted loop playsInline>
            <source src="https://assets.mixkit.co/videos/preview/mixkit-little-school-kids-learning-in-class-4434-large.mp4" type="video/mp4" />
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="hero-ov" />
        <div className="hero-blob1" />
        <div className="hero-blob2" />

        <div className="hero-content">
          <div className="hero-badge">
            <div className="badge-dot" />
            Rajam's Premier School &nbsp;·&nbsp; Est. 1999
          </div>
          <h1>
            Nurturing{' '}
            <span className="highlight">Brilliant Minds</span>
            <br />for Tomorrow's World
          </h1>
          <p>
            Abhyaas International School — Nursery to Class X — empowering every
            child with knowledge, character, and the confidence to lead.
          </p>
          {/* Single centred CTA — no Login button here */}
          <div className="hero-btns">
            <button className="btn-hero-p" onClick={() => setActiveModal('admission')}>
              ✨ Apply for Admission
            </button>
          </div>
        </div>

        <div className="hero-scroll">
          <span style={{ fontSize: '1.2rem' }}>↓</span>
          Scroll to explore
        </div>
      </section>

      {/* ══════════════════ STATS BAR ══════════════════ */}
      <div className="stats-bar">
        {STATS.map(({ value, label }) => (
          <div className="sc" key={label}>
            <div className="sc-val">{value}</div>
            <div className="sc-lbl">{label}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW BENTO ══════════════════ */}
      <section className="sec" style={{ background: '#fff' }}>
        <div className="sec-in">
          <div className="chip">📊 At a Glance</div>
          <div className="sec-h">School Overview</div>
          <div className="sec-p">Key numbers that reflect our dedication to every student.</div>
          <div className="bento b4">
            {STATS.map(s => (
              <HoverCard key={s.label} accent={s.color} bg={s.bg}>
                {hovered => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="c-ico" style={{ background: hovered ? 'rgba(255,255,255,0.22)' : s.bg }}>
                      {s.icon}
                    </div>
                    <div className="c-val" style={{ color: hovered ? '#fff' : s.color }}>{s.value}</div>
                    <div className="c-lbl" style={{ color: hovered ? 'rgba(255,255,255,0.80)' : undefined }}>{s.label}</div>
                  </div>
                )}
              </HoverCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ ACADEMICS BENTO ══════════════════ */}
      <section className="sec" style={{ background: 'var(--bg)' }}>
        <div className="sec-in">
          <div className="chip">🎓 Academics</div>
          <div className="sec-h">Our Academic Programs</div>
          <div className="sec-p">A structured, holistic learning journey from early childhood to board-level excellence.</div>
          <div className="bento b4">
            {PROGRAMS.map(p => (
              <HoverCard key={p.id} accent={p.accent} bg={p.bg}>
                {hovered => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="c-ico" style={{ background: hovered ? 'rgba(255,255,255,0.22)' : p.bg, fontSize: '1.65rem' }}>
                      {p.icon}
                    </div>
                    <div className="c-name" style={{ color: hovered ? '#fff' : undefined }}>{p.name}</div>
                    <div className="c-desc" style={{ color: hovered ? 'rgba(255,255,255,0.80)' : undefined }}>{p.desc}</div>
                  </div>
                )}
              </HoverCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ WHY US BENTO ══════════════════ */}
      <section className="sec" style={{ background: '#fff' }}>
        <div className="sec-in">
          <div className="chip">⭐ Why Abhyaas</div>
          <div className="sec-h">Why Choose Us?</div>
          <div className="sec-p">We combine rigorous academics with a nurturing environment — because great education shapes both mind and character.</div>
          <div className="bento b2">
            {WHY_ITEMS.map(w => (
              <HoverCard key={w.title} accent={w.color}>
                {hovered => (
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div className="why-dot" style={{ background: hovered ? 'rgba(255,255,255,0.70)' : w.color }} />
                    <div>
                      <div className="c-name" style={{ marginBottom: 6, color: hovered ? '#fff' : undefined }}>
                        {w.icon}&nbsp; {w.title}
                      </div>
                      <div className="c-desc" style={{ color: hovered ? 'rgba(255,255,255,0.82)' : undefined }}>
                        {w.desc}
                      </div>
                    </div>
                  </div>
                )}
              </HoverCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ NOTICES STRIP ══════════════════ */}
      <section className="sec" style={{ background: 'var(--bg)' }}>
        <div className="sec-in">
          <div className="chip">📢 Latest Updates</div>
          <div className="sec-h">School Notices</div>
          <div className="sec-p">Stay informed with the latest announcements from Abhyaas.</div>
          <div className="notices-row">
            {NOTICES.map(n => (
              <div key={n.title} className="nc" style={{ borderLeftColor: n.color }}>
                <div className="nc-type"  style={{ color: n.color }}>{n.type}</div>
                <div className="nc-title">{n.title}</div>
                <div className="nc-body">{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="footer">
        <div className="footer-top">

          {/* Col 1 — Brand + contact */}
          <div>
            <div className="ft-logo-row">
              <img src="/abhyaas-logo.jpeg" alt="Abhyaas" className="ft-logo"
                onError={e => { e.target.style.display = 'none'; }} />
              <div>
                <div className="ft-logo-name">Abhyaas</div>
                <div className="ft-logo-sub">International School</div>
              </div>
            </div>
            <p className="ft-desc">
              Empowering young minds with quality education, strong values, and the skills to thrive in an ever-changing world — since 1999.
            </p>
            <div className="ft-contact-item"><span className="ft-contact-ico">📍</span> Rajam, Andhra Pradesh</div>
            <div className="ft-contact-item"><span className="ft-contact-ico">📞</span> +91 98765 43210</div>
            <div className="ft-contact-item"><span className="ft-contact-ico">✉️</span> admissions@abhyaas.edu.in</div>
            <div className="ft-contact-item"><span className="ft-contact-ico">🕐</span> Mon – Sat, 8:00 AM – 4:00 PM</div>
          </div>

          {/* Col 2 — Academics */}
          <div>
            <div className="ft-col-title">Academics</div>
            {ACADEMIC_LINKS.map(l => (
              <button key={l} className="ft-link">→ {l}</button>
            ))}
          </div>

          {/* Col 3 — Connect With Us (replaces Quick Links) */}
          <div>
            <div className="ft-col-title">Connect With Us</div>
            <div className="social-grid">
              {SOCIAL.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="social-btn">
                  <span className="social-ico">{s.icon}</span>
                  <span className="social-label">{s.label}</span>
                </a>
              ))}
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Abhyaas International School, Rajam. All rights reserved.</span>
            <div className="footer-bottom-links">
              <button className="footer-bottom-lnk">Privacy Policy</button>
              <button className="footer-bottom-lnk">Terms of Use</button>
              <button className="footer-bottom-lnk">Sitemap</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════════ MODALS ══════════════════════ */}

      {/* ── LOGIN ERP ── */}
      {activeModal === 'login' && (
        <div className="mo" onClick={closeModal}>
          <div className="mb" onClick={e => e.stopPropagation()}>

            {/* Compact header */}
            <div className="lhdr" style={{ padding: '1.3rem 1.6rem 1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="l-logo" style={{ width: 48, height: 48, borderRadius: 12, margin: 0, flexShrink: 0 }}>
                    <img src="/abhyaas-logo.jpeg" alt="Abhyaas"
                      onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:1.4rem">🏫</span>'; }} />
                  </div>
                  <div>
                    <div className="l-title">
                      {loginMode === 'login'  && 'Welcome Back'}
                      {loginMode === 'forgot' && 'Forgot Password'}
                      {loginMode === 'verify' && 'Enter OTP'}
                      {loginMode === 'reset'  && 'New Password'}
                    </div>
                    <div className="l-sub">
                      {loginMode === 'login'  && 'Abhyaas ERP Portal'}
                      {loginMode === 'forgot' && 'Enter your Login ID'}
                      {loginMode === 'verify' && 'Check your email for the OTP'}
                      {loginMode === 'reset'  && 'Create a secure password'}
                    </div>
                  </div>
                </div>
                <button className="mcls" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', flexShrink: 0 }} onClick={closeModal}>✕</button>
              </div>
            </div>

            <div className="lbody">
              {/* Step progress bar for forgot flow */}
              {loginMode !== 'login' && (
                <div className="lp-step-bar">
                  {['Enter ID','Verify OTP','New Password'].map((s,i) => {
                    const active = i <= ({forgot:0,verify:1,reset:2}[loginMode] ?? 0);
                    return <div key={s} className="lp-step-seg" style={{ background: active ? '#1e3a8a' : '#e2e8f0' }} />;
                  })}
                </div>
              )}

              {/* Feedback messages */}
              {loginMode === 'login' && loginErr && <div className="err-box">⚠️ {loginErr}</div>}
              {loginMode === 'login' && capErr   && <div className="err-box">🔢 Wrong answer. New captcha generated.</div>}
              {loginMode !== 'login' && fpMsg.text && (
                <div className={fpMsg.type === 'ok' ? 'success-box' : 'err-box'}>
                  {fpMsg.type === 'ok' ? '✅' : '⚠️'} {fpMsg.text}
                </div>
              )}

              {/* ── NORMAL LOGIN ── */}
              {loginMode === 'login' && (
                <form onSubmit={handleLogin}>
                  <div className="fg">
                    <label className="fl">Login ID</label>
                    <input type="text" placeholder="e.g. AB-STD-101" required className="fi"
                      value={loginId} onChange={e => setLoginId(e.target.value)} autoComplete="username" />
                  </div>
                  <div className="fg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <label className="fl" style={{ margin: 0 }}>Password</label>
                      <button type="button" className="forgot-link"
                        onClick={() => { setLoginErr(''); setFpMsg({ text:'',type:'' }); setLoginMode('forgot'); }}>
                        Forgot Password?
                      </button>
                    </div>
                    <input type="password" placeholder="Enter your password" required className="fi"
                      value={loginPass} onChange={e => setLoginPass(e.target.value)} autoComplete="current-password" />
                  </div>
                  <div className="fg">
                    <label className="fl">Security Check — What is {captcha.q}?</label>
                    <div className="cap-row">
                      <div className="cap-pill">{captcha.q} = ?</div>
                      <input type="number" placeholder="Answer" required className="fi"
                        value={capVal} onChange={e => setCapVal(e.target.value)} autoComplete="off"
                        style={{ textAlign: 'center', fontWeight: 800, fontSize: '1rem' }} />
                      <button type="button" className="cap-ref" onClick={refresh} title="New captcha">↻</button>
                    </div>
                  </div>
                  <button type="submit" className="sbtn" disabled={loading}>
                    {loading ? '⏳ Signing in…' : '🔑 Sign In to ERP'}
                  </button>
                </form>
              )}

              {/* ── FORGOT: enter Login ID ── */}
              {loginMode === 'forgot' && (
                <form onSubmit={handleForgotRequest}>
                  <div className="fg">
                    <label className="fl">Login ID / Username</label>
                    <input type="text" placeholder="e.g. AB-STD-101" required className="fi"
                      value={loginId} onChange={e => setLoginId(e.target.value)} autoComplete="username" />
                  </div>
                  <button type="submit" className="sbtn" disabled={loading}>
                    {loading ? '⏳ Sending OTP…' : '📧 Send OTP'}
                  </button>
                  <span className="cancel-link" onClick={() => { setLoginMode('login'); setFpMsg({ text:'',type:'' }); }}>
                    ← Back to login
                  </span>
                </form>
              )}

              {/* ── VERIFY OTP ── */}
              {loginMode === 'verify' && (
                <form onSubmit={handleVerifyOtp}>
                  <div className="fg">
                    <label className="fl">6-Digit OTP</label>
                    <input type="text" placeholder="123456" required maxLength={6} className="fi otp-input"
                      value={fpOtp} onChange={e => setFpOtp(e.target.value)} autoComplete="one-time-code" />
                  </div>
                  <button type="submit" className="sbtn" disabled={loading}>
                    {loading ? '⏳ Verifying…' : '✅ Verify OTP'}
                  </button>
                  <span className="cancel-link" onClick={() => { setLoginMode('login'); setFpMsg({ text:'',type:'' }); }}>
                    ← Back to login
                  </span>
                </form>
              )}

              {/* ── RESET PASSWORD ── */}
              {loginMode === 'reset' && (
                <form onSubmit={handleResetPassword}>
                  <div className="fg">
                    <label className="fl">New Password</label>
                    <input type="password" placeholder="At least 6 characters" required className="fi"
                      value={fpNewPass} onChange={e => setFpNewPass(e.target.value)} autoComplete="new-password" />
                  </div>
                  <div className="fg">
                    <label className="fl">Confirm Password</label>
                    <input type="password" placeholder="Repeat new password" required className="fi"
                      value={fpConfPass} onChange={e => setFpConfPass(e.target.value)} autoComplete="new-password" />
                  </div>
                  <button type="submit" className="sbtn" disabled={loading}>
                    {loading ? '⏳ Resetting…' : '🔒 Reset Password'}
                  </button>
                  <span className="cancel-link" onClick={() => { setLoginMode('login'); setFpMsg({ text:'',type:'' }); }}>
                    ← Back to login
                  </span>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── ADMISSION FORM ── */}
      {activeModal === 'admission' && (
        <div className="mo" onClick={closeModal}>
          <div className="mb" onClick={e => e.stopPropagation()}>
            <div className="lhdr">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <button className="mcls" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }} onClick={closeModal}>✕</button>
              </div>
              <div className="l-logo">
                <img src="/abhyaas-logo.jpeg" alt="Abhyaas"
                  onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:2rem">🏫</span>'; }} />
              </div>
              <div className="l-title">Apply for Admission</div>
              <div className="l-sub">Abhyaas International School · Nursery – Class X</div>
            </div>
            <div className="lbody">
              {admErr     && <div className="err-box">⚠️ {admErr}</div>}
              {admSuccess && (
                <div className="success-box">
                  ✅ Thank you! We'll contact you within 24 hours to discuss your admission enquiry.
                </div>
              )}
              {!admSuccess && (
                <form onSubmit={handleAdmission}>
                  <div className="fg">
                    <label className="fl">Parent / Guardian Name *</label>
                    <input type="text" placeholder="e.g. Rajesh Kumar" required className="fi"
                      value={admForm.parentName}
                      onChange={e => setAdmForm(f => ({ ...f, parentName: e.target.value }))} />
                  </div>
                  <div className="fg">
                    <label className="fl">Mobile Number *</label>
                    <input type="tel" placeholder="10-digit mobile number" required className="fi"
                      maxLength={10}
                      value={admForm.mobile}
                      onChange={e => setAdmForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                  </div>
                  <div className="fg">
                    <label className="fl">Student's Name</label>
                    <input type="text" placeholder="Child's full name (optional)" className="fi"
                      value={admForm.studentName}
                      onChange={e => setAdmForm(f => ({ ...f, studentName: e.target.value }))} />
                  </div>
                  <div className="fg">
                    <label className="fl">Applying for Class *</label>
                    <select required className="fi"
                      value={admForm.className}
                      onChange={e => setAdmForm(f => ({ ...f, className: e.target.value }))}>
                      <option value="">— Select Class —</option>
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="fg">
                    <label className="fl">Message / Any Questions</label>
                    <textarea placeholder="Any specific queries about curriculum, fees, transport…" className="fi"
                      rows={3} style={{ resize: 'vertical' }}
                      value={admForm.message}
                      onChange={e => setAdmForm(f => ({ ...f, message: e.target.value }))} />
                  </div>
                  <button type="submit" className="sbtn" disabled={admLoading}>
                    {admLoading ? '⏳ Submitting…' : '✨ Submit Enquiry'}
                  </button>
                </form>
              )}
              {admSuccess && (
                <button className="sbtn" style={{ marginTop: 12 }} onClick={closeModal}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PROGRAMS ── */}
      {activeModal === 'programs' && (
        <Modal title="Academic Programs" subtitle="Nursery to Class X — a journey of structured excellence" onClose={closeModal} size="xwide">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '1rem' }}>
            {PROGRAMS.map(p => (
              <div key={p.id}
                style={{ background: p.bg, border: `1.5px solid ${p.accent}28`, borderRadius: 16, padding: '1.8rem 1.2rem', textAlign: 'center', transition: 'transform 0.22s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ fontSize: '2.6rem', marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, color: p.accent, marginBottom: 5, fontSize: '1.1rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.84rem', color: '#374151', fontWeight: 600 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── WHY US ── */}
      {activeModal === 'why' && (
        <Modal title="Why Choose Abhyaas?" subtitle="What sets us apart from the rest" onClose={closeModal} size="wide">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {WHY_ITEMS.map(w => (
              <div key={w.title}
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '1.4rem 1.5rem', transition: 'border-color 0.2s, transform 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = w.color; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{w.icon}</div>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 5 }}>{w.title}</div>
                <div style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.65, fontWeight: 500 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── NOTICES ── */}
      {activeModal === 'notices' && (
        <Modal title="School Notices" subtitle="Latest announcements from Abhyaas" onClose={closeModal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {NOTICES.map(n => (
              <div key={n.title}
                style={{ background: n.bg, border: `1.5px solid ${n.color}28`, borderLeft: `4px solid ${n.color}`, borderRadius: 14, padding: '1.1rem 1.3rem' }}>
                <div style={{ fontSize: '0.67rem', fontWeight: 800, color: n.color, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>{n.type}</div>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{n.title}</div>
                <div style={{ fontSize: '0.81rem', color: '#64748b', lineHeight: 1.65, fontWeight: 500 }}>{n.body}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── CONTACT ── */}
      {activeModal === 'contact' && (
        <Modal title="Get in Touch" subtitle="We are always here to help" onClose={closeModal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {[
              { icon: '📍', bg: '#fff7ed', label: 'Address', value: 'Rajam, Andhra Pradesh' },
              { icon: '📞', bg: '#eff6ff', label: 'Phone',   value: '+91 98765 43210' },
              { icon: '✉️', bg: '#eef2ff', label: 'Email',   value: 'admissions@abhyaas.edu.in' },
            ].map(({ icon, bg, label, value }) => (
              <div key={label}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '1.1rem 1.3rem' }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{value}</div>
                </div>
              </div>
            ))}
            <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '1rem 1.3rem', textAlign: 'center', color: 'var(--blue)', fontSize: '0.85rem', fontWeight: 800 }}>
              🕐 Office Hours: Monday – Saturday &nbsp;·&nbsp; 8:00 AM – 4:00 PM
            </div>
          </div>
        </Modal>
      )}

      {/* Chatbot */}
      <ChatbotRobot />

    </>
  );
}