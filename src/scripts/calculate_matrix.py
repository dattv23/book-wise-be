import numpy as np
import pandas as pd
from pymongo import MongoClient
from scipy.sparse.linalg import svds
from datetime import datetime, timezone


def calculate_and_save_matrix(mongodb_uri, database_name):
    # MongoDB Connection
    client = MongoClient(mongodb_uri)
    db = client[database_name]

    # Fetch reviews
    reviews_cursor = db.reviews.aggregate(
        [
            {"$match": {"is_deleted": False}},
            {"$project": {"user_id": 1, "book_id": 1, "rating": 1}},
        ]
    )
    reviews_df = pd.DataFrame(list(reviews_cursor))

    if reviews_df.empty:
        print("No reviews found")
        return

    # Create user-item matrix
    user_book_ratings = reviews_df.pivot_table(
        index="user_id", columns="book_id", values="rating", aggfunc="mean"
    ).fillna(0)

    user_ids = user_book_ratings.index.tolist()
    book_ids = user_book_ratings.columns.tolist()

    # Normalize ratings
    ratings_matrix = user_book_ratings.values
    user_ratings_mean = np.mean(ratings_matrix, axis=1)
    ratings_demeaned = ratings_matrix - user_ratings_mean[:, np.newaxis]

    # Perform SVD
    k = min(10, min(ratings_demeaned.shape) - 1)
    U, sigma, Vt = svds(ratings_demeaned, k=k)

    # Save matrices and mappings to MongoDB
    matrix_data = {
        "U": U.tolist(),
        "sigma": sigma.tolist(),
        "Vt": Vt.tolist(),
        "user_ratings_mean": user_ratings_mean.tolist(),
        "user_ids": user_ids,
        "book_ids": book_ids,
        "updated_at": datetime.now(timezone.utc),
    }

    db.recommendation_matrices.replace_one({"_id": "latest"}, matrix_data, upsert=True)

    print(f"Matrix calculation completed at {datetime.now(timezone.utc)}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: python calculate_matrix.py <mongodb_uri> <database_name>")
        sys.exit(1)

    mongodb_uri = sys.argv[1]
    database_name = sys.argv[2]
    calculate_and_save_matrix(mongodb_uri, database_name)
