import pandas as pd
import random
import os
from pymongo import MongoClient
from matrix_factorization import MF

# Read .env file
def load_env(file_path):
    with open(file_path, "r") as file:
        for line in file:
            if line.strip() and not line.startswith("#"):
                key, value = line.strip().split("=", 1)
                os.environ[key] = value  # Save

# Load .env file
load_env(".env")

# MongoDB Connection
mongodb_uri = os.getenv("MONGO_URI")
database_name = os.getenv("DATABASE_NAME")

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
reviews_df["user_id"] = reviews_df["user_id"].astype("category").cat.codes
reviews_df["book_id"] = reviews_df["book_id"].astype("category").cat.codes

# Check data is fetched successfully
if reviews_df.empty:
    print("No reviews found")
else:
    print("Data fetched successfully")

def user_wise_split_custom(reviews_df, train_ratio=5, test_ratio=2):
    """Split the data into training and testing sets with a ratio of 5:7 for training and 2:7 for testing"""
    train_data = []
    test_data = []

    user_reviews = {}
    for _, review in reviews_df.iterrows():
        user_id = review["user_id"]
        if user_id not in user_reviews:
            user_reviews[user_id] = []
        user_reviews[user_id].append(review)

    for user_id, reviews in user_reviews.items():
        if len(reviews) <= 3:
            train_data.extend(reviews)
        else:
            random.shuffle(reviews)
            num_reviews = len(reviews)
            num_train = (num_reviews * train_ratio) // (train_ratio + test_ratio)
            train_data.extend(reviews[:num_train])
            test_data.extend(reviews[num_train:])

    train_df = pd.DataFrame(train_data)
    test_df = pd.DataFrame(test_data)
    return train_df, test_df


train_df, test_df = user_wise_split_custom(reviews_df)

# Convert to a format compatible with MF
# rate_train and rate_test are numpy with columns: user_id, book_id, rating
rate_train = train_df[["user_id", "book_id", "rating"]].to_numpy()
rate_test = test_df[["user_id", "book_id", "rating"]].to_numpy()

# Train MF model
rs = MF(rate_train, K=10, lam=0.1, learning_rate=0.1, max_iter=100, user_based=1)
rs.fit()

# evaluate model with RMSE
RMSE = rs.evaluate_RMSE(rate_test)
print("\nUser-based MF, RMSE =", RMSE)
