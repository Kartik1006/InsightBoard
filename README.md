# InsightBoard

<p align="center">
  A modern, AI-powered data analytics platform — a simpler, more intuitive alternative to PowerBI and Tableau.<br/>
  Built with Next.js, React, Recharts, and OpenRouter AI.
</p>

## 🚀 Overview

**InsightBoard** is a premium, full-featured data analytics dashboard that transforms raw CSV/Excel data into interactive visualizations, AI-driven insights, and SQL-powered queries — all without writing a single line of code.

Upload any dataset, and InsightBoard automatically generates KPI cards, smart chart recommendations, and actionable insights. Go deeper with the **Natural Language SQL Engine** — ask questions in plain English and get instant answers. Build complex multi-series charts with the **Advanced Chart Builder**, or explore your data row-by-row with the **Data Explorer**.

Live Demo: [https://insight-board-omega.vercel.app/](https://insight-board-omega.vercel.app/)

## ✨ Why It Was Made

Data analysis tools are often either too complex (requiring specialized coding knowledge) or too rigid (lacking deep customization). InsightBoard bridges this gap by providing a no-code, drag-and-drop interface paired with the power of advanced data processing, AI capabilities, and SQL querying. It was created to:

- **Democratize Data Analysis**: Make complex datasets understandable through an intuitive user interface.
- **Eliminate Busywork**: Automate tedious data cleaning tasks with built-in preprocessing tools.
- **Enable Natural Language Querying**: Ask questions about your data in plain English — no SQL knowledge required.
- **Deliver Advanced Visualizations**: Build multi-series, grouped, and stacked charts that rival PowerBI's capabilities.
- **Accelerate Decision Making**: Leverage AI to automatically surface hidden trends and actionable insights.

## 🎯 Use Cases & Applications

InsightBoard is versatile and can be applied across various domains and professions:
- **Business Intelligence & Sales**: Analyze sales pipelines, revenue growth, customer acquisition costs, and identify top-performing regions.
- **Financial Analysis**: Visualize expense reports, track budget variances, and monitor cash flow efficiently.
- **Marketing Analytics**: Assess campaign performance, track engagement metrics, and analyze customer demographics.
- **Operations & Logistics**: Monitor inventory levels, track shipment delivery times, and optimize supply chain efficiency.
- **Data Journalism & Research**: Quickly parse and visualize publicly available datasets to uncover trends, anomalies, and stories.

## 🛠 Features

### Core Dashboard
- **File Upload & Parsing**: Drag and drop CSV or Excel datasets. Uses `papaparse` and `xlsx` for robust, high-performance client-side parsing.
- **Automated Data Cleaning**: Drop empty rows, remove duplicates, trim whitespace, and standardize headers with a single click.
- **Interactive Dashboards**: Drag-and-drop chart reordering with `@dnd-kit`. KPI cards, filters, and chart widgets auto-generated from your data.
- **Advanced Visualizations**: 7 chart types (Bar, Line, Area, Donut/Pie, Scatter, Radar, Step) powered by `recharts` with interactive zoom capabilities.
- **AI-Powered Insights**: Integrates OpenRouter AI (GPT models) to automatically analyze your dataset and provide smart, context-aware insights — both globally and per-chart (flip any chart to see its AI analysis).
- **Premium UI/UX**: Sleek dark/light mode, micro-animations via `framer-motion`, and a Carbon-inspired design system.
- **Real-time Filtering**: Drill down with dynamically generated category and date-range filters.

### 🗣️ Natural Language SQL Query Engine *(New)*
- **Ask in Plain English**: Type questions like *"Show total revenue by country"* or *"What are the top 10 products by sales?"*
- **AI-Powered SQL Generation**: OpenRouter AI converts your question to a valid SQL query, tuned for AlaSQL compatibility.
- **Client-Side Execution**: SQL runs entirely in-browser using [AlaSQL](https://github.com/AlaSQL/alasql) — no server database needed.
- **Editable SQL**: View, edit, and re-run the generated SQL before executing.
- **Auto-Chart Results**: Query results automatically visualized as charts when applicable.
- **Query History**: Re-run past queries with a single click.
- **Safety First**: Only `SELECT` queries are allowed — no data mutation possible.

### 📊 Advanced Chart Builder *(Enhanced)*
- **Multi-Y Axis Columns**: Select 2+ numeric columns to overlay on the same chart as multiple series.
- **Group-By / Color-By**: Add a categorical column to split data into colored series (e.g., revenue by country, grouped by product type).
- **Sort Control**: Sort by value (ascending/descending) or alphabetically.
- **Top-N Limiter**: Slider to show the top 5, 10, 15, 20, or 50 records.
- **Stacked / Grouped Toggle**: For bar and area charts, switch between stacked and side-by-side layouts.
- **Custom Chart Titles**: Name your charts however you like.
- **Live Preview**: See your chart before adding it to the dashboard.

### 📋 Data Explorer *(New)*
- **Full Table View**: Spreadsheet-like view of your entire dataset with row numbers.
- **Sortable Columns**: Click any column header to sort ascending/descending.
- **Global Search**: Search across all columns simultaneously.
- **Column Stats on Hover**: See type, unique count, null count, min, max, and mean for any column.
- **Pagination**: Navigate large datasets with full pagination controls.

### 🗂️ Tab-Based Navigation *(New)*
- **Dashboard Tab**: KPIs, charts, AI insights, custom chart builder — the full analytics view.
- **Data Explorer Tab**: Sortable, searchable, paginated table view of your raw data.
- **SQL Query Tab**: Natural language query interface with results table and auto-charting.

## 💻 Technical Specifications

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Custom CSS Design System |
| **State Management** | React Context API (`hooks/useDataStore.tsx`) |
| **Charting** | [Recharts](https://recharts.org/) (multi-series, stacked, grouped) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Drag & Drop** | [dnd-kit](https://dndkit.com/) |
| **Data Parsing** | [PapaParse](https://www.papaparse.com/) (CSV) & [SheetJS](https://sheetjs.com/) (Excel) |
| **SQL Engine** | [AlaSQL](https://github.com/AlaSQL/alasql) (client-side in-memory SQL) |
| **AI Integration** | [OpenRouter API](https://openrouter.ai/) (GPT models for insights & NL→SQL) |
| **Icons** | [Lucide React](https://lucide.dev/) |

### Project Architecture
```text
InsightBoard/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── insights/         # AI insights API route
│   │   └── nl-to-sql/        # Natural language → SQL API route
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Main page (upload → preview → dashboard)
│   └── globals.css           # Design system & component styles
├── components/
│   ├── cleaning/             # Data cleaning panel
│   ├── dashboard/
│   │   ├── AIInsightsPanel   # Global AI insights
│   │   ├── ChartWidget       # Chart rendering (multi-series support)
│   │   ├── ChartZoom         # Zoom/drill-down modal
│   │   ├── CustomChartBuilder# Advanced chart builder (multi-column)
│   │   ├── DashboardView     # Main dashboard with tab navigation
│   │   ├── DataExplorer      # Sortable/searchable data table
│   │   ├── FilterPanel       # Dynamic data filters
│   │   ├── KPICard           # KPI metric cards
│   │   └── NLQueryPanel      # Natural language SQL query interface
│   ├── layout/               # Header, theme toggle
│   └── upload/               # File upload & data preview
├── hooks/                    # useDataStore (global state)
├── lib/
│   ├── analyzer.ts           # Chart engine (adaptive + advanced custom)
│   ├── cleaner.ts            # Data cleaning utilities
│   ├── parser.ts             # CSV/Excel parser
│   ├── sqlEngine.ts          # AlaSQL wrapper (client-side SQL)
│   ├── types.ts              # TypeScript type definitions
│   └── utils.ts              # Formatting & helper functions
└── public/                   # Sample datasets
```

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kartik1006/InsightBoard.git
   cd InsightBoard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Required for AI insights and NL→SQL features
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the Application:**
   Navigate to [http://localhost:3000](http://localhost:3000). Upload the included sample datasets from `/public` to see the dashboard in action.

## 🤝 Contributing

Contributions are always welcome! If you'd like to improve InsightBoard:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is open-source. Please add a license of your choice (e.g. MIT) if desired.

---
*Built to make data analysis visually stunning, intuitive, and highly accessible — a simpler PowerBI for everyone.*
