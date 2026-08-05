# Actividades de Trabalho

Repository for the code, manuals, and supporting material used in the **Actividades de Trabalho** project.

## Current version

This repository currently includes the **v14 redesign**, with prior fixes from **v13**.

- **v13**: interface corrections and security hardening
- **v14**: screen-based navigation redesign and usability improvements
- **design13**: design mock/specification reference (not production app)

---

## What changed in v14

Version 14 reorganizes the app from a single long scroll into **separate screens** with a **fixed navigation rail**, splitting:

- operational work (e.g., launch/entry, personal month, absences)
- supervision work (e.g., panel, administration)

### Main UX improvements

- Screen-based flow with fixed rail navigation
- Pending-approval and goal-progress visibility in the rail
- 3-step launch flow with immediate effect preview
- Goal section with explanatory text below the metric
- Panel organized in tabs
- Approval action changed to a clear **button**
- Day total moved to group header (removes fragile colspan dependency)

---

## v13 fixes included in v14

v14 includes the v13 correction set:

1. **Hidden elements visibility fix**  
   Enforced hidden behavior with:
   - `[hidden]{display:none !important}`  
   to prevent app styles from overriding browser-hidden elements.

2. **HTML/script injection hardening**  
   User-provided text and configurable names are escaped before rendering in UI contexts where HTML injection could occur.

3. **Narrow-screen subtotal alignment fix**  
   Removed dependence on fixed table colspan behavior that broke under responsive column hiding.

---

## Access and permission model

Visibility of screens and features is still enforced by role rules in application logic (`podeVer()`), not only by navigation visibility.

---

## Data and compatibility

No data migration was introduced in v14.

Unchanged across v11 → v14:

- network file structure
- storage format
- approval rules
- goal calculation logic
- CSV column layout

Files written by earlier versions (e.g., v11) remain readable in v14 without conversion.

---

## Design reference (`design13`)

The `design13` folder is included as a **design reference only**.

Important:

- It is **not** the production app.
- It depends on online CDN resources (React, ReactDOM, Babel, Google Fonts).
- It should **not** be published as runtime application code.

During implementation, additional production concerns were added beyond the mock, including:

- responsive behavior/media query handling
- visible focus-ring accessibility
- color normalization from `oklch()` to hexadecimal values

---

## Verification summary

No automated test suite is currently included in the project.  
Validation for v13/v14 was performed with a real-browser flow using a network-layer double (`rede.js`) and in-memory data, including:

- multiple combinations of width × role × screen
- JavaScript runtime error checks
- horizontal overflow checks
- injection regression checks
- subtotal alignment measurements
- `node --check` syntax validation for JS sources

---

## Repository stack

Primary languages in this repository:

- **HTML** (~72.5%)
- **JavaScript** (~27.5%)

---

## Notes

If needed, this README can be updated again to include formal details from the **ProjectDesign PDF** (scope, actors, workflows, constraints, and acceptance criteria).
