import numpy as np
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timezone
from matrix_factorization import MF
from sklearn.preprocessing import LabelEncoder
import weaviate
import json


def create_weaviate_client(weaviate_url, weaviate_api_key=None):
    """
    Create and return a Weaviate client
    """
    try:
        client = weaviate.Client(url=weaviate_url, auth_client_secret=weaviate_api_key)
        return client
    except Exception as e:
        print(f"Error connecting to Weaviate: {e}")
        return None


def create_weaviate_schemas(client):
    """
    Create schemas for user and item embeddings in Weaviate
    """
    # Schema cho user embeddings
    user_schema = {
        "class": "UserEmbedding",
        "vectorizer": "none",
        "properties": [
            {"name": "user_id", "dataType": ["string"]},
            {"name": "embedding", "dataType": ["number[]"]},
        ],
    }

    # Schema cho item embeddings
    item_schema = {
        "class": "ItemEmbedding",
        "vectorizer": "none",
        "properties": [
            {"name": "book_id", "dataType": ["string"]},
            {"name": "embedding", "dataType": ["number[]"]},
        ],
    }

    # Tạo schema nếu chưa tồn tại
    if not client.schema.exists("UserEmbedding"):
        client.schema.create_class(user_schema)

    if not client.schema.exists("ItemEmbedding"):
        client.schema.create_class(item_schema)


def import_embeddings_to_weaviate(client, mf_model, user_encoder, book_encoder):
    """
    Import user and item embeddings to Weaviate
    """
    # Import user embeddings
    for idx in range(mf_model.n_users):
        user_vector = mf_model.W[:, idx]
        user_id = user_encoder[idx]

        user_obj = {"user_id": str(user_id), "embedding": user_vector.tolist()}

        client.data_object.create(user_obj, "UserEmbedding")

    # Import item embeddings
    for idx in range(mf_model.n_items):
        item_vector = mf_model.X[idx, :]
        book_id = book_encoder[idx]

        item_obj = {"book_id": str(book_id), "embedding": item_vector.tolist()}

        client.data_object.create(item_obj, "ItemEmbedding")


def calculate_and_save_matrix(
    mongodb_uri, database_name, weaviate_url=None, weaviate_api_key=None
):
    """
    Calculate and save recommendation matrices to MongoDB and Weaviate
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

    if weaviate_url:
        try:
            weaviate_client = create_weaviate_client(weaviate_url, weaviate_api_key)
            if weaviate_client:
                create_weaviate_schemas(weaviate_client)
                import_embeddings_to_weaviate(
                    weaviate_client,
                    mf_model,
                    user_encoder.classes_,
                    book_encoder.classes_,
                )
                print("Embeddings successfully imported to Weaviate")
        except Exception as e:
            print(f"Error importing to Weaviate: {e}")

    print(f"Matrix calculation completed at {datetime.now(timezone.utc)}")


def weaviate_recommend(weaviate_url, weaviate_api_key, user_id, top_k=10):
    """
    Recommendation using Weaviate near vector search
    """
    try:
        client = create_weaviate_client(weaviate_url, weaviate_api_key)

        user_query = (
            client.query.get("UserEmbedding", ["user_id", "embedding"])
            .with_filter(
                {"path": ["user_id"], "operator": "Equal", "valueString": str(user_id)}
            )
            .do()
        )

        if not user_query["data"]["Get"]["UserEmbedding"]:
            return []

        user_vector = user_query["data"]["Get"]["UserEmbedding"][0]["embedding"]

        recommended_items = (
            client.query.get("ItemEmbedding", ["book_id"])
            .with_near_vector({"vector": user_vector, "certainty": 0.7})
            .with_limit(top_k)
            .do()
        )

        items = [
            item["book_id"]
            for item in recommended_items["data"]["Get"]["ItemEmbedding"]
        ]

        return items

    except Exception as e:
        print(f"Error in Weaviate recommendation: {e}")
        return []


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print(
            "Usage: python calculate_matrix.py <mongodb_uri> <database_name> [weaviate_url] [weaviate_api_key]"
        )
        sys.exit(1)

    mongodb_uri = sys.argv[1]
    database_name = sys.argv[2]

    # Optional Weaviate parameters
    weaviate_url = sys.argv[3] if len(sys.argv) > 3 else None
    weaviate_api_key = sys.argv[4] if len(sys.argv) > 4 else None

    calculate_and_save_matrix(
        mongodb_uri, database_name, weaviate_url, weaviate_api_key
    )
