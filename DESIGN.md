# Design System Inspired by Apple Fitness+

## 1. Visual Theme & Atmosphere

Apple Fitness+ embodies a premium athletic minimalism — a design language that fuses Apple's signature restraint with the high-energy pulse of modern fitness culture. The visual personality is clean, confident, and kinetic: vast areas of pure white and near-black create a stage where a single electric lime-green call-to-action bursts with urgency and vitality. Full-bleed cinematic video and photography ground the experience in real human movement, while typographic weight contrasts — bold near-black statements alongside lighter secondary text — guide the eye with authority. Depth is achieved not through heavy shadows but through tonal layering and generous whitespace. The overall atmosphere communicates effortless capability: this is a system that works as hard as its users do, without ever looking strained.

**Key Characteristics:**
- **Electric accent energy:** A single bold lime-green (`#9EF200`) punctuates an otherwise achromatic palette, signaling action and momentum
- **Cinematic scale:** Hero sections use full-viewport imagery and video with overlaid white display type for maximum impact
- **Apple-grade typographic precision:** SF Pro Display and SF Pro Text at exact optical sizes with carefully calibrated weights and line heights
- **Radical whitespace:** Generous padding and negative space give every element room to breathe and assert itself
- **Monochromatic depth:** Near-black neutrals (`#1D1D1F`, `#333336`) replace pure black for a sophisticated, softer darkness
- **Minimal chrome:** Navigation is transparent or near-transparent; borders and shadows are subtle or absent
- **Content-first hierarchy:** UI chrome recedes; product imagery and messaging are always the protagonist

---

## 2. Color Palette & Roles

### Primary
- **Apple Blue** (`#0071E3`): Primary interactive color; used for hyperlinks, inline CTAs, and system-level interactive text across standard content sections
- **Apple Blue Dark** (`#006EDB`): Hover and pressed state for primary blue interactive elements
- **Apple Blue Mid** (`#0076DF`): Focus ring and alternative interactive states; used in select contextual link treatments
- **Apple Blue Bright** (`#0077ED`): Elevated interactive state; used sparingly on hover over high-contrast backgrounds

### Accent Colors
- **Fitness Lime** (`#9EF200`): Primary CTA button background (e.g., "Try it free*"); reserved exclusively for the hero call-to-action pill button; conveys energy, urgency, and brand vitality
- **Fitness Lime Bright** (`#AAFF00`): Hover state for the lime CTA button; slightly more saturated to signal interactivity

### Interactive
- **CTA Text on Lime** (`#1D1D1F`): Text color placed on lime CTA buttons; ensures AAA contrast on the bright accent
- **Link Text** (`#0071E3`): Standard inline link color throughout body content
- **Link Text Hover** (`#006EDB`): Darkened link color on hover

### Neutral Scale
- **Ink** (`#1D1D1F`): Primary text color for all body copy, headings, and UI labels; Apple's signature near-black
- **Carbon** (`#333336`): Secondary text, subheadings, and muted label text; used heavily in feature copy
- **True Black** (`#000000`): Deep backgrounds, hero overlays, and maximum-contrast surfaces
- **Secondary Text** (`#6E6E73`): Tertiary UI text, legal footnotes, placeholder text, and de-emphasized descriptions
- **Dark Surface** (`#272729`): Dark card backgrounds and elevated dark-mode surfaces
- **Deep Background** (`#18181A`): Near-black section backgrounds; used for premium dark sections

### Surface & Borders
- **Pure White** (`#FFFFFF`): Page background, card surfaces, light navigation bar, and text over dark imagery
- **Hairline** (`#E8E8ED`): Dividers, card borders, and subtle separator lines; lightest visible stroke in the system

---

## 3. Typography Rules

