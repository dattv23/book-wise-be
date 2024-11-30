import sys
import json
from pymongo import MongoClient
from datetime import datetime, timezone
import pandas as pd
from matrix_factorization import MF
from sklearn.preprocessing import LabelEncoder


def get_recommendations(mongodb_uri, database_name, user_id):
    """
    Get recommendations using pre-calculated matrices
    """
    # MongoDB Connection
    client = MongoClient(mongodb_uri)
    db = client[database_name]
    
    # Get ratings data from MongoDB
    ratings_data = list(db.reviews.find({"is_deleted": False}, {"_id": 0}))
    if not ratings_data:
        raise ValueError("Something went wrong when connect to Database!")

    # Prepare data
    data = pd.DataFrame(ratings_data)
    data = data[data["rating"].notnull()]
    data = data[data["rating"].apply(lambda x: isinstance(x, (int, float)))]
    data["rating"] = data["rating"].astype(float)
    data = data.groupby(["user_id", "book_id"], as_index=False)["rating"].mean()

    # Label encode user_id and book_id, str --> int
    user_encoder = LabelEncoder()
    book_encoder = LabelEncoder()
    data["encoded_user_id"] = user_encoder.fit_transform(data["user_id"])
    data["encoded_book_id"] = book_encoder.fit_transform(data["book_id"])

    # Create input data matrix for the model.
    Y_data = data[["encoded_user_id", "encoded_book_id", "rating"]].to_numpy()

    # Train matrix factorization model
    mf_model = MF(Y_data=Y_data, K=15, lam=0.1, learning_rate=0.1, max_iter=200, user_based=1)
    mf_model.fit()

    # Predict ratings for the user.
    try:
        user_index = user_encoder.transform([user_id])[0]
    except ValueError:
        print(json.dumps({"recommendedBookIds": []}))
        return

    predictions = mf_model.pred_for_user(user_index)

    # Retrieve the list of books already rated
    rated_books = data[data["encoded_user_id"] == user_index]["encoded_book_id"].values
    rated_book_ids = set(rated_books)

    # Filter out unrated books and sort them by predicted scores.
    unrated_books = [(book_id, score) for book_id, score in predictions if book_id not in rated_book_ids]
    recommended_books = sorted(unrated_books, key=lambda x: x[1], reverse=True)[:8]

    # Map encoded book_id back to its original value.
    recommended_book_ids = [
        book_encoder.inverse_transform([encoded_book_id])[0]
        for encoded_book_id, _ in recommended_books
    ]

    # Save the recommendation list to MongoDB."
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
