# =========================================
# Multi-stage Docker build para AquaLytics FastAPI
# Optimizado para producción con imagen minimal
# =========================================

# =============
# Builder stage
# =============
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create and use a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

# Copy and install Python dependencies
COPY pyproject.toml .
RUN pip install --user -e .

# ===============
# Production stage  
# ===============
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/home/appuser/.local/bin:$PATH" \
    PORT=8000

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /home/appuser/.local /home/appuser/.local

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:$PORT/health')"

# Expose port
EXPOSE $PORT

# Production command
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1"]

# =========================================
# BUILD INSTRUCTIONS
# =========================================
# 
# Build image:
#   docker build -t aqualytics-api .
#
# Run container:
#   docker run -p 8000:8000 \
#     -e AQUALYTICS_DATABASE_URL="postgresql://..." \
#     -e AQUALYTICS_ALLOWED_ORIGINS="https://aqualytics-mvp.vercel.app" \
#     -e AQUALYTICS_SECRET_KEY="your-secret-key" \
#     aqualytics-api
#
# Multi-platform build (for deployment):
#   docker buildx build --platform linux/amd64,linux/arm64 -t aqualytics-api .
#
# =========================================
