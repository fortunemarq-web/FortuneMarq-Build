"use client";

// Motion + scroll engine for the marketing site, tuned for a smooth, premium
// feel that stays fast on small/low-power devices.
//
// Performance strategy:
//  • Lenis smooth-scroll runs ONLY on fine-pointer (desktop) — touch devices use
//    native momentum scrolling (this is the #1 fix for "sticky" mobile scroll).
//  • ScrollTrigger.config({ ignoreMobileResize }) stops address-bar jump/jank.
//  • Heavy scrubbed effects (mission word-scrub) run on desktop only; mobile gets
//    a light one-shot fade.
//  • The infinite creative-journal loop and project videos pause when offscreen.
//  • Snappy preloader (~1s) that only plays once per session.
//  • prefers-reduced-motion fully respected.
// (Companion GPU/paint reductions live in the perf block at the end of site.css.)

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import SplitType from "split-type";

const EASE_EXPO = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export default function SiteMotion() {
  // The /site layout (and this engine) stays mounted across client-side route
  // changes, so we key the whole effect on the pathname: each navigation tears
  // the engine down (revert ctx, destroy Lenis, drop listeners) and rebuilds it
  // for the new page. This is what lets per-page motion init on soft navigation.
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ nullTargetWarn: false });
    ScrollTrigger.config({ ignoreMobileResize: true });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // "Desktop" = wide + real pointer. Everything else (phones, tablets, narrow
    // windows) gets native momentum scroll + lighter effects for a smooth feel.
    const isDesktop =
      window.matchMedia("(min-width: 992px) and (hover: hover) and (pointer: fine)").matches && !reduceMotion;
    const useLenis = isDesktop;

    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      initPreloader(cleanups, reduceMotion);
      initPageEnter(reduceMotion);

      // Smooth scroll: desktop pointer only. Touch keeps native momentum.
      let lenis: Lenis | null = null;
      if (useLenis) {
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true, duration: 1.2, easing: EASE_EXPO });
        const onScroll = () => ScrollTrigger.update();
        lenis.on("scroll", onScroll);
        const rafFn = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(rafFn);
        gsap.ticker.lagSmoothing(0);
        cleanups.push(() => {
          gsap.ticker.remove(rafFn);
          lenis?.destroy();
        });
      }

      initMobileMenu(cleanups);

      if (document.getElementById("fmq-home-vision")) {
        initHeroAnimations(reduceMotion);
        if (isDesktop) initHeroInteractions();
        initHeroParallax(reduceMotion);
        initTrustMarquee();
        initMission(reduceMotion);
        initAbout();
        if (isDesktop) initCapabilities();
        initMobileStack(reduceMotion);
        initResultsEngine(cleanups);
        initCreativeJournal(reduceMotion);
      }

      // WORK page (composed page — hero entrance; project grid handled by the
      // shared #featured-projects init below).
      if (document.querySelector(".wk-hero")) {
        initWorkPage(reduceMotion);
      }

      // Featured-projects grid + lazy play-in-view videos — shared by the home
      // and Work pages (both mount a #featured-projects section).
      if (document.getElementById("featured-projects")) {
        initFeaturedProjects(cleanups, reduceMotion);
      }

      // ABOUT page
      if (document.querySelector(".abt-hero")) {
        initAboutPage(reduceMotion);
      }

      // SERVICES page
      if (document.querySelector(".sp-hero")) {
        initServicesPage(reduceMotion, cleanups);
      }

      // CONTACT page
      if (document.querySelector(".ct-hero")) {
        initContactPage(reduceMotion, cleanups);
      }

      // Shared, page-agnostic enhancements (Task B). Each is a no-op when its
      // hook elements are absent, so they're safe to call on every page.
      setupTextReveals();
      initParallax(reduceMotion);
      if (isDesktop) initMagneticCTAs(cleanups);
      if (isDesktop) initCardSpotlight(cleanups);

      const refreshT = setTimeout(() => ScrollTrigger.refresh(), 400);
      cleanups.push(() => clearTimeout(refreshT));

      initFooterAnimations();
      initScrollIndicator(lenis, cleanups);
      initSmoothAnchors(lenis, cleanups);
    });

    return () => {
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore teardown errors */
        }
      });
      ctx.revert();
      document.body.classList.remove("is-loading", "menu-open");
      document.body.style.overflow = "";
    };
  }, [pathname]);

  return null;
}

/* ───────────────────────── PRELOADER (snappy, once/session) ───────────────────────── */
function initPreloader(cleanups: Array<() => void>, reduceMotion: boolean) {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  const finish = () => {
    preloader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    const t = setTimeout(() => preloader.remove(), 700);
    cleanups.push(() => clearTimeout(t));
  };

  // Already shown this session, or reduced motion → reveal immediately.
  let alreadyShown = false;
  try {
    alreadyShown = sessionStorage.getItem("fmq_preloaded") === "1";
  } catch {
    /* sessionStorage may be unavailable */
  }
  if (alreadyShown || reduceMotion) {
    preloader.remove();
    document.body.classList.remove("is-loading");
    return;
  }
  try {
    sessionStorage.setItem("fmq_preloaded", "1");
  } catch {
    /* ignore */
  }

  document.body.classList.add("is-loading");
  const fill = document.getElementById("progress-fill");
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 26 + 16, 100); // fast, smooth fill (~1s)
    if (fill) fill.style.width = progress + "%";
    if (progress >= 100) {
      clearInterval(loadingInterval);
      const t = setTimeout(finish, 260); // brief hold at 100%, then CSS fade-out
      cleanups.push(() => clearTimeout(t));
    }
  }, 80);
  cleanups.push(() => clearInterval(loadingInterval));
}

