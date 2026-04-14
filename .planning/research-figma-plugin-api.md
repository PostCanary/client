# Research: Figma Plugin API for Programmatic Postcard Design

Date: 2026-04-12
Purpose: Determine what the Figma Plugin API can and cannot do for programmatically creating print-ready 6x9" postcard templates with variable data support, informing PostCanary's design pipeline architecture.

## Sources

| # | Source | URL | Type |
|---|--------|-----|------|
| 1 | Figma Plugin API Reference | https://developers.figma.com/docs/plugins/api/api-reference/ | Official docs |
| 2 | Figma Node Types | https://developers.figma.com/docs/plugins/api/nodes/ | Official docs |
| 3 | Figma `figma` Global Object | https://developers.figma.com/docs/plugins/api/figma/ | Official docs |
| 4 | Figma Working with Variables | https://developers.figma.com/docs/plugins/working-with-variables/ | Official guide |
| 5 | Figma Working with Images | https://developers.figma.com/docs/plugins/working-with-images/ | Official guide |
| 6 | Figma createImage | https://developers.figma.com/docs/plugins/api/properties/figma-createimage/ | Official docs |
| 7 | Figma createText | https://developers.figma.com/docs/plugins/api/properties/figma-createtext/ | Official docs |
| 8 | Figma ExportSettings | https://www.figma.com/plugin-docs/api/ExportSettings/ | Official docs |
| 9 | Figma exportAsync | https://www.figma.com/plugin-docs/api/properties/nodes-exportasync/ | Official docs |
| 10 | Figma layoutMode | https://developers.figma.com/docs/plugins/api/properties/nodes-layoutmode/ | Official docs |
| 11 | Figma layoutSizingHorizontal | https://developers.figma.com/docs/plugins/api/properties/nodes-layoutsizinghorizontal/ | Official docs |
| 12 | Figma FrameNode | https://developers.figma.com/docs/plugins/api/FrameNode/ | Official docs |
| 13 | Figma ComponentNode | https://developers.figma.com/docs/plugins/api/ComponentNode/ | Official docs |
| 14 | Figma layoutPositioning | https://developers.figma.com/docs/plugins/api/properties/nodes-layoutpositioning/ | Official docs |
| 15 | Figma appendChildAt (Grid) | https://developers.figma.com/docs/plugins/api/properties/nodes-appendchildat/ | Official docs |
| 16 | Figma Variables REST API | https://developers.figma.com/docs/rest-api/variables/ | Official docs |
| 17 | Lob Figma Plugin Help | https://help.lob.com/print-and-mail/integrations/creative-conversion-tools/figma-plugin | Lob docs |
| 18 | Lob + Figma Integration Page | https://www.lob.com/integration/figma | Lob marketing |
| 19 | Figma Plugin Samples (variables-import-export) | https://github.com/figma/plugin-samples/blob/master/variables-import-export/export.html | GitHub |

---

## 1. Node Creation Capabilities

The Plugin API provides factory methods on the `figma` global object for creating nodes programmatically. Every created node is parented under `figma.currentPage` by default. [Source 1, 2]

### Creatable Node Types

| Method | Creates | Relevant for PostCanary |
|--------|---------|------------------------|
| `figma.createFrame()` | FrameNode | Primary container for postcard layout |
| `figma.createRectangle()` | RectangleNode | Background fills, color blocks, image containers |
| `figma.createText()` | TextNode | All text content |
| `figma.createEllipse()` | EllipseNode | Decorative elements |
| `figma.createPolygon()` | PolygonNode | Decorative elements |
| `figma.createStar()` | StarNode | Decorative elements |
| `figma.createLine()` | LineNode | Dividers, borders |
| `figma.createVector()` | VectorNode | Custom shapes via VectorPath |
| `figma.createComponent()` | ComponentNode | Reusable template sections |
| `figma.createComponentSet()` | ComponentSetNode | Variant systems (front/back, styles) |
| `figma.createSlice()` | SliceNode | Export regions |
| `figma.createBooleanOperation()` | BooleanOperationNode | Combined shapes |
| `figma.createNodeFromJSXAsync()` | Any node via JSX | Declarative node creation (widgets) |

