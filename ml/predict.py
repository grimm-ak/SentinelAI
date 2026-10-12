
import joblib
import pandas as pd

from huggingface_hub import hf_hub_download

from ml.config import (
    BINARY_MODEL_FILE,
    MULTICLASS_MODEL_FILE,
    HF_MODEL_REPO,
)


def load_model(filename, local_path):
    if not local_path.exists():
        print(f"Downloading {filename} from Hugging Face...")

        downloaded_path = hf_hub_download(
            repo_id=HF_MODEL_REPO,
            filename=filename,
        )

        local_path.parent.mkdir(parents=True, exist_ok=True)

        import shutil
        shutil.copy2(downloaded_path, local_path)

    return joblib.load(local_path)


binary_model = load_model(
    "binary_model.joblib",
    BINARY_MODEL_FILE,
)

multiclass_model = load_model(
    "multiclass_model.joblib",
    MULTICLASS_MODEL_FILE,
)


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
