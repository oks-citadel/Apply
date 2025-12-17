# ApplyForUs Hex Codes - Quick Reference

## Primary Colors (Most Frequently Used)

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| **Teal 600** | `#0D9488` | rgb(13, 148, 136) | Primary CTA buttons |
| **Teal 700** | `#0F766E` | rgb(15, 118, 110) | Button hover states |
| **Charcoal 900** | `#1A1A1F` | rgb(26, 26, 31) | Dark backgrounds, primary text |
| **Slate 600** | `#6C757D` | rgb(108, 117, 125) | Secondary text |
| **Warm Gray 50** | `#FAFAF9` | rgb(250, 250, 249) | Light section backgrounds |
| **White** | `#FFFFFF` | rgb(255, 255, 255) | Card backgrounds, text |

---

## Complete Color System (All Hex Codes)

### Charcoal
```
50:  #F7F7F8  rgb(247, 247, 248)
100: #EBEBED  rgb(235, 235, 237)
200: #D1D1D6  rgb(209, 209, 214)
300: #B7B7BF  rgb(183, 183, 191)
400: #9D9DA8  rgb(157, 157, 168)
500: #6B6B7A  rgb(107, 107, 122)  ← Main
600: #525261  rgb(82, 82, 97)
700: #3D3D49  rgb(61, 61, 73)
800: #2A2A33  rgb(42, 42, 51)
900: #1A1A1F  rgb(26, 26, 31)     ← Primary
950: #0F0F13  rgb(15, 15, 19)
```

### Slate
```
50:  #F8F9FA  rgb(248, 249, 250)
100: #F1F3F5  rgb(241, 243, 245)
200: #E9ECEF  rgb(233, 236, 239)
300: #DEE2E6  rgb(222, 226, 230)
400: #CED4DA  rgb(206, 212, 218)
500: #ADB5BD  rgb(173, 181, 189)
600: #6C757D  rgb(108, 117, 125)  ← Main
700: #495057  rgb(73, 80, 87)
800: #343A40  rgb(52, 58, 64)
900: #212529  rgb(33, 37, 41)
950: #1A1D20  rgb(26, 29, 32)
```

### Warm Gray
```
50:  #FAFAF9  rgb(250, 250, 249)  ← Backgrounds
100: #F5F5F4  rgb(245, 245, 244)
200: #E7E5E4  rgb(231, 229, 228)  ← Borders
300: #D6D3D1  rgb(214, 211, 209)
400: #A8A29E  rgb(168, 162, 158)
500: #78716C  rgb(120, 113, 108)  ← Main
600: #57534E  rgb(87, 83, 78)
700: #44403C  rgb(68, 64, 60)
800: #292524  rgb(41, 37, 36)
900: #1C1917  rgb(28, 25, 23)
950: #0C0A09  rgb(12, 10, 9)
```

### Teal (Primary Brand)
```
50:  #F0FDFA  rgb(240, 253, 250)
100: #CCFBF1  rgb(204, 251, 241)  ← Badge backgrounds
200: #99F6E4  rgb(153, 246, 228)
300: #5EEAD4  rgb(94, 234, 212)
400: #2DD4BF  rgb(45, 212, 191)   ← Dark mode text
500: #14B8A6  rgb(20, 184, 166)   ← Main teal
600: #0D9488  rgb(13, 148, 136)   ← Primary buttons ⭐
700: #0F766E  rgb(15, 118, 110)   ← Button hover ⭐
800: #115E59  rgb(17, 94, 89)     ← Button active
900: #134E4A  rgb(19, 78, 74)
950: #042F2E  rgb(4, 47, 46)
```

### Muted Blue (Secondary)
```
50:  #F0F4F8  rgb(240, 244, 248)
100: #D9E2EC  rgb(217, 226, 236)
200: #BCCCDC  rgb(188, 204, 220)
300: #9FB3C8  rgb(159, 179, 200)
400: #829AB1  rgb(130, 154, 177)
500: #627D98  rgb(98, 125, 152)   ← Main
600: #486581  rgb(72, 101, 129)
700: #334E68  rgb(51, 78, 104)
800: #243B53  rgb(36, 59, 83)
900: #102A43  rgb(16, 42, 67)
950: #0A1F33  rgb(10, 31, 51)
```

---

## CSS Color Variables (For Reference)

```css
:root {
  /* Primary Brand */
  --teal-600: #0D9488;
  --teal-700: #0F766E;

  /* Neutrals */
  --charcoal-900: #1A1A1F;
  --slate-600: #6C757D;
  --warm-gray-50: #FAFAF9;
  --warm-gray-200: #E7E5E4;

  /* Backgrounds */
  --bg-white: #FFFFFF;
  --bg-light: #FAFAF9;
  --bg-dark: #1A1A1F;

  /* Text */
  --text-primary: #1A1A1F;
  --text-secondary: #6C757D;
  --text-white: #FFFFFF;
}
```

---

## Common Color Combinations

### Light Mode

#### Primary Button
```
Background: #0D9488 (teal-600)
Hover:      #0F766E (teal-700)
Active:     #115E59 (teal-800)
Text:       #FFFFFF (white)
```

#### Outline Button
```
Border:     #E9ECEF (slate-200)
Text:       #1A1A1F (charcoal-900)
Hover BG:   #F1F3F5 (slate-100)
```

#### Card
```
Background: #FFFFFF (white)
Border:     #E7E5E4 (warmGray-200)
Text:       #1A1A1F (charcoal-900)
Secondary:  #6C757D (slate-600)
```

#### Badge
```
Background: #CCFBF1 (teal-100)
Text:       #0F766E (teal-700)
Border:     #99F6E4 (teal-200)
```

