// scripts/summarize-figma.mjs
import fs from 'node:fs/promises'
import path from 'node:path'

const SRC      = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve('landing-page.json')      // <-- default to your file
const OUT_JSON = path.resolve('figma-summary.json')
const OUT_MD   = path.resolve('figma-summary.md')

// ---------------- helpers ----------------
const num = v => (typeof v === 'number' ? v : undefined)
const px = v => (typeof v === 'number' ? Math.round(v) : undefined)

function toHex({ r, g, b }, opacity = 1) {
  const h = n => Math.round(n * 255).toString(16).padStart(2, '0')
  const hex = `#${h(r)}${h(g)}${h(b)}`
  return opacity === 1
    ? hex
    : `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${opacity})`
}

function solidFill(fills) {
  if (!Array.isArray(fills)) return null
  const f = fills.find(x => x?.type === 'SOLID' && x?.color)
  if (!f) return null
  const a = 'opacity' in f ? f.opacity : 1
  return toHex(f.color, a)
}

function hasImageFill(fills) {
  return Array.isArray(fills) && fills.some(f => f?.type === 'IMAGE')
}

function strokeInfo(node) {
  if (!Array.isArray(node.strokes) || node.strokes.length === 0) return undefined
  const s = node.strokes[0]
  if (s?.type !== 'SOLID' || !s.color) return undefined
  return {
    color: toHex(s.color, s.opacity ?? 1),
    w: num(node.strokeWeight) ?? 1,
  }
}

// order by canvas stacking: top→bottom then left→right
function byCanvasPos(a, b) {
  const A = a.absoluteBoundingBox || {},
    B = b.absoluteBoundingBox || {}
  const ay = Math.round(A.y ?? 0),
    by = Math.round(B.y ?? 0)
  const ax = Math.round(A.x ?? 0),
    bx = Math.round(B.x ?? 0)
  return ay === by ? ax - bx : ay - by
}

const ALLOW = new Set([
  'DOCUMENT',   // root
  'CANVAS',     // pages
  'FRAME',
  'TEXT',
  'RECTANGLE',
  'ELLIPSE',
  'VECTOR',
  'LINE',
  'GROUP',
  'INSTANCE',
])


// palette collector
const palette = new Map()
const addColor = hex => {
  if (!hex) return
  palette.set(hex, (palette.get(hex) || 0) + 1)
}

// ---------------- simplify ----------------
function simplify(node, index = 0, parentPath = []) {
  if (!ALLOW.has(node.type)) return null

  const pathCrumbs = [...parentPath, node.name || node.type]
  const base = {
    id: node.id,
    type: node.type,
    name: node.name,
    visible: node.visible !== false,
    z: index,
    path: pathCrumbs.join(' > '),
  }

  // geometry
  if (node.absoluteBoundingBox) {
    const b = node.absoluteBoundingBox
    base.box = { x: px(b.x), y: px(b.y), w: px(b.width), h: px(b.height) }
  }

  // auto-layout
  if (node.layoutMode) {
    base.layout = {
      mode: node.layoutMode, // HORIZONTAL | VERTICAL
      gap: num(node.itemSpacing),
      padding: {
        t: num(node.paddingTop),
        r: num(node.paddingRight),
        b: num(node.paddingBottom),
        l: num(node.paddingLeft),
      },
      primaryAlign: node.primaryAxisAlignItems, // MIN | CENTER | MAX | SPACE_BETWEEN
      counterAlign: node.counterAxisAlignItems, // MIN | CENTER | MAX | BASELINE
      primarySizing: node.primaryAxisSizingMode, // FIXED | AUTO
      counterSizing: node.counterAxisSizingMode, // FIXED | AUTO
      wraps: node.layoutWrap === 'WRAP',
    }
  }

  // visuals
  const bg = solidFill(node.fills)
  if (bg) {
    base.bg = bg
    addColor(bg)
  }
  if (node.cornerRadius != null) base.radius = num(node.cornerRadius)
  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii.map(num)
    base.radii = { tl, tr, br, bl }
  }
  const stroke = strokeInfo(node)
  if (stroke) {
    base.stroke = stroke
    addColor(stroke.color)
  }
  if (Array.isArray(node.effects) && node.effects.length) base.shadow = true
  if (node.clipsContent) base.clip = true
  if (typeof node.opacity === 'number' && node.opacity !== 1) {
    base.opacity = +node.opacity.toFixed(3)
  }

  // classify
  if (node.type === 'TEXT') {
    base.kind = 'text'
    base.text = (node.characters || '').trim()
    const s = node.style || {}
    base.textStyle = {
      ff: s.fontFamily,
      sz: num(s.fontSize),
      lh: s.lineHeightPx ?? s.lineHeightPercent,
      fw: s.fontWeight,
      ls: s.letterSpacing,
      align: s.textAlignHorizontal, // LEFT | CENTER | RIGHT | JUSTIFIED
      valign: s.textAlignVertical, // TOP | CENTER | BOTTOM
      deco: s.textDecoration, // STRIKETHROUGH | UNDERLINE | NONE
      case: s.textCase, // UPPER | LOWER | TITLE | SMALL_CAPS | NORMAL
    }
    const color = solidFill(node.fills)
    if (color) {
      base.color = color
      addColor(color)
    }
  } else if (node.type === 'LINE' || (node.type === 'VECTOR' && base.box?.h === 1)) {
    base.kind = 'rule'
    if (!stroke && bg) base.stroke = { color: bg, w: 1 }
  } else if (hasImageFill(node.fills)) {
    base.kind = 'image'
  } else if (
    node.type === 'RECTANGLE' ||
    node.type === 'ELLIPSE' ||
    node.type === 'VECTOR'
  ) {
    base.kind = 'shape'
  } else if (
    node.type === 'FRAME' ||
    node.type === 'CANVAS' ||
    node.type === 'DOCUMENT'
  ) {
    base.kind = 'frame'
  } else if (node.type === 'GROUP' || node.type === 'INSTANCE') {
    base.kind = node.type.toLowerCase()
  }


  // recurse
  if (Array.isArray(node.children) && node.children.length) {
    base.children = node.children
      .filter(c => c.visible !== false && ALLOW.has(c.type))
      .sort(byCanvasPos)
      .map((c, i) => simplify(c, i, pathCrumbs))
      .filter(Boolean)
  }

  return base
}