/* ───────────────────────── PAGE-ENTER TRANSITION ───────────────────────── */
// Soft container fade on every route mount (the engine re-runs per pathname).
// Container-level only, so it layers under — never fights — each page's hero
// entrance. fromTo always resolves to opacity:1, so content can't get stuck.
function initPageEnter(reduceMotion: boolean) {
  if (reduceMotion) return;
  const main = document.querySelector("main");
  if (!main) return;
  gsap.fromTo(main, { autoAlpha: 0.5, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", clearProps: "transform,opacity,visibility" });
}

/* ───────────────────────── SMOOTH IN-PAGE ANCHORS ───────────────────────── */
// In-page hash links glide instead of jumping. Desktop uses Lenis (consistent
// with wheel inertia); touch falls back to native smooth scroll.
function initSmoothAnchors(lenis: Lenis | null, cleanups: Array<() => void>) {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')).filter(
    (a) => (a.getAttribute("href") || "").length > 1
  );
  anchors.forEach((a) => {
    const onClick = (e: Event) => {
      const id = a.getAttribute("href") || "";
      let target: Element | null = null;
      try {
        target = document.querySelector(id);
      } catch {
        return; // not a valid selector (e.g. href="#")
      }
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -80, duration: 1.2, easing: EASE_EXPO });
      else (target as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
    };
    a.addEventListener("click", onClick);
    cleanups.push(() => a.removeEventListener("click", onClick));
  });
}

/* ───────────────────────── MOBILE MENU ───────────────────────── */
function initMobileMenu(cleanups: Array<() => void>) {
  const toggle = document.querySelector<HTMLElement>(".header-toggle");
  const menu = document.querySelector<HTMLElement>(".mobile-menu");
  const menuLinks = document.querySelectorAll<HTMLElement>(".m-link");
  if (!toggle || !menu) return;

  gsap.set(menuLinks, { x: -30, opacity: 0 });
  const setExpanded = (v: boolean) => toggle.setAttribute("aria-expanded", v ? "true" : "false");
  setExpanded(false);

  const openMenu = () => {
    document.body.classList.add("menu-open");
    menu.classList.add("is-active");
    document.body.style.overflow = "hidden";
    setExpanded(true);
    gsap.to(menuLinks, { x: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: "power2.out" });
    menuLinks[0]?.focus();
  };
  const closeMenu = (returnFocus = false) => {
    document.body.classList.remove("menu-open");
    menu.classList.remove("is-active");
    document.body.style.overflow = "";
    setExpanded(false);
    gsap.to(menuLinks, { x: -20, opacity: 0, duration: 0.15, ease: "power2.in" });
    if (returnFocus) toggle.focus();
  };
  const onToggle = () => {
    if (menu.classList.contains("is-active")) closeMenu(true);
    else openMenu();
  };
  toggle.addEventListener("click", onToggle);
  cleanups.push(() => toggle.removeEventListener("click", onToggle));

  // Escape closes the menu and returns focus to the toggle (keyboard a11y).
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && menu.classList.contains("is-active")) closeMenu(true);
  };
  document.addEventListener("keydown", onKey);
  cleanups.push(() => document.removeEventListener("keydown", onKey));

  // Explicit close (cancel) button inside the off-canvas panel.
  const closeBtn = menu.querySelector<HTMLElement>(".mm-close");
  if (closeBtn) {
    const onClose = () => closeMenu(true);
    closeBtn.addEventListener("click", onClose);
    cleanups.push(() => closeBtn.removeEventListener("click", onClose));
  }

  const linkEls = Array.from(menu.querySelectorAll<HTMLAnchorElement>("a"));
  const onLink = () => {
    document.body.classList.remove("menu-open");
    menu.classList.remove("is-active");
    document.body.style.overflow = "";
    setExpanded(false);
    gsap.set(menuLinks, { x: -30, opacity: 0 });
  };
  linkEls.forEach((l) => l.addEventListener("click", onLink));
  cleanups.push(() => linkEls.forEach((l) => l.removeEventListener("click", onLink)));
}