### Font Family
- **Primary — SF Pro Text:** `"SF Pro Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif` — Used for all body copy, navigation links, captions, buttons, and UI labels up to 19px
- **Secondary — SF Pro Display:** `"SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif` — Used for display headings, section titles, and large typographic statements at 20px and above

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display Hero | SF Pro Display | 80px | 700 | 88px | `-0.02em` | Full-bleed hero headline over video/imagery; color: `#FFFFFF` |
| Heading 1 | SF Pro Display | 34px | 600 | 50px | `-0.01em` | Section-level primary headings; color: `#1D1D1F` |
| Heading 2 / Feature Title | SF Pro Display | 28px | 600 | 34px | `-0.01em` | Feature section titles; color: `#1D1D1F` |
| Heading 3 / Card Title | SF Pro Display | 19px | 600 | 23px | `0em` | Card headings and subsection labels; color: `#1D1D1F` |
| Large Body / Callout | SF Pro Text | 17px | 400 | 25px | `0em` | Primary body text, nav links, callout paragraphs; color: `#1D1D1F` |
| Body Emphasis | SF Pro Text | 17px | 600 | 25px | `0em` | Bold inline body text for key stats ("12 workout types"); color: `#1D1D1F` |
| Body Secondary | SF Pro Text | 14px | 400 | 20px | `0em` | Secondary descriptive text, supporting copy; color: `#333336` |
| Navigation Link | SF Pro Text | 12px | 400 | 16px | `0em` | Top global nav items; color: `rgba(0,0,0,0.8)` |
| Caption / Legal | SF Pro Text | 12px | 400 | 16px | `0em` | Footnotes, disclaimers, asterisk copy; color: `#6E6E73` |
| Button Label | SF Pro Text | 17px | 400 | 25px | `0em` | CTA button text; color: `#1D1D1F` on lime, `#FFFFFF` on dark |
| Brand Wordmark | SF Pro Display | 24px | 600 | 28px | `0em` | "Apple Fitness+" logo-text in nav; color: `#333336` |
| Code / Metric | SF Pro Display | 24px | 600 | 24px | `0em` | In-app metric overlays (heart rate, calories); color: `#FFFFFF` |

### Principles
- **Optical sizing:** SF Pro Display is used exclusively at ≥20px; SF Pro Text handles all smaller UI sizes
- **Weight contrast creates hierarchy:** Bold weight (`600`–`700`) for structural statements; regular (`400`) for supporting copy — never medium weight
- **Black-and-grey duet:** Primary text in `#1D1D1F`, secondary in `#333336`, tertiary in `#6E6E73` — three tiers, no more
- **Center alignment for feature copy:** Multi-line feature paragraphs and section headlines are center-aligned on desktop; left-aligned on mobile
- **No text decoration on nav links at rest:** Underline appears only on hover for inline links; nav items use opacity shifts instead
- **Tight hero tracking:** Display sizes use `letter-spacing: -0.02em` to maintain optical density at large scales

---

## 4. Component Stylings

### Buttons

#### Primary CTA — Lime Pill ("Try it free*")
```
background-color: #9EF200;
color: #1D1D1F;
font-family: "SF Pro Text", -apple-system, sans-serif;
font-size: 17px;
font-weight: 400;
line-height: 25px;
padding: 12px 24px;
border-radius: 36px;
border: none;
box-shadow: none;
cursor: pointer;
display: inline-block;
white-space: nowrap;
```
- **Hover:** `background-color: #AAFF00;` — brightness boost, no other change
- **Active/Pressed:** `background-color: #8DD900;` — slight darkening
- **Focus:** `outline: 3px solid #0071E3; outline-offset: 2px;`

#### Primary CTA — Lime Pill on Dark Background (hero in-page variant)
```
background-color: #9EF200;
color: #1D1D1F;
font-size: 17px;
font-weight: 400;
padding: 16px 28px;
border-radius: 36px;
border: none;
min-width: 160px;
```
- **Hover:** `background-color: #AAFF00;`

#### Secondary Button — Ghost / Text Link
```
background-color: transparent;
color: #0071E3;
font-family: "SF Pro Text", -apple-system, sans-serif;
font-size: 17px;
font-weight: 400;
line-height: 25px;
padding: 0;
border: none;
border-radius: 0;
box-shadow: none;
text-decoration: none;
cursor: pointer;
```
- **Hover:** `color: #006EDB; text-decoration: underline;`

