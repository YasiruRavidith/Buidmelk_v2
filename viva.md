# BuildMe.lk — University Viva Voce Examination Guide

> **Target Audience:** Academic Evaluators, External Examiners, and Project Review Panels  
> **Degree Program:** B.Sc. (Hons) in Software Engineering / Computer Science / Information Technology  
> **Project Scope:** Full-Stack Enterprise Platform with AI Engine, Cloud DevOps, and Hybrid Auth

---

## Section 1: Project Motivation & Domain Analysis

### Q1. What is the core problem BuildMe.lk solves, and why is it specifically relevant to Sri Lanka?
**Answer:**  
In Sri Lanka, building a residential home is one of the largest personal financial investments, yet the construction industry is highly fragmented, informal, and opaque:
- **Price Volatility & Opacity:** Homebuilders have no central reference for current material prices (cements, river sand, 12mm TMT steel, clay bricks). They are frequently overcharged by middlemen.
- **Contractor Mistrust:** Homeowners struggle to verify qualifications, past projects, or reliable feedback for contractors and tradespeople.
- **Unrealistic Budgeting:** Without technical knowledge, clients start projects without knowing structural material quantities or realistic labor costs, leading to abandoned half-built houses.
- **Fragmented Services:** A homebuilder must visit separate architects, structural engineers, lawyers for deed approvals, local hardware stores, and labor corners.

**BuildMe.lk** centralizes the entire lifecycle into a unified digital ecosystem: AI-powered estimation with Sri Lankan civil engineering benchmarks, a competitive tender bidding marketplace, ticket-gated verified contact discovery, live material pricing, and on-demand daily labor hiring.

---

### Q2. Who are the primary stakeholders of BuildMe.lk, and what value proposition does each receive?
**Answer:**
1. **Homeowners (Clients):** Gain cost transparency via instant AI BOQ estimations, competitive quotes through open tender bidding, and fraud prevention through verified professional profiles.
2. **Professionals (Contractors, Engineers, Architects, QS, Lawyers):** Access a consistent pipeline of genuine, ready-to-build construction leads without marketing expenditure; showcase portfolio and certifications with automated digital watermarks.
3. **Daily Construction Workers (Masons, Plumbers, Helpers):** Can view and accept local site jobs on short notice with transparent daily wage rates.
4. **Hardware Stores & Material Suppliers:** Gain digital storefronts, showcase verified stock, and receive purchase orders directly from contractors and homebuilders.

---

### Q3. How does BuildMe.lk differ from existing platforms like Ikman.lk or global platforms like Upwork?
**Answer:**
- **Versus General Classifieds (Ikman.lk):** Classifieds are static text ads with zero construction context, no quantity estimation calculators, no standardized bidding matrices, and high susceptibility to unverified fraud. BuildMe.lk incorporates structural BOQ algorithms, dynamic price indices, and ticket-gated professional verification.
- **Versus Global Freelancing Platforms (Upwork / Fiverr):** Upwork is tailored for digital remote knowledge workers, whereas construction is fundamentally physical, location-constrained, and bound by local building regulations (e.g., UDA guidelines, SLS certification for cement and steel). BuildMe.lk is localized specifically to Sri Lankan districts, currency (LKR), and construction materials.

---

## Section 2: Architecture & Technology Stack Justifications

### Q4. Walk us through the high-level architecture of the system.
**Answer:**  
BuildMe.lk implements a **headless, decoupled client-server architecture**:
1. **Frontend Presentation Tier:** Built using **Next.js 16 (App Router)** and **React 19**, styled with **Tailwind CSS v4** following a tailored "Quiet Luxury" design system. The client renders both statically pre-rendered content and interactive dynamic client components.
2. **API & Business Logic Tier:** Developed using **Django 5.2** and **Django REST Framework (DRF 3.16)** running on Python 3.12 under **Gunicorn** multi-worker WSGI. It encapsulates business logic across 5 modular sub-applications (`users`, `estimations`, `bidding`, `marketplace`, `workers`).
3. **External Services Tier:** 
   - **Firebase Authentication:** Handles user identity, OAuth, and token issuance.
   - **OpenRouter AI (GPT-4o-mini):** Generates architectural recommendations and powers the live market price crawler.
   - **ReportLab 4.5:** Programmatically renders multi-page PDF reports.