/* ───────────────────────── HERO ───────────────────────── */
function initHeroAnimations(reduceMotion: boolean) {
  if (!document.getElementById("fmq-home-vision")) return;
  if (reduceMotion) {
    gsap.set([".vh-badge", ".vh-body", ".vh-actions", ".vh-trust", ".sphere-scene", ".visual-cap", ".vh-scroll"], { opacity: 1, y: 0 });
    gsap.set(".vh-line", { height: "100%" });
    return;
  }
  document.fonts.ready.then(() => {
    gsap.set(".vh-badge", { y: 20, opacity: 0 });
    gsap.set(".vh-body", { y: 20, opacity: 0 });
    gsap.set(".vh-actions", { y: 20, opacity: 0 });
    gsap.set(".vh-trust", { y: 20, opacity: 0 });
    gsap.set(".sphere-scene", { scale: 0.8, opacity: 0 });
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(".vh-badge", { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" });
    tl.to(".vh-body", { y: 0, opacity: 1, duration: 0.8 }, "-=0.6")
      .to(".vh-line", { height: "100%", duration: 0.8 }, "-=0.8")
      .to(".vh-actions", { y: 0, opacity: 1, duration: 0.8 }, "-=0.6")
      .to(".vh-trust", { y: 0, opacity: 1, duration: 0.8 }, "-=0.6")
      .to(".sphere-scene", { opacity: 1, scale: window.innerWidth > 768 ? 0.85 : 0.6, duration: 1.5, ease: "back.out(0.8)" }, "-=1.0")
      .to(".visual-cap", { opacity: 1, duration: 0.5 }, "-=0.5")
      .to(".vh-scroll", { opacity: 1, duration: 0.5 }, "-=0.5");
  });
}

// Scroll-linked depth on the hero — sphere + content drift as the hero leaves,
// auroras counter-drift (auroras are hidden on mobile, so there it's just the
// sphere + content). Runs on ALL devices (cheap transforms on native scroll).
function initHeroParallax(reduceMotion: boolean) {
  if (reduceMotion) return;
  const hero = document.getElementById("fmq-home-vision");
  if (!hero) return;
  const st = () => ({ trigger: hero, start: "top top", end: "bottom top", scrub: true as const });
  gsap.to(".sphere-scene", { yPercent: -16, ease: "none", scrollTrigger: st() });
  gsap.to(".visual-cap", { yPercent: -28, ease: "none", scrollTrigger: st() });
  gsap.to(".vh-content", { yPercent: 12, autoAlpha: 0.55, ease: "none", scrollTrigger: st() });
  gsap.to(".vh-aurora-1", { yPercent: 26, ease: "none", scrollTrigger: st() });
  gsap.to(".vh-aurora-2", { yPercent: -22, ease: "none", scrollTrigger: st() });
}

// Mobile "Core Offerings" stack — the desktop pin doesn't run on touch, so give
// the stacked cards their own scroll entrance (rise + settle). Self-gates on
// visibility so it's a no-op when the section is display:none (desktop).
function initMobileStack(reduceMotion: boolean) {
  const section = document.querySelector<HTMLElement>(".fm-mobile-stack-section");
  if (!section || section.offsetParent === null) return; // hidden (desktop) → skip
  if (reduceMotion) return;

  gsap.from(".fm-mobile-intro > *", {
    y: 30, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power2.out",
    scrollTrigger: { trigger: ".fm-mobile-intro", start: "top 88%", once: true },
  });
  gsap.utils.toArray<HTMLElement>(".fm-stack-card").forEach((card) => {
    gsap.from(card, {
      y: 48, opacity: 0, scale: 0.96, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 90%", once: true },
    });
  });
}

function initHeroInteractions() {
  const root = document.getElementById("fmq-home-vision");
  const scene = document.getElementById("sphere-scene");
  if (!root || !scene) return;
  let raf = 0;
  const onMove = (e: MouseEvent) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      gsap.to(scene, { rotationY: x * 15, rotationX: -y * 15, duration: 1, ease: "power2.out" });
      if (window.innerWidth > 991) {
        gsap.to(".vh-aurora-1", { x: x * 40, y: y * 40, duration: 2 });
        gsap.to(".vh-aurora-2", { x: -x * 40, y: -y * 40, duration: 2 });
      }
    });
  };
  root.addEventListener("mousemove", onMove);
}

function initTrustMarquee() {
  const trustSection = document.querySelector<HTMLElement>(".vh-trust");
  const wrapper = trustSection?.querySelector<HTMLElement>(".trust-ticker-wrapper");
  const track = trustSection?.querySelector<HTMLElement>(".trust-ticker-track");
  if (!trustSection || !wrapper || !track) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.fonts.ready.then(() => {
    setTimeout(() => {
      const duration = track.scrollWidth / 2 / 40;
      wrapper.style.setProperty("--marquee-duration", `${duration}s`);
      trustSection.addEventListener("mouseenter", () => wrapper.classList.add("is-paused"));
      trustSection.addEventListener("mouseleave", () => wrapper.classList.remove("is-paused"));
    }, 100);
  });
}

/* ───────────────────────── MISSION ───────────────────────── */
function initMission(reduceMotion: boolean) {
  const statement = document.querySelector<HTMLElement>(".mp-statement");
  if (statement) {
    document.fonts.ready.then(() => {
      if (reduceMotion) {
        gsap.set(statement, { opacity: 1 });
        statement.querySelectorAll<HTMLElement>(".txt-accent").forEach((a) => (a.style.color = "#42CA80"));
        return;
      }
      // Per-word scroll-scrub reveal on ALL devices. scrub:1 = smooth catch-up;
      // words go grey→white as you scroll, the accent phrase resolves to green.
      const split = new SplitType(statement, { types: "lines,words" });
      const allWords = (split.words || []) as HTMLElement[];
      const normalWords = allWords.filter((w) => !w.closest(".txt-accent"));
      const accentWords = allWords.filter((w) => w.closest(".txt-accent"));
      gsap.set(normalWords, { opacity: 0.18, color: "#555" });
      gsap.set(accentWords, { opacity: 0.4, color: "#555" });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: statement, start: "top 78%", end: "bottom 55%", scrub: 1 },
      });
      tl.to(normalWords, { opacity: 1, color: "#ffffff", stagger: 0.4, ease: "none" }, 0);
      tl.to(accentWords, { opacity: 1, color: "#42CA80", stagger: 0.4, ease: "none" }, 0.3);
    });
  }

  // Certificate / partner cards — premium 3D "deal-in" reveal.
  const logoChips = gsap.utils.toArray<HTMLElement>(".logo-chip");
  if (logoChips.length && !reduceMotion) {
    gsap.set(logoChips, { opacity: 0, y: 70, scale: 0.9, rotateX: -55, transformOrigin: "50% 100%", transformPerspective: 900 });
    gsap.to(logoChips, {
      opacity: 1, y: 0, scale: 1, rotateX: 0,
      duration: 0.9, stagger: { each: 0.08, from: "start" }, ease: "back.out(1.5)",
      scrollTrigger: { trigger: ".mp-logos-grid", start: "top 82%", once: true },
    });
  }
}

