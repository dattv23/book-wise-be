import sys
import json
from pymongo import MongoClient
from datetime import datetime, timezone
import weaviate


def create_weaviate_client(weaviate_url, weaviate_api_key=None):
    """
    Create and return a Weaviate client
    """
    try:
        client = weaviate.Client(url=weaviate_url, auth_client_secret=weaviate_api_key)
        return client
    except Exception as e:
        print(json.dumps({"error": f"Error connecting to Weaviate: {e}"}))
        return None


def weaviate_recommend(weaviate_client, user_id, top_k=10):
    """
    Fetch recommendations from Weaviate using user's embedding
    """
    try:
        # Retrieve user's embedding from Weaviate
        user_query = (
            weaviate_client.query.get("UserEmbedding", ["embedding"])
            .with_filter(
                {"path": ["user_id"], "operator": "Equal", "valueString": str(user_id)}
            )
            .do()
        )

        user_embedding = (
            user_query.get("data", {}).get("Get", {}).get("UserEmbedding", [])
        )
        if not user_embedding:
            return {
                "error": f"No embedding found for user {user_id}",
                "recommendedBookIds": [],
            }

        user_vector = user_embedding[0]["embedding"]

        # Perform vector-based search for items
        recommended_items_query = (
            weaviate_client.query.get("ItemEmbedding", ["book_id"])
            .with_near_vector({"vector": user_vector})
            .with_limit(top_k)
            .do()
        )

        item_results = (
            recommended_items_query.get("data", {})
            .get("Get", {})
            .get("ItemEmbedding", [])
        )
        recommended_book_ids = [item["book_id"] for item in item_results]

        return {"recommendedBookIds": recommended_book_ids}

    except Exception as e:
        return {"error": f"Error during recommendation: {e}", "recommendedBookIds": []}


def fetch_from_mongodb(mongodb_uri, database_name, user_id, recommended_books):
    """
    Fetch recommendations from MongoDB if Weaviate fails
    """
    try:
        # Connect to MongoDB
        client = MongoClient(mongodb_uri)
        db = client[database_name]

        # Save the recommendation list to MongoDB
        db.recommendations.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "recommendedBookIds": recommended_books,
                    "updatedAt": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )
        return {"recommendedBookIds": recommended_books}

    except Exception as e:
        return {
            "error": f"Error during MongoDB fallback: {e}",
            "recommendedBookIds": [],
        }


def get_recommendations(
    mongodb_uri, database_name, weaviate_url, weaviate_api_key, user_id
):
    """
    Main function to get recommendations for a user
    """
    # Create Weaviate client
    weaviate_client = create_weaviate_client(weaviate_url, weaviate_api_key)

    if weaviate_client:
        # Attempt recommendation via Weaviate
        weaviate_result = weaviate_recommend(weaviate_client, user_id)
        if "error" not in weaviate_result:
            return weaviate_result

        print(json.dumps({"warning": weaviate_result["error"]}))

    # If Weaviate fails, fallback to MongoDB
    print(json.dumps({"warning": "Falling back to MongoDB recommendations"}))
    return fetch_from_mongodb(mongodb_uri, database_name, user_id, [])


if __name__ == "__main__":
    if len(sys.argv) != 6:
        print(json.dumps({"error": "Incorrect number of arguments"}))
        print(
            "Usage: python get_recommendations.py <mongodb_uri> <database_name> <weaviate_url> <weaviate_api_key> <user_id>"
        )
        sys.exit(1)

    mongodb_uri = sys.argv[1]
    database_name = sys.argv[2]
    weaviate_url = sys.argv[3]
    weaviate_api_key = sys.argv[4]
    user_id = sys.argv[5]

    result = get_recommendations(
        mongodb_uri, database_name, weaviate_url, weaviate_api_key, user_id
    )
    print(json.dumps(result))
