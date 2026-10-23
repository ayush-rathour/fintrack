# FinTrack v17.7 - Personal Expense Tracker (PWA)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with HTML5](https://img.shields.io/badge/HTML-5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Styled with CSS3](https://img.shields.io/badge/CSS-3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Deployed on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?logo=netlify&logoColor=white)](https://fintrack-ar.netlify.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white)](https://github.com/ayush-rathour/fintrack)

> **FinTrack** is a modern, offline-first personal expense tracker built with semantic HTML5, hand-written CSS3, and vanilla JavaScript (ES6+). Packaged as an installable Progressive Web App, it lets users record, search, filter, analyse, and export everyday spending  with all data kept entirely on-device in `localStorage`. No accounts, no backend, no network calls beyond loading static assets and CDN libraries.

**Live Application:** https://fintrack-ar.netlify.app
**Installable APK:** https://ayushrathour.pages.dev/files/FinTrack_v17.apk

> **Note:** FinTrack currently focuses on expense tracking only. Income tracking and full balance management are not yet implemented (see Roadmap).

---

# Table of Contents

1. Overview
2. Key Features
3. Tech Stack
4. Project Structure
5. Application Modules
6. Getting Started
7. Configuration Guide
8. Deployment
9. Performance & Accessibility
10. Privacy & Security
11. Browser Support
12. Credits & Attributions
13. Contact
14. License

---

# Overview

FinTrack is a lightweight, framework-free finance app that helps people track and understand their spending without any server, account, or cloud dependency. Everything  the transaction ledger, the theme preference, the PIN hash, the monthly budget  lives in the browser's `localStorage` on the user's own device.

The UI follows a fintech-inspired blue-gradient design with rounded surfaces, soft shadows, and a large library of hand-tuned CSS animations (spring easing, staggered list entrances, sliding "pill" indicators behind active tabs/segments, shimmer sweeps, number pop-ins, etc.). The app is a four-tab single-page interface  **Home**, **Insights**, **Charts**, and **Settings**  with a floating bottom tab bar and full light/dark theme support.

---

# Key Features

## User Experience & Interface

- **Four-tab app shell** (Home / Insights / Charts / Settings) with a floating pill-shaped bottom navigation bar, animated tab-switch transitions (slide left/right depending on direction), and a sliding highlight pill behind the active icon.
- **Light & dark themes**, toggled from Settings via a two-way animated switch; the choice is persisted in `localStorage` and re-applied on load. Charts, category colors, and badge colors all have dedicated dark-mode palettes.
- **Sticky header** showing the app name and a live "This Month" spend chip that flashes on update.
- **Sticky search bar and filter bar** on the Home tab so they stay visible while scrolling a long transaction list.
- **Animated statistics**: total spent, today's spend, and daily average count up/down smoothly whenever the underlying numbers change, with a pop animation on the value itself.
- **Skeleton loading state** utility for the transaction list, and **scroll-reveal** animations (via `IntersectionObserver`) for list items beyond the first six.
- **Ripple effect** on primary buttons, category chips, sort buttons, timer segments, tab buttons, PIN keys, and modal buttons.
- **Toast notification system** (success / error / info / warning) with auto-dismiss progress bars, plus a dedicated **undo toast** used for deletions.
- **Glass-style modal windows** for confirmations, custom export, and data import.
- Fully **responsive layout** with dedicated breakpoints for ≤380px, ≤600px, and ≥901px (desktop gets a centered, rounded "phone-card" shell).

---

## Expense Management

### Recording & Editing

- Add an expense with **description** (up to 60 characters, with a live counter that turns amber near the limit and red/pulses at the limit), **amount**, **date**, and **category**.
- **In-place editing**: clicking edit on a transaction loads it back into the form, highlights the form card and the row being edited, and swaps the submit button to "Update Expense."
- **One-click delete with a 5-second Undo window** via a dedicated undo toast  deleted items can be restored before the toast expires.
- Smooth **exit/entry animations**: new rows get a border "flash," deleted rows animate out and collapse, and the list uses keyed diffing so re-renders don't cause flicker.

### Categories

Transactions are organised into eight built-in categories, each with its own icon and color (light/dark variants):