/* ───────────────────────── ABOUT STATS ───────────────────────── */
function initAbout() {
  if (!document.querySelector(".about-section")) return;
  document.querySelectorAll<HTMLElement>(".stat-num").forEach((stat) => {
    const target = +(stat.getAttribute("data-target") || "0");
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration: 2, ease: "power2.out",
      scrollTrigger: { trigger: ".stats-minimal", start: "top 85%", once: true },
      onUpdate: () => {
        stat.innerText = String(Math.floor(obj.val));
      },
    });
  });
}

/* ───────────────────────── CAPABILITIES (desktop horizontal pin) ───────────────────────── */
function initCapabilities() {
  const track = document.querySelector<HTMLElement>(".sp-horiz-track");
  const section = document.querySelector<HTMLElement>(".sp-horiz-section");
  if (!track || !section) return;
  const getScrollAmount = () => track.scrollWidth - window.innerWidth;
  gsap.to(track, {
    x: () => -getScrollAmount(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: 1,
      start: "top top",
      end: () => "+=" + getScrollAmount(),
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
}

/* ───────────────────────── RESULTS ENGINE ───────────────────────── */
function initResultsEngine(cleanups: Array<() => void>) {
  const section = document.querySelector<HTMLElement>(".res-sticky-viewport");
  const track = document.querySelector<HTMLElement>(".res-track");
  const cards = document.querySelectorAll<HTMLElement>(".res-card");
  const bar = document.querySelector<HTMLElement>(".res-bar");
  if (!section || !track) return;

  initResultsLightbox(cleanups);

  // Sticky + auto horizontal scroll on ALL devices: the section pins and the
  // cards translate left as you scroll (the CSS perf block makes the mobile
  // layout pinnable instead of a native side-scroll). scrub:1 = smooth.
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  gsap.to(track, {
    x: () => -dist(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: 1,
      start: "center center",
      end: () => "+=" + dist(),
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (bar) bar.style.transform = `scaleX(${self.progress})`;
      },
    },
  });
  // subtle parallax drift on the screenshots
  cards.forEach((card) => {
    const img = card.querySelector("img");
    if (img) {
      gsap.to(img, {
        xPercent: 8, ease: "none",
        scrollTrigger: { trigger: section, start: "center center", end: () => "+=" + dist(), scrub: 1 },
      });
    }
  });
}

function initResultsLightbox(cleanups: Array<() => void>) {
  const lightbox = document.getElementById("resLightbox");
  const lightboxImage = lightbox?.querySelector<HTMLImageElement>(".res-lightbox-image");
  const lightboxTitle = lightbox?.querySelector<HTMLElement>(".res-lightbox-title");
  const lightboxClose = lightbox?.querySelector<HTMLElement>(".res-lightbox-close");
  const cards = document.querySelectorAll<HTMLElement>(".res-card[data-image]");
  if (!lightbox || !lightboxImage || !lightboxTitle) return;

  const openHandlers: Array<[HTMLElement, (e: Event) => void]> = [];
  cards.forEach((card) => {
    const handler = (e: Event) => {
      e.preventDefault();
      const imageSrc = card.getAttribute("data-image");
      const imageTitle = card.getAttribute("data-title");
      if (imageSrc) {
        lightboxImage.src = imageSrc;
        lightboxImage.alt = imageTitle || "Result Image";
        lightboxTitle.textContent = imageTitle || "";
        lightbox.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    };
    card.addEventListener("click", handler);
    openHandlers.push([card, handler]);
  });

  const closeLightbox = () => {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
  };
  lightboxClose?.addEventListener("click", closeLightbox);
  const overlay = lightbox.querySelector(".res-lightbox-overlay");
  overlay?.addEventListener("click", closeLightbox);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) closeLightbox();
  };
  document.addEventListener("keydown", onKey);

  cleanups.push(() => {
    openHandlers.forEach(([el, h]) => el.removeEventListener("click", h));
    lightboxClose?.removeEventListener("click", closeLightbox);
    overlay?.removeEventListener("click", closeLightbox);
    document.removeEventListener("keydown", onKey);
  });
}

/* ───────────────────────── FEATURED PROJECTS ───────────────────────── */
function initFeaturedProjects(cleanups: Array<() => void>, reduceMotion: boolean) {
  const root = document.getElementById("featured-projects");
  if (!root) return;

  const head = root.querySelector(".fp-head");
  if (head) {
    gsap.from(head.children, {
      y: 40, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: root, start: "top 80%" },
    });
  }

  document.querySelectorAll<HTMLElement>(".fp-card").forEach((card) => {
    const meta = card.querySelector(".fp-meta");
    const name = card.querySelector(".fp-name");
    const tag = card.querySelector(".fp-tag");
    const media = card.querySelector(".fp-media");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: card, start: "top 82%" },
      defaults: { ease: "power3.out" },
    });
    tl.from(card, { y: 60, opacity: 0, duration: 0.8 })
      .from([meta, name, tag], { y: 20, opacity: 0, stagger: 0.06, duration: 0.5 }, "-=0.4")
      .from(media, { y: 16, opacity: 0, duration: 0.6 }, "-=0.35")
      .add(() => card.classList.add("fp-in"), 0.1);
  });

  // Videos: load + play only while in view, pause otherwise (saves decode/CPU).
  const vids = Array.from(root.querySelectorAll<HTMLVideoElement>("video.fp-video"));
  vids.forEach((v) => {
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
  });
  // Reduced-motion: leave videos on their poster frame (no autoplaying loop).
  if (reduceMotion) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          const p = v.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { threshold: 0.2 }
  );
  vids.forEach((v) => io.observe(v));
  cleanups.push(() => io.disconnect());
}

