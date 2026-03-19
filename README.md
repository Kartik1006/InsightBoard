# InsightBoard

<p align="center">
  A modern, interactive, and AI-powered data visualization dashboard built with Next.js, React, and Tailwind CSS.
</p>

## 🚀 Overview

**InsightBoard** is a premium, highly interactive dashboard application designed to simplify data analysis and visualization. Built primarily for analyzing tabular datasets (like sales, CRM data, or financial records), it allows users to effortlessly upload CSV or Excel files, clean and transform their data on the fly, and visualize insights through customizable charts and KPI cards. 

With a focus on performance, aesthetics, and user experience, InsightBoard integrates modern UI paradigms like drag-and-drop customization, smooth animations, and AI-driven insights to help users make data-driven decisions faster.

Live Demo: [https://insight-board-omega.vercel.app/](https://insight-board-omega.vercel.app/)

## ✨ Why It Was Made

Data analysis tools are often either too complex (requiring specialized coding knowledge) or too rigid (lacking deep customization). InsightBoard bridges this gap by providing a no-code, drag-and-drop interface paired with the power of advanced data processing and AI capabilities. It was created to:
- **Democratize Data Analysis**: Make complex datasets understandable through an intuitive user interface.
- **Eliminate Busywork**: Automate tedious data cleaning tasks with built-in preprocessing tools.
- **Enhance Visibility**: Provide dynamic, real-time visual feedback on critical metrics.
- **Accelerate Decision Making**: Leverage AI to automatically surface hidden trends and actionable insights, reducing manual analytical effort.

## 🎯 Use Cases & Applications

InsightBoard is versatile and can be applied across various domains and professions:
- **Business Intelligence & Sales**: Analyze sales pipelines, revenue growth, customer acquisition costs, and identify top-performing regions.
- **Financial Analysis**: Visualize expense reports, track budget variances, and monitor cash flow efficiently.
- **Marketing Analytics**: Assess campaign performance, track engagement metrics, and analyze customer demographics.
- **Operations & Logistics**: Monitor inventory levels, track shipment delivery times, and optimize supply chain efficiency.
- **Data Journalism & Research**: Quickly parse and visualize publicly available datasets to uncover trends, anomalies, and stories.

## 🛠 Features

- **File Upload & Parsing**: Seamlessly drag and drop CSV or Excel datasets. The app utilizes `papaparse` and `xlsx` for robust, high-performance client-side parsing.
- **Automated Data Cleaning**: Built-in utilities to instantly handle messy data—drop empty rows, remove duplicates, trim whitespace, and standardize headers with a single click.
- **Interactive Dashboards**: Construct custom dashboard layouts using intuitive drag-and-drop functionality built with `@dnd-kit`.
- **Advanced Visualizations**: Beautiful, responsive charts powered by `recharts`. Includes interactive features like **Chart Zoom** for granular, deep-dive analysis.
- **AI-Powered Insights**: Integrates the **Gemini AI API** to automatically analyze your dataset and provide smart, context-aware recommendations directly alongside your charts.
- **Premium UI/UX**: Designed with a sleek Light/Dark mode toggle, engaging micro-animations using `framer-motion`, and beautifully crafted styling via Tailwind CSS v4.
- **Real-time Filtering**: Drill down into specific data points securely and quickly with dynamically generated filters.

## 💻 Technical Specifications

### Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & CSS Modules
- **State Management**: Zustand (`hooks/useDataStore.tsx` & Context API)
- **Charting**: [Recharts](https://recharts.org/)
- **Animations & Interactions**: [Framer Motion](https://www.framer.com/motion/) & [dnd-kit](https://dndkit.com/)
- **Data Processing**: [PapaParse](https://www.papaparse.com/) (CSV) & [SheetJS / xlsx](https://sheetjs.com/) (Excel)
- **Icons**: [Lucide React](https://lucide.dev/)

### Project Architecture
```text
InsightBoard/
├── app/                  # Next.js App Router (pages, layout, globals.css)
├── components/           # Modular React components
│   ├── cleaning/         # Data upload, preview, and cleaning interfaces
│   ├── dashboard/        # Charts, KPI widgets, Filter panels, Custom builder
│   └── layout/           # App shell, Navbar, Theme toggle
├── hooks/                # Custom React hooks & global state definitions
├── lib/                  # Core business logic (parser, cleaner, analyzer, types)
└── public/               # Static assets & sample datasets
```

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd dashboard1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your API keys (e.g., for AI features):
   ```env
   # Required for the generative AI insights panel
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the Application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser. Feel free to upload the included sample datasets from the `/public` directory to see the dashboard in action.

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
*Built to make data analysis visually stunning, intuitive, and highly accessible.*