- Food & Dining
- Travel
- Shopping
- Health
- Entertainment (labeled "Fun" in the picker)
- Bills
- Education
- Other

### Browsing, Search, Sort & Filter

- **Instant search** (debounced) across description, amount, formatted date, and category.
- **Sort toggle** by Date or Amount, click again to flip ascending/descending (with an animated arrow icon).
- **Category filter dropdown** to narrow the list to a single category.
- **Empty state** illustration when no transactions match the current filters.

---

## Spending Analytics & Visualisation (Home & Charts tabs)

### Live Summary Stats (Home)

- **Total Spent** and total transaction count.
- **Today's spend** and today's transaction count.
- **Daily Average** (based on the span of days between the first and last recorded expense, capped at 90 days) and the number of active days it covers.
- **This Month** total shown as a pill in the sticky header.
- **Monthly budget bar** (only shown once a budget is set in Settings): fills proportionally to spend, turns amber past 80% and red/pulsing once over budget, and shows remaining/over-budget amount.

### Interactive Charts (Chart.js)

All charts respect the selected time period (**7 Days / 30 Days / 3 Months / All Time**, via an animated sliding-pill switcher) and automatically re-theme when switching light/dark mode:

- **Daily Spending Trend**  a filled line chart of spend per day, with gradient fill and smart point sizing for dense data.
- **Category Breakdown**  a doughnut chart with a generated legend beneath it.
- **Weekly Comparison**  a bar chart of the last 8 Monday–Sunday calendar weeks, highlighting the current week and the single highest-spending week, plus a stat strip (This Week / Last Week / % Change / Records).
- Each chart shows a friendly **empty-state overlay** (icon + message) instead of a blank canvas when there's no data for the selected period.
- Every chart can be **exported as a PNG** via a dedicated download button on its card.

---

## Smart Insights Engine (Insights tab)

Insight cards are generated dynamically from the current transaction data and rendered as **expandable accordion cards** (tap to expand a detail panel; only one stays open at a time). Cards currently generated:

1. **This Month**  total spend, count, daily average, and a breakdown of the month's top 3 categories, with a biggest-expense callout.
2. **Top Spending Category**  the all-time leading category with its share of total spend, a full category breakdown bar list, and the top 5 individual expenses in that category.
3. **Weekly Trend**  compares the last 7 days to the previous 7 days (increasing / decreasing / stable), with a day-by-day bar breakdown of the current week.
4. **Largest Expense**  the single biggest transaction on record, its % of total spend, and a top-5 "biggest expenses" list.
5. **30-Day Daily Average**  average daily spend over the trailing 30 days, a projected monthly total, and a week-by-week (Week 1–4) breakdown.
6. **Recurring Expense**  auto-detects any description repeated 3+ times, shows total/average/yearly-projected spend on it, its most recent occurrences, and a ranked list of all other recurring expenses.

Each card includes a short plain-language observation and a practical tip; cards only appear when there's enough data to support them (e.g., the recurring-expense card is skipped entirely if nothing repeats).

---

## Security & Privacy

FinTrack never leaves the device  there is no login, no cloud sync, and no analytics beacon in the shipped code.

### PIN Lock

- **4-digit PIN** entered via an on-screen numeric keypad (also supports the physical keyboard: digits, Backspace/Delete, Enter).
- PINs are never stored in plain text  each PIN is combined with a randomly generated, persisted salt and hashed with **SHA-256** (`crypto.subtle.digest`) before being saved to `localStorage`.
- Full **Set / Change / Remove PIN** flows, each requiring the correct current PIN before a change or removal takes effect.
- **3 wrong attempts trigger a 30-second lockout**, with a live countdown message; the lockout state is persisted so it survives a page refresh.
- **Auto-lock on inactivity**: choose 15s / 30s / 1m / 2m / Off from a sliding segmented control in Settings. Any mouse move, key press, touch, click, or scroll resets the idle timer; once it fires (and a PIN is set), the PIN overlay reappears automatically.
- Visual feedback on entry: dots fill as digits are typed, the PIN box shakes on a wrong entry, and flashes green on success.

### Data Ownership

- All expenses, the PIN hash + salt, the theme choice, the budget, and the auto-lock preference are stored exclusively in the browser's `localStorage`.
- **Clear All Data** (in Settings, behind a confirmation modal) wipes `localStorage` entirely  including the PIN  and reloads the app.

