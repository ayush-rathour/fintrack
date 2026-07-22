# FinTrack v17.3 - Personal Expense Tracker (PWA)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with HTML5](https://img.shields.io/badge/HTML-5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Styled with CSS3](https://img.shields.io/badge/CSS-3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Deployed on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?logo=netlify&logoColor=white)](https://fintrack-ar.netlify.app)

> **FinTrack** is a modern, offline-first personal expense tracker built with semantic HTML5, hand-written CSS3, and vanilla JavaScript. Designed as a Progressive Web App (PWA), it enables users to securely record, analyse, and visualise everyday spending while keeping all financial data stored locally on the user's device-without requiring accounts, cloud synchronisation, or an internet connection.

**Live Application:** https://fintrack-ar.netlify.app

> **Note:** FinTrack currently focuses on expense tracking only. Income tracking, budgeting, and overall balance management are planned for future releases.

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

FinTrack is a lightweight yet feature-rich personal finance application that helps users monitor and understand their spending habits without relying on external servers or third-party services. Built entirely with vanilla web technologies, the application combines modern user experience principles with strong local privacy, making it suitable for everyday financial tracking on desktop and mobile devices alike.

Unlike traditional expense trackers that require user accounts or cloud storage, FinTrack operates completely offline after installation. All transaction data, application settings, and security preferences remain on the user's device through browser LocalStorage, ensuring complete ownership of personal financial information.

The application includes interactive spending analytics, behavioural insights, PIN-protected local security, flexible data import/export tools, and Progressive Web App capabilities, allowing it to function similarly to a native mobile application while remaining entirely browser-based.

The design follows a clean, fintech-inspired interface featuring a modern blue-gradient theme, glassmorphism components, smooth animations, responsive layouts, and carefully designed interactions that prioritise usability across phones, tablets, and desktop systems.

---

# Key Features

## User Experience & Interface

- **Modern fintech-inspired interface** featuring a clean blue-gradient colour palette, glassmorphism panels, soft shadows, and carefully balanced spacing for an intuitive financial dashboard experience.
- **Fully responsive layout** optimised for mobile phones, tablets, laptops, and desktop displays without requiring a separate mobile application.
- **Progressive Web App (PWA)** architecture allows FinTrack to be installed directly from the browser and used like a native application.
- **Offline-first design** ensures the application remains fully functional even without an internet connection.
- **Animated floating labels**, interactive cards, smooth transitions, and subtle micro-interactions provide a polished user experience throughout the application.
- **Modern toast notification system** with icons, progress indicators, and contextual success or error feedback.
- **Glass-style modal windows** for confirmations, security prompts, import/export operations, and application settings.
- **Collapsible settings panel** that groups privacy, data management, and security controls without cluttering the main interface.

---

## Expense Management

FinTrack focuses on making everyday expense tracking simple, organised, and efficient.

### Transaction Management

- Add expense entries with description, amount, category, and transaction date.
- Automatic chronological sorting, ensuring the newest transactions always appear first.
- Instant search across descriptions, amounts, dates, and transaction information.
- Category-based filtering for quicker navigation through spending history.
- One-click transaction deletion with a built-in **Undo** recovery window, allowing accidentally removed entries to be restored within five seconds.
- Live transaction updates without requiring page refreshes.

### Categories

Expenses can be organised into predefined spending categories, including:

- Food
- Transport
- Shopping
- Entertainment
- Bills
- Healthcare
- Education
- Travel
- Personal
- Other

This categorisation enables meaningful analytics and more accurate spending insights.

---

## Spending Analytics & Visualisation

FinTrack transforms raw transaction data into meaningful visual information through interactive dashboards and real-time calculations.

### Financial Summary

The dashboard continuously updates to display:

- Total spending
- Today's spending
- Daily average expenditure
- Total recorded transactions

All summary values update instantly whenever transactions are added, edited, imported, or removed.

### Interactive Charts

The application includes multiple Chart.js visualisations designed to help users better understand their spending behaviour.

Available charts include:

- Daily spending trend
- Category distribution (Doughnut Chart)
- Weekly spending comparison
- Historical spending patterns

Each chart supports:

- Smooth animations
- Dynamic gradient styling
- Rich tooltips
- Responsive resizing
- Empty-state messaging when insufficient data exists
- PNG image export for reports or sharing

---

## Smart Insights Engine

Beyond simple statistics, FinTrack analyses transaction history to generate intelligent behavioural insights that encourage better financial decision-making.

The insights engine automatically evaluates spending patterns and highlights useful observations such as:

### Monthly Spending Summary

Provides a concise overview of:

- Total monthly expenditure
- Number of recorded expenses
- Average daily spending
- Highest spending categories

### Weekly Spending Trend

Compares current and previous weeks to identify whether spending is:

