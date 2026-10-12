
from ml.data_loader import load_test_data
from ml.predict import predict_traffic

# Load the test dataset
_, test_data = None, load_test_data()

# Select one real network-traffic record
sample = test_data.drop(
    columns=["label", "attack_cat"]
).iloc[0].to_dict()

# Run prediction
result = predict_traffic(sample)

print("\nNetwork Traffic Prediction")
print("==========================")
print(result[0])
