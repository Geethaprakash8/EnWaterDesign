# Integration Guide: EnWater UI Stylings & Interactive Effects

This guide explains how to export, import, and integrate the unified CSS stylings and JavaScript interactive effects from this project into a React or static frontend application.

---

## Files Exported

1. **Stylesheet**: [`exported-ui-styles.css`](file:///d:/Project%20Check/exported-ui-styles.css)
   - Contains core design system tokens (light and dark color palettes, typography, variables).
   - Contains layouts (header navigation bars, grids, footers, containers).
   - Contains components (double-sided flip cards, horizontal scroll rows, accordions, carousels, forms, and alerts).
   - Contains animations (fading reveal elements, keyframe scroll indicators, prefers-reduced-motion fallback limits).

2. **JavaScript Effects**: [`exported-ui-effects.js`](file:///d:/Project%20Check/exported-ui-effects.js)
   - Self-initializes basic DOM enhancements on ready (dates, intersection observers, click-to-flip cards, carousels, accordions).
   - Exports module functions for advanced custom setups (autoplay checks, tab switchers, toast clipboard helper).

---

## 1. Static HTML Page Integration

To use these styles and interactive scripts in a static environment, copy the files and reference them directly in your page head and body:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EnWater Design</title>
  <!-- Load the unified stylesheet -->
  <link rel="stylesheet" href="exported-ui-styles.css">
</head>
<body>

  <!-- Example 1: Viewport Reveal Item -->
  <div class="reveal">
    <h2>This slides up when scrolled into view</h2>
  </div>

  <!-- Example 2: Horizontal Carousel Track -->
  <section data-carousel>
    <button data-carousel-prev>Prev</button>
    <button data-carousel-next>Next</button>
    <div data-carousel-track class="scroll-wrap">
      <div style="min-width: 300px; height: 200px; background: #fff;">Card 1</div>
      <div style="min-width: 300px; height: 200px; background: #fff;">Card 2</div>
      <div style="min-width: 300px; height: 200px; background: #fff;">Card 3</div>
    </div>
  </section>

  <!-- Load the interaction effects library -->
  <script src="exported-ui-effects.js"></script>
</body>
</html>
```

---

## 2. React Application Integration (Vite / Next.js)

To implement these behaviors inside a React framework (such as `siteworks-react`), follow these steps:

### Step A: Load the Styles
Copy `exported-ui-styles.css` into your React src folder (e.g., `src/styles/exported-ui-styles.css`) and import it in your main entry file (`src/main.tsx` or `src/App.tsx`):

```tsx
// src/main.tsx or src/App.tsx
import './styles/exported-ui-styles.css';
```

### Step B: UI Components & React Hooks
Instead of loading raw scripts that modify the DOM directly (which can conflict with React's virtual DOM), it is best practice to replicate these interaction states in React state or custom hooks:

#### A. Scroll Reveal Component (`Reveal.tsx`)
Create a scroll reveal container using the React-friendly approach:

```tsx
// src/components/common/Reveal.tsx
import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delayClass?: 'reveal-delay-1' | 'reveal-delay-2' | 'reveal-delay-3';
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({ children, delayClass, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'visible' : ''} ${delayClass || ''} ${className}`}
    >
      {children}
    </div>
  );
};
```

#### B. Double-Sided Flip Card Component (`FlipCard.tsx`)
A React version of the white-front, green-back flip cards featuring manual click-to-flip controls:

```tsx
// src/components/common/FlipCard.tsx
import React, { useState } from 'react';

interface FlipCardProps {
  kicker: string;
  frontTitle: string;
  frontImage: string;
  backItems: { title: string; desc: string }[];
  backNote?: string;
}

export const FlipCard: React.FC<FlipCardProps> = ({ kicker, frontTitle, frontImage, backItems, backNote }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className={`card-media ${isFlipped ? 'is-flipped' : ''}`}>
      <div className="card-flip">
        {/* Front Face */}
        <div className="card-face card-front">
          <div className="thumb">
            <img src={frontImage} alt={frontTitle} />
          </div>
          <div className="body">
            <h3>{frontTitle}</h3>
          </div>
          <button 
            type="button" 
            className="flip-toggle"
            onClick={() => setIsFlipped(true)}
          >
            Details →
          </button>
        </div>

        {/* Back Face */}
        <div className="card-face card-back">
          <span className="back-kicker">{kicker}</span>
          <div className="back-copy">
            {backItems.map((item, idx) => (
              <div key={idx} className="back-item">
                <strong>{item.title}</strong>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
          {backNote && <p className="back-note" style={{marginTop: 'auto', fontSize: '12px', opacity: 0.8}}>{backNote}</p>}
          <button 
            type="button" 
            className="flip-toggle"
            onClick={() => setIsFlipped(false)}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### C. Process Capability Tab Switcher (`CapabilityTabs.tsx`)
A responsive tab switcher that shows different scopes and bullet items based on selected sidebar triggers:

```tsx
// src/components/sections/CapabilityTabs.tsx
import React, { useState } from 'react';

interface CapabilityData {
  title: string;
  body: string;
  items: string[];
}

interface CapabilityTabsProps {
  capabilities: Record<string, CapabilityData>;
}

export const CapabilityTabs: React.FC<CapabilityTabsProps> = ({ capabilities }) => {
  const keys = Object.keys(capabilities);
  const [activeKey, setActiveKey] = useState(keys[0]);
  const activeData = capabilities[activeKey];

  return (
    <div id="capabilities" className="grid-2">
      {/* Sidebar Triggers */}
      <div style={{ display: 'grid', gap: '8px' }}>
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            className="btn"
            style={{
              justifyContent: 'flex-start',
              background: activeKey === key ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: activeKey === key ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
              textAlign: 'left'
            }}
            onClick={() => setActiveKey(key)}
          >
            {capabilities[key].title}
          </button>
        ))}
      </div>

      {/* Content Display Panels */}
      <div style={{ display: 'grid', gap: '20px' }}>
        <h3 data-cap-title style={{ color: 'var(--teal)', fontSize: '24px' }}>{activeData.title}</h3>
        <p data-cap-body style={{ opacity: 0.8, lineHeight: 1.6 }}>{activeData.body}</p>
        <div data-cap-list style={{ display: 'grid', gap: '10px' }}>
          {activeData.items.map((item, idx) => (
            <div key={idx} className="step-outputs" style={{ background: 'rgba(0,0,0,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

#### D. Form Copy-to-Clipboard Clipboard Doser
A React function to handle packing contact form values into the clipboard buffer, then rendering a floating toast popover:

```tsx
// src/components/common/EnquiryForm.tsx
import React, { useState } from 'react';

export const EnquiryForm: React.FC = () => {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleCopyToClipboard = async () => {
    const textOutput = `EnWater Design Enquiry\nName: ${name || 'N/A'}\nDetails: ${details || 'N/A'}`;
    
    try {
      await navigator.clipboard.writeText(textOutput);
      triggerToast();
    } catch (err) {
      // Fallback
      alert('Failed to copy. Please select details and copy manually.');
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="form-group">
        <label>
          <span>Your Name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </div>
      <div className="form-group">
        <label>
          <span>Project Details</span>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} />
        </label>
      </div>
      
      <button type="button" className="btn primary" onClick={handleCopyToClipboard}>
        Copy details to clipboard
      </button>

      {showToast && (
        <div className="toast-feedback">
          ✓ Form copied to clipboard successfully
        </div>
      )}
    </div>
  );
};
```

---

## 3. Page-Specific Style & Interaction Maps

This section details exactly which HTML page categories in the project codebase use which layout wrappers, fonts, color palettes, and interaction effects.

### A. Intro Video Landing Page
* **Files**: `index.html`
* **Colors & Variables**: 
  - Background: `#000000` (pure black fallback).
  - Accent: `--accent: #55a092` (EnWater branding teal).
  - Overlay Panels: `rgba(0,0,0,0.18)` blur mask.
* **Typography**:
  - Font Family: `system-ui, -apple-system, sans-serif` (no custom external web fonts loaded).
* **Key CSS Layout Classes**:
  - `.wrap` - fixed full viewport alignment (`position: fixed; inset: 0;`).
  - `.ui` - flexible bottom brand overlay panel (`display: flex; align-items: flex-end; justify-content: space-between;`).
  - `.fallback` - centered alert box with `backdrop-filter: blur(10px)`.
* **Interactive JS Effects**:
  - Autoplay blocker diagnostics detection (checks if video play event starts within `900ms`).
  - Skip trigger redirection & manual playback play/pause handlers.

### B. Core Brand Content Pages (Oat/Ivory Theme)
* **Files**: `about.html`, `get-in-touch.html`, `thank-you.html`
* **Colors & Variables**:
  - Theme variables: `--ink: #0e1614`, `--ivory: #f5f2eb` (warm oat background), `--stone: #d8d3c8`, `--teal: #2d8a78`.
  - Contrast background: `--deep: #0c1f1c` (dark forest green hero and footer).
* **Typography**:
  - Headings: `Georgia, serif` (`var(--serif)`). Sizes: `clamp(44px, 6.5vw, 92px)` for H1 hero titles; `clamp(30px, 3.4vw, 48px)` for H2 subtitles.
  - Body: `system-ui, sans-serif` (`var(--sans)`). Size: `17px` for leads, `14.5px` for description copy.
* **Key CSS Layout Classes**:
  - `.nav` - absolute fixed blur navbar header (`height: 64px; backdrop-filter: blur(16px);`).
  - `.who-grid` / `.grid-2` - split grid columns with `gap: 80px`.
  - `.progress-steps` - horizontal connector steps flow layout.
* **Interactive JS Effects**:
  - Viewport-entry observer reveals (`.reveal` class scroll listener).
  - Simple dropdown panels (`.nav-dd-panel`) toggle displays on cursor focus/hover.
  - Clipboard enquiry compiler with feedback notification toast banner.

### C. Main Dashboard Home Page
* **Files**: `home.html`
* **Colors & Variables**:
  - Theme variables: `--brand: #107a70`, `--ink: #0b1220`, `--muted: #5b6b7b`, `--bg: #f6faf9`.
* **Typography**:
  - Primary font: `Inter, sans-serif` (Google Fonts).
  - H1 headline size: `clamp(28px, 3.1vw, 44px)`.
* **Key CSS Layout Classes**:
  - `header` - sticky white site navbar (`position: sticky; top: 0;`).
  - `.hero-grid` - split layout wrapping image media.
  - `.grid-3`, `.grid-4` - responsive columns that stack on mobile.
* **Interactive JS Effects**:
  - Dual-sided image flip cards (white/blue transition panels) with Escape and outside-reset bindings.
  - Slick navigation dropdown positioning engine (`aquad-nav-v25`) that avoids boundary clipping.

### D. Advisory & Wastewater Process Pages (Sage/Forest Theme)
* **Files**: Subfolders `Advisory/`, `design-sourcing/`, `FlowPlan/`, `How We Engage/`, `Projects/`, `Sectors/`
* **Colors & Variables**:
  - Theme variables: `--cream: #f2f5f4` (sage/cool background), `--ink: #071a21`, `--forest: #0f3b45`, `--forest2: #0a242b`, `--accent: #55a092`.
* **Typography**:
  - Headings: `Georgia, serif` (`var(--serif)`). H2 size: `clamp(26px, 2.6vw, 38px)`.
  - Body: `system-ui, sans-serif` (`var(--sans)`).
* **Key CSS Layout Classes**:
  - `.advisory-section-nav` - sticky scrollable sub-navigation chip bar.
  - `.accordion` - vertical list wrappers.
  - `.scroll-wrap` - horizontally scrollable rows.
* **Interactive JS Effects**:
  - Dynamic subnav offset height calculator (`setTopNavHeight`).
  - Scroll anchors with customized padding offsets.
  - Capability tab switchers (update descriptions, lists on click triggers).
  - Vertical accordion toggles (`+` / `-` toggle indicator switchers).
  - Horizontal chevron carousel row scrollers.

```