---

## Data Import & Export

### Export

- **Export PDF**  a full, all-time report generated client-side with **jsPDF + jsPDF-AutoTable**: branded header, generation date, five summary stat cards (total expenses, total amount, 90-day daily average, highest-spend category, highest-spend day), a complete sorted transaction table, and a footer with page numbers and a linked developer credit on every page.
- **Export JSON**  downloads the full transaction array as a formatted `.json` backup file.
- **Custom Export**  opens a modal to choose a **time period** (This Month / Last Month / Last 3 Months / This Year / Custom Range with start & end date pickers) and/or a **category filter**, with a live "matching transactions" counter, then export the filtered result as either a similarly branded **PDF** or a **JSON** file.
- **Export chart images**  any of the three Chart.js visualisations can be saved as a standalone PNG.
- **Share Monthly Summary**  builds a formatted text digest for the current month (total, transaction count, daily average, trend vs. last month, budget usage if set, top 3 categories with emoji medals, and the single biggest expense) and either opens the native share sheet (`navigator.share`) or copies it to the clipboard as a fallback.

### Import

- Import from **CSV or JSON** via a file picker.
- CSV parsing handles quoted fields and commas within quotes (a minimal RFC 4180-style line parser).
- After parsing, a preview modal shows how many valid transactions were detected, then lets the user choose:
  - **Merge**  appends new transactions while skipping exact duplicates (matched on date + description + amount), reporting how many were added vs. skipped.
  - **Replace All**  wipes the existing ledger and replaces it with the imported data.

---

## Storage Usage Summary

The Settings tab's **Storage Summary** panel shows, live:

- Total number of recorded expenses.
- The size of the stored expense data (via `Blob` size, in KB).
- Total `localStorage` usage across all keys used by the app (in KB).

---

## Progressive Web App

FinTrack ships a `manifest.json` and a `service-worker.js`, making it installable and offline-capable:

- **Installable** on Android, iOS, Windows, macOS, and Linux, with standalone display mode and a dedicated app icon/screenshot.
- **App shortcuts** (long-press the icon on supported platforms) for "Add Expense" and "View Insights."
- **Offline-first caching**: the service worker pre-caches the app shell (HTML, CSS, JS, manifest, icon) plus the Chart.js, Bootstrap Icons, and Google Fonts CDN assets on install, serves cached responses instantly, and refreshes the cache in the background on every fetch (stale-while-revalidate style). Navigation requests fall back to the cached `index.html` if the network is unavailable.
- **Automatic cache versioning**: the service worker's cache name is tied to the app version (currently `fintrack-expense-v17.7`), and old caches are purged on activation.

---

# Tech Stack

| Category            | Technology                                                                     |
| ------------------- | ------------------------------------------------------------------------------ |
| Markup              | HTML5 (Semantic HTML, ARIA attributes)                                         |
| Styling             | CSS3 (Custom Properties, Flexbox, CSS Grid, Animations, Media Queries)         |
| Scripting           | Vanilla JavaScript (ES6+)                                                      |
| Data Visualisation  | Chart.js                                                                       |
| PDF Generation      | jsPDF + jsPDF-AutoTable                                                        |
| Icons               | Font Awesome (primary, used across the UI), Bootstrap Icons (cached by the SW) |
| Fonts               | Google Fonts  SUSE (variable weight)                                          |
| Offline Support     | Service Worker (cache-first with background refresh)                           |
| Storage             | Browser `localStorage`                                                         |
| Progressive Web App | Web App Manifest                                                               |
| Hosting             | Netlify                                                                        |
| Version Control     | Git & GitHub                                                                   |

**Build Process:** None (no package manager, bundler, or framework required.)

**CDNs Used:** Chart.js, jsPDF, jsPDF-AutoTable, Font Awesome, Google Fonts (SUSE), Bootstrap Icons (cached asset).

---

# Project Structure

```text
.
├── index.html            # Main application markup (app shell, modals, PIN overlay)
├── styles.css            # Complete application styling & animations
├── script.js             # Core application logic (state, rendering, charts, PDF, PIN, PWA hook-in)
├── manifest.json         # Web App Manifest (PWA metadata, icons, shortcuts)
├── service-worker.js     # Offline caching & asset management
├── fintrack_icon.png     # Application icon / favicon / screenshot
├── LICENSE
└── README.md
```

