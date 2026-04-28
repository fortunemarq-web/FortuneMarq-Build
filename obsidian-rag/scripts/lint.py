#!/usr/bin/env python3
"""
Obsidian RAG Wiki Linter
========================
Checks the health of the wiki and raw sources folder.

Usage:
    python3 scripts/lint.py

Run from the obsidian-rag/ root directory.
"""

import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ── Configuration ────────────────────────────────────────────────────────────

WIKI_DIR = Path("wiki")
RAW_DIR = Path("raw")
INDEX_FILE = WIKI_DIR / "index.md"
STALE_DAYS = 90          # Pages not updated within this many days are flagged
MAX_WORD_COUNT = 800     # Pages exceeding this are flagged as oversized

# ── Helpers ──────────────────────────────────────────────────────────────────

def read_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  [ERROR] Could not read {path}: {e}")
        return ""


def extract_wiki_links(content: str) -> set[str]:
    """Extract all [[WikiLink]] references from a markdown file."""
    return set(re.findall(r"\[\[([^\]|#]+?)(?:\|[^\]]+)?\]\]", content))


def extract_last_updated(content: str) -> datetime | None:
    """Extract the 'Last updated: YYYY-MM-DD' date from a wiki page."""
    match = re.search(r"\*\*Last updated:\*\*\s*(\d{4}-\d{2}-\d{2})", content)
    if match:
        try:
            return datetime.strptime(match.group(1), "%Y-%m-%d")
        except ValueError:
            return None
    return None


def extract_tags(content: str) -> set[str]:
    """Extract all #tags from a markdown file."""
    return set(re.findall(r"#(\w[\w-]*)", content))


def word_count(content: str) -> int:
    return len(content.split())


def get_index_entries(index_content: str) -> set[str]:
    """Extract all [[PageName]] references from the index file."""
    return extract_wiki_links(index_content)


# ── Checks ───────────────────────────────────────────────────────────────────

def check_orphan_pages(wiki_files: list[Path], index_entries: set[str]) -> list[str]:
    """Pages that exist in wiki/ but are not listed in index.md."""
    issues = []
    for f in wiki_files:
        if f.name == "index.md":
            continue
        page_name = f.stem
        if page_name not in index_entries:
            issues.append(f"  ⚠  ORPHAN: '{f.name}' is not listed in index.md")
    return issues


def check_dead_links(wiki_files: list[Path]) -> list[str]:
    """[[Links]] that point to pages that don't exist."""
    existing = {f.stem for f in wiki_files}
    issues = []
    for f in wiki_files:
        content = read_file(f)
        links = extract_wiki_links(content)
        for link in links:
            # Ignore raw/ references and the index itself
            if link.startswith("raw/") or link == "index":
                continue
            if link not in existing:
                issues.append(f"  ⚠  DEAD LINK: '{f.name}' links to [[{link}]] which does not exist")
    return issues


def check_stale_pages(wiki_files: list[Path]) -> list[str]:
    """Pages not updated in more than STALE_DAYS days."""
    cutoff = datetime.now() - timedelta(days=STALE_DAYS)
    issues = []
    for f in wiki_files:
        if f.name == "index.md":
            continue
        content = read_file(f)
        last_updated = extract_last_updated(content)
        if last_updated is None:
            issues.append(f"  ⚠  NO DATE:  '{f.name}' has no 'Last updated' field")
        elif last_updated < cutoff:
            age = (datetime.now() - last_updated).days
            issues.append(f"  ⚠  STALE:    '{f.name}' last updated {age} days ago ({last_updated.date()})")
    return issues


def check_unprocessed_sources(raw_files: list[Path]) -> list[str]:
    """Raw source files missing 'processed: true' in their front matter."""
    issues = []
    for f in raw_files:
        content = read_file(f)
        if "processed: true" not in content.lower():
            issues.append(f"  ⚠  UNPROCESSED: '{f.name}' has not been processed yet")
    return issues


def check_oversized_pages(wiki_files: list[Path]) -> list[str]:
    """Pages exceeding MAX_WORD_COUNT words."""
    issues = []
    for f in wiki_files:
        if f.name == "index.md":
            continue
        content = read_file(f)
        wc = word_count(content)
        if wc > MAX_WORD_COUNT:
            issues.append(f"  ⚠  OVERSIZED: '{f.name}' has {wc} words (limit: {MAX_WORD_COUNT}) — consider splitting")
    return issues


def check_missing_tags(wiki_files: list[Path]) -> list[str]:
    """Pages with no tags at all."""
    issues = []
    for f in wiki_files:
        if f.name == "index.md":
            continue
        content = read_file(f)
        tags = extract_tags(content)
        if not tags:
            issues.append(f"  ⚠  NO TAGS:   '{f.name}' has no #tags")
    return issues


def check_needs_review(wiki_files: list[Path]) -> list[str]:
    """Pages tagged with #needs-review."""
    issues = []
    for f in wiki_files:
        content = read_file(f)
        tags = extract_tags(content)
        if "needs-review" in tags:
            issues.append(f"  🔍 REVIEW:   '{f.name}' is tagged #needs-review — contradiction or unverified claim")
    return issues


# ── Main ─────────────────────────────────────────────────────────────────────

def run_lint():
    print("=" * 60)
    print("  Obsidian RAG — Wiki Lint Check")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Gather files
    if not WIKI_DIR.exists():
        print(f"\n[FATAL] Wiki directory '{WIKI_DIR}' not found. Run from obsidian-rag/ root.")
        sys.exit(1)

    wiki_files = sorted(WIKI_DIR.glob("*.md"))
    raw_files = sorted(RAW_DIR.glob("*.md")) if RAW_DIR.exists() else []

    print(f"\n  Wiki pages:   {len(wiki_files)}")
    print(f"  Raw sources:  {len(raw_files)}")

    # Read index
    index_content = read_file(INDEX_FILE) if INDEX_FILE.exists() else ""
    index_entries = get_index_entries(index_content)

    all_issues = []

    # Run all checks
    checks = [
        ("Orphan Pages",        check_orphan_pages(wiki_files, index_entries)),
        ("Dead Links",          check_dead_links(wiki_files)),
        ("Stale Pages",         check_stale_pages(wiki_files)),
        ("Unprocessed Sources", check_unprocessed_sources(raw_files)),
        ("Oversized Pages",     check_oversized_pages(wiki_files)),
        ("Missing Tags",        check_missing_tags(wiki_files)),
        ("Needs Review",        check_needs_review(wiki_files)),
    ]

    for check_name, issues in checks:
        print(f"\n── {check_name} {'─' * (45 - len(check_name))}")
        if issues:
            for issue in issues:
                print(issue)
            all_issues.extend(issues)
        else:
            print("  ✓  All clear")

    # Summary
    print("\n" + "=" * 60)
    if all_issues:
        print(f"  ❌  {len(all_issues)} issue(s) found. Review the above and fix before next session.")
    else:
        print("  ✅  Wiki is healthy. No issues found.")
    print("=" * 60 + "\n")

    return len(all_issues)


if __name__ == "__main__":
    issue_count = run_lint()
    sys.exit(0 if issue_count == 0 else 1)