- Increasing
- Decreasing
- Remaining stable

This enables users to recognise financial trends before they become habits.

### Best Saving Day

Analyses historical spending to determine which day demonstrates the healthiest spending behaviour, helping users identify routines associated with better money management.

### Recurring Expenses

Automatically detects repeated payments such as subscriptions, memberships, utility bills, and other recurring expenses, encouraging users to review unnecessary recurring costs.

Every generated insight includes:

- A meaningful icon
- Concise statistical summary
- Practical financial recommendation
- Easy-to-understand language designed for everyday users

Rather than overwhelming users with raw financial data, FinTrack focuses on transforming information into actionable guidance.

---

## Security & Privacy

FinTrack is designed around a privacy-first philosophy. Unlike many modern finance applications, it does not rely on user accounts, cloud synchronisation, external databases, or third-party storage providers. Every transaction, preference, and security setting remains stored locally on the user's own device.

No personal financial information is transmitted to external servers, giving users complete ownership and control over their data.

### Advanced PIN Protection

FinTrack includes a comprehensive local authentication system that protects sensitive financial information without requiring an internet connection.

The security layer supports multiple authentication workflows, including:

- Setting a new PIN
- PIN confirmation during setup
- Secure application unlock
- PIN change
- PIN removal

Additional security measures include:

- **Four-digit PIN authentication** with an intuitive numeric keypad.
- **SHA-256 hashed PIN storage**, ensuring PIN values are never stored in plain text.
- **Automatic inactivity lock** after two minutes of user inactivity.
- **Three-attempt protection** with a temporary 30-second lockout after consecutive failed attempts.
- **Persistent lockout state**, preventing bypass through page refreshes or browser restarts.
- **PIN verification** before performing sensitive actions such as clearing all stored data.

This layered approach provides meaningful protection while maintaining a simple and frictionless user experience.

---

## Data Import & Export

FinTrack provides flexible data portability features, allowing users to create backups, migrate between devices, and analyse their spending outside the application.

### Export Options

Users can export their financial information in multiple formats depending on their needs.

#### PDF Reports

Generate professionally formatted spending reports containing:

- FinTrack branding
- Report generation date
- Summary statistics
- Daily averages
- Highest spending category
- Highest spending day
- Complete transaction table
- Automatic page numbering
- Developer attribution

#### JSON Export

Export structured transaction data for:

- Device migration
- Long-term backups
- Data recovery
- Integration with external applications

#### Chart Export

Every interactive chart can be exported as a high-resolution PNG image for presentations, documentation, or financial reporting.

---

### Import Options

Existing transaction histories can be imported from both CSV and JSON files.

During the import process, users are provided with:

- File preview before importing
- Validation of supported file formats
- Import summary
- Duplicate detection
- Conflict handling options

Two import modes are available:

**Replace All**

Completely replaces the existing transaction history with the imported dataset.

**Merge**

Safely appends imported transactions while automatically skipping duplicate entries based on transaction date, description, and amount.

After each import, FinTrack displays a summary showing:

- Imported records
- Duplicate entries skipped
- Final transaction count

---

## Data Usage Summary

To improve transparency, FinTrack provides live information about the application's local storage usage.

The Data & Security panel displays:

- Total recorded transactions
- Storage occupied by transaction history
- Overall browser LocalStorage usage

This helps users understand how much data the application stores and monitor long-term usage without relying on hidden background processes.

---

## Progressive Web App

FinTrack is developed as a Progressive Web App (PWA), enabling it to deliver a native application experience while remaining entirely browser-based.

Once installed, the application launches independently from the browser and continues functioning without an active internet connection.

### PWA Features

- Installable on Android, iOS, Windows, macOS, and Linux.
- Offline-first architecture powered by a Service Worker.
- Fast startup through intelligent asset caching.
- Full-screen application experience without browser interface elements.
- Automatic loading of previously cached resources when offline.
- Native home-screen integration on supported devices.

### Offline Experience

After the initial visit, FinTrack caches its core application files locally, allowing users to:

- Record new expenses.
- Browse historical transactions.
- View spending analytics.
- Generate reports.
- Export or import data.
- Access security settings.

-all without requiring an internet connection.

This ensures the application remains reliable while travelling, during network interruptions, or in environments with limited connectivity.

---

# Tech Stack

| Category            | Technology                                                                            |
| ------------------- | ------------------------------------------------------------------------------------- |
| Markup              | HTML5 (Semantic HTML, Accessibility, ARIA Attributes)                                 |
| Styling             | CSS3 (Custom Properties, Flexbox, CSS Grid, Glassmorphism, Animations, Media Queries) |
| Scripting           | Vanilla JavaScript (ES6+)                                                             |
| Data Visualisation  | Chart.js                                                                              |
| PDF Generation      | jsPDF + AutoTable                                                                     |
| Icons               | Bootstrap Icons, Font Awesome                                                         |
| Offline Support     | Service Worker                                                                        |
| Storage             | Browser LocalStorage                                                                  |
| Progressive Web App | Web App Manifest                                                                      |
| Hosting             | Netlify                                                                               |
| Version Control     | Git & GitHub                                                                          |

