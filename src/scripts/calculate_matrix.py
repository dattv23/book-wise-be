import numpy as np
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timezone
from matrix_factorization import MF
from sklearn.preprocessing import LabelEncoder
import json


def calculate_and_save_matrix(mongodb_uri, database_name):
    """
    Calculate and save recommendation matrices to MongoDB
    """
    # MongoDB Connection
    client = MongoClient(mongodb_uri)
    db = client[database_name]

    # Get ratings data from MongoDB
    ratings_data = list(db.reviews.find({"is_deleted": False}, {"_id": 0}))
    if not ratings_data:
        raise ValueError("Something went wrong when connecting to Database!")

    # Prepare data
    data = pd.DataFrame(ratings_data)
    data = data[data["rating"].notnull()]
    data = data[data["rating"].apply(lambda x: isinstance(x, (int, float)))]
    data["rating"] = data["rating"].astype(float)
    data = data.groupby(["user_id", "book_id"], as_index=False)["rating"].mean()

    # Label encode user_id and book_id
    user_encoder = LabelEncoder()
    book_encoder = LabelEncoder()
    data["encoded_user_id"] = user_encoder.fit_transform(data["user_id"])
    data["encoded_book_id"] = book_encoder.fit_transform(data["book_id"])

    # Create input data matrix for the model
    Y_data = data[["encoded_user_id", "encoded_book_id", "rating"]].to_numpy()

    # Train matrix factorization model
    mf_model = MF(
        Y_data=Y_data, K=15, lam=0.1, learning_rate=0.1, max_iter=200, user_based=1
    )
    mf_model.fit()

    # Serialize model and save to MongoDB
    model_data = {
        "_id": "latest",
        "model": mf_model.to_dict(),
        "user_encoder": list(user_encoder.classes_),
        "book_encoder": list(book_encoder.classes_),
        "created_at": datetime.now(timezone.utc),
    }

    # Replace existing model with new one
    db.recommendation_matrices.replace_one({"_id": "latest"}, model_data, upsert=True)

    print(f"Matrix calculation completed at {datetime.now(timezone.utc)}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: python calculate_matrix.py <mongodb_uri> <database_name>")
        sys.exit(1)

    mongodb_uri = sys.argv[1]
    database_name = sys.argv[2]
    calculate_and_save_matrix(mongodb_uri, database_name)
