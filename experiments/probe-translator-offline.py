"""Isolated upstream-only probe; not a Sinaliza implementation."""
import sys
import json
import time
import resource
import platform
import os
import math
import statistics
import importlib.metadata
import argparse
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", type=Path, help="Write JSON to this path instead of stdout")
args = parser.parse_args()

attempts = []

def forbid_network(event, args):
    if event in ("socket.connect", "socket.getaddrinfo"):
        attempts.append(event)
        raise RuntimeError("Network is forbidden in this upstream offline probe")

sys.addaudithook(forbid_network)
start = time.perf_counter()
from vlibras_translator.translate import Translator
import_ms = (time.perf_counter() - start) * 1000
start = time.perf_counter()
translator = Translator()
init_ms = (time.perf_counter() - start) * 1000

texts = [
    "Olá mundo.",
    "Eu gosto de estudar.",
    "Nós vamos ao mercado amanhã.",
    "Quanto custa o livro?",
    "Tenho 25 anos.",
    "A professora explicou a matéria e os alunos fizeram perguntas sobre o livro.",
]
first_calls = []
for text in texts:
    start = time.perf_counter()
    gloss = translator.translate(text, neural=False)
    first_calls.append({"text": text, "gloss": gloss, "ms": (time.perf_counter() - start) * 1000})

samples = []
cpu_start = time.process_time()
wall_start = time.perf_counter()
for i in range(30):
    for text in texts:
        start = time.perf_counter()
        gloss = translator.translate(text, neural=False)
        samples.append({"text": text, "gloss": gloss, "ms": (time.perf_counter() - start) * 1000})

def summary(values):
    ordered = sorted(values)
    return {"n": len(values), "p50_ms": statistics.median(values), "p95_ms": ordered[math.ceil(len(values) * .95) - 1], "min_ms": ordered[0], "max_ms": ordered[-1]}

result = {
    "kind": "exploratory_upstream_rule_based_only",
    "python": platform.python_version(),
    "platform": platform.platform(),
    "cpu_count": os.cpu_count(),
    "versions": {name: importlib.metadata.version(name) for name in ["vlibras-translator", "spacy", "nltk", "numpy", "joblib", "pt-core-news-md"]},
    "network_policy": "audit hook blocks socket.connect and socket.getaddrinfo before upstream import",
    "network_attempts": attempts,
    "import_ms": import_ms,
    "init_ms": init_ms,
    "first_calls": first_calls,
    "warm_aggregate": summary([sample["ms"] for sample in samples]),
    "warm_by_text": [{"text": text, **summary([sample["ms"] for sample in samples if sample["text"] == text])} for text in texts],
    "benchmark_cpu_seconds": time.process_time() - cpu_start,
    "benchmark_wall_seconds": time.perf_counter() - wall_start,
    "max_rss_kib": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
    "samples": samples,
    "limitations": ["No neural model", "No Sinaliza implementation", "No remote VLibras service", "New process but OS filesystem caches not flushed", "Exploratory synthetic corpus; not linguistic validation"],
}
assert not attempts, attempts
serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
if args.output is None:
    sys.stdout.write(serialized)
else:
    args.output.write_text(serialized, encoding="utf-8")
