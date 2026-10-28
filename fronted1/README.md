# Excel Analytics - Frontend

Interactive Next.js 15 application for uploading, visualizing, and analyzing Excel datasets.

## Key Features
- **In-Browser Excel Engine**: Fast client-side `.xlsx` and `.xls` parsing with `xlsx` library, sheet switching, and paginated data preview.
- **2D Visualizations (Chart.js)**:
  - Bar Charts (Vertical & Horizontal)
  - Trend Line Charts
  - Filled Area Charts
  - Pie & Doughnut Charts
  - Numerical Scatter Plots
  - Bubble Charts
  - One-click PNG image export
  - Type-validated axes, grouped measures, chronological date aggregation, and INR labels
- **3D Visualizations (Plotly)**:
  - 3D Numeric Point Plots
  - 3D Surface Elevation Mesh
  - 3D Point Cloud Scatter
  - Numeric 3D Bubble and Line plots
  - Category Donut
  - Geographic Power Map (3D Globe)
  - 3D Pan, Zoom, and Rotation
- **AI Intelligence Hub**:
  - Connects to Google Gemini API
  - Automated executive summaries
  - Trend and growth driver analysis
  - Anomaly and outlier detection
  - Natural language Q&A on your uploaded spreadsheet
- **Redux State Persistence**:
  - `redux-persist` saves user session state and analysis history in browser storage.
  - Uploaded workbook data is kept in session storage and is not copied into persistent analysis history.
- **Analysis History**:
  - Full production architecture with hybrid cloud synchronization (MongoDB backend) and resilient local caching (`redux-persist`).
  - Automated tracking of Gemini insights, 2D/3D charts, and column statistics.
  - Interactive history studio with full-text search, category filtering (All, AI Insights, Charts, Summaries), and sorting.
  - Multi-format data export: 1-click CSV export for tabular data snapshots, Markdown (.md) export for AI insights, and clipboard copying.
  - Dedicated `/history` route and integrated visualization tab (`/tabSection?tab=HISTORY`).
  - Safe confirmation modal for clearing history and instant single-item deletions.
- **Chart validation**:
  - Scatter and bubble plots require numeric dimensions; nominal categories are not encoded as measurements in 3D plots.
  - Invalid/missing data is shown as a validation message instead of being silently converted to zero.

## Getting Started
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
