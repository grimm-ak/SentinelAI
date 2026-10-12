# SentinelAI — ML-Powered Security Operations Dashboard

SentinelAI is a machine-learning-powered Security Operations Center (SOC) dashboard that analyzes network traffic, detects potential attacks, and provides security analytics through a web interface and REST API.

**Live Demo:** https://sentinel-ai-silk-seven.vercel.app/  
**API:** https://sentinelai-api-dbuv.onrender.com  
**Interactive API Documentation:** https://sentinelai-api-dbuv.onrender.com/docs  
**Source Code:** https://github.com/grimm-ak/SentinelAI

## Features

- **Network Intrusion Detection:** Classifies network traffic as normal or potentially malicious using machine learning.
- **Attack Classification:** Supports multiclass attack categorization.
- **Security Dashboard:** Displays detection statistics and security activity.
- **Detection History:** Stores and retrieves detection records.
- **Alert Management:** View alerts and update their status.
- **Model Explainability:** Exposes global feature-importance information to help understand model behavior.
- **REST API:** Provides endpoints for detection, dashboard statistics, alerts, and historical records.
- **Cloud Deployment:** React frontend hosted on Vercel and FastAPI backend hosted on Render.

## Architecture

```text
                Network Traffic Features
                          |
                          v
                 React + Vite Frontend
                          |
                     REST API
                          |
                          v
                    FastAPI Backend
                          |
              +-----------+-----------+
              |                       |
              v                       v
       ML Classification        SQLite Database
              |
              v
       Detection Results
              |
              v
      Dashboard and Alerts
```

The frontend communicates with the backend through HTTP requests. The backend loads the trained machine-learning models from Hugging Face Hub and manages detection records and alerts.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Python, FastAPI |
| Machine Learning | scikit-learn, Random Forest |
| Dataset | UNSW-NB15 |
| Data Processing | pandas, NumPy |
| Database | SQLite |
| Model Hosting | Hugging Face Hub |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Machine Learning Performance

The binary classifier was evaluated on a held-out dataset.

| Metric | Score |
|---|---:|
| Precision | 89.17% |
| Recall | 94.22% |
| F1 Score | 91.62% |
| ROC-AUC | 97.97% |

These metrics describe the evaluated binary classification model, not guaranteed performance on live network traffic.

The project also includes a multiclass classifier for attack categorization. Multiclass performance varies across categories, particularly for less frequent classes.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Service health check |
| POST | `/api/detect` | Analyze network traffic features |
| GET | `/api/detections` | Retrieve detection history |
| GET | `/api/alerts` | Retrieve security alerts |
| PATCH | `/api/alerts/{alert_id}/status` | Update an alert's status |
| GET | `/api/dashboard` | Retrieve dashboard statistics |
| GET | `/api/explainability` | Retrieve global feature importance |

Explore the request schemas and responses through the [interactive Swagger documentation](https://sentinelai-api-dbuv.onrender.com/docs).

## Run Locally

### Prerequisites

- Python 3.10 or a compatible version supported by the dependencies
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/grimm-ak/SentinelAI.git
cd SentinelAI
```

### 2. Set up the backend

Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

On Windows, activate the environment with:

```powershell
.venv\Scripts\activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
python -m uvicorn backend.main:app --reload
```

The backend will be available at `http://127.0.0.1:8000`.

API documentation: `http://127.0.0.1:8000/docs`

### 3. Set up the frontend

Open another terminal and run:

```bash
cd SentinelAI/frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

Ensure the frontend API configuration points to the local backend when running locally.

## Model Hosting

Trained model artifacts are hosted separately from the Git repository to avoid committing large binary files.

The application downloads the required model files from Hugging Face Hub:

[SentinelAI Models — Hugging Face](https://huggingface.co/TheReaper5117/sentinelai-models)

The model repository can be configured through the `HF_MODEL_REPO` environment variable. The default repository is `TheReaper5117/sentinelai-models`.

## Deployment

### Frontend — Vercel

- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Environment variable:**

```text
VITE_API_URL=https://sentinelai-api-dbuv.onrender.com
```

### Backend — Render

- **Build command:** `pip install -r requirements.txt`
- **Start command:**

```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

- **Environment variable:**

```text
FRONTEND_URL=https://sentinel-ai-silk-seven.vercel.app
```

The Render free tier may spin down after inactivity, resulting in a delay on the first request. Its ephemeral filesystem also means SQLite records should not be treated as durable production storage.

## Project Scope and Limitations

- Model metrics are based on offline evaluation and do not establish real-world production detection performance.
- Global feature importance describes overall model behavior; it is not a guaranteed explanation for an individual prediction.
- Performance can vary between attack categories.
- Production SOC deployment would require additional work around authentication, access control, durable storage, monitoring, and operational validation.

SentinelAI is an educational and portfolio project demonstrating machine learning, API development, security analytics, and cloud deployment.

## License

Refer to the repository's license file, if present, for applicable usage and distribution terms.