**Build Process:** None (No package manager, bundler, frontend framework, or build tools required.)

**CDNs Used:** Chart.js, jsPDF, AutoTable, Bootstrap Icons, Font Awesome.

---

# Project Structure

```text
.
├── index.html                        # Main application interface
├── styles.css                        # Complete application styling
├── script.js                         # Core application logic
├── manifest.json                     # Progressive Web App configuration
├── service-worker.js                 # Offline caching & asset management
├── finTrack_icon.png                 # Application icon & favicon
├── google333456a1430d0ffc.html       # Google Analytics G-tag
├── LICENSE
└── README.md
```

> **Note:** All application files should remain within the project root. The relative file structure is required for the Service Worker, Web App Manifest, icons, and offline caching to function correctly.

---

# Application Modules

FinTrack is organised into multiple functional areas, each responsible for a specific aspect of expense management.

| Module              | Description                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **Dashboard**       | Displays financial summaries, charts, and spending statistics in real time.                  |
| **Transactions**    | Add, search, filter, sort, and manage expense records.                                       |
| **Insights**        | Automatically analyses spending behaviour and generates personalised financial observations. |
| **Charts**          | Interactive visualisations powered by Chart.js with export functionality.                    |
| **Import & Export** | Supports CSV/JSON imports, PDF reports, JSON backups, and PNG chart exports.                 |
| **Security**        | Local PIN authentication, inactivity lock, secure data removal, and privacy controls.        |
| **Settings**        | Data management, storage information, and application preferences.                           |

---

# Getting Started

## Prerequisites

FinTrack is built entirely with standard web technologies and requires no build tools, package managers, or external dependencies to run locally.

A modern web browser is sufficient.

---

## Running Locally

### 1. Clone the Repository

```bash
git clone https://github.com/ayush-rathour/fintrack.git

cd fintrack
```

---

### 2. Verify Project Files

Ensure the following core files are present in the project root:

- `index.html`
- `styles.css`
- `script.js`
- `manifest.json`
- `service-worker.js`
- `finTrack_icon.png`

---

### 3. Start a Local Server (Recommended)

Although `index.html` can be opened directly, serving the project through a lightweight local server is recommended to ensure correct behaviour of the Service Worker and Progressive Web App features.

Using Python:

```bash
python -m http.server 8000
```

Using Node.js:

```bash
npx http-server .
```

---

### 4. Open the Application

Visit

```
http://localhost:8000
```

in your browser.

The application will automatically register its Service Worker and become installable on supported browsers.

---

# Configuration Guide

FinTrack has been designed with simplicity in mind. Most customisation can be completed by editing a small number of files.

| What to Change       | Where                                  |
| -------------------- | -------------------------------------- |
| Application title    | `index.html` `<title>`                 |
| Meta tags & SEO      | `index.html` `<head>`                  |
| Theme colours        | `styles.css` `:root` custom properties |
| Categories           | `script.js` category definitions       |
| Chart appearance     | `script.js` Chart.js configuration     |
| Insight rules        | `script.js` Insights Engine            |
| PIN security logic   | `script.js` Security module            |
| PDF layout           | `script.js` PDF export functions       |
| Import validation    | `script.js` Import module              |
| Service Worker cache | `service-worker.js`                    |
| Application icon     | `finTrack_icon.png`                    |
| PWA information      | `manifest.json`                        |

---

# Deployment

FinTrack is a static Progressive Web Application and can be deployed to any static hosting provider without requiring server-side processing or backend infrastructure.

The live application is currently deployed on **Netlify** and is accessible at:

**Live Application:** https://fintrack-ar.netlify.app

The complete source code is available on GitHub:

**Repository:** https://github.com/ayush-rathour/fintrack

---

## Deploying to Netlify

1. Push the project to GitHub, GitLab, or Bitbucket.
2. Create a new site on Netlify.
3. Connect your repository.
4. Leave the **Build Command** empty.
5. Set the **Publish Directory** to the project root (`.`).
6. Deploy the site.

Since FinTrack is built entirely with static web technologies, no compilation or build process is required.

---

## Deploying to Other Static Hosts

FinTrack is equally compatible with:

- GitHub Pages
- Cloudflare Pages
- Vercel
- Firebase Hosting
- Surge
- Render Static Sites
- Any standard web server capable of serving static files

To ensure proper Progressive Web App functionality, preserve the complete project directory structure and verify that the Service Worker and Web App Manifest are served correctly.

---

