# Excel Analytics

> A full-stack web application for interactive Excel spreadsheet processing, advanced 2D & 3D data visualization, and AI-powered dataset intelligence powered by Google Gemini.

---

## 1. Project Overview

**Excel Analytics** is an end-to-end analytics platform designed to bridge the gap between raw spreadsheet data and actionable insights. Built with a modern **Next.js 15 (React 19)** frontend and a resilient **Node.js / Express** backend, the application allows users to upload Microsoft Excel workbooks (`.xlsx`, `.xls`), explore and paginate data sheets in-browser, generate high-performance 2D and 3D visual charts, and query datasets using Google Gemini AI.

---

## 2. Problem Statement & Proposed Solution

### The Problem
* Non-technical users and data teams frequently work with tabular data in Excel, but generating multifaceted charts or extracting rapid qualitative summaries often requires steep learning curves or fragmented third-party tools.
* Visualizing multidimensional datasets across 3D coordinates (such as surface elevation, 3D bar columns, or geospatial data) is notoriously difficult in conventional spreadsheet software.
* Traditional BI setups often lack integrated natural language exploration without complex cloud warehousing pipelines.

### The Solution
* **Zero-Setup Spreadsheet Ingestion**: Client-side parsing using SheetJS (`xlsx`) allows instant workbook exploration without requiring initial server-side conversions for standard previews.
* **Dual Visualization Engine**: Combines **Chart.js** for responsive 2D charts (bar, line, area, pie, scatter, bubble) and **Plotly.js** for interactive 3D WebGL visualizations (3D scatter, surfaces, ribbons, columns, geographic power maps).
* **Integrated Gemini AI Assistant**: Connects to Google's Gemini models via a dedicated, authenticated Express backend endpoint to deliver executive summaries, growth trend analysis, anomaly detection, and conversational Q&A over spreadsheet rows.
* **Persistent Session & State Management**: Redux Toolkit with `redux-persist` ensures active sheets, parsed tables, and user authentication tokens persist across browser refreshes.

---

## 3. Key Features

- **Authentication & User Management**:
  - Secure registration and login with `bcryptjs` password hashing (salt factor 10).
  - JWT authentication using HTTP-only cookies (`sameSite: 'strict'`) and optional Bearer token authorization header support.
  - Profile customization with image uploads processed through Multer and streamed to Cloudinary CDN storage.
  - Client-side navigation authentication guards (`AuthGuard`) protecting private routes (`/upload`, `/tabSection`, `/ai`, `/profile`).

- **Spreadsheet Processing**:
  - Drag-and-drop file upload via `react-dropzone`.
  - In-browser workbook decoding supporting multi-sheet selection.
  - Paginated data grid with dynamic row slicing and column discovery.

- **Interactive 2D Visualizations (Chart.js)**:
  - Vertical and Horizontal Bar Charts
  - Multi-series Trend Line Charts
  - Area Fill Charts
  - Pie and Doughnut Charts
  - Scatter & Bubble Plots
  - Export to PNG feature with `downloadjs`

- **Interactive 3D Visualizations (Plotly.js WebGL)**:
  - 3D Bar & Column graphs with dynamic axis mapping (X, Y, Z coordinates)
  - 3D Point Cloud Scatter plots
  - 3D Surface elevation mesh visualization
  - 3D Bubble / 4D coordinate scatter
  - 3D Ribbon & perspective charts
  - Geographic 3D Power Map projection for latitude/longitude datasets
  - Interactive camera controls: rotate, pan, and zoom in WebGL space

- **AI Analytics Hub**:
  - Direct natural language prompt interface for spreadsheet data.
  - Pre-engineered quick prompt templates:
    - *Executive Summary*: High-level summary of columns and figures.
    - *Key Trends & Drivers*: Growth patterns, peaks, and troughs.
    - *Anomaly Detection*: Outliers, data inconsistencies, or abnormal variances.
  - Resilient backend client with transient error retries (503/429 backoff).

---

## 4. Technology Stack

### Frontend (`fronted1/`)
| Layer | Technologies |
|---|---|
| **Framework** | Next.js 15.4.4 (App Router), React 19.1.0 |
| **State Management** | Redux Toolkit (`@reduxjs/toolkit`), `react-redux`, `redux-persist` |
| **Styling** | Tailwind CSS v4, Lucide React icons, React Icons, Framer Motion |
| **2D Charting** | Chart.js v4, `react-chartjs-2` |
| **3D Charting** | Plotly.js v3, `react-plotly.js` |
| **Excel Parser** | SheetJS (`xlsx`) |
| **HTTP Client** | Axios (configured with `withCredentials: true`) |
| **UI Notifications** | React-Toastify |

