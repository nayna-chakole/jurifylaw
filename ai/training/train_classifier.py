import os
import re
import numpy as np
import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer

# ---- Anchor all paths to this script's location, not the terminal's current directory ----
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ---- 0. Auto-detect hardware ----
USE_GPU = torch.cuda.is_available()
if USE_GPU:
    device_name = torch.cuda.get_device_name(0)
    print(f"GPU detected: {device_name} — using GPU-optimized settings")
    BATCH_SIZE = 8
    GRAD_ACCUM = 4
    USE_FP16 = True
    USE_GRAD_CKPT = True
else:
    print("No GPU detected — using CPU-safe settings")
    device_name = "CPU"
    BATCH_SIZE = 8
    GRAD_ACCUM = 1
    USE_FP16 = False
    USE_GRAD_CKPT = False

# ---- 1. Load data ----
DATA_PATH = os.path.join(SCRIPT_DIR, "..", "..", "datasets", "legalease_expanded_dataset_with_labour_law.csv")
print("Looking for dataset at:", os.path.abspath(DATA_PATH))
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"Dataset not found at {os.path.abspath(DATA_PATH)}. "
        f"Check the exact filename in your datasets/ folder and that it matches here."
    )

df = pd.read_csv(DATA_PATH)
print("Loaded:", df.shape)

# ---- 2. Template-aware split (avoids train/test leakage) ----
def normalize(t):
    t = re.sub(r'\d+', 'NUM', t)
    t = re.sub(r'Rs\.|₹|INR', 'CUR', t)
    return t

df["template_id"] = df["clause_text"].astype(str).apply(normalize)
label2id = {"Safe": 0, "Caution": 1, "Risky": 2}
id2label = {v: k for k, v in label2id.items()}
df["label_id"] = df["risk_label"].map(label2id)

unique_templates = np.array(df["template_id"].astype(str).unique())
train_templates, test_templates = train_test_split(unique_templates, test_size=0.15, random_state=42)
train_templates, val_templates = train_test_split(train_templates, test_size=0.1, random_state=42)

train_df = df[df["template_id"].isin(train_templates)].reset_index(drop=True)
val_df   = df[df["template_id"].isin(val_templates)].reset_index(drop=True)
test_df  = df[df["template_id"].isin(test_templates)].reset_index(drop=True)
print("Train/Val/Test sizes:", len(train_df), len(val_df), len(test_df))

# ---- 3. Tokenize ----
MODEL_NAME = "law-ai/InLegalBERT"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=3)

def tokenize(batch):
    return tokenizer(batch["clause_text"], truncation=True, padding="max_length", max_length=128)

train_ds = Dataset.from_pandas(train_df[["clause_text", "label_id"]]).rename_column("label_id", "labels")
val_ds   = Dataset.from_pandas(val_df[["clause_text", "label_id"]]).rename_column("label_id", "labels")
test_ds  = Dataset.from_pandas(test_df[["clause_text", "label_id"]]).rename_column("label_id", "labels")

train_ds = train_ds.map(tokenize, batched=True)
val_ds   = val_ds.map(tokenize, batched=True)
test_ds  = test_ds.map(tokenize, batched=True)

# ---- 4. Metrics ----
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {"accuracy": accuracy_score(labels, preds), "f1_macro": f1_score(labels, preds, average="macro")}

# ---- 5. Training args ----
args = TrainingArguments(
    output_dir=os.path.join(SCRIPT_DIR, "..", "models", "_checkpoints"),
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    gradient_accumulation_steps=GRAD_ACCUM,
    num_train_epochs=3,
    weight_decay=0.01,
    load_best_model_at_end=True,
    metric_for_best_model="f1_macro",
    fp16=USE_FP16,
    gradient_checkpointing=USE_GRAD_CKPT,
    use_cpu=not USE_GPU,
    logging_steps=50,
)

trainer = Trainer(
    model=model, args=args,
    train_dataset=train_ds, eval_dataset=val_ds,
    compute_metrics=compute_metrics,
)

# ---- 6. Train ----
trainer.train()

# ---- 7. Evaluate on held-out test set ----
predictions = trainer.predict(test_ds)
preds = np.argmax(predictions.predictions, axis=-1)
labels = predictions.label_ids

print("\n=== TEST RESULTS ===")
print("Device used:", device_name)
print("Accuracy:", accuracy_score(labels, preds))
print("F1 (macro):", f1_score(labels, preds, average="macro"))
print("Confusion matrix:\n", confusion_matrix(labels, preds))

test_df["pred"] = [id2label[p] for p in preds]
print("\nPer-document-type accuracy:")
print(test_df.groupby("document_type").apply(lambda g: (g["risk_label"] == g["pred"]).mean()))

# ---- 8. Save final model ----
SAVE_PATH = os.path.join(SCRIPT_DIR, "..", "models", "inlegalbert_clause_risk_v1")
trainer.save_model(SAVE_PATH)
tokenizer.save_pretrained(SAVE_PATH)
print(f"\nModel saved to {os.path.abspath(SAVE_PATH)}")