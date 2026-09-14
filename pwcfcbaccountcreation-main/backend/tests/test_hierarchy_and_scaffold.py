"""Tests for GET /api/accounts/{id}/hierarchy and GET /api/scaffold/download."""
import io
import os
import zipfile
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def accounts():
    r = requests.get(f"{API}/accounts", timeout=15)
    assert r.status_code == 200
    return r.json()


def _find(accounts, level, name):
    return next(a for a in accounts if a["level"] == level and a["name"] == name)


def _find_focus(node, focus_id):
    if node["id"] == focus_id:
        return node
    for c in node.get("children", []):
        r = _find_focus(c, focus_id)
        if r:
            return r
    return None


class TestHierarchy:
    def test_l4_returns_full_rollup(self, accounts):
        l4 = _find(accounts, "L4", "Apex Americas - USD Operating")
        r = requests.get(f"{API}/accounts/{l4['id']}/hierarchy", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["focusId"] == l4["id"]
        root = d["tree"]
        # root should be Apex Global Holdings PLC (L1)
        assert root["level"] == "L1"
        assert root["name"] == "Apex Global Holdings PLC"
        assert root["isFocus"] is False
        # path: L1 -> L2 (Apex Americas Regional Group) -> L3 (Apex Americas LLC) -> L4 focus
        l2 = next(c for c in root["children"] if c["name"] == "Apex Americas Regional Group")
        assert l2["level"] == "L2"
        l3 = next(c for c in l2["children"] if c["name"] == "Apex Americas LLC")
        assert l3["level"] == "L3"
        l4node = next(c for c in l3["children"] if c["id"] == l4["id"])
        assert l4node["level"] == "L4"
        assert l4node["isFocus"] is True

    def test_l3_returns_root_and_focus_flag(self, accounts):
        l3 = _find(accounts, "L3", "Apex Americas LLC")
        r = requests.get(f"{API}/accounts/{l3['id']}/hierarchy", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["tree"]["name"] == "Apex Global Holdings PLC"
        focus = _find_focus(d["tree"], l3["id"])
        assert focus is not None and focus["isFocus"] is True
        assert focus["level"] == "L3"

    def test_l1_returns_itself_as_root(self, accounts):
        l1 = _find(accounts, "L1", "Apex Global Holdings PLC")
        r = requests.get(f"{API}/accounts/{l1['id']}/hierarchy", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["tree"]["id"] == l1["id"]
        assert d["tree"]["isFocus"] is True
        # Should contain L2 descendants of Apex
        child_names = {c["name"] for c in d["tree"]["children"]}
        assert "Apex Americas Regional Group" in child_names
        assert "Apex EMEA Operating Group" in child_names
        # Ensure L3/L4 nested somewhere
        def collect_levels(n, out):
            out.add(n["level"])
            for c in n.get("children", []):
                collect_levels(c, out)
        levels = set()
        collect_levels(d["tree"], levels)
        assert {"L1", "L2", "L3", "L4"}.issubset(levels)

    def test_missing_id_returns_404(self):
        r = requests.get(f"{API}/accounts/does-not-exist/hierarchy", timeout=15)
        assert r.status_code == 404


class TestScaffoldDownload:
    def test_download_zip(self):
        r = requests.get(f"{API}/scaffold/download", timeout=30)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/zip")
        cd = r.headers.get("content-disposition", "")
        assert "attachment" in cd
        assert "meridianone-salesforce-package.zip" in cd
        zf = zipfile.ZipFile(io.BytesIO(r.content))
        names = zf.namelist()
        assert len(names) == 12, f"expected 12 files, got {len(names)}: {names}"
        joined = "\n".join(names)
        assert ".flow-meta.xml" in joined
        assert "lwc/relationshipSearch/" in joined
        assert "lwc/relationshipHierarchyTree/" in joined
        assert "RelationshipSearchController.cls" in joined
        assert "package.xml" in joined
