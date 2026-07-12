/* ═══════════ SoloOS — 스크롤 스크럽 히어로 + 섹션 리빌 ═══════════ */
"use strict";

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
/* 구간 진행도: p가 [a,b]를 지나는 동안 0→1 */
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const lerp = (t, from, to) => from + (to - from) * t;
/* 부드러운 가감속 */
const ease = (t) => t * t * (3 - 2 * t);

const track = $("#hero-track");
const intro = $("#hero-intro");
const hint = $("#scroll-hint");
const navbar = $("#navbar");
const gear = $("#gear");
const docs = [$(".doc1"), $(".doc2"), $(".doc3")];
const quoteCard = $("#quote-card");
const amount = $("#qc-amount");
const stamp = $("#qc-stamp");
const caption = $("#hook-caption");
const heroFinal = $("#hero-final");

const TOTAL = 101180000; // 견적 합계 카운트업 목표

/* 문서 3개의 시작 위치(%) → 기어 중심으로 수렴 */
const DOC_FROM = [
  { x: 0, y: 0 },
  { x: 0, y: -60 },
  { x: 0, y: 0 },
];

function heroProgress() {
  const vh = window.innerHeight;
  const max = track.offsetHeight - vh;
  return clamp((window.scrollY - track.offsetTop) / max, 0, 1);
}

function renderHero() {
  const p = heroProgress();

  /* 1) 인트로(이미지 씬): p 0~0.16에서 위로 사라짐 */
  const tIntro = ease(seg(p, 0, 0.16));
  intro.style.opacity = String(1 - tIntro);
  intro.style.transform = `translateY(${lerp(tIntro, 0, -80)}px) scale(${lerp(tIntro, 1, 0.94)})`;
  hint.style.opacity = String(1 - seg(p, 0, 0.07));

  /* 2) 문서 3종 등장(0.14~0.22) → 기어로 수렴하며 소멸(0.24~0.44) */
  docs.forEach((doc, i) => {
    const tIn = ease(seg(p, 0.13 + i * 0.02, 0.2 + i * 0.02));
    const tFly = ease(seg(p, 0.26, 0.44));
    // 기어 중심으로 이동량 계산 (뷰포트 기준 대략치)
    const vw = window.innerWidth;
    const targets = [vw * 0.34, vw * 0.0, -vw * 0.34]; // 좌/중/우 → 중앙
    const dx = lerp(tFly, 0, targets[i]);
    const dy = lerp(tFly, 0, window.innerHeight * 0.14);
    doc.style.opacity = String(tIn * (1 - seg(p, 0.4, 0.46)));
    doc.style.transform = `translate(${dx}px, ${lerp(tIn, 30, 0) + dy}px) scale(${lerp(tFly, 1, 0.3)}) rotate(${lerp(tFly, 0, (i - 1) * 18)}deg)`;
  });

  /* 3) 기어: 등장(0.18~0.26) → 스크롤에 따라 회전 → 소멸(0.5~0.58) */
  const gearIn = ease(seg(p, 0.18, 0.26)) * (1 - ease(seg(p, 0.5, 0.58)));
  gear.style.opacity = String(gearIn);
  gear.style.transform = `translate(-50%, -50%) rotate(${p * 620}deg) scale(${lerp(ease(seg(p, 0.18, 0.3)), 0.5, 1)})`;

  /* 4) 견적서 카드: 부상(0.5~0.64), 유지, 퇴장(0.8~0.88) */
  const cardIn = ease(seg(p, 0.5, 0.64));
  const cardOut = ease(seg(p, 0.8, 0.88));
  quoteCard.style.opacity = String(cardIn * (1 - cardOut));
  quoteCard.style.transform = `translate(-50%, ${lerp(cardIn, 10, -52)}%) scale(${lerp(cardIn, 0.92, 1) - cardOut * 0.06}) rotate(${lerp(cardIn, 2, 0)}deg)`;

  /* 5) 금액 카운트업 (0.56~0.74) */
  const tCount = ease(seg(p, 0.56, 0.74));
  amount.textContent = "₩" + Math.round(TOTAL * tCount).toLocaleString("ko-KR");

  /* 6) 도장 팝 (0.72~0.79) */
  const tStamp = ease(seg(p, 0.72, 0.79));
  stamp.style.opacity = String(tStamp);
  stamp.style.transform = `rotate(-14deg) scale(${tStamp})`;

  /* 7) 캡션 (0.6 in ~ 0.84 out) */
  caption.style.opacity = String(ease(seg(p, 0.6, 0.68)) * (1 - seg(p, 0.8, 0.86)));

  /* 8) 마지막 헤드라인 (0.86~0.97) */
  const tFinal = ease(seg(p, 0.86, 0.97));
  heroFinal.style.opacity = String(tFinal);
  heroFinal.style.transform = `translateY(${lerp(tFinal, 40, 0)}px)`;
  heroFinal.classList.toggle("on", tFinal > 0.6);

  /* 내비게이션: 히어로 후반부터 표시 */
  navbar.classList.toggle("show", p > 0.92);
}

/* renderHero는 소수 요소의 스타일만 갱신하므로 스크롤마다 직접 호출해도 충분히 가볍다.
   (rAF 스로틀은 백그라운드 탭에서 멈춰 핸들러가 잠길 수 있어 사용하지 않음) */
window.addEventListener("scroll", renderHero, { passive: true });
window.addEventListener("resize", renderHero);
renderHero();

/* ─────────── 섹션 리빌 + 스탯 카운트업 (스크롤 위치 기반 — 모든 환경에서 동작) ─────────── */
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
});

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const start = Date.now();
  const dur = 1200;
  const tick = () => {
    const t = ease(clamp((Date.now() - start) / dur, 0, 1));
    el.textContent = String(Math.round(target * t));
    if (t < 1) setTimeout(tick, 16);
  };
  tick();
}

function checkReveals() {
  const vh = window.innerHeight;
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => {
    if (el.getBoundingClientRect().top < vh * 0.88) el.classList.add("in");
  });
  document.querySelectorAll("[data-count]:not(.counted)").forEach((el) => {
    if (el.getBoundingClientRect().top < vh * 0.92) {
      el.classList.add("counted");
      animateCount(el);
    }
  });
}

window.addEventListener("scroll", checkReveals, { passive: true });
window.addEventListener("resize", checkReveals);
checkReveals();