### Backend (`backend/`)
| Layer | Technologies |
|---|---|
| **Runtime & Framework** | Node.js (ES Modules), Express.js v5 |
| **Database & ODM** | MongoDB, Mongoose v8 |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors` |
| **File & Media Handling** | Multer (memory storage), Cloudinary SDK v2 |
| **AI Integration** | Google Gen AI SDK (`@google/genai`) with Gemini models |
| **Test Runner** | Native Node.js Test Runner (`node:test`) |

---

## 5. Architecture Overview & Data Flow

```
[ User Browser / Client (Next.js 15 App Router) ]
       │
       ├─► (Client-side) Excel Upload (xlsx) ──► Redux Store (Parsed Rows & Columns)
       │                                                 │
       │                                                 ├─► Chart.js 2D Charts
       │                                                 └─► Plotly.js 3D WebGL Charts
       │
       ▼ (HTTP / REST with Credentials)
[ Express.js API Server (port 8000) ]
       │
       ├─► /api/v1/user/register & /login ──────► MongoDB (Mongoose Schema)
       ├─► /api/v1/user/update-photo (Multer) ──► Cloudinary Cloud Storage
       └─► /api/v1/user/gemni ─────────────────► Google Gemini API (gemini-3.8-flash)
```

---

## 6. Repository Structure

```
excel-analytics/
├── .gitignore                      # Root Git ignore configuration
├── README.md                       # Comprehensive project documentation
├── backend/                        # Express.js REST API
│   ├── .env.example                # Backend environment variable template
│   ├── .gitignore                  # Backend specific ignore rules
│   ├── package.json                # Backend scripts and dependencies
│   ├── server.js                   # Application entry point, middleware, and route mounting
│   ├── cloudinary/
│   │   └── cloudinary.js           # Cloudinary v2 SDK configuration
│   ├── controllers/
│   │   └── authController.js       # Register, login, logout, profile, and Gemini AI handlers
│   ├── middleware/
│   │   ├── authMiddleWare.js       # JWT cookie & Bearer token verification
│   │   └── db.js                   # Mongoose MongoDB connection helper
│   ├── models/
│   │   └── User.js                 # User schema definition
│   ├── multer/
│   │   └── multer.js               # Multer memory storage configuration for file uploads
│   ├── public/                     # Public static assets
│   ├── routes/
│   │   └── userRoutes.js           # User and AI API route declarations
│   └── tests/
│       └── auth.test.js            # Automated unit tests with node:test
└── fronted1/                       # Next.js frontend application (App Router)
    ├── .env.example                # Frontend environment variable template
    ├── .gitignore                  # Frontend specific ignore rules
    ├── package.json                # Frontend scripts and dependencies
    ├── next.config.mjs             # Next.js compiler and bundle settings
    ├── postcss.config.mjs          # PostCSS configuration
    ├── app/                        # Next.js App Router pages
    │   ├── layout.js               # Root layout with Redux Store provider & Toast container
    │   ├── page.js                 # Landing page
    │   ├── login/page.js           # Login screen
    │   ├── signup/page.js          # User registration screen
    │   ├── profile/page.js         # User profile and avatar management
    │   ├── upload/page.js          # Excel upload and data preview page
    │   ├── tabSection/page.js      # 2D and 3D visualization dashboard
    │   └── ai/page.js              # AI spreadsheet analytics and Q&A workspace
    ├── components/                 # Reusable React components
    │   ├── AuthGuard.js            # Client-side session and route authentication protection
    │   ├── ExcelPreview.js         # Paginated Excel grid renderer
    │   ├── Header.js               # Main responsive navigation bar
    │   ├── chart2D/                # Chart.js component implementations
    │   └── chart3D/                # Plotly.js 3D chart components & PlotlyWrapper
    └── redux/                      # Redux state slices & store persistence
        ├── store.js                # Root Redux store configuration
        ├── authSlice.js            # Authentication state slice
        ├── excelSlice.js           # Parsed spreadsheet datasets slice
        ├── storage.js              # SSR-compatible fallback storage for redux-persist
        └── provide.js              # Redux Provider client wrapper
