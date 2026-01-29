#!/usr/bin/env python3
import json
import sys
import re
from pathlib import Path

def slugify(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r"[^a-z0-9]+", "-", name)
    return name.strip("-") or "section"

def collect_text_nodes(node, parents, acc):
    if isinstance(node, dict):
        node_type = node.get("type")
        if node_type == "TEXT":
            text = (node.get("characters") or "").strip()
            if text:
                box = node.get("absoluteBoundingBox", {}) or {}
                style = node.get("style", {}) or {}
                parent_names = [p.get("name") for p in parents if isinstance(p, dict) and p.get("name")]
                acc.append({
                    "text": text,
                    "y": box.get("y", 0),
                    "x": box.get("x", 0),
                    "fontSize": style.get("fontSize"),
                    "parents": parent_names,
                })

        # Recurse into children
        for k, v in node.items():
            if isinstance(v, (dict, list)):
                collect_text_nodes(v, parents + [node], acc)

    elif isinstance(node, list):
        for child in node:
            collect_text_nodes(child, parents, acc)

def classify_line(node):
    size = node.get("fontSize") or 0
    text = node["text"]

    # Very rough heuristic: big text = heading, medium = subhead, smaller = body/label
    if size >= 40:
        return "HEADING"
    elif size >= 24:
        return "SUBHEAD"
    else:
        # Short all-caps / button-like → CTA
        if len(text) <= 30 and text.isupper():
            return "CTA"
        return "BODY"

def main(path: str):
    data = json.loads(Path(path).read_text(encoding="utf-8"))

    doc = data["document"]
    all_text = []
    collect_text_nodes(doc, [], all_text)

    # Sort by vertical then horizontal position
    all_text.sort(key=lambda t: (t["y"], t["x"]))

    print(f"# Landing Page Summary: {data.get('name', 'Untitled')}")
    print()
    print(f"- Figma file name: **{data.get('name')}**")
    print(f"- Last modified: **{data.get('lastModified')}**")
    print()

    print("## Text Content (top -> bottom)\n")

    last_printed = None
    for node in all_text:
        text = re.sub(r"\s+", " ", node["text"]).strip()
        if not text:
            continue

        # Skip exact duplicates that appear right after each other
        if text == last_printed:
            continue
        last_printed = text

        role = classify_line(node)
        parents = " > ".join(node["parents"][-3:]) if node["parents"] else ""
        meta = f"_{role}_"
        if parents:
            meta += f" · `{parents}`"

        print(f"- {meta}: {text}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python summarize_figma_landing.py landing-page.json")
        sys.exit(1)
    main(sys.argv[1])