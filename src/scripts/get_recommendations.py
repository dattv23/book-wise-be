import sys
import json
import numpy as np
from pymongo import MongoClient
from datetime import datetime, timezone


def get_recommendations(mongodb_uri, database_name, user_id):
    """
    Get recommendations using pre-calculated matrices
    """
    # MongoDB Connection
    client = MongoClient(mongodb_uri)
    db = client[database_name]

    matrix_data = db.recommendation_matrices.find_one({"_id": "latest"})
    if not matrix_data:
        print(json.dumps({"error": "No pre-calculated matrices found"}))
        return

    U = np.array(matrix_data["U"])
    sigma = np.array(matrix_data["sigma"])
    Vt = np.array(matrix_data["Vt"])
    user_ratings_mean = np.array(matrix_data["user_ratings_mean"])
    user_ids = matrix_data["user_ids"]
    book_ids = matrix_data["book_ids"]

    try:
        user_index = user_ids.index(user_id)
    except ValueError:
        print(json.dumps({"recommendedBookIds": []}))
        return

    sigma_diag = np.diag(sigma)
    user_pred = user_ratings_mean[user_index] + np.dot(
        np.dot(U[user_index, :], sigma_diag), Vt
    )

    user_reviews = list(db.reviews.find({"user_id": user_id}))
    rated_book_ids = set(review["book_id"] for review in user_reviews)

    unrated_books = [
        (book_id, rating)
        for book_id, rating in zip(book_ids, user_pred)
        if book_id not in rated_book_ids
    ]

    recommended_books = sorted(unrated_books, key=lambda x: x[1], reverse=True)[:8]
    recommended_book_ids = [book_id for book_id, _ in recommended_books]

    db.recommendations.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "recommendedBookIds": recommended_book_ids,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )

    print(json.dumps({"recommendedBookIds": recommended_book_ids}))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({"error": "Incorrect number of arguments"}))
        sys.exit(1)

    mongodb_uri = sys.argv[1]
    database_name = sys.argv[2]
    user_id = sys.argv[3]
    get_recommendations(mongodb_uri, database_name, user_id)