> **Note:** All application files should remain within the project root. The relative paths in the manifest, service worker, and `<link>`/`<script>` tags depend on this structure for correct offline caching.

---

# Application Modules

| Module               | Description                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **Dashboard (Home)** | Stats strip, budget bar, expense form, and searchable/sortable/filterable transaction list.      |
| **Insights**         | Auto-generated, expandable analysis cards covering monthly, category, trend, and recurring data. |
| **Charts**           | Chart.js visualisations (trend, category doughnut, weekly comparison) with PNG export.           |
| **Settings**         | Theme, budget, auto-lock timer, data export/import, storage stats, PIN security, About info.     |
| **Security**         | SHA-256-hashed PIN lock, lockout protection, and inactivity auto-lock.                           |
| **Import & Export**  | CSV/JSON import (merge or replace), full & custom PDF/JSON export, chart PNG export, share.      |

---

# Getting Started

## Prerequisites

FinTrack requires no build tools, package managers, or external dependencies to run locally  just a modern web browser.

## Running Locally

### 1. Clone the Repository

```bash
git clone https://github.com/ayush-rathour/fintrack.git
cd fintrack
```

### 2. Verify Project Files

Ensure the following are present in the project root:

- `index.html`
- `styles.css`
- `script.js`
- `manifest.json`
- `service-worker.js`
- `fintrack_icon.png`

### 3. Start a Local Server (Recommended)

Serving through a lightweight local server ensures the Service Worker and PWA install prompt behave correctly (opening `index.html` directly via `file://` will work for the UI but skips service worker registration).

Using Python:

```bash
python -m http.server 8000
```

Using Node.js:

```bash
npx http-server .
```

### 4. Open the Application

Visit `http://localhost:8000` in your browser. The service worker registers automatically on load, and the app becomes installable on supported browsers.

---

# Configuration Guide

| What to Change             | Where                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| Application title          | `index.html` `<title>`                                                                           |
| Meta tags & SEO            | `index.html` `<head>`                                                                            |
| Theme colours (light/dark) | `styles.css` `:root` and `[data-theme="dark"]` custom properties                                 |
| Categories & icons         | `script.js`  `CAT`, `CAT_COLORS`, `CAT_COLORS_DARK` objects                                     |
| Chart appearance           | `script.js`  `renderTrendChart`, `renderCategoryChart`, `renderWeeklyChart`, `getChartDefaults` |
| Insight rules              | `script.js`  `renderInsights()`                                                                 |
| PIN security logic         | `script.js`  PIN system block (hashing, lockout, auto-lock)                                     |
| PDF layout                 | `script.js`  `export-pdf` handler & `generateCustomPDFReport()`                                 |
| Import validation          | `script.js`  `importFile` change handler & `parseCSVLine()`                                     |
| Auto-lock durations        | `index.html` `.timer-seg` buttons + `script.js` `initTimerSegments()`                            |
| Service Worker cache       | `service-worker.js`  `CACHE_NAME`, `APP_SHELL`                                                  |
| Application icon           | `fintrack_icon.png`                                                                              |
| PWA metadata               | `manifest.json`                                                                                  |

---

# Deployment

FinTrack is a static PWA and can be deployed to any static hosting provider  no server-side processing required.

**Live Application:** https://fintrack-ar.netlify.app
**Repository:** https://github.com/ayush-rathour/fintrack

## Deploying to Netlify

1. Push the project to GitHub, GitLab, or Bitbucket.
2. Create a new site on Netlify and connect the repository.
3. Leave the **Build Command** empty.
4. Set the **Publish Directory** to the project root (`.`).
5. Deploy.

## Deploying to Other Static Hosts

Equally compatible with GitHub Pages, Cloudflare Pages, Vercel, Firebase Hosting, Surge, Render Static Sites, or any static file server. Preserve the full directory structure so the manifest and service worker resolve correctly.

---

# Performance & Accessibility

### Performance

