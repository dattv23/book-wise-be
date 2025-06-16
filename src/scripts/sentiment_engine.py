"""
Sentiment Analysis Engine using pre-trained SVM model
Custom preprocessing for Vietnamese text
"""

import argparse
import os
import logging
import json
import sys
import joblib
from text_processor import TextProcessor

log_dir = os.path.join(os.path.dirname(__file__), "log")
os.makedirs(log_dir, exist_ok=True)
models_dir = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(models_dir, exist_ok=True)

log_file_path = os.path.join(log_dir, "sentiment_engine.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file_path, encoding="utf-8"),
        logging.StreamHandler(sys.stderr),
    ],
)


class SentimentEngine:
    def __init__(self):
        self.model = None
        self.processor = TextProcessor(
            teencode_path="teencode.csv",
            stopword_path="stopwords.txt",
            phrase_rules_path="phrase_rules.csv",
        )
        self.model_path = os.path.join(models_dir, "model_sentiment_analysis.pkl")

    def load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found at: {self.model_path}")
        logging.info(f"Loading model from {self.model_path}")
        self.model = joblib.load(self.model_path)
        return True

    def predict(self, comment: str) -> str:
        if self.model is None:
            raise RuntimeError("Model not loaded.")
        processed = self.processor.preprocess(comment)
        return self.model.predict([processed])[0]


def main():
    import traceback

    parser = argparse.ArgumentParser(description="Sentiment Analysis Engine")
    parser.add_argument("--mode", choices=["predict", "batch_predict"], required=True)
    parser.add_argument("--comment", help="Comment to predict")
    parser.add_argument("--file", help="CSV file for batch prediction")
    args = parser.parse_args()

    engine = SentimentEngine()

    try:
        engine.load_model()

        if args.mode == "predict":
            if not args.comment:
                raise ValueError("Missing --comment for prediction")
            label = engine.predict(args.comment)
            print(json.dumps({"comment": args.comment, "predicted_label": label}))

        elif args.mode == "batch_predict":
            if not args.file:
                raise ValueError("Missing --file for batch prediction")

            import pandas as pd

            df = pd.read_csv(args.file)
            logging.info(f"Loaded {len(df)} rows from CSV")

            if "id" not in df.columns or "comment" not in df.columns:
                raise ValueError("CSV file must contain 'id' and 'comment' columns")

            results = []
            for _, row in df.iterrows():
                try:
                    label = engine.predict(str(row["comment"]))
                    results.append({"id": row["id"], "label": label})
                except Exception as e:
                    results.append({"id": row["id"], "label": "error", "error": str(e)})

            print(json.dumps(results))

    except Exception as e:
        error_obj = {"error": str(e), "trace": traceback.format_exc()}
        logging.error(json.dumps(error_obj, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
