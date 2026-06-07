# ============================================================
#  AI Engine — FastAPI + TensorFlow (Python 3.11)
#  Single-stage slim image. The trained .h5 models are copied
#  into the image because app.py loads them from this folder.
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# TensorFlow needs the OpenMP runtime (libgomp1) at runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first so this layer is cached
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code AND the trained models (.h5 files)
COPY . .

# The FastAPI app listens on 8001
EXPOSE 8001

# Entry point is app.py -> the FastAPI instance is named "app"
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
