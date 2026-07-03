# Niche Landing Page — Image Generation Brief

Generate these in **Gemini (Nano Banana / 2.5 Flash Image)**. The goal: one cohesive,
premium, *designed* image system that makes a visitor think "damn, who built this?" —
matching the feel of our marketing site and our two references
(breedlove.xyz = dark cinematic editorial; creativemarketing.peachweb.io = gradient-mesh +
glossy 3D product renders).

> **Honesty rule (00_MASTER §2.2):** NO fabricated client results, fake dashboards with
> "real" numbers, fake testimonials, or screenshots implying outcomes we haven't delivered.
> All imagery here is **abstract / sculptural / atmospheric** — it sells craft, not claims.
> The data dashboards in the page are rendered in code from our *real* market research.

---

## HOW TO USE THIS FILE

1. For each image: copy the **Prompt** block into Gemini. The prompt already includes the
   shared **STYLE BLOCK** so every image comes out cohesive — don't drop those lines.
2. Set the **aspect ratio** noted for that image.
3. Export the **highest quality** available (PNG preferred; I'll optimise to WebP at build).
4. Save into: `public/site/lp/img/` using the **exact filename** given. That's all I need —
   I wire them into the pages from there.
5. **Do these FIRST for sign-off (don't batch all 14 yet):**
   `dental-clinics.png` + `intelligence-orb.png` + `aurora-plate.png`.
   Once you approve the look on the dental page, generate the other 13 objects.

Filenames map 1:1 to niche slugs in `lib/lp/niches.ts`, so the page auto-finds them.

---

## GLOBAL ART DIRECTION (the look every image shares)

- **Palette:** near-black background `#070707`–`#0A0C0B`. The ONLY chromatic light is
  FortuneMarq green — core `#42CA80`, bright highlight `#7CF0AE`, deep shadow-green `#0E2A1C`.
  Plus clean white specular highlights. **No other hues** (no blue, purple, orange, neon).
- **Mood:** cinematic, calm, expensive. "Apple keynote product shot meets fintech." Confident
  and minimal — never busy, never gamer-neon, never cheesy stock.
- **Lighting:** single dramatic key light in green from one side, soft green rim light, deep
  falloff into black, gentle volumetric haze, subtle bloom/glow around the bright edges.
  Studio product-render lighting.
- **Materials:** polished glass, dark brushed metal / chrome, matte ceramic, liquid mercury,
  subsurface-scattering translucency. Glossy with crisp, believable reflections.
- **Composition:** ONE hero subject, centered, **floating** in space, surrounded by generous
  dark negative space, shallow depth of field. Must read when cropped to square or 9:16
  (mobile) — keep the subject centered and away from edges.
- **Background:** seamless dark gradient that melts into `#070707` (so it composites
  invisibly onto the page) with a soft radial green glow behind the subject. No floor line,
  no horizon, no visible studio.
- **Render quality:** photoreal 3D render, octane/redshift style, ultra-detailed, 8k, sharp
  focus on subject, soft grain.
- **ALWAYS AVOID:** any text/letters/numbers, logos, watermarks, UI/screens with data,
  identifiable human faces, multiple colors, cluttered backgrounds, drop-shadow on a white
  card, flat vector/illustration look, busy reflections.

### STYLE BLOCK (already pasted into every prompt below — keep it)
> *Premium photorealistic 3D product render, single subject floating in deep near-black space
> (#070707), dramatic volumetric lighting in emerald green (#42CA80) with bright green rim
> highlights (#7CF0AE) and clean white speculars, soft green radial glow behind the subject,
> shallow depth of field, subtle haze and gentle bloom, polished glass and dark chrome
> materials, cinematic, minimal, expensive, octane render, 8k, ultra detailed, soft film
> grain. No text, no logos, no UI, no human faces, no other colors. Centered composition with
> generous dark negative space, subject kept away from edges so it crops cleanly to square and
> vertical.*

---

## SHARED IMAGES (generate once — reused on every niche page)

### `intelligence-orb.png`  ·  aspect **1:1**  ·  used in §04 (how we work / differentiation)
> A perfect floating sphere made of dark smoked glass with a living core of emerald-green
> energy inside — fine glowing filaments and a soft neural mesh suspended within, light
> pulsing outward through the glass. Polished, liquid, alive. *[STYLE BLOCK]*

### `aurora-plate.png`  ·  aspect **9:16**  ·  OPTIONAL hero atmosphere (else CSS handles it)
> An abstract atmospheric gradient field: deep black fading into soft clouds of emerald-green
> light and faint mist, like a slow aurora deep in space, very dark overall with one gentle
> green glow drifting off-center. No subject, no objects — pure premium background texture.
> *[STYLE BLOCK]*

### `device-phone.png`  ·  aspect **4:5**  ·  OPTIONAL frame for the preview section
> A single modern smartphone floating at a slight angle, matte black body, **blank dark
> switched-off screen** (no UI, no icons, no text), thin green rim light tracing one edge,
> soft reflection. Empty screen — it will be composited over later. *[STYLE BLOCK]*

---

## PER-NICHE HERO OBJECTS (14)  ·  aspect **4:5** (portrait, mobile-first)  ·  one per page

> Each is the focal hero image for that niche's landing page. Subject = a single sculptural
> object that instantly signals the trade, rendered in the shared premium style. Keep it
> abstract-luxe, not literal stock.

### `dental-clinics.png`
> A single flawless human molar tooth sculpted in glossy pearl-white ceramic, pristine and
> oversized like a museum object, floating and slowly rotating, faint translucent glass core,
> emerald-green volumetric light raking across its glossy enamel surface. *[STYLE BLOCK]*

### `gyms.png`
> A single competition kettlebell in dark brushed gunmetal with a polished chrome handle,
> floating, a thin sheen of sweat-like gloss, sharp emerald-green rim light along its curve.
> Powerful, heavy, premium. *[STYLE BLOCK]*

### `skin-clinics.png`
> A large luminous water droplet / serum bead of perfectly smooth translucent gel, glowing
> from within with soft emerald subsurface light, dewy and radiant, floating, tiny refractions
> inside. Clean, clinical, luxurious — evokes flawless skin. *[STYLE BLOCK]*

### `jee-neet-coaching.png`
> A clear triangular glass prism floating in the dark, a single beam of emerald-green light
> entering and refracting into a crisp focused ray, sharp caustics. Evokes focus, brilliance,
> clarity of thought. *[STYLE BLOCK]*

### `car-rentals.png`
> A single sleek modern car key fob in matte black with chrome edges, floating, OR a polished
> low-profile sports-car wheel rim — your pick — dark chrome, emerald-green rim light tracing
> the contours, glossy reflections. Sleek, fast, premium. *[STYLE BLOCK]*

### `computer-training.png`
> A single oversized mechanical keyboard keycap in dark matte material floating in space, its
> top face glowing with soft emerald light from beneath, crisp chamfered edges, one clean
> green light streak. Abstract, techy, premium — no letters on the key. *[STYLE BLOCK]*

### `real-estate.png`
> A minimalist architectural model of a modern villa carved from frosted crystal glass,
> floating, clean geometric planes, emerald-green light glowing softly from inside the
> structure and along its edges. Aspirational, architectural, luxe. *[STYLE BLOCK]*

### `interior-designers.png`
> A single sculptural designer lounge chair in dark matte form with one chrome detail,
> floating like a gallery piece, elegant curves, emerald-green rim light defining its silhouette,
> soft reflection beneath. Refined, high-design, premium. *[STYLE BLOCK]*

### `ielts-coaching.png`
> A pristine folded paper plane in smooth matte white-grey, floating mid-flight with a trailing
> ribbon of soft emerald-green light behind it, faint glass globe softly out of focus in the
> deep background. Evokes language, travel, going abroad. *[STYLE BLOCK]*

### `tuition-centres.png`
> A single open hardcover book floating, its pages fanned, soft emerald-green light rising out
> of the open pages like glowing knowledge, dark premium cover, gentle particles of light.
> Warm, aspirational, scholarly — no readable text on the pages. *[STYLE BLOCK]*

### `modular-kitchens.png`
> A sleek minimalist kitchen cabinet module / handleless drawer front in dark matte lacquer
> with one slim chrome channel, floating as a clean rectangular sculptural block, emerald-green
> light tracing the seams and edges. Premium, modular, architectural. *[STYLE BLOCK]*

### `ivf-clinics.png`
> A single delicate luminous orb like a glowing seed of light suspended in dark space, soft
> emerald subsurface glow, protected within a faint translucent glass shell, gentle and
> hopeful, ethereal haze around it. Tasteful and sensitive — abstract, never clinical or
> graphic. *[STYLE BLOCK]*

### `physiotherapy.png`
> A smooth balanced stack of three rounded river-stones in dark polished stone, floating in
> perfect balance, OR a flowing ribbon of light tracing a spine-like curve — your pick —
> emerald-green rim light, calm and restorative. Evokes movement, balance, recovery.
> *[STYLE BLOCK]*

### `hotels.png`
> A single luxury reception desk bell in polished dark chrome floating in space, OR an elegant
> hotel key card with a soft green light edge — your pick — pristine, glossy, emerald-green
> rim light and reflections. Evokes hospitality, premium stay. *[STYLE BLOCK]*

---

## NOTES

- If a generated object looks too literal/stocky, add: *"more abstract, sculptural, museum
  art-object, less realistic product photo."*
- If the background isn't dark enough to blend, add: *"background pure near-black #070707,
  darker, more negative space."*
- Keep the **same camera angle and light direction** across all 14 so the set feels like one
  family (slightly above eye level, key light from upper-left, green).
- Re-roll until the subject is **centered with breathing room** — I crop these to square and
  9:16 for mobile.
- Deliver into `public/site/lp/img/` with the exact filenames. Ping me when `dental-clinics`,
  `intelligence-orb`, and `aurora-plate` are in — I'll build the dental page around them for
  your approval before you spend time on the rest.
