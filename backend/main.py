from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
import os
from ml.explain import get_feature_importance
from ml.predict import predict_traffic
from backend.database import get_connection, initialize_database
from backend.schemas import TrafficRequest

app = FastAPI(
    title="AI SOC API",
    description="ML-powered network intrusion detection",
    version="1.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *[
            origin.strip()
            for origin in os.getenv("FRONTEND_URL", "").split(",")
            if origin.strip()
        ],
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialize_database()


@app.get("/")
def root():
    return {"message": "AI SOC API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/explainability")
def explainability():
    try:
        return {
            "scope": "global",
            "description": (
                "Overall Random Forest feature importance; "
                "not a per-detection explanation."
            ),
            "features": get_feature_importance(),
        }
    except (AttributeError, KeyError, ValueError) as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not calculate feature importance: {error}",
        ) from error

@app.post("/api/detect")
def detect_traffic(request: TrafficRequest):
    try:
        prediction = predict_traffic(request.features)[0]
    except (KeyError, ValueError) as error:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid traffic features: {error}",
        ) from error

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO detections (
                is_attack, attack_probability,
                attack_category, severity
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                int(prediction["is_attack"]),
                prediction["attack_probability"],
                prediction["attack_category"],
                prediction["severity"],
            ),
        )
        detection_id = cursor.lastrowid

        if prediction["is_attack"]:
            connection.execute(
                """
                INSERT INTO alerts (
                    detection_id, title, severity
                )
                VALUES (?, ?, ?)
                """,
                (
                    detection_id,
                    f"Predicted {prediction['attack_category']} attack",
                    prediction["severity"],
                ),
            )

        row = connection.execute(
            "SELECT * FROM detections WHERE id = ?",
            (detection_id,),
        ).fetchone()

    return {
        "id": row["id"],
        "is_attack": bool(row["is_attack"]),
        "attack_probability": row["attack_probability"],
        "attack_category": row["attack_category"],
        "severity": row["severity"],
        "created_at": row["created_at"],
    }


@app.get("/api/detections")
def get_detections(limit: int = 50):
    if not 1 <= limit <= 200:
        raise HTTPException(
            status_code=400,
            detail="limit must be between 1 and 200",
        )

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT * FROM detections
            ORDER BY id DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [dict(row) | {"is_attack": bool(row["is_attack"])}
            for row in rows]


@app.get("/api/alerts")
def get_alerts(limit: int = 50):
    if not 1 <= limit <= 200:
        raise HTTPException(
            status_code=400,
            detail="limit must be between 1 and 200",
        )

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT alerts.*, detections.attack_probability,
                   detections.attack_category
            FROM alerts
            JOIN detections
              ON alerts.detection_id = detections.id
            ORDER BY alerts.id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [dict(row) for row in rows]


@app.patch("/api/alerts/{alert_id}/status")
def update_alert_status(alert_id: int, status: str):
    allowed_statuses = {"open", "investigating", "resolved"}

    status = status.strip().lower()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status must be open, investigating, or resolved",
        )

    with get_connection() as connection:
        alert = connection.execute(
            "SELECT id FROM alerts WHERE id = ?",
            (alert_id,),
        ).fetchone()

        if alert is None:
            raise HTTPException(
                status_code=404,
                detail="Alert not found",
            )

        connection.execute(
            "UPDATE alerts SET status = ? WHERE id = ?",
            (status, alert_id),
        )

        updated_alert = connection.execute(
            "SELECT * FROM alerts WHERE id = ?",
            (alert_id,),
        ).fetchone()

    return dict(updated_alert)


@app.get("/api/dashboard")
def dashboard():
    with get_connection() as connection:
        totals = connection.execute(
            """
            SELECT COUNT(*) AS total,
                   COALESCE(SUM(is_attack), 0) AS attacks
            FROM detections
            """
        ).fetchone()

        severities = connection.execute(
            """
            SELECT severity, COUNT(*) AS count
            FROM detections
            WHERE is_attack = 1
            GROUP BY severity
            """
        ).fetchall()

        open_alerts = connection.execute(
            "SELECT COUNT(*) FROM alerts WHERE status = 'open'"
        ).fetchone()[0]

    return {
        "total_detections": totals["total"],
        "predicted_attacks": totals["attacks"],
        "predicted_normal": totals["total"] - totals["attacks"],
        "open_alerts": open_alerts,
        "attack_severity_breakdown": {
            row["severity"]: row["count"] for row in severities
        },
    }