/* ───────────────────────── TEXT REVEALS ───────────────────────── */
function setupTextReveals() {
  document.fonts.ready.then(() => {
    document.querySelectorAll<HTMLElement>('[data-reveal="lines"]').forEach((target) => {
      const split = new SplitType(target, { types: "lines,words" });
      if (split.lines) {
        gsap.from(split.lines, {
          y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: "power3.out",
          scrollTrigger: { trigger: target, start: "top 85%", once: true },
        });
      }
    });
    document.querySelectorAll<HTMLElement>(".reveal-fade").forEach((target) => {
      gsap.from(target, {
        y: 30, opacity: 0, duration: 0.9, ease: "power2.out",
        scrollTrigger: { trigger: target, start: "top 90%", once: true },
      });
    });
  });
}

/* ───────────────────────── FOOTER ───────────────────────── */
function initFooterAnimations() {
  const footer = document.querySelector(".fm-footer");
  if (!footer) return;
  const items = footer.querySelectorAll(".fm-footer-lead > *, .fm-footer-col");
  if (items.length) {
    gsap.from(items, {
      y: 26, opacity: 0, duration: 0.7, stagger: 0.06, ease: "power2.out",
      scrollTrigger: { trigger: footer, start: "top 85%", once: true },
    });
  }
  const wordmark = footer.querySelector(".fm-footer-wordmark");
  if (wordmark) {
    gsap.from(wordmark, {
      y: 50, opacity: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: footer, start: "top 65%", once: true },
    });
  }
  const socials = footer.querySelectorAll(".fm-footer-social");
  if (socials.length) {
    gsap.from(socials, {
      scale: 0, opacity: 0, duration: 0.5, stagger: 0.08, ease: "back.out(2)",
      scrollTrigger: { trigger: ".fm-footer-bottom", start: "top 96%", once: true },
    });
  }
}

/* ───────────────────────── SCROLL INDICATOR ───────────────────────── */
function initScrollIndicator(lenis: Lenis | null, cleanups: Array<() => void>) {
  const indicator = document.getElementById("scrollIndicator");
  const btn = indicator?.querySelector<HTMLElement>(".scroll-indicator-btn");
  const circle = indicator?.querySelector<HTMLElement>(".scroll-indicator-circle");
  const progress = indicator?.querySelector<SVGCircleElement>(".scroll-indicator-progress");
  const percentText = indicator?.querySelector<HTMLElement>(".scroll-indicator-percent");
  if (!indicator || !btn || !circle || !progress || !percentText) return;

  const circumference = 2 * Math.PI * 45;
  const update = () => {
    const scrollHeight =
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, document.documentElement.clientHeight) -
      window.innerHeight;
    const scrollTop = (lenis && (lenis as unknown as { scroll: number }).scroll) || window.scrollY || 0;
    const v = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0;
    percentText.textContent = String(Math.round(v * 100));
    progress.style.strokeDashoffset = String(circumference - v * circumference);
    gsap.to(circle, { rotation: v * 360, duration: 0.3, ease: "power1.out" });
    indicator.classList.toggle("is-visible", scrollTop > 100 && !document.body.classList.contains("menu-open"));
  };

  if (lenis) {
    lenis.on("scroll", update);
  } else {
    window.addEventListener("scroll", update, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", update));
  }
  update();

  const onBtn = (e: Event) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.2, easing: EASE_EXPO });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };
  btn.addEventListener("click", onBtn);

  const menu = document.querySelector(".mobile-menu");
  let observer: MutationObserver | null = null;
  if (menu) {
    observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
  cleanups.push(() => {
    btn.removeEventListener("click", onBtn);
    observer?.disconnect();
  });
}

