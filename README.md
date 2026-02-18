
# SaccoFlow - Multi-Tenant SACCO Management SaaS

SaccoFlow is a secure, scalable, and multi-tenant record-keeping system for SACCOs (Savings and Credit Cooperative Organizations). It is built with React, Vite, and Ant Design on the frontend, and powered by Supabase for backend services (PostgreSQL, Auth, RLS).

## Features

- **Multi-Tenant Architecture**: Supports hundreds of SACCOs with strict data isolation via Row Level Security (RLS).
- **Role-Based Access Control**: Separate dashboards for Admins and Members.
- **Member Management**: Add, update, and manage member profiles.
- **Financial Tracking**: 
  - Manage Savings and Share accounts.
  - Record Deposits and Withdrawals (with audit trails).
- **Loan Management**:
  - Apply for loans (Members).
  - Approve, reject, and disburse loans (Admins).
  - Track repayment status.
- **Reporting**: Export Members, Transactions, and Loans to CSV.
- **Audit Logging**: Tracks critical actions for accountability.
- **Responsive Design**: Mobile-friendly interface using Ant Design.

## Tech Stack

- **Frontend**: React + Vite
- **UI Framework**: Ant Design
- **Routing**: React Router
- **Backend / Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: GitHub Pages (Static Site)

## Prerequisites

- Node.js (v18+)
- A Supabase Project (See setup below)

## Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/your-username/saccoflow.git
cd saccoflow
npm install
```

### 2. Configure Supabase

1.  Create a new Supabase project at [database.new](https://database.new).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Copy the contents of `database.sql` from this repository and run it. This will create the necessary tables, RLS policies, and helper functions.
4.  Optionally, run the contents of `triggers.sql` to set up automatic balance updates.

### 3. Environment Variables

1.  Copy `.env.example` to `.env`.
    ```bash
    cp .env.example .env
    ```
2.  Update `.env` with your Supabase credentials:
    ```
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```
    (Find these in Supabase Settings -> API)

### 4. Run Locally

```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

## Deployment to GitHub Pages

1.  **Build the project**:
    ```bash
    npm run build
    ```
    This creates a `dist` folder.

2.  **Deploy**:
    - Push your changes to GitHub.
    - Go to your repository **Settings** -> **Pages**.
    - Set the **Source** to `GitHub Actions` or manually select the branch (usually `main` or `gh-pages` if you use a deploy script).
    - *Recommended*: Use a workflow or simply push the `dist` folder content to a `gh-pages` branch.
    
    *Alternative (easiest for Vite)*:
    - Install `gh-pages`: `npm install gh-pages --save-dev`
    - Add to `package.json` scripts:
      ```json
      "predeploy": "npm run build",
      "deploy": "gh-pages -d dist"
      ```
    - Run `npm run deploy`.

    *Note*: You must set your Supabase URL/Key in your production environment or build process if not committed in `.env`. For static sites, `.env` variables are embedded at build time, so ensure `.env` is present during build or variables are set in CI/CD.

## Usage Guide

1.  **Register a SACCO**: Go to `/register-sacco` to create a New Sacco and Admin account.
2.  **Login**: Use the Admin email/password.
3.  **Onboard Members**: Go to the Members tab and start adding members.
4.  **Record Transactions**: Go to Transactions to record initial deposits/shares.

## License

MIT
