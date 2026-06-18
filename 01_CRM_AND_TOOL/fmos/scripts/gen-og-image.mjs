// Generates the marketing-site social share image (1200×630) →
// public/site/images/og-default.png. Re-run after a brand/tagline change:
//   node scripts/gen-og-image.mjs
import sharp from "sharp";

const W = 1200;
const H = 630;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="80%" cy="20%" r="62%">
      <stop offset="0%" stop-color="#42CA80" stop-opacity="0.30"/>
      <stop offset="55%" stop-color="#42CA80" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#42CA80" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#030303"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="#42CA80"/>
  <text x="96" y="312" font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="6" fill="#42CA80" font-weight="600">DIGITAL MARKETING AGENCY · HUBLI</text>
  <text x="92" y="412" font-family="Arial, Helvetica, sans-serif" font-size="98" fill="#ffffff" font-weight="700">FortuneMarq</text>
  <text x="96" y="484" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#d3d6d4" font-weight="400">Marketing that pays you back.</text>
</svg>`;

const logo = await sharp("public/site/images/FORTUNEMARQ-LOGO.webp")
  .resize({ height: 132 })
  .png()
  .toBuffer();

const base = await sharp(Buffer.from(svg)).png().toBuffer();

await sharp(base)
  .composite([{ input: logo, top: 96, left: 96 }])
  .png()
  .toFile("public/site/images/og-default.png");

console.log("wrote public/site/images/og-default.png");