4. **Data & Storage Tier:** SQLite configured on a persistent volume mount `/app/media/db.sqlite3` (with PostgreSQL compatibility via `dj-database-url`), and persistent media storage for uploads.

---

### Q5. Why did you choose Next.js 16 with the App Router over a standard Single Page Application (like Vite + React)?
**Answer:**
1. **SEO for Construction Leads:** Construction professionals and suppliers need search visibility. Next.js App Router provides server-side rendering (SSR) and dynamic metadata generation for public profiles (`/professionals/[id]`) and marketplace items (`/marketplace/[materialId]`), ensuring Google indexes them.
2. **Performance (Turbopack):** Next.js 16’s Turbopack engine provides near-instant local compilation and optimized chunk splitting in production.
3. **Hybrid Rendering:** High-traffic informational pages (About, Estimation calculator, Marketplace directory) leverage static optimization, while authenticated dashboards and tender bidding utilize reactive client-side rendering (`"use client"`).
4. **Modern React 19 Integration:** Native compatibility with React 19 features like asynchronous transitions, hooks, and clean server-client boundaries.

---

### Q6. Why select Django and DRF for the backend instead of Node.js / Express?
**Answer:**
1. **Built-in Security Defaults:** Django offers out-of-the-box protection against SQL Injection (parameterized ORM), CSRF, Clickjacking, and Cross-Site Scripting (XSS).
2. **Relational Data Integrity:** Construction procurement involves interconnected relationships: a `ProjectPost` has many `Bid` records, links to an `EstimationHistory`, and interacts with `TicketBundle` and `ProjectUnlock` records. Django’s transactional ORM guarantees ACID compliance.
3. **Heavy Data Processing & Native Libraries:** ReportLab for programmatic PDF generation and Pillow for automated watermark image processing are native, mature Python libraries that operate faster and more reliably than their Node equivalents.
4. **Out-of-the-Box Administrative Control:** The Django Admin dashboard allows system operators to inspect users, override market prices, and audit submitted bids without building custom admin panels from scratch.

---

## Section 3: Authentication, Security & RBAC

### Q7. Explain your authentication flow. How do Firebase and Django communicate securely?
**Answer:**  
BuildMe.lk adopts the **Zero-Password Backend** design pattern:
1. When a user logs in via Google or Email/Password, authentication is processed entirely on the client by the **Firebase Client SDK**. Passwords never touch the Django backend.
2. Upon successful authentication, Firebase issues a cryptographically signed JWT ID Token.
3. Every authenticated HTTP request passes this token in the header:  
   `Authorization: Bearer <Firebase_ID_Token>`
