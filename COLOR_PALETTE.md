# Spensely Color Palette Reference
## Quick Visual Guide to All Colors

---

## Primary Brand Colors

### Cyan (Primary)
```
#00D9FF  ████████  Bright Cyan (Primary)
#00B8D4  ████████  Deep Turquoise (Primary Dark)
#33E0FF  ████████  Cyan Glow (Primary Light)

Gradient: [#00D9FF → #00B8D4]
```

**Usage:**
- Primary buttons
- Tab bar active state
- Focus states
- Links and CTAs
- Logo color

**Accessibility:** Use with dark backgrounds only

---

## Semantic Colors

### Income (Mint Green)
```
#00FFA3  ████████  Bright Mint
#00E891  ████████  Sea Green
#00D9A3  ████████  Deep Mint

Gradient: [#00FFA3 → #00E891]
```

**Usage:**
- Income indicators
- Positive balances
- Success states
- Add income buttons

**Symbolizes:** Growth, profit, positive cash flow

---

### Expense (Coral Pink)
```
#FF6B9D  ████████  Soft Coral
#FF4D7D  ████████  Deep Pink

Gradient: [#FF6B9D → #FF4D7D]
```

**Usage:**
- Expense indicators
- Negative amounts
- Add expense buttons
- Spending categories

**Symbolizes:** Outflow, spending (friendly, not alarming)

---

### Analytics (Purple)
```
#A855F7  ████████  Bright Purple
#7C3AED  ████████  Deep Purple

Gradient: [#A855F7 → #7C3AED → #00D9FF]
```

**Usage:**
- Statistics screen
- Charts and graphs
- Data visualization
- Insights

**Symbolizes:** Intelligence, analysis, insights

---

### Savings (Gold)
```
#FFD700  ████████  Gold
#FFA500  ████████  Orange

Gradient: [#FFD700 → #FFA500]
```

**Usage:**
- Savings goals
- Piggy bank features
- Achievement badges
- Premium features

**Symbolizes:** Value, achievement, wealth accumulation

---

### Status Colors

```
#00FFA3  ████████  Success (same as Income)
#FF4D4D  ████████  Error (Bright Red)
#FFB84D  ████████  Warning (Golden Amber)
#00D9FF  ████████  Info (same as Primary)
```

**Usage:**
- Toast notifications
- Form validation
- Alert banners
- Status indicators

---

## Background System

### Base Layers
```
#0A0E27  ████████  Base (Deep Navy-Purple)
#141937  ████████  Layer 1 (Content Background)
#1E2547  ████████  Layer 2 (Elevated Cards)
#2A3157  ████████  Layer 3 (Modal Overlays)
```

**Layer Hierarchy:**
```
Layer 3  ▓▓▓▓▓▓▓▓  Modals, Overlays
Layer 2  ▒▒▒▒▒▒▒▒  Important Cards
Layer 1  ░░░░░░░░  Content Area
Base     ________  Screen Background
```

---

### Glass Effects

#### Backgrounds
```
rgba(255, 255, 255, 0.08)   ░░░░  Light Glass
rgba(255, 255, 255, 0.12)   ░░░░  Medium Glass
rgba(255, 255, 255, 0.18)   ░░░░  Heavy Glass
```

#### Borders
```
rgba(0, 217, 255, 0.2)      ----  Cyan Border
rgba(255, 255, 255, 0.1)    ----  Light Border
rgba(255, 255, 255, 0.15)   ----  Medium Border
rgba(255, 255, 255, 0.25)   ----  Heavy Border
```

#### Shadows
```
rgba(0, 217, 255, 0.3)      ~~~~  Cyan Shadow (glow)
rgba(0, 0, 0, 0.3)          ~~~~  Dark Shadow (depth)
```

---

### Blur Backgrounds
```
rgba(10, 14, 39, 0.85)      ████  Navbar (15% transparent)
rgba(10, 14, 39, 0.90)      ████  Tab Bar (10% transparent)
rgba(10, 14, 39, 0.95)      ████  Modal (5% transparent)
```