### Key Node Properties Settable Programmatically

Every `SceneNode` supports: `x`, `y`, `width`, `height` (via `resize()`), `rotation`, `opacity`, `fills`, `strokes`, `effects`, `constraints`, `blendMode`, `cornerRadius`, `clipsContent`. [Source 12]

```ts
// Example: Create a 6x9" postcard frame at 300 DPI (1800x2700 px)
const postcardFront = figma.createFrame()
postcardFront.name = "Postcard Front - 6x9"
postcardFront.resize(1800, 2700)
postcardFront.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]
postcardFront.clipsContent = true
```

### Frame Hierarchy

Frames can contain child frames, creating arbitrary nesting. Use `frame.appendChild(child)` or `frame.insertChild(index, child)` to build the tree. [Source 12]

### What IS NOT Possible

- No `figma.createPage()` with custom names in a single call -- you use `figma.createPage()` then set `.name`.
- No creation of `SectionNode` via plugin (sections are a FigJam/whiteboard concept). [Inferred from docs -- SectionNode is listed as a type but no `createSection` method exists]
- Node creation only works in the plugin sandbox (main thread), not from the UI iframe.

---

## 2. Text Handling

### Creating and Styling Text

Text nodes are created via `figma.createText()`, which returns an empty `TextNode`. Before setting `.characters`, the font used by that text node must be loaded via `figma.loadFontAsync()`. [Source 7]

```ts
const text = figma.createText()
text.x = 50
text.y = 50

// MUST load font before setting characters
await figma.loadFontAsync({ family: "Inter", style: "Regular" })
text.characters = 'Hello world!'

// Styling
text.fontSize = 18
text.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]
```

### Available Text Properties

| Property | Type | Notes |
|----------|------|-------|
| `fontName` | `{ family: string, style: string }` | e.g. `{ family: "Inter", style: "Bold" }` |
| `fontSize` | `number` | In Figma points |
| `letterSpacing` | `{ value: number, unit: 'PIXELS' \| 'PERCENT' }` | |
| `lineHeight` | `{ value: number, unit: 'PIXELS' \| 'PERCENT' } \| { unit: 'AUTO' }` | |
| `textCase` | `'ORIGINAL' \| 'UPPER' \| 'LOWER' \| 'TITLE' \| 'SMALL_CAPS' \| 'SMALL_CAPS_FORCED'` | Equivalent to CSS `text-transform` |
| `textDecoration` | `'NONE' \| 'UNDERLINE' \| 'STRIKETHROUGH'` | |
| `textAlignHorizontal` | `'LEFT' \| 'CENTER' \| 'RIGHT' \| 'JUSTIFIED'` | |
| `textAlignVertical` | `'TOP' \| 'CENTER' \| 'BOTTOM'` | |
| `paragraphSpacing` | `number` | Space between paragraphs |
| `paragraphIndent` | `number` | First-line indent |
| `textAutoResize` | `'NONE' \| 'WIDTH_AND_HEIGHT' \| 'HEIGHT' \| 'TRUNCATE'` | Controls overflow behavior |

### Font Loading

Fonts must be loaded before use. The API provides:
- `figma.loadFontAsync(fontName)` -- loads a specific font family+style combination
- `figma.listAvailableFontsAsync()` -- lists all fonts available to the user

