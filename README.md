# BuildMe.lk — Sri Lanka's Quiet Luxury Construction Marketplace & AI Estimation Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-5.2.4-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.16.0-red?style=for-the-badge&logo=django)](https://www.django-rest-framework.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=for-the-badge&logo=railway)](https://railway.app/)

> **BuildMe.lk** is a centralized digital construction ecosystem built to bring cost transparency, verified contractor matching, dynamic material price tracking, and intelligent bill of quantities (BOQ) planning to the Sri Lankan building industry.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Documentation](#-project-documentation)
- [Getting Started Locally](#-getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup-django--drf)
  - [Frontend Setup](#2-frontend-setup-nextjs--react)
- [Demo User Accounts](#-demo-user-accounts)
- [Environment Variables](#-environment-variables)
- [Cloud Deployment (Railway)](#-cloud-deployment-railway)
- [License](#-license)

---

## 🌟 Project Overview

In Sri Lanka, individual homebuilders face a daunting challenge: opaque material pricing, unverified contractor credentials, unpredictable labor rates, and lack of standardized civil engineering planning. 

**BuildMe.lk** transforms this experience into a quiet-luxury, transparent journey:
- **For Homeowners:** Instant AI-driven construction cost estimations, downloadable branded PDF reports, and an open tender system to receive competitive contractor bids.
- **For Construction Professionals:** A steady stream of verified project tenders, portfolio showcases with automated digital watermarks, and direct client connections.
- **For Hardware Stores:** Storefronts displaying real-time branch inventory and localized market prices.
- **For Site Workers:** Instant on-demand daily labor job board with transparent wage rates.

---

## 🚀 Key Features

### 1. 🏠 AI Construction Cost Estimator & BOQ Calculator
- Generates realistic construction cost breakdowns (materials, labor, foundation, roofing, plumbing, electrical, interior finishes) customized for Sri Lankan building standards.
- Ingests land size, house size, floor count, room count, and material preferences (Tokyo Super / Sanstha cement, river vs. manufactured sand, roof tile varieties).
- Integrates with OpenRouter AI (`gpt-4o-mini`) for architectural layout and ventilation strategies, with an automatic heuristic fallback if offline.

### 2. 📄 Instant Programmatic ReportLab PDF Generation
- Compiles project estimations into clean, multi-page vector PDF documents directly on the backend.
- Includes cost summary cards, architectural design directions, itemized Bill of Quantities, and anti-tamper background watermarks.

### 3. 🔨 Open Tender Bidding & Ticket Paywall
- Clients publish estimates to the open tender board with a single click.
- Verified contractors, engineers, and architects submit proposals with price quotes, timeframes, and cover letters.
- **Ticket Bundle Model:** Unlocking client and professional contact details uses a paywall bundle (3 unlocks for LKR 500) to protect privacy and eliminate spam.
- Accepting a bid automatically awards the tender and marks competing proposals as rejected.

### 4. 🛒 Live Material Marketplace with AI Price Crawler
- E-commerce catalog tracking prices for essential commodities in Sri Lanka.
- Automated background crawler updates prices and marks relative freshness (e.g., *"AI updated 2h ago"*).
- Supplier inventory, verified customer reviews, and integrated shopping cart.

### 5. 👷 Verified Professionals Directory
- Comprehensive profiles for Contractors, Architects, Engineers, Quantity Surveyors (QS), and Lawyers.
- Uploaded portfolios and certifications are automatically watermarked in memory via Pillow.
- Gated contact revelation: Non-logged-in visitors are guided to sign in before connecting.

### 6. 🛠️ On-Demand Daily Worker Job Board
- Post urgent site labor requirements (e.g., 3 Masons needed tomorrow in Colombo).
- Workers apply with 1 tap from their smartphones.

---

## 🏗 Architecture & Tech Stack

```
[ Next.js 16 + React 19 Frontend ]  <─── HTTPS / REST ───>  [ Django 5.2 + DRF Backend ]
       │                                                                  │
       ├── Tailwind CSS v4 (Quiet Luxury)                                 ├── Gunicorn WSGI
       ├── Firebase Client SDK (OAuth & JWT)                              ├── Firebase Admin SDK (Auth Middleware)
       └── TypeScript 5                                                   ├── OpenRouter AI (GPT-4o-mini)
                                                                          ├── ReportLab 4.5 (PDF Generator)
                                                                          ├── Pillow (Digital Watermarking)
                                                                          └── SQLite Volume / PostgreSQL
```

- **Frontend:** Next.js 16.2.6 (App Router, Turbopack), React 19.2.4, TypeScript 5, Tailwind CSS v4, Lucide React, Firebase Client SDK.
- **Backend:** Python 3.12, Django 5.2.4, Django REST Framework 3.16, Firebase Admin SDK, ReportLab 4.5.1, Pillow, Gunicorn, WhiteNoise.
- **DevOps:** Docker multi-stage containerization, Railway Nixpacks (Node 20), persistent media volume mounts.

---

## 📚 Project Documentation

For comprehensive technical specifications and academic examination prep, explore:
- **[TECHSTACK.md](file:///d:/Buildmelk/TECHSTACK.md):** Complete deep-dive into system architecture, modules, security design, and deployment.
- **[viva.md](file:///d:/Buildmelk/viva.md):** Comprehensive University Viva Voce examination guide containing realistic examiner questions and model answers across 8 domains.
- **[DEMO_USERS.md](file:///d:/Buildmelk/DEMO_USERS.md):** Pre-seeded demo credentials for all platform roles.

---

## 💻 Getting Started Locally

### Prerequisites
- **Python:** `3.12+`
- **Node.js:** `>= 20.9.0`
- **Git**

---

### 1. Backend Setup (Django + DRF)

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed initial demo data (materials, hardware shops, categories)
python load_initial_data.py
python manage.py seed_demo_users

# Start the Django development server
python manage.py runserver
```
The backend will be live at `http://localhost:8000/api`. Diagnostic health check available at `http://localhost:8000/health/`.

---

### 2. Frontend Setup (Next.js + React)

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Next.js development server (Turbopack)
npm run dev
```
The frontend will be live at `http://localhost:3000`.

---

## 👥 Demo User Accounts

All demo accounts can be initialized with `python manage.py seed_demo_users`:

| Role | Profession Type | Email | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Client** | Homeowner | `client@demo.buildmelk.lk` | `Demo@2026!Client` | Homeowner client account |
| **Professional** | CONTRACTOR | `contractor@demo.buildmelk.lk` | `Demo@2026!Contractor` | Building contractor |
| **Professional** | ENGINEER | `engineer@demo.buildmelk.lk` | `Demo@2026!Engineer` | Civil / structural engineer |
| **Professional** | ARCHITECT | `architect@demo.buildmelk.lk` | `Demo@2026!Architect` | Chartered architect |
| **Professional** | QS | `qs@demo.buildmelk.lk` | `Demo@2026!QS` | Quantity surveyor |
| **Professional** | LAWYER | `lawyer@demo.buildmelk.lk` | `Demo@2026!Lawyer` | Construction deed lawyer |
| **Professional** | HARDWARE | `hardware@demo.buildmelk.lk` | `Demo@2026!Hardware` | Hardware store owner |
| **Professional** | WORKER | `worker@demo.buildmelk.lk` | `Demo@2026!Worker` | Site artisan / worker |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
SECRET_KEY=your-production-secret-key
DEBUG=True
ALLOWED_HOSTS=*
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4o-mini
# Optional PostgreSQL:
# DATABASE_URL=postgres://user:password@host:port/dbname
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## ☁️ Cloud Deployment (Railway)

The repository is pre-configured for automated monorepo deployment on **Railway**:

1. **Backend Service:**
   - **Builder:** `DOCKERFILE` (`backend/Dockerfile`)
   - **Persistent Volume:** Mount at `/app/media` to persist database and uploaded images.
   - **Start Command:** Automatically runs migrations, seeds initial data, and boots Gunicorn on `$PORT`.
2. **Frontend Service:**
   - **Builder:** `NIXPACKS` pinned to Node 20 (`frontend/nixpacks.toml` and `frontend/railway.json`).
   - **Start Command:** `npm run start -- -p $PORT -H 0.0.0.0`.

---

## 📄 License

This project was developed for academic and commercial presentation purposes. All rights reserved © 2026 BuildMe.lk.
