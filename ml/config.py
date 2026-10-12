
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

MODEL_DIR = ROOT / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

TRAIN_FILE = RAW_DATA_DIR / "UNSW_NB15_training-set.parquet"
TEST_FILE = RAW_DATA_DIR / "UNSW_NB15_testing-set.parquet"

HF_MODEL_REPO = os.getenv(
    "HF_MODEL_REPO",
    "TheReaper5117/sentinelai-models",
)

BINARY_MODEL_FILE = MODEL_DIR / "binary_model.joblib"
MULTICLASS_MODEL_FILE = MODEL_DIR / "multiclass_model.joblib"

RANDOM_STATE = 42
