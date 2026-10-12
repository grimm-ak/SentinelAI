
from ml.predict import binary_model


def get_feature_importance(top_n=10):
    """
    Return global feature importance for the binary classifier.

    These scores describe overall model behavior, not an
    explanation for an individual detection.
    """
    preprocessor = binary_model.named_steps["preprocessor"]
    model = binary_model.named_steps["model"]

    feature_names = preprocessor.get_feature_names_out()
    importances = model.feature_importances_

    results = [
        {
            "feature": str(name),
            "importance": round(float(score), 6),
        }
        for name, score in zip(feature_names, importances)
    ]

    results.sort(
        key=lambda item: item["importance"],
        reverse=True,
    )

    return results[:top_n]
