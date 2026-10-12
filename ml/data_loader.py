import pandas as pd

from ml.config import TRAIN_FILE, TEST_FILE


def load_train_data():
    return pd.read_parquet(TRAIN_FILE)


def load_test_data():
    return pd.read_parquet(TEST_FILE)


def load_data():
    train = load_train_data()
    test = load_test_data()

    return train, test