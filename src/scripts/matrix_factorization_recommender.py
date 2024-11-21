import sys
import json
import numpy as np
import pandas as pd
from pymongo import MongoClient
from scipy.sparse.linalg import svds
from datetime import datetime, timezone


def generate_recommendations(mongodb_uri, database_name, user_id):
    """
    Generate recommendations for a specific user

    Returns:
        dict: Recommended book IDs
    """
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

    # Create user-item matrix
    user_book_ratings = reviews_df.pivot_table(
        index="user_id", columns="book_id", values="rating", aggfunc="mean"
    ).fillna(0)

    # Normalize ratings
    ratings_matrix = user_book_ratings.values
    user_ratings_mean = np.mean(ratings_matrix, axis=1)
    ratings_demeaned = ratings_matrix - user_ratings_mean[:, np.newaxis]

    # Perform SVD
    k = min(10, min(ratings_demeaned.shape) - 1)
    U, sigma, Vt = svds(ratings_demeaned, k=k)

    # Reconstruct full matrix
    sigma = np.diag(sigma)
    predicted_ratings = np.dot(np.dot(U, sigma), Vt) + user_ratings_mean[:, np.newaxis]

    # Find user index
    try:
        user_index = np.where(user_book_ratings.index == user_id)[0][0]
    except IndexError:
        # If user not found, return empty recommendations
        print(json.dumps({"recommendedBookIds": []}))
        sys.exit(0)

    # Get user's predicted ratings
    user_predicted_ratings = predicted_ratings[user_index]

    # Find books user hasn't rated
    user_existing_ratings = list(db.reviews.find({"user_id": user_id}))
    rated_book_ids = set(review["book_id"] for review in user_existing_ratings)

    # Sort unrated books by predicted rating
    unrated_books = [
        (book_id, rating)
        for book_id, rating in zip(user_book_ratings.columns, user_predicted_ratings)
        if book_id not in rated_book_ids
    ]

    # Get top 5 recommendations
    recommended_books = sorted(unrated_books, key=lambda x: x[1], reverse=True)[:5]
    recommended_book_ids = [book_id for book_id, _ in recommended_books]

    # Save recommendations to MongoDB
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

    # Output recommendations as JSON
    print(json.dumps({"recommendedBookIds": recommended_book_ids}))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({"error": "Incorrect number of arguments"}))
        sys.exit(1)

    mongodb_uri = sys.argv[1]
    database_name = sys.argv[2]
    user_id = sys.argv[3]

    generate_recommendations(mongodb_uri, database_name, user_id)
