"""
login_and_fetch.py

Authenticate to the HC‑gateway /login endpoint, get the session token,
then fetch all nine collections (distance, exerciseSession, …, vo2Max)
and print the results (or write to a file).

Usage:

    python login_and_fetch.py \
        --server https://myapp.example.com \
        --username alice \
        --password secret123 \
        [--fcmToken <token>] \
        [--out results.json] \
        [--insecure]          # skip TLS verification (dev only)

If you prefer to store your credentials in environment variables,
create a `.env` file:

    SERVER_URL=https://myapp.example.com
    USERNAME=alice
    PASSWORD=secret123
    FCMTOKEN=abcd....

Then run:

    python login_and_fetch.py

"""

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import requests
from dotenv import load_dotenv

# --------------------------------------------------------------------------- #
#  CONSTANTS / CONFIG
# --------------------------------------------------------------------------- #
COLLECTIONS = [
    "distance",
    "exerciseSession",
    "heartRate",
    "oxygenSaturation",
    "sleepSession",
    "speed",
    "steps",
    "totalCaloriesBurned",
    "vo2Max",
]


def pprint_json(obj: Any) -> None:
    """Pretty‑print a JSON‑serialisable object to stdout"""
    print(json.dumps(obj, indent=2, default=str))


# --------------------------------------------------------------------------- #
#  HELPER: Authenticate and return the token
# --------------------------------------------------------------------------- #
def login(
    server: str,
    username: str,
    password: str,
    fcm_token: str | None = None,
    insecure: bool = False,
) -> Dict[str, Any]:
    """POST /login and return the JSON payload (token, refresh, expiry)."""
    url = f"{server.rstrip('/')}/login"
    payload: Dict[str, Any] = {"username": username, "password": password}
    if fcm_token:
        payload["fcmToken"] = fcm_token

    resp = requests.post(url, json=payload, timeout=20, verify=not insecure)
    try:
        resp.raise_for_status()
    except requests.HTTPError as exc:
        raise RuntimeError(f"Login failed ({resp.status_code}): {resp.text}") from exc

    try:
        data = resp.json()
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Login response is not valid JSON: {resp.text}") from exc

    if "token" not in data or "expiry" not in data:
        raise RuntimeError(f"Unexpected login response: {data}")

    data["expiry"] = datetime.fromisoformat(data["expiry"])
    return data


# --------------------------------------------------------------------------- #
#  HELPER: Fetch a particular collection
# --------------------------------------------------------------------------- #
def fetch_collection(
    server: str,
    method: str,
    token: str,
    queries: List[Any] | None = None,
    insecure: bool = False,
) -> List[Dict[str, Any]]:
    """Call /fetch/<method> as POST. Return the list of documents."""
    if queries is None:
        queries = []

    url = f"{server.rstrip('/')}/fetch/{method}"
    headers = {"Authorization": f"Bearer {token}"}

    resp = requests.post(
        url,
        json={"queries": queries},
        headers=headers,
        timeout=30,
        verify=not insecure,
    )
    try:
        resp.raise_for_status()
    except requests.HTTPError as exc:
        raise RuntimeError(
            f"Fetching {method} failed ({resp.status_code}): {resp.text}"
        ) from exc

    try:
        data = resp.json()
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Fetch response for {method} is not valid JSON: {resp.text}"
        ) from exc

    if not isinstance(data, list):
        raise RuntimeError(f"Expected a list from /fetch/{method}, got {type(data)}")

    return data


# --------------------------------------------------------------------------- #
#  MAIN
# --------------------------------------------------------------------------- #
def main(argv=None) -> None:
    parser = argparse.ArgumentParser(description="Login & fetch HC‑gateway data")
    parser.add_argument(
        "--server", help="Base URL of the app (e.g. https://myapp.example.com)"
    )
    parser.add_argument("--username", help="Login username")
    parser.add_argument("--password", help="Login password")
    parser.add_argument("--fcmToken", help="Optional FCM token")
    parser.add_argument(
        "--out", help="Output file (JSON) – if omitted, prints to stdout"
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Skip TLS verification (useful for local dev only)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of results per collection (e.g., 10)",
    )
    args = parser.parse_args(argv)

    # Load env vars if any (dotenv)
    load_dotenv()

    server = args.server or os.getenv("SERVER_URL")
    username = args.username or os.getenv("USERNAME")
    password = args.password or os.getenv("PASSWORD")
    fcm_token = args.fcmToken or os.getenv("FCMTOKEN")

    if not server:
        parser.error("Missing --server or SERVER_URL env var")
    if not username:
        parser.error("Missing --username or USERNAME env var")
    if not password:
        parser.error("Missing --password or PASSWORD env var")

    # Step 1: Log in
    print(f"[{datetime.now().isoformat()}] Logging in as {username} …")
    login_resp = login(server, username, password, fcm_token, insecure=args.insecure)
    token = login_resp["token"]
    expiry = login_resp["expiry"]
    print(
        f"[{datetime.now().isoformat()}] Token obtained (expires {expiry.isoformat()})"
    )

    # Step 2: Fetch every collection
    results: Dict[str, List[Dict[str, Any]]] = {}
    for method in COLLECTIONS:
        print(f"[{datetime.now().isoformat()}] Fetching '{method}' …")
        try:
            docs = fetch_collection(server, method, token, insecure=args.insecure)
            if args.limit is not None:
                docs = docs[: args.limit]
        except Exception as exc:
            print(f"❌  Error fetching {method}: {exc}")
            continue
        results[method] = docs
        print(f"    → {len(docs)} documents")

    # Step 3: Output
    if args.out:
        output_path = Path(args.out)
        output_path.write_text(
            json.dumps(results, indent=2, default=str), encoding="utf-8"
        )
        print(f"✅  All data written to {output_path}")
    else:
        pprint_json(results)


if __name__ == "__main__":
    main()