/* ───────────────────────── CREATIVE JOURNAL (auto-loop, paused offscreen) ───────────────────────── */
function initCreativeJournal(reduceMotion: boolean) {
  const section = document.querySelector(".cj-section");
  const images = document.querySelectorAll<HTMLElement>(".cj-image-wrap");
  if (!section || !images.length) return;

  gsap.from(".cj-header", { y: 30, opacity: 0, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: section, start: "top 80%", once: true } });

  if (reduceMotion) {
    // Show all images statically.
    images.forEach((img, i) => gsap.set(img, { opacity: i === 0 ? 1 : 0 }));
    return;
  }

  const duration = 1.0;
  const directions = [
    { x: 0, y: -100 },
    { x: 0, y: 100 },
    { x: -100, y: 0 },
    { x: 100, y: 0 },
    { x: 0, y: -100 },
  ];
  images.forEach((img, i) => {
    const dir = directions[i % directions.length];
    gsap.set(img, { x: dir.x + "%", y: dir.y + "%", opacity: 0, scale: 1, zIndex: i });
  });

  const masterTl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: "power2.out" } });
  images.forEach((img, i) => {
    const startTime = i * duration;
    const dir = directions[i % directions.length];
    masterTl
      .to(img, { x: "0%", y: "0%", opacity: 1, duration: duration * 0.5, ease: "power2.out" }, startTime)
      .to(img, { x: "0%", y: "0%", opacity: 1, duration: duration * 0.2, ease: "none" }, startTime + duration * 0.5)
      .to(img, { x: -dir.x + "%", y: -dir.y + "%", opacity: 0, duration: duration * 0.3, ease: "power2.in" }, startTime + duration * 0.7);
  });

  // Only run the loop while the section is on screen.
  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => (self.isActive ? masterTl.play() : masterTl.pause()),
  });
}

/* ───────────────────────── ABOUT PAGE ───────────────────────── */
// Ported from initNewAboutPage in the original script.js (gated by .abt-hero),
// with a prefers-reduced-motion path that just resolves the metric counters.
function initAboutPage(reduceMotion: boolean) {
  if (!document.querySelector(".abt-hero")) return;

  // Metric count-up — always set final values so the numbers are correct even
  // when reduced-motion skips the animation.
  const metricCards = gsap.utils.toArray<HTMLElement>(".abt-metric-card");

  if (reduceMotion) {
    metricCards.forEach((card) => {
      const numEl = card.querySelector<HTMLElement>(".metric-num");
      if (numEl) numEl.innerText = String(+(numEl.dataset.count || "0"));
    });
    return;
  }

  // Hero entrance
  const heroTl = gsap.timeline({ delay: 0.3 });
  heroTl
    .from(".abt-hero-tag", { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" })
    .from(".abt-hero-title", { y: 50, opacity: 0, duration: 1, ease: "power2.out" }, "-=0.5")
    .from(".abt-hero-sub", { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
    .from(".abt-scroll-indicator", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.4");

  // Story
  gsap.from(".abt-story-img-wrap", {
    scale: 1.1, opacity: 0, duration: 1.2, ease: "power2.out",
    scrollTrigger: { trigger: ".abt-story", start: "top 70%" },
  });
  gsap.from(".abt-story-badge", {
    scale: 0, opacity: 0, duration: 0.8, ease: "back.out(1.7)",
    scrollTrigger: { trigger: ".abt-story", start: "top 60%" },
  });
  gsap.from(".abt-story-content > *", {
    y: 40, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power2.out",
    scrollTrigger: { trigger: ".abt-story-content", start: "top 70%" },
  });

  // Philosophy
  gsap.from(".abt-philosophy-header", {
    y: 40, opacity: 0, duration: 0.8, ease: "power2.out",
    scrollTrigger: { trigger: ".abt-philosophy", start: "top 70%" },
  });
  const pillars = gsap.utils.toArray<HTMLElement>(".abt-pillar");
  if (pillars.length) {
    gsap.fromTo(
      pillars,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: ".abt-pillars", start: "top 90%", toggleActions: "play none none none" },
      }
    );
  }

  // Metrics — entrance + count-up on enter
  metricCards.forEach((card) => {
    const numEl = card.querySelector<HTMLElement>(".metric-num");
    const targetNum = +(numEl?.dataset.count || "0");
    gsap.from(card, {
      y: 40, opacity: 0, duration: 0.6, ease: "power2.out",
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        onEnter: () => {
          if (!numEl) return;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: targetNum, duration: 2, ease: "power2.out",
            onUpdate: () => {
              numEl.innerText = String(Math.round(obj.val));
            },
          });
        },
      },
    });
  });

  // Approach
  gsap.from(".abt-approach-left > *", {
    y: 40, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power2.out",
    scrollTrigger: { trigger: ".abt-approach", start: "top 70%" },
  });
  gsap.from(".abt-process-step", {
    x: 60, opacity: 0, stagger: 0.12, duration: 0.7, ease: "power2.out",
    scrollTrigger: { trigger: ".abt-approach-right", start: "top 70%" },
  });

  // CTA
  gsap.from(".abt-cta-content > *", {
    y: 40, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power2.out",
    scrollTrigger: { trigger: ".abt-cta", start: "top 70%" },
  });
}