```

> **Note on directory naming:** The frontend is located in `fronted1/` to match the existing project structure and import paths.

---

## 7. Prerequisites

Before running the application, make sure you have the following installed:

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or later
- **MongoDB**: A running local instance (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster
- **Google AI Studio Account**: For generating an API key to use Google Gemini AI
- **Cloudinary Account**: For cloud image hosting (free tier works)

---

## 8. Installation & Setup Instructions

Clone the repository and enter the directory:

```bash
git clone https://github.com/Vinay-kumar-123/Excel-analysis.git
cd Excel-analysis
```

### Windows (PowerShell)

```powershell
# 1. Install Backend Dependencies
Set-Location backend
npm install
Set-Location ..

# 2. Install Frontend Dependencies
Set-Location fronted1
npm install
Set-Location ..
```

### macOS / Linux (Bash)

```bash
# 1. Install Backend Dependencies
cd backend && npm install && cd ..

# 2. Install Frontend Dependencies
cd fronted1 && npm install && cd ..
```

---

## 9. Environment Variable Configuration

Create the respective `.env` files from the provided templates.

### Backend (`backend/.env`)

Copy the template:
```powershell
# Windows PowerShell
Copy-Item backend/.env.example backend/.env

# macOS / Linux
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:
```env
PORT=8000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/excel-analytics
SECRET_KEY=your_secure_random_jwt_secret_key
GEMNI_AI_API=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend (`fronted1/.env.local`)

Copy the template:
```powershell
# Windows PowerShell
Copy-Item fronted1/.env.example fronted1/.env.local

# macOS / Linux
cp fronted1/.env.example fronted1/.env.local
```

Edit `fronted1/.env.local` with your values:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
CLOUD_NAME=your_cloudinary_cloud_name
UPLOAD_PRESET=your_cloudinary_upload_preset
```

---

## 10. Backend Startup Instructions

From the root project directory:

```powershell
# Using PowerShell
Set-Location backend
npm run dev      # Runs with nodemon for hot-reloading
# OR for production:
npm start        # Runs standard node server.js
```

The backend server listens on `http://localhost:8000` by default.
A health check is available at `GET http://localhost:8000/health`.

---

## 11. Frontend Startup Instructions

From the root project directory in a separate terminal:

