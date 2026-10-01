"""Chittagonian retrieval: finds the most similar dataset rows to ground the LLM (RAG)."""
import re

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

from ..config import settings
from ..languages import has_bengali_script

_SPLIT = re.compile(r"[।.?!\n]+")


class CtgIndex:
    def __init__(self, path):
        self.ready = False
        if not path.exists():
            return
        df = pd.read_csv(path).dropna(subset=["chattogram", "bengali", "english"])
        self.df = df.reset_index(drop=True)
        self.v_bn = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), sublinear_tf=True)
        self.m_bn = self.v_bn.fit_transform(self.df.chattogram + " " + self.df.bengali)
        self.v_en = TfidfVectorizer(analyzer="word", ngram_range=(1, 2), sublinear_tf=True, stop_words="english")
        self.m_en = self.v_en.fit_transform(self.df.english)
        self.ready = True

    def _search(self, query: str, k: int, min_score: float):
        vec, mat = (self.v_bn, self.m_bn) if has_bengali_script(query) else (self.v_en, self.m_en)
        scores = (mat @ vec.transform([query]).T).toarray().ravel()
        top = np.argsort(-scores)[:k]
        return [(int(i), float(scores[i])) for i in top if scores[i] >= min_score]

    def search_text(self, text: str, per_sentence: int = 3, max_total: int = 10, min_score: float = 0.15):
        """Retrieve examples for every sentence of the input, de-duplicated."""
        if not self.ready or not text.strip():
            return []
        parts = [p.strip() for p in _SPLIT.split(text[:1500]) if len(p.strip()) > 1][:6] or [text[:300]]
        seen, rows = set(), []
        for p in parts:
            for i, s in self._search(p, per_sentence, min_score):
                if i not in seen:
                    seen.add(i)
                    rows.append((s, self.df.iloc[i]))
        rows.sort(key=lambda x: -x[0])
        return [r for _, r in rows[:max_total]]

    @staticmethod
    def format_examples(rows) -> str:
        return "\n".join(
            f"- Chittagonian: {r.chattogram} | Bengali: {r.bengali} | English: {r.english}" for r in rows
        )


index = CtgIndex(settings.data_path)