# Performance & Accessibility

FinTrack has been designed with a strong emphasis on performance, responsiveness, accessibility, and maintainability.

### Performance

- Lightweight application built entirely with vanilla web technologies.
- No frontend frameworks or unnecessary runtime dependencies.
- Offline asset caching powered by a Service Worker.
- Optimised rendering with efficient DOM updates.
- Fast startup after initial installation.
- Responsive layouts using CSS Grid and Flexbox.
- Minimal network requests after first launch.
- Hardware-accelerated CSS animations where appropriate.

---

### Accessibility

Accessibility has been considered throughout the application's design and implementation.

Features include:

- Semantic HTML5 document structure.
- Keyboard-accessible interactive components.
- Clearly visible focus indicators.
- Accessible form labels and validation messages.
- Responsive typography and spacing.
- Sufficient colour contrast throughout the interface.
- Mobile-friendly touch targets.
- Screen-reader-friendly form controls using appropriate HTML semantics.

The objective is to ensure FinTrack remains usable across a wide range of devices and accessibility needs without compromising visual quality.

---

# Privacy & Security

Privacy is one of FinTrack's core design principles.

Unlike many finance applications, FinTrack does not require:

- User accounts
- Registration
- Internet connectivity
- Cloud synchronisation
- External databases
- Analytics services
- Personal information

All financial records remain stored exclusively within the browser's LocalStorage on the user's own device.

FinTrack never transmits transaction data to external servers, ensuring users retain complete ownership and control of their financial information.

---

## Data Ownership

Every transaction, report, chart, preference, and security setting belongs entirely to the user.

The application provides flexible import and export capabilities so users can create backups or migrate data whenever required.

No financial information leaves the user's device unless the user explicitly chooses to export it.

---

# Browser Support

FinTrack uses modern browser technologies including:

- CSS Custom Properties
- CSS Grid
- Flexbox
- Service Workers
- Progressive Web App APIs
- LocalStorage
- ES6 JavaScript
- Canvas-based Chart.js visualisations

The application is tested and supported on the latest stable versions of:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Apple Safari
- Brave
- Opera
- Samsung Internet

Older browsers that do not support Progressive Web App features or modern JavaScript APIs may experience reduced functionality.

---

# Version Information

| Property         | Value                  |
| ---------------- | ---------------------- |
| Current Version  | **v17.3**              |
| Release Type     | Stable                 |
| Application Type | Progressive Web App    |
| Platform         | Static Web Application |
| Build System     | None                   |
| Offline Support  | Yes                    |
| Primary Language | Vanilla JavaScript     |

---

# Roadmap

The following improvements are planned for future releases:

- Income tracking
- Complete balance management
- Monthly budgeting tools
- Savings goals
- Financial reports with richer analytics
- Recurring expense automation
- Multi-currency support
- Dark and Light theme options
- Data synchronisation between devices (optional)
- Enhanced AI-powered financial insights

These features are intended to expand FinTrack from a dedicated expense tracker into a comprehensive personal finance management application while preserving its privacy-first philosophy.

---

# Credits & Attributions

FinTrack is built upon several excellent open-source technologies and community projects.

### Libraries

- **Chart.js** - Interactive financial data visualisation.
- **jsPDF** - PDF document generation.
- **jsPDF AutoTable** - Professional transaction tables.
- **Bootstrap Icons** - Interface icons.
- **Font Awesome** - Supplemental iconography.

### Inspiration

The application's design philosophy draws inspiration from modern fintech products including:

- Notion
- Cleo
- Google Material Design
- Contemporary banking and budgeting dashboards

All application logic, interface design, security implementation, analytics engine, visual styling, and documentation have been designed and developed by **Ayush Rathour** unless otherwise stated.

---

# Contact

**Ayush Rathour**  
Frontend Developer · Saharanpur, Uttar Pradesh, India

- **Portfolio:** https://ayushrathour.netlify.app
- **Live Application:** https://fintrack-ar.netlify.app
- **GitHub:** https://github.com/ayush-rathour
- **Email:** ayushrathour.dev@gmail.com

For project collaborations, feature suggestions, bug reports, or general enquiries, please feel free to get in touch through GitHub or via email.

---

# License

This project is licensed under the **MIT License**.

The MIT License permits anyone to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, provided that the original copyright notice and license text are included in all copies or substantial portions of the software.

The software is provided **"as is"**, without warranty of any kind, express or implied.

> **Please Note:** While the source code is released under the MIT License, the FinTrack name, branding, visual identity, application icons, screenshots, documentation, and original content represent the intellectual property of the author. If you use this project as a template or starting point for your own application, please replace all branding, assets, and project-specific content with your own.

---

<p align="center">
Built with precision, privacy, and a passion for better personal finance - by <strong>Ayush Rathour</strong>
</p>