Google Fonts are available in Figma by default (Figma ships with them). The plugin loads them the same way as any other font -- by calling `loadFontAsync` with the family name. No special import step is needed. [Source 7, inferred from Figma's font system]

### Mixed Styles (Rich Text)

A single TextNode can have different styles on different character ranges using `setRange*` methods:

```ts
text.setRangeFontSize(0, 5, 24)  // First 5 chars at size 24
text.setRangeFontName(6, 12, { family: "Inter", style: "Bold" })
text.setRangeLetterSpacing(0, 5, { value: 2, unit: 'PIXELS' })
```

Each `setRange*` call requires that the font for that range is already loaded.

### Text Overflow Handling

Use `textAutoResize` to control what happens when text exceeds the node's bounds:
- `'NONE'` -- fixed size, text clips (default)
- `'HEIGHT'` -- width is fixed, height expands to fit
- `'WIDTH_AND_HEIGHT'` -- both dimensions expand
- `'TRUNCATE'` -- fixed size, text truncates with ellipsis

For PostCanary templates with variable-length content (business name, headline), use `'HEIGHT'` with a fixed width matching the layout column, so the frame adjusts.

### Failure Mode

When `loadFontAsync` is not called before setting text properties, the plugin throws: `"Cannot set font on text node before font is loaded"`. Load every font variant you plan to use before any text operations.

---

## 3. Image Handling

### Adding Images

Two primary methods exist for getting images into a Figma file via plugin: [Source 5, 6]

**Method 1: `figma.createImageAsync(url)` -- Load from URL**
```ts
const image = await figma.createImageAsync('https://example.com/photo.jpg')
const rect = figma.createRectangle()
const { width, height } = await image.getSizeAsync()
rect.resize(width, height)
rect.fills = [{
  type: 'IMAGE',
  imageHash: image.hash,
  scaleMode: 'FILL'  // or 'FIT', 'CROP', 'TILE'
}]
```

**Method 2: `figma.createImage(data)` -- Load from Uint8Array**
```ts
const image = figma.createImage(uint8ArrayOfPngBytes)
// Then apply to a node's fills using image.hash
```

**Method 3: JSX-style (simpler)**
```ts
figma.createNodeFromJSXAsync(
  <figma.widget.Image src="https://example.com/photo.jpg" width={200} height={300} />
)
```

### Image Constraints

- **Formats**: PNG, JPG, GIF only. No SVG, WebP, or TIFF. [Source 6]
- **Maximum size**: 4096 x 4096 pixels. Images exceeding this throw an error. [Source 6]
- **CORS**: When loading from URL, the server must allow cross-origin requests. Base64-encoded data avoids this issue entirely. [Source 5]
- Images are NOT nodes -- they are handles (`Image` objects) stored by Figma. They become visible by assigning them as fills on shapes (rectangles, frames, ellipses, etc.). [Source 6]

### Scale Modes

When an image is assigned as a fill, `scaleMode` controls rendering:
- `'FILL'` -- image covers the entire node, cropping if necessary
- `'FIT'` -- image fits within the node, letterboxing if necessary
- `'CROP'` -- user-defined crop region
- `'TILE'` -- image tiles/repeats

For postcard backgrounds, use `'FILL'`. For business logos, use `'FIT'` to prevent distortion.

### Image Manipulation

The plugin can read image bytes back via `image.getBytesAsync()`, decode them in the UI iframe using HTML Canvas, manipulate pixels, re-encode, and write back via `figma.createImage()`. This enables brightness/contrast adjustments, filters, etc. [Source 5]

### Failure Modes

- `"Image is too small"` -- image has zero dimensions
- `"Image is too large"` -- exceeds 4096x4096
- `"Image type is unsupported"` -- not PNG/JPG/GIF
- CORS errors fail silently or throw in the UI iframe context

---

## 4. Auto Layout

Auto Layout is fully controllable via the Plugin API. Set `layoutMode` on a FrameNode to activate it. [Source 10, 11, 14, 15]

### Core Properties

```ts
const container = figma.createFrame()
container.layoutMode = 'VERTICAL'  // or 'HORIZONTAL' or 'GRID'

// Padding
container.paddingTop = 40
container.paddingBottom = 40
container.paddingLeft = 40
container.paddingRight = 40

// Gap between children
container.itemSpacing = 16

// Alignment
container.primaryAxisAlignItems = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'
container.counterAxisAlignItems = 'MIN' | 'CENTER' | 'MAX' | 'BASELINE'

// Sizing
container.layoutSizingHorizontal = 'FIXED' | 'HUG' | 'FILL'
container.layoutSizingVertical = 'FIXED' | 'HUG' | 'FILL'
```

### Grid Layout (Introduced ~2024)

`layoutMode = 'GRID'` enables CSS Grid-like layouts:
```ts
const grid = figma.createFrame()
grid.layoutMode = 'GRID'
grid.gridRowCount = 3
grid.gridColumnCount = 3
grid.appendChildAt(child, rowIndex, columnIndex)
```

Grid layout is relevant for postcard designs that need a structured grid (e.g., photo grid on back). [Source 15]

### Child Sizing

Children of auto-layout frames use these shorthands:
- `layoutSizingHorizontal = 'FILL'` -- child stretches to fill available width
- `layoutSizingHorizontal = 'FIXED'` -- child maintains its explicit width
- `layoutSizingHorizontal = 'HUG'` -- child shrinks to content (only valid on auto-layout frames and text nodes)

`'HUG'` on a child that is not itself an auto-layout frame or text node will throw an error. [Source 11]

### Absolute Positioning Within Auto Layout

Children can opt out of auto-layout flow while remaining nested:
```ts
child.layoutPositioning = 'ABSOLUTE'
child.x = 90
child.y = -10
child.constraints = { horizontal: 'MAX', vertical: 'MIN' }
```

This is essential for overlaying elements (e.g., a badge or logo pinned to a corner) on an auto-layout postcard. [Source 14]

### Failure Mode

Setting `layoutMode` on a frame causes immediate repositioning of all children as a side effect. Setting it back to `'NONE'` does NOT restore original positions. Always set `layoutMode` before adding children. [Source 10]

---

## 5. Components and Variants

### Creating Components

```ts
const component = figma.createComponent()
component.name = "Postcard/Front/Hero"
component.resize(1800, 2700)
// Add children, set properties, etc.
```

Components behave identically to frames but can be instantiated:
```ts
const instance = component.createInstance()
instance.x = 2000  // Place next to the component
```

### ComponentSets (Variants)

A `ComponentSet` groups component variants. Each variant is a `ComponentNode` child with specific property values encoded in its name:

```ts
// Create variant components first
const variant1 = figma.createComponent()
variant1.name = "Style=Modern, Side=Front"

const variant2 = figma.createComponent()
variant2.name = "Style=Modern, Side=Back"

const variant3 = figma.createComponent()
variant3.name = "Style=Classic, Side=Front"

// Group into a ComponentSet
const componentSet = figma.combineAsVariants([variant1, variant2, variant3], figma.currentPage)
componentSet.name = "Postcard Template"
```

### Component Properties

Components support typed properties (beyond variants):
- `'VARIANT'` -- selects which variant is active
- `'BOOLEAN'` -- show/hide layers
- `'TEXT'` -- overridable text content
- `'INSTANCE_SWAP'` -- swap nested component instances

These are accessible via `component.componentPropertyDefinitions` and can be set on instances via `instance.setProperties()`. [Source 13]

### Architecture Pattern for PostCanary

Create a `ComponentSet` per postcard template style (Modern, Classic, Bold, etc.). Each set contains variants for Front and Back. Use `TEXT` component properties for editable fields (headline, phone, address). Use `INSTANCE_SWAP` for swappable logo/image sections. This maps naturally to Figma's design system model.

---

## 6. Variables

Variables store reusable values (colors, numbers, strings, booleans) that can be bound to node properties. Introduced in 2023, expanded through 2024-2025. [Source 4]

### Variable Types

| resolvedType | Use Case for PostCanary |
|--------------|------------------------|
| `'COLOR'` | Brand colors (primary, secondary, accent) |
| `'FLOAT'` | Spacing values, font sizes, widths |
| `'STRING'` | Template text (headline, phone, address), font family names |
| `'BOOLEAN'` | Show/hide optional elements |

### Creating Variables Programmatically

```ts
// Create a collection for template data
const collection = figma.variables.createVariableCollection("Template Data")
const modeId = collection.modes[0].modeId

// Create string variables for template fields
const headline = figma.variables.createVariable("headline", collection, "STRING")
headline.setValueForMode(modeId, "Your Business Name")

const phone = figma.variables.createVariable("phone", collection, "STRING")
phone.setValueForMode(modeId, "(555) 123-4567")

// Create color variables for brand colors
const primaryColor = figma.variables.createVariable("primary_color", collection, "COLOR")
primaryColor.setValueForMode(modeId, { r: 0.2, g: 0.4, b: 0.8 })
```

### Binding Variables to Nodes

```ts
// Bind a width variable
node.setBoundVariable('width', widthVariable)

// Bind a color variable to fills (immutable array pattern)
const fillsCopy = JSON.parse(JSON.stringify(node.fills))
fillsCopy[0] = figma.variables.setBoundVariableForPaint(fillsCopy[0], 'color', colorVariable)
node.fills = fillsCopy

// Bind typography variables
textNode.setBoundVariable("fontFamily", fontFamilyVar)
textNode.setBoundVariable("fontWeight", fontWeightVar)
```

### Variable Modes for Template Variants

Variable collections support multiple modes. Each mode provides a different set of values for the same variables. This maps to PostCanary's use case of generating multiple postcard variations from the same template:

```ts
const collection = figma.variables.createVariableCollection("Business Data")
collection.renameMode(collection.modes[0].modeId, "Business A")
const modeB = collection.addMode("Business B")

const businessName = figma.variables.createVariable("business_name", collection, "STRING")
businessName.setValueForMode(collection.modes[0].modeId, "Joe's Pizza")
businessName.setValueForMode(modeB, "Main Street Dental")
```

### Can Variables Represent `{{headline}}` Template Placeholders?

Yes, but with a critical distinction. Figma Variables are not text interpolation (they don't replace `{{placeholder}}` inside a string). Instead, a STRING variable replaces the **entire text content** of a bound text node. For PostCanary:

- Each variable data field (headline, phone, address) maps to its own TextNode, each bound to its own STRING variable.
- To preview different businesses, switch the variable mode on the containing frame.
- This is structurally different from Lob's `{{merge_variable}}` syntax but achieves the same result.

### Limitations

- **No IMAGE type variable.** Variables support COLOR, FLOAT, STRING, and BOOLEAN only. Image swapping must use component INSTANCE_SWAP properties or direct fill manipulation. [Source 4 -- inferred from exhaustive type list]
- **Extended collections** (theming) require Enterprise plan. [Source 4]
- **Free/Pro plan limits:** Variable collections have mode limits (1 mode on free, 4 on Pro, 40 on Enterprise). This constrains how many business variants can exist in a single collection. [Inferred from Figma pricing docs]

---

## 7. Styles

### Creating Styles Programmatically

```ts
// Text Style
const headlineStyle = figma.createTextStyle()
headlineStyle.name = "Postcard/Headline"
headlineStyle.fontName = { family: "Inter", style: "Bold" }
headlineStyle.fontSize = 48
headlineStyle.letterSpacing = { value: -1, unit: 'PIXELS' }
headlineStyle.lineHeight = { value: 56, unit: 'PIXELS' }

// Apply to a text node
await textNode.setTextStyleIdAsync(headlineStyle.id)

// Color Style (Paint Style)
const primaryStyle = figma.createPaintStyle()
primaryStyle.name = "Brand/Primary"
primaryStyle.paints = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.8 } }]

// Effect Style
const shadowStyle = figma.createEffectStyle()
shadowStyle.name = "Card/Shadow"
shadowStyle.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.15 },
  offset: { x: 0, y: 4 },
  radius: 12,
  spread: 0,
  visible: true,
  blendMode: 'NORMAL'
}]
```

### Style Types Available

| Method | Creates |
|--------|---------|
| `figma.createTextStyle()` | TextStyle |
| `figma.createPaintStyle()` | PaintStyle (colors, gradients) |
| `figma.createEffectStyle()` | EffectStyle (shadows, blurs) |
| `figma.createGridStyle()` | GridStyle (layout grids) |

### Applying Styles

Styles are applied by ID:
```ts
node.fillStyleId = paintStyle.id
node.effectStyleId = effectStyle.id
await textNode.setTextStyleIdAsync(textStyle.id)
```

Styles and variables can work together -- a style's paint can have a bound variable for the color value.

---

## 8. Export Capabilities

### Supported Export Formats

The `exportAsync` method on any node supports: [Source 8, 9]

| Format | Setting | Output Type | PostCanary Use |
|--------|---------|-------------|----------------|
| PNG | `{ format: 'PNG' }` | `Uint8Array` | Preview thumbnails |
| JPG | `{ format: 'JPG' }` | `Uint8Array` | Compressed previews |
| SVG | `{ format: 'SVG' }` | `Uint8Array` | Scalable vector output |
| SVG String | `{ format: 'SVG_STRING' }` | `string` | SVG as text for embedding |
| PDF | `{ format: 'PDF' }` | `Uint8Array` | Print-ready output |
| JSON (REST) | `{ format: 'JSON_REST_V1' }` | Object | Programmatic data extraction |

### Resolution Control

```ts
// Export at 2x resolution (600 DPI if canvas is 300 DPI)
const bytes = await node.exportAsync({
  format: 'PNG',
  constraint: { type: 'SCALE', value: 2 }
})

// Export at specific width
const bytes = await node.exportAsync({
  format: 'PNG',
  constraint: { type: 'WIDTH', value: 1800 }
})

// Export at specific height
const bytes = await node.exportAsync({
  format: 'PNG',
  constraint: { type: 'HEIGHT', value: 2700 }
})
```

### Color Profile Support

```ts
const bytes = await node.exportAsync({
  format: 'PNG',
  colorProfile: 'SRGB'          // sRGB
  // or 'DISPLAY_P3_V4'         // Display P3
  // or 'DOCUMENT'              // Match document color profile
})
```

### CMYK Support

Figma works exclusively in RGB color space. There is no native CMYK export or color mode. [Source 8 -- inferred from the absence of any CMYK option in ExportSettings]

For print-ready postcards, the workflow is:
1. Export from Figma as high-resolution PDF (RGB)
2. Convert RGB to CMYK using a post-processing tool (e.g., Ghostscript, Adobe Acrobat, or server-side ImageMagick)
3. OR: rely on the print partner (Lob) to handle the RGB-to-CMYK conversion, which Lob does automatically

### PDF Export Details

PDF export produces a vector PDF (not a rasterized image). Text remains selectable, vectors remain scalable. This is the preferred format for print handoff. [Source 8]

```ts
const pdfBytes = await postcardFrame.exportAsync({ format: 'PDF' })
// pdfBytes is a Uint8Array representing the PDF file
```

### `contentsOnly` Option

```ts
// Export only the node's contents (default: true)
// Set to false to include overlapping layers from other parts of the canvas
const bytes = await node.exportAsync({
  format: 'PDF',
  contentsOnly: true
})
```

### `useAbsoluteBounds` Option

```ts
// Use the full dimensions of the node even if content is cropped
const bytes = await node.exportAsync({
  format: 'PNG',
  useAbsoluteBounds: true
})
```

### Failure Mode

Exporting very complex nodes (thousands of children, high-resolution images) can hit memory limits in the plugin sandbox. Test with representative designs before assuming export will work for all templates.

---

## 9. Plugin Architecture

### Structure

Every plugin requires:
- **`manifest.json`** -- metadata, permissions, entry points
- **`code.js` (main thread)** -- runs in Figma's sandbox, has access to `figma` API
- **`ui.html` (UI thread, optional)** -- runs in an iframe, has access to browser APIs

```json
{
  "name": "PostCanary Template Builder",
  "id": "unique-plugin-id",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"]
}
```

### Execution Model

- **Main thread (sandbox)**: Access to `figma.*` API. No DOM, no `fetch`, no browser APIs. Communicates with UI via `figma.ui.postMessage()`.
- **UI thread (iframe)**: Full browser APIs (`fetch`, Canvas, DOM). Communicates with main thread via `parent.postMessage({ pluginMessage: data }, '*')`. No direct access to `figma.*`.

This split is critical for PostCanary:
- Image fetching from external URLs happens in the **UI iframe** (or via `figma.createImageAsync` which internally handles it).
- Node creation/manipulation happens in the **main thread**.
- Data from PostCanary's API (business info, brand colors) can be fetched in the UI iframe and posted to the main thread.

### Network Access

- The main thread has `figma.createImageAsync(url)` for loading images from URLs.
- For general HTTP requests, use the UI iframe's `fetch()` API.
- `figma.ui.postMessage()` and `figma.ui.onmessage` bridge data between threads.

### Can a Plugin Run Headlessly?

Not in the traditional sense. Plugins require Figma to be open (either desktop app or browser). However:
- **Plugin parameters** allow running without showing a UI (no `figma.showUI()` call needed).
- The **Figma REST API** can operate on files without Figma open, but with far fewer capabilities.
- **Figma's MCP server** (announced 2025) may enable headless-like interaction, but details are limited.

For PostCanary's production pipeline, the recommended approach is: use a plugin for template creation (interactive), then use the REST API for data extraction and export (automated).

### Performance Limits

- Plugin execution has no hard timeout for standard plugins, but `figma.closePlugin()` should be called when done.
- Large operations (creating hundreds of nodes, processing large images) can freeze the Figma UI.
- Use `figma.commitUndo()` to batch undo operations and improve perceived performance.
- The UI iframe has standard browser memory limits.

### TypeScript Support

Figma strongly recommends TypeScript. Install typings via:
```
npm install --save-dev @figma/plugin-typings
```

ESLint rules are available at `@figma/eslint-plugin-figma-plugins`.

---

## 10. Existing Print/Template Plugins

### Lob's Figma Plugin

Lob provides a first-party Figma plugin for direct mail design. Key findings: [Source 17, 18]

**How it works:**
1. Plugin generates a blank template frame at the correct mail dimensions (4x6, 6x9, 6x11 postcards; 8.5x11 letters; self-mailers)
2. Designer creates their design within the template, staying within bleed lines
3. Dynamic text uses `{{double_bracket}}` syntax directly in text layers (NOT Figma Variables -- this is raw text that gets parsed during export)
4. On export, the plugin **converts the Figma design to HTML** (not PDF, not image)
5. The HTML template is uploaded to Lob's API as a "Live HTML Template"
6. Lob handles: image hosting, font hosting, merge variable replacement, print production, USPS delivery

**Key architectural decisions by Lob:**
- Single root frame required (all design elements must be children of one frame)
- Non-variable imagery and text are flattened automatically on export
- Google fonts are auto-detected and hosted by Lob
- Variable imagery uses hosted image URLs in the audience CSV file
- The plugin authenticates with Lob credentials entered by the user

**What this means for PostCanary:**
- Lob's approach is Figma-to-HTML conversion, which is the simplest path to variable data printing
- PostCanary could follow the same pattern: design in Figma, export as HTML, send to Lob
- Alternatively, PostCanary could export PDF from Figma and send the PDF to Lob (Lob accepts both HTML and PDF)
- The `{{merge_variable}}` convention is well-established and Lob expects it

### Other Print-Relevant Plugins

- **Export PDF** (community plugin, Source 1 search results) -- basic PDF export functionality
- Various community template plugins exist, but none specifically target the "programmatic design generation" use case that PostCanary needs

---

## 11. REST API vs Plugin API

### What the REST API CAN Do

| Capability | REST API | Notes |
|------------|----------|-------|
| Read file structure | Yes | Full node tree via `GET /v1/files/:key` |
| Read node properties | Yes | Specific nodes via `GET /v1/files/:key/nodes?ids=` |
| Export images | Yes | `GET /v1/images/:key?ids=&format=png\|jpg\|svg\|pdf` |
| Read/write variables | Yes | `GET/POST /v1/files/:key/variables` (Enterprise only) |
| Read styles | Yes | Via file endpoint |
| Read components | Yes | `GET /v1/files/:key/components` |
| Create comments | Yes | `POST /v1/files/:key/comments` |
| Get file version history | Yes | `GET /v1/files/:key/versions` |

### What the REST API CANNOT Do

| Capability | REST API | Plugin API |
|------------|----------|------------|
| Create nodes | No | Yes |
| Modify node properties | No | Yes |
| Create/modify styles | No | Yes |
| Set fills, strokes, effects | No | Yes |
| Create components | No | Yes |
| Run auto-layout | No | Yes |
| Load fonts | No | Yes |
| Create images from bytes | No | Yes |

The REST API is read-only for design content. It can read everything but modify almost nothing (except variables on Enterprise, and comments).

### Combining Them

The recommended architecture for PostCanary:

1. **Plugin API** creates the template design (nodes, layout, styles, components, variables)
2. **Plugin API** exports PDF/PNG for preview
3. **REST API** reads the completed design data for backend processing
4. **REST API** exports final high-resolution images/PDFs for print production
5. **REST API** reads variable definitions to map to PostCanary's CRM data

The REST API Variables endpoint requires Enterprise plan access. On lower plans, variable data must be managed entirely within the plugin.

---

## Key Limitations

1. **No CMYK color space.** Figma is RGB-only. Print color accuracy requires post-processing or relying on the print vendor's conversion.

2. **No headless plugin execution.** A plugin cannot run without Figma open. Template creation is inherently interactive unless pre-built templates are reused via the REST API.

3. **Image size cap at 4096x4096.** For 300 DPI print at 6x9", the required resolution is 1800x2700 px, which is well within the limit. No issue for postcards.

4. **Font loading is async and mandatory.** Every font variant must be explicitly loaded before use. Forgetting this throws an error.

5. **Variable modes have plan-based limits.** Free: 1 mode, Pro: 4 modes, Enterprise: 40 modes. This limits how many business variants can coexist in one file.

6. **No IMAGE type for Variables.** Images cannot be swapped via variables. Use INSTANCE_SWAP component properties or direct fill manipulation instead.

7. **REST API is read-only for design content.** Cannot create or modify nodes, styles, or components. Only Variables can be written via REST, and only on Enterprise.

8. **UI iframe required for network requests.** The main plugin thread cannot use `fetch`. All external API calls (to PostCanary backend) must go through the UI iframe and be messaged to the main thread.

---

## Architecture Recommendation for PostCanary

### Recommended Approach: Figma Plugin + Lob HTML Pipeline

**Phase 1 -- Template Creation (Figma Plugin)**
- Build a custom Figma plugin that generates postcard templates programmatically
- The plugin creates a 6x9" frame with auto-layout, text nodes, image placeholders, and brand styling
- Use Figma Variables (STRING type) for variable data fields, bound to individual text nodes
- Use Component Properties (INSTANCE_SWAP) for variable images (business photos, logos)
- Export preview PNG for the PostCanary dashboard

**Phase 2 -- Design-to-Print Pipeline**
- Option A (Simpler): Follow Lob's pattern -- convert Figma design to HTML with `{{merge_variables}}`, upload to Lob
- Option B (Higher fidelity): Export PDF from Figma Plugin API, upload PDF to Lob as the creative
- Option C (Hybrid): Use Plugin API to generate the initial design, then export HTML for Lob compatibility

**Phase 3 -- Production Automation**
- Use REST API to read completed templates (node structure, variables, exports)
- PostCanary backend triggers Lob API with audience data and template reference
- Lob handles: printing, addressing, postage, USPS delivery, tracking

### Why Not Pure REST API?

The REST API cannot create designs. It can only read existing ones. Template creation requires either: (a) manual design in Figma, (b) a Figma plugin, or (c) generating HTML/PDF outside Figma entirely.

### Why Not Skip Figma Entirely?

Figma provides: professional typography, precise layout, visual preview, designer familiarity, component reusability. Building all of this from scratch (e.g., HTML/CSS templates) is possible but results in lower design quality and more engineering effort -- this was proven in PostCanary Sessions 31-36 where CSS-only templates failed to achieve professional results.

---

## Decision Rules (Draft)

1. **If the goal is "create a template from scratch programmatically"** -> use Figma Plugin API with `figma.createFrame()`, `figma.createText()`, auto-layout, and variables.

2. **If the goal is "modify an existing template with new business data"** -> use Figma Variables with modes (up to plan limits), or use Component Properties for instance-level overrides.

3. **If the goal is "export a print-ready file"** -> use `exportAsync({ format: 'PDF' })` from the Plugin API, or use the REST API image export endpoint for server-side automation.

4. **If CMYK accuracy is critical** -> add a post-processing step after Figma export. Figma will always output RGB.

5. **If variable images need swapping** -> use INSTANCE_SWAP component properties, not Variables (no IMAGE variable type exists).

6. **If the pipeline must run without a human opening Figma** -> template creation must happen in advance; only REST API reads/exports can run headlessly.

7. **If Lob is the print vendor** -> prefer HTML template export (Lob's native format) over PDF, since Lob's `{{merge_variables}}` system integrates directly with HTML.

8. **If the business has > 4 template variants to preview** -> Enterprise plan required for variable modes, OR use multiple files/pages, OR handle variation at the Lob merge-variable level rather than Figma level.
