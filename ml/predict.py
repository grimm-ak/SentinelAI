
import joblib
import pandas as pd

from ml.config import BINARY_MODEL_FILE, MULTICLASS_MODEL_FILE

binary_model = joblib.load(BINARY_MODEL_FILE)
multiclass_model = joblib.load(MULTICLASS_MODEL_FILE)


def predict_traffic(records):
    """
    Predict whether network traffic is malicious
    and classify the attack category.
    """
    if isinstance(records, dict):
        records = [records]

    data = pd.DataFrame(records)

    binary_predictions = binary_model.predict(data)
    binary_probabilities = binary_model.predict_proba(data)[:, 1]
    attack_categories = multiclass_model.predict(data)

    results = []

    for i in range(len(data)):
        is_attack = int(binary_predictions[i]) == 1

        results.append({
            "is_attack": is_attack,
            "attack_probability": round(
                float(binary_probabilities[i]), 4
            ),
            "attack_category": (
                str(attack_categories[i]) if is_attack else "Normal"
            ),
            "severity": (
                "high"
                if binary_probabilities[i] >= 0.8
                else "medium"
                if binary_probabilities[i] >= 0.5
                else "low"
            ),
        })

    return results