/* ───────────────────────── SERVICES PAGE ───────────────────────── */
// Ported from initCinematicServices + initServicesAnimations (gated by .sp-hero).
// The .sp-title[data-reveal="lines"] reveal is owned by setupTextReveals (shared),
// so we don't re-split it here. Full reduced-motion path flattens the pinned
// cinematic showcase into a static stack and keeps the accordion functional.
function initServicesPage(reduceMotion: boolean, cleanups: Array<() => void>) {
  // ── Cinematic showcase ──────────────────────────────────────────────
  const section = document.querySelector<HTMLElement>(".c-svc-section");
  const slides = gsap.utils.toArray<HTMLElement>(".c-svc-slide");
  const counter = document.querySelector<HTMLElement>(".c-svc-counter");

  if (section && slides.length) {
    if (reduceMotion) {
      // Flatten the 400vh pinned section into a visible stack.
      gsap.set(section, { height: "auto" });
      gsap.set(".c-svc-pin-wrapper", { position: "static", height: "auto" });
      gsap.set(slides, { position: "relative", clipPath: "inset(0% 0 0 0)", height: "100vh" });
    } else {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          pin: ".c-svc-pin-wrapper",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
      slides.forEach((slide, i) => {
        if (i === 0) return; // base slide stays put
        const img = slide.querySelector(".c-svc-img");
        gsap.set(slide, { clipPath: "inset(100% 0 0 0)" });
        tl.to(slide, {
          clipPath: "inset(0% 0 0 0)",
          duration: 1,
          ease: "none",
          onStart: () => {
            if (counter) counter.innerText = `0${i + 1}`;
          },
          onReverseComplete: () => {
            if (counter) counter.innerText = `0${i}`;
          },
        });
        if (img) tl.fromTo(img, { scale: 1.1, yPercent: 10 }, { scale: 1, yPercent: 0, duration: 1, ease: "none" }, "<");
      });
    }
  }

  // ── Hero label + desc fade (the title is handled by setupTextReveals) ──
  if (!reduceMotion) {
    gsap.from('.sp-label[data-reveal="fade"], .sp-desc[data-reveal="fade"]', {
      y: 24, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power2.out", delay: 0.2,
    });

    // Process steps
    const steps = gsap.utils.toArray<HTMLElement>('.sp-step[data-reveal="fade"]');
    if (steps.length) {
      gsap.from(steps, {
        y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out",
        scrollTrigger: { trigger: ".sp-process-grid", start: "top 80%" },
      });
    }

    // Pricing cards
    const prices = gsap.utils.toArray<HTMLElement>('.sp-pricing-card[data-reveal="fade"]');
    if (prices.length) {
      gsap.from(prices, {
        y: 60, opacity: 0, scale: 0.95, duration: 1, stagger: 0.2, ease: "power3.out",
        scrollTrigger: { trigger: ".sp-pricing-grid", start: "top 75%" },
      });
    }
  }

  // ── Accordion (interactive — wired in both motion modes) ──────────────
  const accItems = Array.from(document.querySelectorAll<HTMLElement>(".sp-acc-item"));
  const dur = reduceMotion ? 0 : 0.3;
  accItems.forEach((item) => {
    const btn = item.querySelector<HTMLElement>(".sp-acc-btn");
    const panel = item.querySelector<HTMLElement>(".sp-acc-panel");
    if (!btn || !panel) return;
    const onClick = () => {
      const isActive = item.classList.contains("active");
      accItems.forEach((i) => {
        i.classList.remove("active");
        const p = i.querySelector<HTMLElement>(".sp-acc-panel");
        if (p) gsap.to(p, { height: 0, duration: dur });
      });
      if (!isActive) {
        item.classList.add("active");
        gsap.set(panel, { height: "auto" });
        const h = panel.offsetHeight;
        gsap.fromTo(panel, { height: 0 }, { height: h, duration: dur });
      }
    };
    btn.addEventListener("click", onClick);
    cleanups.push(() => btn.removeEventListener("click", onClick));
  });
}

/* ───────────────────────── WORK PAGE ───────────────────────── */
// Composed portfolio page (work.html was empty). Hero entrance + a count-style
// pop on the stat band; the project grid is animated by initFeaturedProjects.
function initWorkPage(reduceMotion: boolean) {
  // Count-up numerals — always resolve to the final value (immediately under
  // reduced-motion, animated on scroll otherwise).
  const counts = gsap.utils.toArray<HTMLElement>(".wk-count");
  const setFinal = (el: HTMLElement) => {
    const to = parseFloat(el.dataset.to || "0");
    const dec = parseInt(el.dataset.decimals || "0", 10);
    el.textContent = to.toFixed(dec);
  };

  if (reduceMotion) {
    counts.forEach(setFinal);
    return;
  }

  const tl = gsap.timeline({ delay: 0.2 });
  tl.from(".wk-tag", { y: 24, opacity: 0, duration: 0.7, ease: "power2.out" })
    .from(".wk-title", { y: 44, opacity: 0, duration: 0.9, ease: "power3.out" }, "-=0.4")
    .from(".wk-sub", { y: 24, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.5");

  const stats = gsap.utils.toArray<HTMLElement>(".wk-stat");
  if (stats.length) {
    gsap.from(stats, {
      y: 30, opacity: 0, scale: 0.92, duration: 0.6, stagger: 0.1, ease: "back.out(1.5)",
      scrollTrigger: { trigger: ".wk-hero-stats", start: "top 92%", once: true },
    });
  }

  counts.forEach((el) => {
    const to = parseFloat(el.dataset.to || "0");
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: to, duration: 1.8, ease: "power2.out",
      scrollTrigger: { trigger: ".wk-hero-stats", start: "top 92%", once: true },
      onUpdate: () => {
        el.textContent = obj.v.toFixed(dec);
      },
    });
  });
}

