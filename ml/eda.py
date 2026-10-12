from pathlib import Path 

import pandas as pd 

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "raw"

def find_file(name):
    path = DATA_DIR / name

    if not path.exists():
        raise FileNotFoundError(
            f"Dataset file not found: {path}\n"
            "Download the UNSW-NB15 Parquet files into data/raw/"
        )
    return path 

def main():
    train_path = find_file("UNSW_NB15_training-set.parquet")
    test_path = find_file("UNSW_NB15_testing-set.parquet")

    train = pd.read_parquet(train_path)
    test = pd.read_parquet(test_path)

    print("\n==============================")
    print("UNSW-NB15 DATASET")
    print("==============================")

    print("\nTraining shape:")
    print(train.shape)

    print("\nTesting shape:")
    print(test.shape)

    print("\nColumns:")
    for column in train.columns:
        print(f"- {column}")

    print("\nData types:")
    print(train.dtypes)

    print("\nMissing values:")
    print(train.isnull().sum())

    if "label" in train.columns:
        print("\nBinary label distribution:")
        print(train["label"].value_counts())
        print("\nBinary label percentage:")
        print(train["label"].value_counts(normalize=True) * 100)

    if "attack_cat" in train.columns:
        print("\nAttack categories:")
        print(train["attack_cat"].value_counts(dropna=False))

    print("\nTraining preview:")
    print(train.head())

    print("\nBasic statistics:")
    print(train.describe(include="all").T)


if __name__ == "__main__":
    main()