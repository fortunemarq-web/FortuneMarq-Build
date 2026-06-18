import fs from "fs";
import path from "path";

// Markdown blog — posts live as plain .md files in content/blog/. To publish a
// new post you just add a .md file (frontmatter + body) and push; the index,
// the post page, and the sitemap pick it up automatically. No CMS, no DB.
//
// Frontmatter (between the --- lines at the top of the file):
//   title:        Post headline
//   description:  1–2 sentence summary (used for SEO + the card)
//   date:         YYYY-MM-DD
//   author:       FortuneMarq            (optional, defaults to FortuneMarq)
//   image:        /site/images/xyz.webp  (optional, defaults to the OG image)
//   tags:         [Local SEO, Google Ads](optional)

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  author: string;
  image: string;
  tags: string[];
  content: string; // markdown body
}

/** Minimal YAML-ish frontmatter parser (content is owner-authored / trusted). */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, content: raw };
  const data: Record<string, unknown> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.startsWith("[") && val.endsWith("]")) {
      data[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      data[key] = val;
    }
  }
  return { data, content: m[2] };
}

function toPost(file: string): BlogPost {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = parseFrontmatter(raw);
  const tags = Array.isArray(data.tags) ? (data.tags as string[]) : data.tags ? [String(data.tags)] : [];
  return {
    slug,
    title: String(data.title || slug),
    description: String(data.description || ""),
    date: String(data.date || ""),
    author: String(data.author || "FortuneMarq"),
    image: String(data.image || "/site/images/og-default.png"),
    tags,
    content: content.trim(),
  };
}

/** All posts, newest first. Reads at build time (pages are statically generated). */
export function getAllPosts(): BlogPost[] {
  let files: string[] = [];
  try {
    // Skip files starting with "_" — those are drafts and stay unpublished.
    files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  } catch {
    return [];
  }
  return files.map(toPost).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getPost(slug: string): BlogPost | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

/** Human-friendly date, e.g. "18 June 2026". Falls back to the raw string. */
export function formatPostDate(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
