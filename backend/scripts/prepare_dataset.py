"""Clean the raw Chittagonian dataset and produce RAG + fine-tuning files.

Usage:  python scripts/prepare_dataset.py [raw_csv]
Output: data/clean/ctg_pairs.csv, train.jsonl, val.jsonl, test.jsonl
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "raw" / "chattogram_raw.csv"
OUT = ROOT / "data" / "clean"
OUT.mkdir(parents=True, exist_ok=True)

ZW = re.compile(r"[\u200b\u200c\u200d\ufeff]")  # zero-width chars
WS = re.compile(r"\s+")


def norm(s: str) -> str:
    s = unicodedata.normalize("NFC", str(s))
    s = ZW.sub("", s)
    return WS.sub(" ", s).strip()


df = pd.read_csv(RAW)
n0 = len(df)
df = df.rename(columns={"Bengali": "bengali", "Chattogram": "chattogram", "English": "english",
                        "Sentiment": "sentiment", "Source of Data": "source"})
for c in ["bengali", "chattogram", "english", "sentiment", "source"]:
    df[c] = df[c].fillna("").map(norm)

df["sentiment"] = df["sentiment"].str.lower()
df["source"] = df["source"].str.lower().map(
    {"conversation": "Conversation", "drama": "Drama", "social media": "Social Media"}).fillna("Other")

df = df[(df.bengali.str.len() > 1) & (df.chattogram.str.len() > 1) & (df.english.str.len() > 1)]
n_empty = n0 - len(df)
df = df.drop_duplicates(subset=["chattogram", "bengali"]).reset_index(drop=True)
n_dup = n0 - n_empty - len(df)

# Deterministic split grouped by Chittagonian text, so the same sentence never leaks across splits.
groups = df.chattogram.unique()
rng = pd.Series(groups).sample(frac=1, random_state=42).tolist()
cut1, cut2 = int(len(rng) * 0.8), int(len(rng) * 0.9)
split_of = {g: ("train" if i < cut1 else "val" if i < cut2 else "test") for i, g in enumerate(rng)}
df["split"] = df.chattogram.map(split_of)

df.to_csv(OUT / "ctg_pairs.csv", index=False, encoding="utf-8")

# Fine-tuning pairs (NLLB-style language tags). Bengali<->English is already well supported, so skipped.
DIRS = [("chattogram", "bengali", "ctg", "ben"), ("bengali", "chattogram", "ben", "ctg"),
        ("chattogram", "english", "ctg", "eng"), ("english", "chattogram", "eng", "ctg")]
for split in ["train", "val", "test"]:
    part = df[df.split == split]
    with open(OUT / f"{split}.jsonl", "w", encoding="utf-8") as f:
        for _, r in part.iterrows():
            for s, t, sl, tl in DIRS:
                f.write(json.dumps({"src": r[s], "tgt": r[t], "src_lang": sl, "tgt_lang": tl},
                                   ensure_ascii=False) + "\n")

same = int((df.chattogram == df.bengali).sum())
conflict = int(df.groupby("chattogram").bengali.nunique().gt(1).sum())
print(f"raw rows            : {n0}")
print(f"dropped empty/short : {n_empty}")
print(f"dropped duplicates  : {n_dup}")
print(f"clean rows          : {len(df)}")
print(f"Chittagonian == Bengali (no dialect difference): {same}")
print(f"Chittagonian texts with >1 different Bengali   : {conflict}")
print(df.split.value_counts().to_string())
print(df.sentiment.value_counts().to_string())
print(df.source.value_counts().to_string())
print("avg words  ctg/bn/en:", *(round(df[c].str.split().str.len().mean(), 1) for c in ["chattogram", "bengali", "english"]))
