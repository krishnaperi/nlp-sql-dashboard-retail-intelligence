# SnowQuery

A Next.js application that converts natural language questions into Snowflake SQL queries and renders interactive ECharts visualizations on a dynamic Multi-Chart Dashboard framework.

## Architecture

* **Frontend:** Next.js (React), framer-motion, Apache ECharts
* **Backend:** Next.js Serverless API Routes
* **AI Engine:** Google Gemini (NL-to-SQL logic) 
* **Database:** Snowflake (Cortex Analyst, Key-Pair Authentication)
* **Design:** Custom Dark-Mode CSS grid with Glassmorphism UI

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd snowquery
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your credentials. **Never commit this file to version control.**

   ```env
   # API Keys
   GEMINI_API_KEY=your_gemini_api_key

   # Snowflake Configuration
   SNOWFLAKE_ACCOUNT=your_account_id
   SNOWFLAKE_USERNAME=your_username
   SNOWFLAKE_PRIVATE_KEY=your_base64_private_key_without_headers
   SNOWFLAKE_DATABASE=COVID19_EPIDEMIOLOGICAL_DATA
   SNOWFLAKE_SCHEMA=PUBLIC
   SNOWFLAKE_WAREHOUSE=SNOWQUERY_WH
   SNOWFLAKE_ROLE=ACCOUNTADMIN
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## Authentication Note

This application uses **Key-Pair Authentication** to connect to Snowflake, replacing standard password authentication to securely bypass multi-factor authentication (MFA) requirements for programmatic access. Ensure your `.p8` private key files or raw text keys are added to your `.gitignore`.
