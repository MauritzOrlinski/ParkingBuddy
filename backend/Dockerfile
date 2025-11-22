
# Lightweight Python image
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

# Install build dependencies required for some cryptographic and DB wheels
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	   build-essential \
	   gcc \
	   libffi-dev \
	   libssl-dev \
	   libpq-dev \
	   ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only requirements first to leverage Docker cache
COPY requirements.txt /app/requirements.txt

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip setuptools wheel \
	&& pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Create a non-root user and give ownership of the app directory
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# Default command to run the FastAPI app with Uvicorn
CMD ["fastapi", "dev", "main"]

