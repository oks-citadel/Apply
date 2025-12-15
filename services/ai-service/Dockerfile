# Stage 1: Builder - Install dependencies
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies (only what's needed for compiling)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create virtual environment for cleaner dependency management
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements first for better layer caching
# When built from repo root context, path is services/ai-service/requirements.txt
COPY services/ai-service/requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge

# Stage 2: Production - Minimal runtime image
FROM python:3.11-slim

WORKDIR /app

# Install only runtime dependencies (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only necessary application files (see .dockerignore)
# When built from repo root context, paths are services/ai-service/*
COPY services/ai-service/src/ ./src/
COPY services/ai-service/requirements.txt .

# Create non-root user with specific UID/GID
RUN groupadd -r -g 1000 aiservice && \
    useradd -r -u 1000 -g aiservice -m -d /home/aiservice aiservice && \
    chown -R aiservice:aiservice /app && \
    mkdir -p /app/cache /app/models && \
    chown -R aiservice:aiservice /app/cache /app/models

# Switch to non-root user
USER aiservice

# Environment variables for optimization
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8008 \
    # PyTorch optimizations
    OMP_NUM_THREADS=4 \
    MKL_NUM_THREADS=4 \
    # Model cache directory
    TRANSFORMERS_CACHE=/app/cache/transformers \
    HF_HOME=/app/cache/huggingface

# Expose port
EXPOSE 8008

# Health check with reduced frequency to save resources
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8008/health || exit 1

# Use exec form for proper signal handling
CMD ["uvicorn", "src.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8008", \
     "--workers", "2", \
     "--loop", "uvloop", \
     "--http", "httptools", \
     "--no-access-log"]