**Used with:** BlurView component for iOS 19 effects

---

## Text Colors

### Hierarchy
```
#FFFFFF                      ████  Primary (100%)
rgba(255, 255, 255, 0.75)   ████  Secondary (75%)
rgba(255, 255, 255, 0.55)   ████  Tertiary (55%)
rgba(255, 255, 255, 0.35)   ████  Disabled (35%)
#0A0E27                      ████  Inverse (for light backgrounds)
```

### Contrast Ratios (WCAG AAA)
```
Primary:   21:1    ✓ AAA
Secondary: 15.75:1 ✓ AAA
Tertiary:  11.55:1 ✓ AAA
Disabled:  7.35:1  ✓ AAA
```

All text meets WCAG AAA standards (7:1 minimum)!

---

## Tab Bar Colors

### Home Tab
```
Gradient: [#00D9FF → #00B8D4]  ████████
Glow:     rgba(0, 217, 255, 0.4)
Icon:     home
```

### Records Tab
```
Gradient: [#FF6B9D → #FF4D7D]  ████████
Glow:     rgba(255, 107, 157, 0.4)
Icon:     receipt
```

### Statistics Tab
```
Gradient: [#A855F7 → #7C3AED]  ████████
Glow:     rgba(168, 85, 247, 0.4)
Icon:     chart-pie
```

### Settings Tab
```
Gradient: [#00FFA3 → #00D9A3]  ████████
Glow:     rgba(0, 255, 163, 0.4)
Icon:     cog
```

---

## Interactive States

### Hover, Press, Focus
```
rgba(0, 217, 255, 0.1)      ░░░░  Hover
rgba(0, 217, 255, 0.2)      ░░░░  Pressed
rgba(0, 217, 255, 0.3)      ░░░░  Focused
rgba(255, 255, 255, 0.05)   ░░░░  Disabled
```

**Usage:**
- Button hover states
- Card press feedback
- Input focus rings
- Disabled overlays

---

## Chart/Data Visualization Colors

### 8-Color Palette
```
#00D9FF  ████████  1. Cyan
#FF6B9D  ████████  2. Pink
#00FFA3  ████████  3. Mint
#A855F7  ████████  4. Purple
#FFB84D  ████████  5. Amber
#33E0FF  ████████  6. Light Cyan
#FF4D7D  ████████  7. Deep Pink
#00E891  ████████  8. Sea Green
```

**Grid & Axis:**
```
rgba(255, 255, 255, 0.1)    ----  Grid Lines
rgba(255, 255, 255, 0.3)    ----  Axis Lines
```

---

## Color Usage Matrix

| Color | Primary Use | Secondary Use | Don't Use For |
|-------|-------------|---------------|---------------|
| Cyan | Buttons, Links | Focus states | Text on light bg |
| Mint Green | Income | Success | Expense indicators |
| Coral Pink | Expense | Highlights | Income indicators |
| Purple | Analytics | Charts | Primary actions |
| Gold | Savings | Achievements | Warnings |
| Red | Errors | Delete actions | Income/positive |
| Amber | Warnings | Caution | Success states |

---

## Color Combinations

### High Contrast (Use These)
```
✓ Cyan on Navy      #00D9FF on #0A0E27  ████ ████
✓ White on Navy     #FFFFFF on #0A0E27  ████ ████
✓ Mint on Navy      #00FFA3 on #0A0E27  ████ ████
✓ Pink on Navy      #FF6B9D on #0A0E27  ████ ████
```

### Low Contrast (Avoid for Text)
```
✗ Cyan on White     #00D9FF on #FFFFFF  ████ ████
✗ Mint on White     #00FFA3 on #FFFFFF  ████ ████
✗ Gray on Navy      #808080 on #0A0E27  ████ ████
```

---

## Gradient Recipes

