from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


ROOT = Path(__file__).resolve().parent.parent

TRAIN_FILE = ROOT / "data" / "raw" / "UNSW_NB15_training-set.parquet"
TEST_FILE = ROOT / "data" / "raw" / "UNSW_NB15_testing-set.parquet"
MODEL_DIR = ROOT / "ml" / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)


def main():
    print("Loading dataset...")

    train = pd.read_parquet(TRAIN_FILE)
    test = pd.read_parquet(TEST_FILE)

    target = "label"

    X_train = train.drop(columns=["label", "attack_cat"])
    y_train = train[target]

    X_test = test.drop(columns=["label", "attack_cat"])
    y_test = test[target]

    categorical_features = [
        "proto",
        "service",
        "state",
    ]

    numerical_features = [
        column
        for column in X_train.columns
        if column not in categorical_features
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                categorical_features,
            ),
            (
                "numerical",
                "passthrough",
                numerical_features,
            ),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )

    print("Training model...")

    pipeline.fit(X_train, y_train)

    print("Making predictions...")

    predictions = pipeline.predict(X_test)
    probabilities = pipeline.predict_proba(X_test)[:, 1]

    precision = precision_score(y_test, predictions)
    recall = recall_score(y_test, predictions)
    f1 = f1_score(y_test, predictions)
    roc_auc = roc_auc_score(y_test, probabilities)

    print("\n==============================")
    print("BINARY MODEL RESULTS")
    print("==============================")

    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1 Score  : {f1:.4f}")
    print(f"ROC-AUC   : {roc_auc:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, predictions))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, predictions))

    model_path = MODEL_DIR / "binary_model.joblib"

    joblib.dump(pipeline, model_path)

    print(f"\nModel saved to:")
    print(model_path)


if __name__ == "__main__":
    main()