#### Icon/Utility Button (nav search, bag icons)
```
background-color: transparent;
color: #1D1D1F;
font-size: 17px;
padding: 0;
border: none;
border-radius: 0;
height: 44px;
width: 22px;
box-shadow: none;
```
- **Hover:** `opacity: 0.7;`

---

### Cards & Containers

#### Feature Content Card (white surface)
```
background-color: #FFFFFF;
border-radius: 18px;
border: 1px solid #E8E8ED;
padding: 32px;
box-shadow: none;
overflow: hidden;
```

#### Dark Feature Card
```
background-color: #1D1D1F;
border-radius: 18px;
border: none;
padding: 32px;
color: #FFFFFF;
overflow: hidden;
```

#### App Info Banner (top sub-nav bar)
```
background-color: #F5F5F7;
padding: 12px 20px;
border-radius: 0;
text-align: center;
font-size: 14px;
color: #1D1D1F;
```

#### Hero Section Container
```
position: relative;
width: 100%;
min-height: 100vh;
overflow: hidden;
background-color: #000000;
display: flex;
align-items: flex-end;
padding-bottom: 76px;
```

---

### Inputs & Forms

#### Text Input
```
background-color: #FFFFFF;
color: #1D1D1F;
font-family: "SF Pro Text", -apple-system, sans-serif;
font-size: 17px;
font-weight: 400;
line-height: 25px;
padding: 12px 16px;
border-radius: 10px;
border: 1px solid #E8E8ED;
box-shadow: none;
outline: none;
width: 100%;
```
- **Focus:** `border-color: #0071E3; box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.25);`
- **Placeholder text:** `color: #6E6E73;`
- **Disabled:** `background-color: #F5F5F7; color: #6E6E73; border-color: #E8E8ED; cursor: not-allowed;`

#### Search Input (navigation)
```
background-color: transparent;
border: none;
font-size: 17px;
color: #1D1D1F;
padding: 0 8px;
height: 44px;
```

---

### Navigation

#### Global Top Nav Bar (Apple universal nav)
```
background-color: rgba(255, 255, 255, 0.85);
backdrop-filter: saturate(180%) blur(20px);
-webkit-backdrop-filter: saturate(180%) blur(20px);
border-bottom: 1px solid rgba(0, 0, 0, 0.08);
height: 44px;
width: 100%;
display: flex;
align-items: center;
justify-content: center;
position: sticky;
top: 0;
z-index: 9999;
```

#### Nav Link Item
```
color: rgba(0, 0, 0, 0.8);
font-family: "SF Pro Text", -apple-system, sans-serif;
font-size: 12px;
font-weight: 400;
line-height: 16px;
padding: 0 8px;
height: 44px;
display: inline-flex;
align-items: center;
text-decoration: none;
background-color: transparent;
border: none;
```
- **Hover:** `color: rgba(0, 0, 0, 0.5);`

#### Fitness+ Sub-Nav Bar
```
background-color: rgba(255, 255, 255, 0.85);
backdrop-filter: saturate(180%) blur(20px);
height: 52px;
display: flex;
align-items: center;
justify-content: space-between;
padding: 0 20px;
position: sticky;
top: 44px;
z-index: 9998;
border-bottom: 1px solid #E8E8ED;
```

#### Wordmark / Brand Logo Text
```
font-family: "SF Pro Display", -apple-system, sans-serif;
font-size: 24px;
font-weight: 600;
line-height: 28px;
color: #333336;
padding: 9px 11px 7px 11px;
text-decoration: none;
```

---

### Badges & Pills

#### Activity Ring Badge / App Icon Badge
```
border-radius: 20px;
overflow: hidden;
width: 40px;
height: 40px;
```

#### Metric Label Badge (in-app overlay)
```
background-color: rgba(0, 0, 0, 0.6);
color: #FFFFFF;
font-size: 12px;
font-weight: 600;
padding: 4px 8px;
border-radius: 20px;
```