4. Django’s custom authentication class ([users/authentication.py](file:///d:/Buildmelk/backend/users/authentication.py)) intercepts the request:
   ```python
   decoded_token = firebase_admin.auth.verify_id_token(token)
   uid = decoded_token.get('uid')
   user, created = CustomUser.objects.get_or_create(firebase_uid=uid, defaults={...})
   ```
5. Django validates the cryptographic signature against Google’s public keys and checks token expiration. If valid, it matches or creates the local `CustomUser` record and sets `request.user`.

---

### Q8. How is Role-Based Access Control (RBAC) enforced in the platform?
**Answer:**  
The `CustomUser` model contains a `role` attribute with choices: `CLIENT`, `PROFESSIONAL`, and `ADMIN`.
- **At the API Level:** DRF permissions check `request.user.role`. For instance, in the bidding module:
  - Any authenticated user can view tenders, but accepting a bid is restricted strictly to the `client` who posted the project tender.
  - Submitting proposals (`Bid`) is restricted to verified users with appropriate roles.
  - Deleting bids is allowed only by the professional who created that specific bid or an Admin.
- **At the Client Level:** Role-based dashboards redirect users dynamically:
  - `CLIENT` → `/dashboard/client` (Active tenders, received bids, ticket credit balance)
  - `PROFESSIONAL` → `/dashboard/professional` (Submitted bids, win rate, client inquiries)
  - `HARDWARE` → `/dashboard/hardware/shops` (Shop inventory, orders, store hours)

---

### Q9. How did you secure professional certifications and portfolio photos against unauthorized reuse?
**Answer:**  
In construction, unscrupulous individuals often steal photos of completed luxury homes and pretend they built them.  
In [backend/marketplace/models.py](file:///d:/Buildmelk/backend/marketplace/models.py), BuildMe.lk implements automated digital watermarking via Pillow:
- Before any portfolio or certification image is saved to disk, an in-memory function intercept draws a 45-degree semi-transparent watermark text (`"BUILDME.LK VERIFIED"`) across the image canvas.
- This renders the image unusable for fraudulent re-upload on competing classifieds while establishing verified provenance on BuildMe.lk.

---

## Section 4: Database Design & Domain Modeling

### Q10. Explain the relational schema between Users, Professional Profiles, and Hardware Shops.
**Answer:**  
BuildMe.lk uses a polymorphic one-to-one extension pattern:
- `CustomUser` (inherits `AbstractUser`) holds identity attributes: `firebase_uid`, `email`, `role`, `phone_number`, `profile_image`.
- If `role == 'PROFESSIONAL'`, a `ProfessionalProfile` is linked via `OneToOneField(CustomUser)`. This model stores civil engineering fields: `profession_type` (`CONTRACTOR`, `ENGINEER`, `ARCHITECT`, `QS`), `years_of_experience`, `certifications`, `service_areas`, `rating`, and `projects_completed`.
- For portfolio showcases, `ProfessionalPortfolioImage` links via `ForeignKey` to `ProfessionalProfile`.
- If the professional is a hardware merchant, a `HardwareShop` model links via `ForeignKey(ProfessionalProfile)`, allowing a single merchant to manage multiple shop branches.
- `HardwareShopItem` acts as a many-to-many junction between `HardwareShop` and `Material`, with unique constraints (`unique_together = ('shop', 'material')`) and distinct stock levels.

---

### Q11. How does the Ticket Paywall database model prevent tender spam and protect contact privacy?
**Answer:**  
The model is composed of two entities in [backend/bidding/models.py](file:///d:/Buildmelk/backend/bidding/models.py):
1. **`TicketBundle`:** Represents a purchase of unlock credits:
   - `owner`: User who purchased the bundle.
   - `unlocks_total`: Number of unlocks (e.g., 3).
   - `unlocks_used`: Counter incremented per unique unlock.
   - `price_paid`: Transaction value (LKR 500.00).
   - `status`: `ACTIVE`, `EXHAUSTED`, or `EXPIRED`.
2. **`ProjectUnlock`:** A relational junction table recording:
   - `bundle`: Reference to the debited bundle.
   - `user`: User who performed the unlock.
   - `project`: The tender unlocked.
   - `unique_together = ('user', 'project')`: Ensures a user is **never charged twice** to view the same project or professional contact details. Subsequent visits check `ProjectUnlock.objects.filter(user=user, project=project).exists()` and immediately reveal the details for free.

---

## Section 5: AI Engine & Algorithmic Computations

### Q12. How does the AI Cost Estimator calculate construction costs, and what is its civil engineering basis?
**Answer:**  
The estimator in [backend/estimations/views.py](file:///d:/Buildmelk/backend/estimations/views.py) combines deterministic mathematical heuristics with LLM design synthesis:
1. **Deterministic Quantity Calculation:**
   - Evaluates total area (`total_area_sqft`), floors, and room counts.
   - Multiplies baseline material factors based on standard Sri Lankan civil engineering norms (e.g., bags of cement per sqft of slab and brickwork, cubes of river sand, tons of steel reinforcement rods).
   - Adjusts for quality tier: `LUXURY` applies premium multipliers to tiles, sanitaryware, fittings, and roofing timber compared to `STANDARD`.
2. **Dynamic Price Application:**
   - Multiplies estimated quantities by live unit prices stored in `MaterialPrices` and `Material` models.
3. **AI Design Synthesis:**
   - Sends the computed parameters to OpenRouter AI (`openai/gpt-4o-mini`).
   - Receives a tailored design brief: recommended architectural layout, cross-ventilation guidance for tropical climates, and cost-saving suggestions.

---

### Q13. What happens if the external AI API (OpenRouter) fails, runs out of credit, or experiences high latency?
**Answer:**  
The system is built to be **resilient and fault-tolerant**:
- In [backend/estimations/views.py](file:///d:/Buildmelk/backend/estimations/views.py), the `_generate_design_brief` function checks if `OPENROUTER_API_KEY` is present and wraps the HTTP call in a `try-except` block with a strict timeout.
- If the API fails or is unreachable, the system automatically falls back to `_fallback_design_brief(sqft, floors, rooms, quality)`:
  ```python
  def _fallback_design_brief(sqft, floors, rooms, quality):
      luxury = quality == 'LUXURY'
      return {
          'design_title': 'Modern Family Residence' if not luxury else 'Premium Contemporary Residence',
          'style_summary': 'Practical, efficient home design with cost control focus...',
          'recommended_layout': [...],
          'material_strategy': [...]
      }
  ```
- As a result, the user's estimation **never fails or crashes**; the calculation and PDF generation proceed seamlessly.

---

### Q14. How does the live Material Price Crawler work?
**Answer:**  
In [backend/marketplace/services.py](file:///d:/Buildmelk/backend/marketplace/services.py):
1. Materials have a `last_ai_update` timestamp and a freshness interval (`OPENROUTER_REFRESH_INTERVAL_HOURS = 24`).
2. The function `material_ai_price_is_stale(material)` checks:
   ```python
   now - material.last_ai_update >= timedelta(hours=24)
   ```
3. If stale and `use_manual_price` is `False`, the background service queries current wholesale and retail prices in Sri Lanka and updates `material.ai_price` and `material.last_ai_update = timezone.now()`.
4. If the supplier or admin needs to lock a price during periods of fuel or import tax fluctuations, they check `use_manual_price = True`, which bypasses the AI crawler.

---

## Section 6: UI/UX & Responsive Engineering

### Q15. How did you design the user interface, and what is the "Quiet Luxury" aesthetic?
**Answer:**  
Most South Asian construction portals are visually chaotic, cluttered with flashing banners and harsh primary colors.  
BuildMe.lk adopts a **"Quiet Luxury" architectural aesthetic**:
- **Curated Natural Palette:** Warm terracotta (`#8B4434`), deep timber charcoal (`#281713`), soft travertine marble background (`#FCFAF7`), and muted borders (`#e8ddd6`).
- **Editorial Typography:** High-contrast pairing of an elegant serif typeface for headings (`Fraunces` / `Playfair`) with an ultra-clean geometric sans-serif for numbers, prices, and specifications (`DM Sans` / `Inter`).
- **Restraint & Micro-Interactions:** Subtle backdrop blurs, clean square borders reminiscent of architectural blueprints, and smooth transitions on hover.

---

### Q16. How did you solve the responsive navigation challenge on tablet viewports?
**Answer:**  
- **The Issue:** The navbar contains 6 long navigation links (`Professionals`, `Open Bidding`, `Workers`, `Materials`, `Shops`, `Estimation`). On desktop, they sit centered horizontally. At 768px–1024px (tablets like iPad in portrait), the 6 links took up ~650px, causing them to collide and overlap directly over the brand logo and right-hand user buttons. Meanwhile, the mobile drawer was hidden on `md:`.
- **The Solution:**
  1. Raised the desktop links breakpoint to `lg:` (1024px) with adaptive spacing (`gap-4 xl:gap-8`).
  2. Changed the hamburger menu from `md:hidden` to `lg:hidden`, making the slide-over menu accessible on both mobile and tablet portrait screens.
  3. Scaled the slide-over panel width to `w-[85vw] sm:w-[380px] md:w-[420px] max-w-[440px]`, providing a spacious, comfortable tablet touch drawer.

---

## Section 7: DevOps, Cloud Deployment & Real-World Challenges

### Q17. Explain your deployment pipeline on Railway.
**Answer:**
- **Backend Service:**
  - Deployed via a custom multi-stage **`Dockerfile`** based on `python:3.12-slim`.
  - Configured with persistent disk storage mounted at `/app/media` to persist SQLite database changes and user-uploaded media across redeployments.
  - Startup script runs database migrations (`python manage.py migrate --noinput`), executes initial database seeding (`load_initial_data.py`), and binds **Gunicorn** to Railway’s dynamic `$PORT`.
- **Frontend Service:**
  - Deployed using Railway’s **Nixpacks** builder pinned to **Node.js 20**.
  - Utilizes `npm run build` with Next.js Turbopack optimization.
  - Starts production server via `npm run start -- -p $PORT -H 0.0.0.0`.

---

### Q18. What were the most challenging bugs you encountered, and how did you resolve them?
**Answer:**

#### Bug 1: Instant Redirect Loop on the Estimation Result Page
- **Symptom:** When a user submitted the estimation form, the calculator succeeded, but the user was immediately kicked back to the estimation form without viewing results.
- **Root Cause:** In `estimation/page.tsx`, the result payload was saved to `sessionStorage.setItem("latest_estimate", ...)`. But `estimation/result/page.tsx` was looking for `sessionStorage.getItem("latestEstimation")`. Since it evaluated to `null`, the result page executed `router.push("/estimation")`.
- **Resolution:** Unified storage keys under both names, saved across both `sessionStorage` and `localStorage`, passed `?id=${data.id}` in the URL, and added a backend endpoint `GET /api/estimations/<id>/` as a fallback.

#### Bug 2: Inconsistent Button Wrapping on Marketplace Product Cards
- **Symptom:** On the product grid, the "Clay Brick" card displayed its price and "Add to Cart" buttons side-by-side on one row, while "River Sand" and "Metal Aggregate" had their buttons stacked below the price.
- **Root Cause:** The card footer used `flex-wrap`. "Rs. 15.00" was short enough to fit horizontally, whereas "Rs. 4500.00 per cube" was wider and exceeded the container threshold, triggering flex-wrap on some cards and not others.
- **Resolution:** Replaced the variable `flex-wrap` container with a clean, structured vertical stack: upper price block with AI timestamp, followed by uniform full-width action buttons on all cards.

#### Bug 3: Railway Nixpacks Node.js 18 Incompatibility with Next.js 16
- **Symptom:** Frontend builds crashed on Railway with `SyntaxError: Unexpected token '?'` and engine requirement failures.
- **Root Cause:** Next.js 16 requires Node.js >= 20.9.0, but Railway's default Nixpacks image selected Node 18.
- **Resolution:** Pinned Node.js 20 across three layers: `nixpacks.toml` (`[phases.setup] nixPkgs = ["nodejs_20", "npm-10_x"]`), `package.json` (`"engines": { "node": ">=20.9.0" }`), and `.nvmrc` (`20.18.0`).

---

## Section 8: Future Enhancements & Scalability

### Q19. If you had an additional 6 months to expand BuildMe.lk, what would be your roadmap?
**Answer:**
1. **LKR Payment Gateway Integration:** Integrate PayHere or WebXPay for automated online credit card and LankaQR payments when purchasing ticket bundles or buying materials.
2. **Real-Time WebSocket Chat:** Implement Django Channels / WebSockets for live, secure messaging between homeowners and bidding contractors once a project is unlocked.
3. **Progressive Escrow Milestones:** Smart contract milestone payments where funds are held in escrow and released upon client sign-off of foundation, structural roof slab, and finishing phases.
4. **Computer Vision Floorplan Analyzer:** Allow users to snap a photo of a blueprinted architectural floorplan and use a multimodal LLM to auto-detect square footage, room dimensions, and window schedules.
5. **Mobile Native App:** Package the platform into iOS and Android applications using React Native / Expo, leveraging push notifications for bid alerts and urgent daily worker requests.