```powershell
# Using PowerShell
Set-Location fronted1
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 12. Available Scripts & Testing Commands

### Backend Scripts (`backend/`)
| Command | Action |
|---|---|
| `npm run dev` | Starts server using `nodemon` on `server.js` |
| `npm start` | Starts production server using `node server.js` |
| `npm test` | Executes unit tests via `node --test tests/*.test.js` |

To run the backend test suite:
```powershell
Set-Location backend
npm test
```

### Frontend Scripts (`fronted1/`)
| Command | Action |
|---|---|
| `npm run dev` | Starts Next.js development server on port 3000 |
| `npm run dev:turbo` | Starts Next.js development server using Turbopack |
| `npm run build` | Builds optimized production static bundle |
| `npm start` | Runs Next.js production server after build |
| `npm run lint` | Runs Next.js ESLint diagnostics |

To validate the frontend build:
```powershell
Set-Location fronted1
npm run build
```

---

## 13. API Overview & Verified Endpoints

Base URL: `http://localhost:8000/api/v1/user`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/health` | No | Server health check (`{ status: "ok" }`) |
| `POST` | `/api/v1/user/register` | No | Create user account (`name`, `email`, `password`) |
| `POST` | `/api/v1/user/login` | No | Authenticate user; sets HTTP-only `token` cookie |
| `GET` | `/api/v1/user/logout` | No | Clears session cookie |
| `GET` | `/api/v1/user/me` | Yes (JWT) | Returns current authenticated user record |
| `POST` | `/api/v1/user/gemni` | Yes (JWT) | Submits dataset payload + prompt query to Google Gemini AI |
| `PUT` | `/api/v1/user/update-photo` | Yes (JWT) | Uploads profile avatar (multipart/form-data, field `image`) |

### Example Request: AI Analytics Endpoint
```http
POST /api/v1/user/gemni HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Cookie: token=<jwt_token_string>

{
  "query": "Identify trends and outliers in this sales data",
  "data": [
    { "Quarter": "Q1", "Revenue": 15000, "Expenses": 8000 },
    { "Quarter": "Q2", "Revenue": 23000, "Expenses": 11000 },
    { "Quarter": "Q3", "Revenue": 31000, "Expenses": 14000 }
  ]
}
```

Response:
```json
{
  "reply": "Based on the provided quarterly data, Revenue demonstrates steady compound growth from Q1 to Q3..."
}
```

---

## 14. Authentication & Security Notes

- **Password Hashing**: Stored using `bcryptjs` with salt round cost factor 10.
- **Session Tokens**: Signed using `HS256` via `jsonwebtoken` with 1-day expiration.
- **Cookies**: Handled with `httpOnly: true` and `sameSite: "strict"` to protect against XSS token exfiltration.
- **Bearer Tokens**: `authMiddleware` additionally supports `Authorization: Bearer <token>` headers for programmatic API consumption.
- **CORS Protection**: Restricted to configured origin (`CLIENT_URL`, default `http://localhost:3000`) with `credentials: true`.
- **Credential Hygiene**: Never commit `.env` files or secret keys to version control. Use `.env.example` templates for configuration.

---

## 15. Excel Upload & Visualization Workflow

```
┌─────────────────────────────────┐
│ 1. Drag & Drop .xlsx or .xls    │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 2. SheetJS In-Browser Parsing   │
│    (Rows extracted to Redux)    │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 3. Data Preview & Pagination    │
│    (/upload view)               │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 4. Visualization Selection      │
│    (/tabSection)                │
├────────────────┬────────────────┤
│ 2D Charts:     │ 3D Charts:     │
│ - Bar          │ - 3D Column    │
│ - Line         │ - 3D Scatter   │
│ - Area         │ - 3D Surface   │
│ - Pie/Doughnut │ - 3D Bubble    │
│ - Scatter      │ - Power Map    │
└────────────────┴────────────────┘
```

1. Navigate to `/upload` after logging in.
2. Upload your Excel spreadsheet (`.xlsx` or `.xls`).
3. Preview the loaded data table, examine column headers, and switch between worksheets.
4. Click **Visualize Data** to navigate to `/tabSection`.
5. Select between **2D Charts** (Chart.js) and **3D Charts** (Plotly WebGL).
6. Pick your chart type, map your independent (X) and dependent (Y, Z) columns, and export images directly as high-resolution PNGs.

---

## 16. AI Analytics Workflow & Gemini Configuration

1. After loading a dataset into memory, navigate to `/ai`.
2. The AI assistant loads your active spreadsheet rows from the Redux store.
3. Choose one of the preset prompts:
   - **Executive Summary**
   - **Trend Analysis**
   - **Anomaly Detection**
   - Or type a custom natural language query (e.g., *"Which product category had the highest profit margin?"*).
4. The client dispatches a POST request to `/api/v1/user/gemni`.
5. The backend passes the structured dataset context to the Gemini API (`gemini-3.8-flash`) using `@google/genai`.
6. Built-in retry handling manages Google API spikes or transient 429/503 limits with exponential backoff.
7. The AI response is rendered with formatted insights in real time.

---

## 17. Troubleshooting

| Issue | Likely Cause | Solution |
|---|---|---|
| **MongoDB connection error (`ECONNREFUSED`)** | Local MongoDB is not running or invalid URI | Verify MongoDB is running locally (`mongod`) or check connection string in `backend/.env`. |
| **`Gemini API key is not configured`** | Missing `GEMNI_AI_API` in `backend/.env` | Generate an API key at [Google AI Studio](https://aistudio.google.com/) and assign it to `GEMNI_AI_API`. |
| **CORS error on client requests** | Origin mismatch between client & server | Verify `CLIENT_URL` in `backend/.env` matches the frontend port (e.g. `http://localhost:3000`). |
| **Plotly chart rendering error on SSR** | Next.js server-side rendering of WebGL window object | Plotly components are wrapped in dynamic client-only loaders (`PlotlyWrapper.js` with `ssr: false`). Ensure client imports use this wrapper. |
| **Profile photo upload fails** | Missing or incorrect Cloudinary credentials | Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`. |

---

## 18. Current Limitations

- **In-Memory Dataset Scope**: Very large Excel workbooks (>50MB or >100,000 rows) may experience browser rendering latency during 3D WebGL mesh generation.
- **AI Token Window**: Passing extremely large multi-sheet tables in full to the Gemini endpoint may approach context limits; consider summarizing or filtering rows prior to AI query dispatch.
- **Gemini Free Tier Quota**: The free tier for Gemini models includes rate limits (per minute/per day). If hit, the backend will return a 429 / transient retry notice.

---

## 19. Contribution Guidelines

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Ensure backend unit tests pass:
   ```bash
   cd backend && npm test
   ```
4. Ensure frontend builds cleanly:
   ```bash
   cd fronted1 && npm run build
   ```
5. Commit your changes with conventional commit syntax (`git commit -m 'feat: add support for parquet files'`).
6. Push to your branch (`git push origin feature/AmazingFeature`).
7. Open a Pull Request.

---

## 20. License

This project is licensed under the terms specified in the repository (ISC License as declared in `backend/package.json`).