---

## 5. Layout Principles

### Spacing System
Base unit: **4px**

| Token | Value | Usage Context |
|---|---|---|
| `space-2` | 8px | Icon padding, inline gaps, small insets |
| `space-3` | 12px | Tight component internal margins |
| `space-4` | 16px | Standard component margin, list item gaps |
| `space-5` | 20px | Card internal padding, section sub-gaps |
| `space-6` | 24px | Button padding horizontal, form field gaps |
| `space-7` | 28px | Button padding in large CTA variant |
| `space-8` | 32px | Card padding, section content internal spacing |
| `space-9` | 36px | Large component padding, modal insets |
| `space-10` | 40px | Section top/bottom padding (mobile) |
| `space-11` | 44px | Navigation bar height; minimum touch target |
| `space-15` | 60px | Gap between major feature blocks |
| `space-19` | 76px | Hero section bottom padding, major section vertical rhythm |

### Grid & Container
- **Max content width:** `980px` centered (matches Apple's standard content rail)
- **Wide/edge-to-edge sections:** `100vw` — hero video, full-bleed imagery
- **Column strategy:** Single centered column for editorial content; 2-column grid for feature comparison sections; 3-column grid for workout type cards at ≥1024px
- **Section padding (desktop):** `padding: 76px 20px` vertically
- **Section padding (mobile):** `padding: 40px 16px` vertically
- **Horizontal margins:** `margin: 0 auto` with `max-width: 980px; padding: 0 20px;`

### Whitespace Philosophy
Apple Fitness+ uses whitespace as an active design element, not passive fill. Large vertical breathing room (76px+ between sections) prevents the interface from feeling cluttered despite heavy typographic and media content. Each section is treated as a distinct visual composition. The white background sections feel expansive and editorial; dark sections feel immersive and focused. Internal component spacing is tight (8–16px) while inter-section spacing is dramatically generous.

### Border Radius Scale

| Value | Context |
|---|---|
| `4px` | Subtle micro-rounding on small UI elements, tags |
| `10px` | Input fields, small cards |
| `18px` | Feature cards, modal dialogs, image containers |
| `20px` | Badges, pill tags, activity indicators |
| `36px` | CTA buttons (large pill shape) |
| `980px` | Full pill containers (visually equivalent to fully-rounded) |
| `50%` | Circular elements: avatar thumbnails, icon containers |

---

## 6. Depth & Elevation

Apple Fitness+ deliberately avoids heavy shadow systems. Elevation is communicated through tonal contrast (light/dark surface switching), not drop shadows. Where shadows exist, they are ultra-subtle and used only to lift interactive surfaces on hover.

| Level | Treatment | Use |
|---|---|---|
| 0 – Flat | `box-shadow: none;` | Default state for all nav, body text, and most cards; relies on background color contrast |
| 1 – Hairline | `box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.08);` | Navigation bar bottom separator; subtle section dividers |
| 2 – Card Lift | `box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);` | Feature cards on white background at rest; gentle floating effect |
| 3 – Card Hover | `box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.12);` | Card hover state; communicates interactivity |
| 4 – Modal / Sheet | `box-shadow: 0 20px 60px 0 rgba(0, 0, 0, 0.30);` | Overlay panels, dropdown menus, modal dialogs |
| 5 – Focus Ring | `box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.40);` | Keyboard focus state on interactive elements |

Shadows use `rgba(0, 0, 0, …)` exclusively — no colored shadows. The system leans on surface color transitions (white → near-black sections) to establish depth hierarchy without shadow stacking.

---

## 7. Do's and Don'ts

### Do
- **Use `#9EF200` exclusively for the primary CTA button** — this color is reserved for action; placing it anywhere else dilutes its signal
- **Use SF Pro Display for headings ≥20px and SF Pro Text for ≤19px** — maintain Apple's optical-size typographic split
- **Center-align feature headlines and supporting body copy** in full-width editorial sections at desktop widths ≥768px
- **Use `#1D1D1F` as the default text color** — never pure `#000000` for body text; it is too harsh against white
- **Use `#6E6E73` for secondary, tertiary, and legal text** — maintain the three-tier gray hierarchy
- **Apply `backdrop-filter: saturate(180%) blur(20px)` to sticky navigation** for the signature Apple frosted-glass effect
- **Maintain 44px minimum height for all interactive touch targets** (buttons, nav links, icon buttons)
- **Use `border-radius: 36px` for all pill CTA buttons** to achieve the fully-rounded capsule shape
- **Rely on color contrast between sections (white vs. near-black) to convey depth** — prefer tonal layering over shadows
- **Use generous vertical section padding (76px desktop, 40px mobile)** to preserve the editorial, magazine-like pacing
- **Render the Apple Fitness+ wordmark** at `font-size: 24px; font-weight: 600` in `#333336` — never all-caps, never in the accent color

### Don't
- **Don't use `#9EF200` for decorative elements, text, borders, or backgrounds** other than the primary CTA button — it loses its urgency
- **Don't use font weights other than 400 (regular) and 600 (semibold)** — this system has no medium (500) or black (900) weights
- **Don't apply drop shadows to buttons** — CTA buttons achieve prominence through color alone, not elevation
- **Don't use more than three text colors on a single section** — stick to `#1D1D1F`, `#333336`, and `#6E6E73`
- **Don't add border-radius to the navigation bar or full-width banners** — these elements remain edge-to-edge with no rounding
- **Don't underline navigation links at rest** — underline is reserved for hover states on inline body links only
- **Don't use pure `#000000` as a background** where `#1D1D1F` or `#18181A` would suffice — pure black is for hero overlays
- **Don't exceed `max-width: 980px` for text-heavy content sections** — long line lengths degrade readability at full viewport width
- **Don't stack multiple colored accents in the same section** — the lime green loses impact when competing with other hues
- **Don't use `border-radius` below `18px` for cards** — smaller radii conflict with the premium, rounded Apple aesthetic
- **Don't reduce touch targets below 44px** on any interactive element, even if the visible element is smaller

---

## 8. Responsive Behavior

### Breakpoints

| Name | Min Width | Key Changes |
|---|---|---|
| **xs / Mobile** | 0px | Single column; 16px horizontal page padding; hero type ~40px; nav collapses to hamburger; CTA buttons full-width; center-aligned body copy |
| **sm / Large Mobile** | 480px | Single column; 20px horizontal padding; hero type ~52px; increased line heights; card grids remain single column |
| **md / Tablet** | 768px | 2-column grid for feature cards; hero type ~64px; horizontal padding 24px; section padding 60px vertical; nav links visible; sub-nav becomes sticky |
| **lg / Desktop** | 1024px | 3-column grid for workout cards; hero type ~80px; `max-width: 980px` content rail active; navigation fully expanded; section padding 76px vertical |
| **xl / Wide Desktop** | 1440px | Full-width layout locks to `max-width: 980px`; hero video remains full-bleed; additional whitespace appears in side gutters automatically |

### Touch Targets
- **Minimum touch target height:** `44px` — applied to all nav links, buttons, and icon controls via `min-height: 44px`
- **Minimum touch target width:** `44px` for icon buttons; text buttons expand naturally
- **Tap area expansion:** Use `padding` to expand the visual hit area on small icons without changing their visual size (e.g., nav icon buttons use `width: 22px` visually but `height: 44px` tap target)
- **CTA buttons on mobile:** `padding: 16px 28px` to maintain comfortable finger-press area; never reduce below `48px` total height on touch devices

### Collapsing Strategy
- **Navigation:** Global Apple nav collapses to Apple logo + hamburger menu at ≤767px; Fitness+ sub-nav retains wordmark and lime CTA button
- **Hero section:** Video remains full-bleed at all breakpoints; headline type scales down from 80px → 40px using fluid type or breakpoint steps; CTA button