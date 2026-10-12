from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score
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

    target = "attack_cat"

    X_train = train.drop(columns=["label", "attack_cat"])
    y_train = train[target].astype(str)

    X_test = test.drop(columns=["label", "attack_cat"])
    y_test = test[target].astype(str)

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

    print("Training multiclass model...")

    pipeline.fit(X_train, y_train)

    print("Making predictions...")

    predictions = pipeline.predict(X_test)

    macro_f1 = f1_score(
        y_test,
        predictions,
        average="macro",
    )

    weighted_f1 = f1_score(
        y_test,
        predictions,
        average="weighted",
    )

    print("\n==============================")
    print("MULTICLASS MODEL RESULTS")
    print("==============================")

    print(f"Macro F1    : {macro_f1:.4f}")
    print(f"Weighted F1 : {weighted_f1:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, predictions))

    model_path = MODEL_DIR / "multiclass_model.joblib"

    joblib.dump(pipeline, model_path)

    print("\nModel saved to:")
    print(model_path)


if __name__ == "__main__":
    main()