- No frameworks or bundlers  plain HTML/CSS/JS served directly.
- Service-worker asset caching for fast repeat loads and offline use.
- Chart.js instances are updated in place (not destroyed/recreated) where possible to avoid flicker and reduce work.
- Keyed DOM diffing for the transaction list avoids full re-renders on every change.
- CSS custom properties drive theming so no JS re-styling pass is needed beyond toggling `data-theme`.

### Accessibility

- Semantic HTML5 structure with `role`, `aria-modal`, `aria-live`, `aria-selected`, and `aria-expanded` attributes on interactive regions (PIN dialog, tabs, insight cards, toast region).
- Keyboard support for the PIN pad (digits, Backspace/Delete, Enter) and `focus-visible` outlines on all major interactive controls.
- Descriptive `aria-label`s on icon-only buttons (theme toggle, keypad delete/submit, search input).
- Touch targets sized for mobile use, with actions always visible (not hover-only) on small screens.

---

# Privacy & Security

FinTrack does not require user accounts, registration, or internet connectivity to function, and does not use cloud storage, external databases, or analytics services. All transaction data, security settings, and preferences remain exclusively in the browser's `localStorage` on the user's own device.

- No transaction data is ever transmitted anywhere  the only network requests are for loading the static app shell and its CDN dependencies (fonts, icons, Chart.js, jsPDF).
- PIN codes are salted and SHA-256 hashed before storage; the plain PIN is never persisted.
- Data only leaves the device when the user explicitly exports or shares it.

---

# Browser Support

FinTrack relies on modern browser features:

- CSS Custom Properties, Grid, and Flexbox
- Service Workers & Web App Manifest
- `localStorage`
- ES6+ JavaScript
- `crypto.subtle` (Web Crypto API) for PIN hashing
- Canvas-based Chart.js rendering
- `IntersectionObserver` for scroll-reveal

Tested on the latest stable releases of Chrome, Edge, Firefox, Safari, Brave, Opera, and Samsung Internet. Older browsers lacking these APIs (particularly Web Crypto and Service Workers) will lose PIN security and offline support respectively.

---

# Version Information

| Property         | Value                  |
| ---------------- | ---------------------- |
| Current Version  | **v17.7**              |
| Release Type     | Stable                 |
| Application Type | Progressive Web App    |
| Platform         | Static Web Application |
| Build System     | None                   |
| Offline Support  | Yes                    |
| Primary Language | Vanilla JavaScript     |

---

# Roadmap

Planned for future releases:

- Income tracking and full balance management
- Multiple/named budgets and savings goals
- Multi-currency support
- Recurring-expense automation (auto-logging, not just detection)
- Richer, exportable analytics reports
- Optional cross-device data sync
- Deeper AI-assisted financial insights

These aim to grow FinTrack from a dedicated expense tracker into a fuller personal finance tool while keeping its privacy-first, local-only design.

---

# Credits & Attributions

### Libraries

- **Chart.js**  interactive data visualisation.
- **jsPDF** & **jsPDF-AutoTable**  client-side PDF report generation.
- **Font Awesome**  primary iconography throughout the UI.
- **Bootstrap Icons**  cached as a PWA asset.
- **Google Fonts (SUSE)**  primary typeface.

### Inspiration

Design inspiration drawn from modern fintech products, Notion, and contemporary banking/budgeting dashboards.

All application logic, interface design, security implementation, analytics engine, and documentation were designed and developed by **Ayush Rathour** unless otherwise stated.

---

# Contact

**Ayush Rathour**
Frontend Developer · Saharanpur, Uttar Pradesh, India

- **Portfolio:** https://ayushrathour.pages.dev
- **Live Application:** https://fintrack-ar.netlify.app
- **GitHub:** https://github.com/ayush-rathour
- **Email:** ayushrathour.dev@gmail.com

For collaborations, feature suggestions, or bug reports, please get in touch via GitHub or email.

---

# License

This project is licensed under the **MIT License**. The software is provided **"as is"**, without warranty of any kind.

> **Please Note:** While the source code is MIT-licensed, the FinTrack name, branding, visual identity, icons, and original content remain the intellectual property of the author. If reusing this project as a template, please replace all branding and project-specific content with your own.

---

<p align="center">
Built with precision, privacy, and a passion for better personal finance - by <strong>Ayush Rathour</strong>
</p>
