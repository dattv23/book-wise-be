import numpy as np
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timezone
from matrix_factorization import MF
from sklearn.preprocessing import LabelEncoder
import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.config import Property, DataType
from weaviate.classes.query import Filter
import weaviate.classes as wvc


def create_weaviate_client(weaviate_url, weaviate_api_key=None):
    """
    Create and return a Weaviate client
    """
    try:
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=weaviate_url,
            auth_credentials=Auth.api_key(api_key=weaviate_api_key),
        )
        return client
    except Exception as e:
        print(f"Error connecting to Weaviate: {e}")
        return None


def create_weaviate_schemas(client):
    """
    Create schemas for user and item embeddings in Weaviate
    """
    # Define schemas for user and item embeddings
    try:
        # Check if classes exist before creating
        existing_classes = client.collections.list_all()

        # User Embedding Class
        if "UserEmbedding" not in existing_classes:
            client.collections.create(
                name="UserEmbedding",
                properties=[
                    wvc.config.Property(
                        name="user_id", data_type=wvc.config.DataType.TEXT
                    ),
                    wvc.config.Property(
                        name="embedding",
                        data_type=wvc.config.DataType.NUMBER_ARRAY,
                    ),
                ],
            )

        # Item Embedding Class
        if "ItemEmbedding" not in existing_classes:
            client.collections.create(
                name="ItemEmbedding",
                properties=[
                    weaviate.classes.config.Property(
                        name="book_id", data_type=weaviate.classes.config.DataType.TEXT
                    ),
                    weaviate.classes.config.Property(
                        name="embedding",
                        data_type=weaviate.classes.config.DataType.NUMBER_ARRAY,
                    ),
                ],
            )

    except Exception as e:
        print(f"Error creating Weaviate schemas: {e}")


def import_embeddings_to_weaviate(client, mf_model, user_encoder, book_encoder):
    """
    Import user and item embeddings to Weaviate
    """
    # Get collections
    user_collection = client.collections.get("UserEmbedding")
    item_collection = client.collections.get("ItemEmbedding")

    # Clear existing data
    user_collection.data.delete_all()
    item_collection.data.delete_all()

    # Import user embeddings
    for idx in range(mf_model.n_users):
        user_vector = mf_model.W[:, idx]
        user_id = user_encoder[idx]

        user_collection.data.insert(
            {"user_id": str(user_id), "embedding": user_vector.tolist()}
        )

    # Import item embeddings
    for idx in range(mf_model.n_items):
        item_vector = mf_model.X[idx, :]
        book_id = book_encoder[idx]

        item_collection.data.insert(
            {"book_id": str(book_id), "embedding": item_vector.tolist()}
        )


def weaviate_recommend(weaviate_url, weaviate_api_key, user_id, top_k=10):
    """
    Recommendation using Weaviate near vector search
    """
    try:
        client = create_weaviate_client(weaviate_url, weaviate_api_key)

        # Get user collection and find the user
        user_collection = client.collections.get("UserEmbedding")
        user_query = user_collection.query.fetch_objects(
            filters=weaviate.classes.query.Filter.by_property("user_id").equal(
                str(user_id)
            )
        )

        if not user_query.objects:
            return []

        user_vector = user_query.objects[0].properties["embedding"]

        # Get item collection and perform near vector search
        item_collection = client.collections.get("ItemEmbedding")
        recommended_items = item_collection.query.near_vector(
            near_vector=user_vector, limit=top_k
        )

        items = [item.properties["book_id"] for item in recommended_items.objects]

        return items

    except Exception as e:
        print(f"Error in Weaviate recommendation: {e}")
        return []


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
        Y_data=Y_data, K=15, lam=0.1, learning_rate=0.1, max_iter=500, user_based=1
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
