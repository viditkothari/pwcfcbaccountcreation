"""Backend tests for Commercial Banking Relationship API."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fallback to frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Metadata ----
class TestMetadata:
    def test_metadata_shape(self, session):
        r = session.get(f"{API}/metadata", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("countries", "industries", "statuses", "levels"):
            assert k in d and isinstance(d[k], list) and len(d[k]) > 0
        # levels contain L1..L4
        codes = {lv["code"] for lv in d["levels"]}
        assert {"L1", "L2", "L3", "L4"}.issubset(codes)


# ---- Search ----
class TestSearch:
    def test_list_all(self, session):
        r = session.get(f"{API}/accounts", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 19
        # levels distribution present
        levels = {row["level"] for row in data}
        assert {"L1", "L2", "L3", "L4"}.issubset(levels)
        # no _id leaked
        assert all("_id" not in row for row in data)

    def test_filter_by_name(self, session):
        r = session.get(f"{API}/accounts", params={"name": "apex"}, timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) > 0
        assert all("apex" in row["name"].lower() for row in rows)

    def test_filter_by_level(self, session):
        r = session.get(f"{API}/accounts", params={"level": "L1"}, timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) >= 5
        assert all(row["level"] == "L1" for row in rows)

    def test_filter_by_country_industry_status(self, session):
        r = session.get(f"{API}/accounts", params={"country": "United States", "industry": "Financial Services", "status": "Active"}, timeout=15)
        assert r.status_code == 200
        for row in r.json():
            assert row["country"] == "United States"
            assert row["industry"] == "Financial Services"
            assert row["status"] == "Active"

    def test_filter_by_relationshipId(self, session):
        r = session.get(f"{API}/accounts", params={"relationshipId": "REL-100045"}, timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) == 1
        assert rows[0]["relationshipId"] == "REL-100045"


# ---- Get by ID ----
class TestGetById:
    def test_get_valid(self, session):
        rows = session.get(f"{API}/accounts", timeout=15).json()
        rid = rows[0]["id"]
        r = session.get(f"{API}/accounts/{rid}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == rid

    def test_get_missing(self, session):
        r = session.get(f"{API}/accounts/does-not-exist-xyz", timeout=15)
        assert r.status_code == 404


# ---- Create ----
class TestCreate:
    def test_create_l1_and_verify(self, session):
        suffix = str(uuid.uuid4().int)[:6]
        payload = {
            "level": "L1",
            "name": f"TEST_ Northwind Holdings {suffix}",
            "relationshipId": f"REL-{suffix}",
            "country": "United States",
            "industry": "Technology",
            "status": "Prospect",
            "attributes": {"creditRating": "A", "relationshipManager": "QA Bot", "kycStatus": "In Progress"},
        }
        r = session.post(f"{API}/accounts", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["id"]
        assert body["level"] == "L1"
        assert body["name"] == payload["name"]
        assert body["source"] == "manual"
        # persistence
        g = session.get(f"{API}/accounts/{body['id']}", timeout=15)
        assert g.status_code == 200
        assert g.json()["relationshipId"] == payload["relationshipId"]

    def test_create_l2(self, session):
        suffix = str(uuid.uuid4().int)[:6]
        payload = {
            "level": "L2",
            "name": f"TEST_ Northwind EMEA {suffix}",
            "relationshipId": f"REL-{suffix}",
            "country": "United Kingdom",
            "industry": "Financial Services",
            "status": "Active",
            "attributes": {"parentRelationship": "Apex Global Holdings PLC", "region": "EMEA"},
        }
        r = session.post(f"{API}/accounts", json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["level"] == "L2"

    def test_create_l3_rejected(self, session):
        payload = {
            "level": "L3",
            "name": "TEST_ Should Fail",
            "relationshipId": "LE-999999",
            "country": "United States",
            "industry": "Technology",
            "status": "Active",
        }
        r = session.post(f"{API}/accounts", json=payload, timeout=15)
        assert r.status_code == 400

    def test_create_l4_rejected(self, session):
        payload = {
            "level": "L4",
            "name": "TEST_ Should Fail L4",
            "relationshipId": "FA-999999",
            "country": "United States",
            "industry": "Technology",
            "status": "Active",
        }
        r = session.post(f"{API}/accounts", json=payload, timeout=15)
        assert r.status_code == 400
