# CUET CSE Class Routine Management System

A departmental class routine planning, clash resolution, and academic lifecycle management application tailored for the **Department of Computer Science & Engineering, Chittagong University of Engineering & Technology (CUET)**.

---

## 🏛️ System Overview

The system models the complete **4-year undergraduate degree** structure at CUET across all 8 academic terms (`L1-T1` through `L4-T2`):
- **Role-Based Access Control**:
  - **Head / Admin**: Oversees departmental appointments, registers faculty members, and assigns Course Coordinators according to batches.
  - **Course Coordinators**: Designated faculty members appointed to oversee a batch for their entire 4-year degree until graduation.
- **Continuous 4-Year Degree Lifecycle**: Commencing Preparatory Leave / Departmental Leave (PL / DL) concludes class schedules for a term to free rooms/labs for semester final exams, while preserving coordinator access to advance the batch to the next term.
- **Clash & Constraint Engine**: Real-time room, lab, and faculty conflict detection across batches.
- **Official University Layout**: Strict university format printable routines with official signatures and department stamps.
- **Lab Occupancy Matrix & Quotas**: Real-time tracking of shared computer laboratories and faculty contact hours.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- **Database**: PostgreSQL (NeonDB serverless cloud) or local SQLite

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher) and `npm`
- **Python** (v3.10 or higher)

### 2. Backend Setup
1. Open a terminal in the project root:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure database connection:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update `DATABASE_URL` with your PostgreSQL / NeonDB connection string, or leave the SQLite fallback.
5. (Optional) Seed initial CUET faculty and curriculum data:
   ```bash
   cd ..
   python -m backend.seed
   ```
6. Start the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --reload --port 8000
   ```
   The backend API will run at `http://127.0.0.1:8000`. API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
1. In another terminal in the project root:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:3000`.

---

## 🔑 Default Credentials

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | Department Head / Academic Dean |
| **Batch 2021 Coordinator** | `sabiha` | `cuet123` | Sabiha Anan (Level-4 Term-I) |
| **Batch 2022 Coordinator** | `rashadur` | `cuet123` | Md. Rashadur Rahman (Level-3 Term-II) |
| **Batch 2023 Coordinator** | `murad` | `cuet123` | Hasan Murad (Level-2 Term-II) |
| **Batch 2024 Coordinator** | `rizvi` | `cuet123` | Md. Atiqul Islam Rizvi (Level-2 Term-I) |
| **Batch 2025 Coordinator** | `mamun` | `cuet123` | Md. Al-Mamun Provath (Level-1 Term-I) |

---

## 📄 License

Developed for academic management within the Department of Computer Science & Engineering, CUET.
