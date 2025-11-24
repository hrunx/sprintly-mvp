"""
Utility script to push the first N LinkedIn contacts into the local dev server
(via tRPC connections.ingestCsv). This lets you enrich/load connections without
manually clicking the UI. Requires the dev server running (pnpm dev) and
Connections.csv in the repo root.
"""
import base64
import json
import os
from pathlib import Path
import sys
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT.parent / "Connections.csv"
API_URL = os.environ.get("API_URL", "http://localhost:3000/api/trpc")
LIMIT = int(os.environ.get("LIMIT", "20"))
TIMEOUT = int(os.environ.get("TIMEOUT", "300"))


def main():
    if not CSV_PATH.exists():
        print(f"❌ Connections.csv not found at {CSV_PATH}")
        sys.exit(1)

    csv_data = CSV_PATH.read_text(encoding="utf-8")
    url = f"{API_URL.rstrip('/')}/connections.ingestCsv"
    print(f"➡️  Posting to {url} (limit={LIMIT})")
    body = json.dumps({
        "id": 0,
        "json": {
            "csvData": csv_data,
            "limit": LIMIT,
        },
    }).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            raw = resp.read()
            snippet = raw[:200]
            print(f"↩️  Raw response: {snippet!r}{'...' if len(raw) > 200 else ''}")
            data = json.loads(raw)
    except urllib.error.HTTPError as exc:
        print(f"❌ Request failed: {exc}\n{exc.read().decode()}")
        sys.exit(1)
    except Exception as exc:
        print(f"❌ Request failed: {exc}")
        sys.exit(1)

    # tRPC wraps result in {result:{data:{...}}}
    result = data.get("result", {}).get("data", {})
    print(f"✅ Imported: {result.get('imported')} profiles")
    db = result.get("db", {})
    print(
        f"DB -> investors: {db.get('investorsAdded')}, companies: {db.get('companiesAdded')}, matches: {db.get('matchesGenerated')}"
    )


if __name__ == "__main__":
    main()
