"""
Tests for the AI Engine's /classify endpoint.

Run from the ai-service folder:
    pytest

Note: importing `app` loads the TensorFlow models, so the first test may take
a few seconds. The trained .h5 models must be present in the ai-service folder.
"""
import io

import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app import app   # the FastAPI instance defined in app.py

client = TestClient(app)


def _fake_oct_image() -> bytes:
    """Create a small in-memory grayscale-like PNG to use as a test upload."""
    img = Image.new("RGB", (224, 224), color=(120, 120, 120))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def test_root_is_alive():
    """The service should respond on the root endpoint."""
    res = client.get("/")
    assert res.status_code == 200


def test_classify_returns_valid_response():
    """POST /classify with an image should return a valid prediction."""
    files = {"file": ("scan.png", _fake_oct_image(), "image/png")}
    res = client.post("/classify", files=files)

    # The request succeeds
    assert res.status_code == 200

    data = res.json()
    # The response has the expected structure
    assert "disease" in data
    assert "confidence" in data

    # The predicted class is one of the four known OCT classes
    assert data["disease"] in ["CNV", "DME", "DRUSEN", "NORMAL"]

    # Confidence is a percentage between 0 and 100
    assert 0.0 <= float(data["confidence"]) <= 100.0
