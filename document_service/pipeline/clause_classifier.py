import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_PATH = "Sunit17/jurifylaw-clause-risk-inlegalbert"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

id2label = {0: "Safe", 1: "Caution", 2: "Risky"}

def classify_clause(text: str) -> dict:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        probs = torch.softmax(model(**inputs).logits, dim=-1)[0]
    pred_id = int(torch.argmax(probs))
    return {
        "label": id2label[pred_id],
        "confidence": round(float(probs[pred_id]), 3),
        "scores": {id2label[i]: round(float(p), 3) for i, p in enumerate(probs)},
    }

if __name__ == "__main__":
    test = "The Company may terminate this agreement at any time without notice or cause."
    print(classify_clause(test))