/* ───────────────────────── CONTACT PAGE ───────────────────────── */
// Ported from initContactPage (gated by .ct-hero). The form SUBMIT is owned by
// the React component (site-contact-page-form → FMOS inbound), so it's NOT wired
// here — we only do entrance reveals + the input focus/blur micro-interaction.
function initContactPage(reduceMotion: boolean, cleanups: Array<() => void>) {
  if (!reduceMotion) {
    const heroTl = gsap.timeline({ delay: 0.3 });
    heroTl
      .from(".ct-tag", { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" })
      .from(".ct-title", { y: 60, opacity: 0, duration: 1, ease: "power2.out" }, "-=0.5")
      .from(".ct-subtitle", { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
      .from(".ct-hud-left", { x: -30, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.8")
      .from(".ct-hud-right", { x: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.6");

    const infoCards = gsap.utils.toArray<HTMLElement>(".ct-info-card");
    if (infoCards.length) {
      gsap.fromTo(infoCards, { x: -40, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: "power2.out", delay: 0.5 });
    }
    const ctResponse = document.querySelector(".ct-response");
    if (ctResponse) {
      gsap.fromTo(ctResponse, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.8 });
    }
    const socialLinks = gsap.utils.toArray<HTMLElement>(".ct-social-link");
    if (socialLinks.length) {
      gsap.fromTo(socialLinks, { x: -30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power2.out", delay: 1 });
    }

    gsap.from(".ct-form-wrapper", {
      y: 60, opacity: 0, duration: 1, ease: "power2.out",
      scrollTrigger: { trigger: ".ct-form-col", start: "top 70%" },
    });
    gsap.from(".ct-faq-header", {
      y: 40, opacity: 0, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: ".ct-faq", start: "top 75%" },
    });
    const faqItems = gsap.utils.toArray<HTMLElement>(".ct-faq-item");
    if (faqItems.length) {
      gsap.fromTo(
        faqItems,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: ".ct-faq-grid", start: "top 95%", toggleActions: "play none none none" },
        }
      );
    }
  }

  // Input focus micro-interaction (kept on all devices — it's a UI affordance).
  const inputs = Array.from(
    document.querySelectorAll<HTMLElement>(".ct-input-group input, .ct-input-group textarea, .ct-input-group select")
  );
  inputs.forEach((input) => {
    const onFocus = () => gsap.to(input.parentElement, { scale: 1.02, duration: 0.3, ease: "power2.out" });
    const onBlur = () => gsap.to(input.parentElement, { scale: 1, duration: 0.3, ease: "power2.out" });
    input.addEventListener("focus", onFocus);
    input.addEventListener("blur", onBlur);
    cleanups.push(() => {
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("blur", onBlur);
    });
  });
}

/* ───────────────────────── IMAGE PARALLAX (shared) ───────────────────────── */
// Subtle scroll-linked drift for any [data-parallax] element. We move the inner
// <img> (kept oversized via scale) inside its overflow-hidden wrapper, so the
// frame never reveals a gap. Cheap single-transform — fine on touch; skipped
// entirely for reduced-motion.
function initParallax(reduceMotion: boolean) {
  if (reduceMotion) return;
  gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((wrap) => {
    const strength = parseFloat(wrap.getAttribute("data-parallax") || "0.12");
    const target = wrap.querySelector<HTMLElement>("img") || wrap;
    const range = strength * 60; // yPercent travel each way
    gsap.set(target, { scale: 1.15, willChange: "transform" });
    gsap.fromTo(
      target,
      { yPercent: -range },
      {
        yPercent: range,
        ease: "none",
        scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

/* ───────────────────────── CARD SPOTLIGHT (desktop) ───────────────────────── */
// A soft brand-green glow that follows the cursor across the site's card
// surfaces. Desktop only (called behind isDesktop, which already excludes
// reduced-motion). A real overlay child is injected per card (no pseudo-element
// clashes) and removed on teardown.
const SPOTLIGHT_SELECTOR =
  ".sp-pricing-card, .ct-faq-item, .ct-info-card, .abt-pillar, .abt-metric-card, .sp-step, .fp-card";

function initCardSpotlight(cleanups: Array<() => void>) {
  const cards = gsap.utils.toArray<HTMLElement>(SPOTLIGHT_SELECTOR);
  cards.forEach((card) => {
    if (getComputedStyle(card).position === "static") card.style.position = "relative";
    const glow = document.createElement("span");
    glow.className = "card-spotlight";
    card.appendChild(glow);

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    const onEnter = () => (glow.style.opacity = "1");
    const onLeave = () => (glow.style.opacity = "0");
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);
    cleanups.push(() => {
      if (raf) cancelAnimationFrame(raf);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
      glow.remove();
    });
  });
}

/* ───────────────────────── MAGNETIC CTAs (desktop) ───────────────────────── */
// Hover-reactive pull toward the cursor for any [data-magnetic] element. Desktop
// only (called behind isDesktop). Uses quickTo for a smooth spring with no GC.
function initMagneticCTAs(cleanups: Array<() => void>) {
  // Explicit opt-ins plus the site's primary CTAs — applied everywhere without
  // touching each page's markup. querySelectorAll de-dupes overlapping matches.
  const els = gsap.utils.toArray<HTMLElement>(
    "[data-magnetic], .header-cta, .fm-footer-cta-btn, .vh-btn-main, .fp-cta, .mm-cta-btn"
  );
  els.forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const strength = 0.4;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    cleanups.push(() => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      gsap.set(el, { x: 0, y: 0 });
    });
  });
}