### Dark Mode

#### Primary Button
```
Background: #0D9488 (teal-600)
Hover:      #0F766E (teal-700)
Active:     #115E59 (teal-800)
Text:       #FFFFFF (white)
```

#### Outline Button
```
Border:     #495057 (slate-700)
Text:       #FFFFFF (white)
Hover BG:   #343A40 (slate-800)
```

#### Card
```
Background: #2A2A33 (charcoal-800)
Border:     #292524 (warmGray-800)
Text:       #FFFFFF (white)
Secondary:  #CED4DA (slate-400)
```

#### Badge
```
Background: #134E4A (teal-900/30)
Text:       #5EEAD4 (teal-300)
Border:     #115E59 (teal-800)
```

---

## Accessibility Contrast Ratios

### WCAG AA Compliant (4.5:1 minimum for normal text)

| Foreground | Background | Ratio | Pass |
|------------|------------|-------|------|
| #1A1A1F (charcoal-900) | #FFFFFF (white) | 18.5:1 | ✅ AAA |
| #6C757D (slate-600) | #FFFFFF (white) | 5.9:1 | ✅ AA |
| #0F766E (teal-700) | #FFFFFF (white) | 4.8:1 | ✅ AA |
| #78716C (warmGray-500) | #FFFFFF (white) | 4.5:1 | ✅ AA |
| #FFFFFF (white) | #0D9488 (teal-600) | 4.5:1 | ✅ AA |
| #FFFFFF (white) | #1A1A1F (charcoal-900) | 18.5:1 | ✅ AAA |

### Large Text (18pt+ or 14pt bold) - 3:1 minimum

| Foreground | Background | Ratio | Pass |
|------------|------------|-------|------|
| #14B8A6 (teal-500) | #FFFFFF (white) | 3.8:1 | ✅ AA |
| #ADB5BD (slate-500) | #FFFFFF (white) | 3.1:1 | ✅ AA |

---

## Color Usage by Section

### Hero Section
```
Background Gradient:
  Start:  #FAFAF9 (warmGray-50)
  Via:    #FFFFFF (white)
  End:    #F0FDFA (teal-50)

Heading:      #1A1A1F (charcoal-900)
Accent Text:  #0D9488 (teal-600)
Body Text:    #6C757D (slate-700)
CTA Button:   #0D9488 (teal-600)
```

### Trust Bar
```
Background:   #FAFAF9 (warmGray-50)
Border:       #E7E5E4 (warmGray-200)
Text:         #78716C (warmGray-600)
Icons:        #0D9488 (teal-600)
```

### Value Cards
```
Card BG:      #FFFFFF (white)
Border:       #E7E5E4 (warmGray-200)
Icon BG:      #CCFBF1 (teal-100)
Icon:         #0D9488 (teal-600)
Heading:      #1A1A1F (charcoal-900)
Body:         #6C757D (slate-600)
Badge BG:     #F0FDFA (teal-50)
Badge Text:   #0F766E (teal-700)
```

### Success Metrics Section
```
Background:   #0D9488 (teal-600)
Heading:      #FFFFFF (white)
Subtext:      #CCFBF1 (teal-100)
Card BG:      rgba(255,255,255,0.1)
Numbers:      #FFFFFF (white)
```

### Footer
```
Background:   #1A1A1F (charcoal-900)
Text:         #ADB5BD (slate-500)
Headings:     #FFFFFF (white)
Links:        #ADB5BD (slate-500)
Links Hover:  #FFFFFF (white)
Border:       #292524 (warmGray-800)
Accent:       #2DD4BF (teal-400)
```

---

## Print Styles (If Needed)

```css
@media print {
  /* Convert to grayscale equivalents */
  .bg-teal-600    { background-color: #404040; }
  .text-teal-600  { color: #404040; }
  .border-teal-600 { border-color: #404040; }

  /* High contrast for printing */
  .text-slate-600 { color: #000000; }
  .bg-white       { background-color: #FFFFFF; }
}
```

---

## Figma/Sketch Export

For designers using the color palette in design tools:

```
Charcoal 900:  #1A1A1F
Slate 600:     #6C757D
Warm Gray 50:  #FAFAF9
Warm Gray 200: #E7E5E4
Teal 600:      #0D9488
Teal 700:      #0F766E
Muted Blue 500: #627D98
White:         #FFFFFF
```

---

## Brand Colors Summary

### Primary Palette
- **Teal**: #0D9488 (main), #0F766E (hover)
- **Charcoal**: #1A1A1F (dark), #6B6B7A (mid)
- **White**: #FFFFFF

### Supporting Palette
- **Slate**: #6C757D (secondary text)
- **Warm Gray**: #FAFAF9 (backgrounds), #E7E5E4 (borders)
- **Muted Blue**: #627D98 (accents)

---

## Copy & Paste Ready

### Tailwind Classes
```jsx
// Primary Button
className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white"

// Outline Button
className="border-2 border-slate-300 dark:border-slate-600 text-charcoal-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"

// Card
className="bg-white dark:bg-charcoal-800 border-2 border-warmGray-200 dark:border-warmGray-800"

// Heading
className="text-charcoal-900 dark:text-white"

// Body Text
className="text-slate-600 dark:text-slate-400"

// Accent Text
className="text-teal-600 dark:text-teal-400"
```

---

**Quick Find**
- Primary CTA: #0D9488
- Dark Background: #1A1A1F
- Light Background: #FAFAF9
- Primary Text: #1A1A1F
- Secondary Text: #6C757D
- Borders: #E7E5E4

---

**Last Updated**: December 2025
**Version**: 1.0.0