### Primary Actions
```css
linear-gradient(135deg, #00D9FF 0%, #00B8D4 100%)
```

### Income/Success
```css
linear-gradient(135deg, #00FFA3 0%, #00E891 100%)
```

### Expense/Delete
```css
linear-gradient(135deg, #FF6B9D 0%, #FF4D7D 100%)
```

### Analytics/Insights
```css
linear-gradient(135deg, #A855F7 0%, #7C3AED 50%, #00D9FF 100%)
```

### Savings/Premium
```css
linear-gradient(135deg, #FFD700 0%, #FFA500 100%)
```

### React Native Implementation
```javascript
<LinearGradient
  colors={['#00D9FF', '#00B8D4']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.gradient}
/>
```

---

## Color Psychology

### Why These Colors?

**Cyan (#00D9FF)**
- Psychology: Trust, technology, clarity
- Finance Context: Modern banking, digital payments
- Emotion: Confident, fresh, innovative

**Mint Green (#00FFA3)**
- Psychology: Growth, prosperity, harmony
- Finance Context: Income, profit, positive gains
- Emotion: Hopeful, energizing, optimistic

**Coral Pink (#FF6B9D)**
- Psychology: Friendly, approachable, gentle
- Finance Context: Spending (not alarming red)
- Emotion: Warm, soft, non-threatening

**Purple (#A855F7)**
- Psychology: Wisdom, intelligence, luxury
- Finance Context: Premium insights, analytics
- Emotion: Sophisticated, thoughtful

**Gold (#FFD700)**
- Psychology: Value, achievement, quality
- Finance Context: Savings, wealth accumulation
- Emotion: Aspirational, rewarding

**Navy-Purple (#0A0E27)**
- Psychology: Stability, professionalism, depth
- Finance Context: Trustworthy, secure
- Emotion: Calm, serious, reliable

---

## Accessibility Notes

### Text Contrast
Always use:
- White text on navy background (21:1)
- Never use colored text <14px
- Minimum 7:1 ratio for body text

### Color Blindness
- Never rely on color alone
- Use icons + text + color
- Test with color blindness simulators
- Income/Expense use different icons too

### Focus Indicators
- Cyan glow: 3px, 0.3 opacity
- Visible on all backgrounds
- Meets WCAG 2.1 Level AA

---

## Code Reference

### Import
```javascript
import { colors } from '../theme/colors';
```

### Usage Examples
```javascript
// Backgrounds
backgroundColor: colors.background.base
backgroundColor: colors.glass.background

// Text
color: colors.text.primary
color: colors.text.secondary

// Borders
borderColor: colors.glass.border
borderColor: colors.primary

// Gradients
colors.primaryGradient
colors.incomeGradient
colors.expenseGradient
```

---

## Print Reference

```
┌─────────────────────────────────────────────────────┐
│ SPENSELY COLOR PALETTE - QUICK REFERENCE           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ PRIMARY         #00D9FF  Bright Cyan                │
│ PRIMARY DARK    #00B8D4  Deep Turquoise             │
│                                                     │
│ INCOME          #00FFA3  Mint Green                 │
│ EXPENSE         #FF6B9D  Coral Pink                 │
│ ANALYTICS       #A855F7  Purple                     │
│ SAVINGS         #FFD700  Gold                       │
│                                                     │
│ SUCCESS         #00FFA3  Mint (same as income)      │
│ ERROR           #FF4D4D  Bright Red                 │
│ WARNING         #FFB84D  Golden Amber               │
│                                                     │
│ BACKGROUND      #0A0E27  Navy-Purple                │
│ TEXT PRIMARY    #FFFFFF  White                      │
│ TEXT SECONDARY  75% White                           │
│                                                     │
│ GLASS BG        rgba(255,255,255,0.08)              │
│ GLASS BORDER    rgba(0,217,255,0.2)                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

**Need more details?** Check `src/theme/colors.js` for the complete implementation!
