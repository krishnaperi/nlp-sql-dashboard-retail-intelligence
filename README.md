# SnowQuery: AI-Powered Snowflake Data Intelligence

SnowQuery is a high-performance **Natural Language to Visualization (NL-to-Viz)** platform designed to democratize access to the Global COVID-19 Epidemiological dataset. It leverages **Google Gemini 1.5 Pro** for semantic-to-SQL translation and **Snowflake's** cloud data warehouse for low-latency analytical queries.

## 🏗️ Technical Architecture

SnowQuery follows a modern serverless architecture with a focus on security and high-fidelity data visualization.

```mermaid
graph TD
    subgraph "Client Layer (Next.js 14)"
        UI["React Server Components"]
        CHT["Chat Interface"]
        VIZ["Recharts Visualization Engine"]
    end

    subgraph "AI Oracle (Google Gemini)"
        PRM["Semantic SQL Prompt Engine"]
        SCH["Categorized Schema Context"]
    end

    subgraph "Data Layer (Snowflake)"
        JWT["JWT Key-Pair Auth"]
        SF["COVID19_EPIDEMIOLOGICAL_DATA"]
        PUB["PUBLIC Schema (30+ Tables)"]
    end

    subgraph "Deployment (Vercel)"
        ENV["Edge Runtime Envars"]
        NORM["PEM Normalization Logic"]
    end

    UI --> CHT
    CHT --> PRM
    PRM --> SCH
    PRM --> SF
    SF --> JWT
    SF --> PUB
    SF --> VIZ
    NORM --> JWT
```

### 🔐 Authentication Flow: JWT Key-Pair
SnowQuery implements a robust **JWT-based Key-Pair Authentication** for Snowflake. This approach bypasses traditional password-based login and MFA, making it highly suitable for serverless environments (Vercel).
- **Normalizer Edge Logic**: Implements an aggressive PEM normalizer to handle Vercel's environment variable escaping, ensuring `BEGIN/END PRIVATE KEY` blocks are valid for OpenSSL 3.0.

## 📊 Analytical Scope
The platform is indexed against the entire **COVID-19 Epidemiological Data** public share.

| Data Domain | Description |
| :--- | :--- |
| **Core Epidemiology** | ECDC Global, JHU Tracking, WHO Daily Reports |
| **Public Health** | CDC Inpatient Bed Occupancy, KFF ICU Capacity |
| **Interventions** | Global Vaccination Progress (OWID/JHU), Policy Measures |
| **Human Impact** | Google/Apple Mobility Reports, US Reopening Status |
| **Regional Granularity** | Detailed tracking for Germany (RKI), Italy (PCM), Belgium, and Canada |

## 🚀 Teck Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS / Vanilla CSS
- **AI Engine**: Google Generative AI (Gemini 1.5 Pro)
- **Database**: Snowflake (Data Warehouse)
- **Data Visualization**: Recharts (Responsive D3-based engine)
- **Deployment**: Vercel

## 🛠️ Installation & Setup

### 1. Prerequisite: Snowflake Key-Pair
Generate your RSA private and public keys:
```bash
openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out snowflake_rsa_key.p8 -nocrypt
openssl rsa -in snowflake_rsa_key.p8 -pubout -out snowflake_rsa_key.pub
```

### 2. Environment Configuration
Create a `.env.local` file with the following parameters:
```env
# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your_account_id
SNOWFLAKE_USERNAME=your_username
SNOWFLAKE_PASSWORD=your_password_or_token
SNOWFLAKE_DATABASE=COVID19_EPIDEMIOLOGICAL_DATA
SNOWFLAKE_SCHEMA=PUBLIC
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIB... (paste full key material)"

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Locally
```bash
npm install
npm run dev
```

## 🧠 NL-to-SQL Prompt Engineering
The system uses a highly optimized **Instruction-Based Prompt** that includes:
- **Fully Qualified Identifiers**: Ensures all queries target `DB.SCHEMA.TABLE`.
- **Snowflake Dialect Specifics**: Enforces `ILIKE`, `TO_DATE`, and `DATE_TRUNC`.
- **Data Integrity Guards**: Automatically wraps daily metrics in `GREATEST(0, col)` to handle historical corrections (negative counts).
- **Multi-Table JOIN Logic**: Standardizes joins across diverse providers on `COUNTRY_REGION` and `DATE`.

---
*Built for High-Scale Data Intelligence.*