// ---------------- markdown ----------------
function outlineMD(n, depth = 0) {
  const pad = '  '.repeat(depth)
  const box = n.box ? ` [${n.box.x},${n.box.y} → ${n.box.w}×${n.box.h}]` : ''
  const layout = n.layout
    ? ` • ${n.layout.mode}` +
      (n.layout.gap != null ? ` gap:${n.layout.gap}` : '') +
      (n.layout.padding
        ? ` pad:${['t', 'r', 'b', 'l']
            .map(k => n.layout.padding[k] ?? 0)
            .join('/')}`
        : '')
    : ''
  const lines = [
    `${pad}- ${n.type}${n.name ? ` • ${n.name}` : ''}${
      n.kind ? ` • ${n.kind}` : ''
    }${box}${layout}`,
  ]
  if (n.text) {
    const preview = n.text.replace(/\s+/g, ' ').slice(0, 80)
    lines.push(`${pad}  "${preview}${n.text.length > 80 ? '…' : ''}"`)
  }
  if (Array.isArray(n.children)) {
    for (const c of n.children) lines.push(outlineMD(c, depth + 1))
  }
  return lines.join('\n')
}

// ---------------- run ----------------
const raw = JSON.parse(await fs.readFile(SRC, 'utf8'))

// YOUR JSON: document is at top level
const root = raw.document
if (!root) {
  console.error('Could not find document in', path.relative(process.cwd(), SRC))
  process.exit(1)
}

const summary = simplify(root)
if (!summary) {
  console.error('simplify() returned null for root node type:', root.type)
  process.exit(1)
}

summary.name = raw.name || summary.name

// attach palette summary (sorted by frequency desc)
summary._palette = Array.from(palette.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([hex, count]) => ({ hex, count }))

await fs.writeFile(OUT_JSON, JSON.stringify(summary, null, 2), 'utf8')

const mdHead =
  `# Figma Frame Outline: ${summary.name || ''}\n\n` +
  (summary._palette?.length
    ? `**Palette (top ${Math.min(12, summary._palette.length)}):** ` +
      summary._palette
        .slice(0, 12)
        .map(p => `\`${p.hex}\`×${p.count}`)
        .join('  ') +
      `\n\n`
    : '')

await fs.writeFile(OUT_MD, mdHead + outlineMD(summary) + '\n', 'utf8')

console.log('Wrote:', path.relative(process.cwd(), OUT_JSON))
console.log('Wrote:', path.relative(process.cwd(), OUT_MD))
console.log('Tip: use box.x/y and kind:"rule" to place dividers; palette helps build CSS vars.')