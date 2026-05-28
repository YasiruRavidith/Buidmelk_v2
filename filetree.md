buildme-lk/
│
├── .gitignore                           # Ignores venv, node_modules, .env files
├── README.md                            # Project documentation
│
├── backend/                             # 🐍 DJANGO BACKEND
│   ├── venv/                            # Python virtual environment (ignored in git)
│   ├── manage.py                        # Django CLI tool
│   ├── requirements.txt                 # Backend dependencies list
│   ├── .env                             # Backend env variables (Secrets, DB URL)
│   ├── firebase-key.json                # Firebase Admin SDK credentials (SECRET)
│   │
│   ├── core/                            # Main Django Configuration
│   │   ├── __init__.py
│   │   ├── asgi.py                      # For async support (useful for chat/websockets later)
│   │   ├── settings.py                  # Apps, CORS, DB, Firebase setup
│   │   ├── urls.py                      # Main routing (includes all app URLs)
│   │   └── wsgi.py
│   │
│   ├── users/                           # 👤 App 1: Auth & Profiles
│   │   ├── migrations/
│   │   ├── __init__.py
│   │   ├── admin.py                     # CustomUser & ProfessionalProfile admin logic
│   │   ├── apps.py
│   │   ├── models.py                    # CustomUser, ProfessionalProfile models
│   │   ├── serializers.py               # JSON conversion for profiles
│   │   ├── urls.py                      # /api/users/... routes
│   │   └── views.py                     # Firebase token verify, profile fetching
│   │
│   ├── estimations/                     # 📐 App 2: Smart Estimation Engine
│   │   ├── migrations/
│   │   ├── models.py                    # MaterialPrices, EstimationHistory models
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py                     # Cost calculation logic
│   │
│   ├── bidding/                         # 🔨 App 3: Open Bidding System
│   │   ├── migrations/
│   │   ├── models.py                    # ProjectPost, Bid, Milestone models
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py                     # Publishing projects, submitting bids
│   │
│   ├── marketplace/                     # 🛒 App 4: Materials & Transport Hub
│   │   ├── migrations/
│   │   ├── models.py                    # Product, HardwareStore, Vehicle models
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py                     # Listings, purchasing logic
│   │
│   └── ai_chatbot/                      # 🤖 App 5: AI integration (Llama/OpenAI)
│       ├── __init__.py
│       ├── urls.py
│       ├── views.py                     # Handles queries from frontend chatbot
│       └── ai_service.py                # LangChain/LLM connection logic
│
└── frontend/                            # ⚛️ NEXT.JS FRONTEND (React)
    ├── .env.local                       # Frontend env variables (Firebase Public Keys)
    ├── next.config.mjs                  # Next.js configurations
    ├── package.json                     # Node.js dependencies
    ├── postcss.config.js                # Tailwind CSS processing
    ├── tailwind.config.ts               # Vibrant Tectonics Colors & Spacing
    ├── tsconfig.json                    # TypeScript configuration
    │
    ├── public/                          # Static Assets
    │   ├── google-icon.svg              # Google Auth icon
    │   ├── default-avatar.png           # Fallback image for profiles
    │   └── illustrations/               # Architectural vectors/graphics
    │
    ├── types/                           # 📘 TypeScript Interfaces (Type Safety)
    │   ├── index.ts                     # Shared generic types
    │   ├── user.ts                      # User & Professional Profile types
    │   └── project.ts                   # Estimation & Bidding types
    │
    ├── lib/                             # 🛠️ Helpers & Configs
    │   ├── firebase.ts                  # Firebase auth initialization
    │   ├── api.ts                       # Axios setup for calling Django APIs
    │   └── utils.ts                     # Currency formatters, date parsers
    │
    ├── hooks/                           # 🪝 Custom React Hooks
    │   ├── useAuth.ts                   # Listens to Firebase Auth state
    │   └── useProfile.ts                # Fetches current user's Django profile
    │
    └── app/                             # 🚦 NEXT.JS APP ROUTER
        ├── globals.css                  # Global styles, Tailwind directives
        ├── layout.tsx                   # Root layout (Navbar, Footer, Fonts)
        ├── page.tsx                     # 🏠 Home Page (Landing)
        │
        ├── components/                  # 🧩 Reusable UI Components
        │   ├── ui/                      # Base Design System Elements
        │   │   ├── Button.tsx
        │   │   ├── Input.tsx
        │   │   ├── Select.tsx
        │   │   └── Badge.tsx
        │   ├── layout/                  # Structural Elements
        │   │   ├── Navbar.tsx
        │   │   ├── Footer.tsx
        │   │   └── Sidebar.tsx
        │   └── features/                # Complex UI parts
        │       ├── ProfileCard.tsx      # For the professionals directory
        │       ├── BidCard.tsx          # For the bidding feed
        │       └── ChatbotWidget.tsx    # Floating AI assistant
        │
        ├── (auth)/                      # 🔐 Authentication Routes (Grouped)
        │   └── login/
        │       └── page.tsx             # Login / Sign up UI
        │
        ├── onboarding/                  # 📝 Profile Setup
        │   └── page.tsx                 # Select Client/Professional, add details
        │
        ├── dashboard/                   # 📊 Protected Dashboards
        │   ├── layout.tsx               # Shared dashboard sidebar/wrapper
        │   ├── client/                  # Homeowner Dashboard
        │   │   └── page.tsx             # Active projects, my bids, chat
        │   └── professional/            # Worker/Contractor Dashboard
        │       └── page.tsx             # Received jobs, earnings, profile edit
        │
        ├── professionals/               # 👷‍♂️ Worker & Professional Directory
        │   ├── page.tsx                 # Search & filter professionals
        │   └── [id]/                    # Dynamic Route: View specific profile
        │       └── page.tsx             # Profile details, portfolio, reviews
        │
        ├── estimation/                  # 🧮 Smart Estimation UI
        │   ├── page.tsx                 # Input house details (Rooms, size)
        │   └── result/
        │       └── page.tsx             # Show generated breakdown (Cement, Labor)
        │
        ├── bidding/                     # ⚖️ Open Bidding Feed
        │   ├── page.tsx                 # Live list of projects needing workers
        │   └── [projectId]/
        │       └── page.tsx             # View project details & submit a bid
        │
        └── materials/                   # 🧱 Material & Transport Hub
            ├── page.tsx                 # Categories (Sand, Cement, Vehicles)
            └── [category]/
                └── page.tsx             # Shop listings for specific items