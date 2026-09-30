# PrepPilot backend image
# slim = small Debian base with just enough to run Python
FROM python:3.12-slim

# don't write .pyc files, and print logs straight away (no buffering)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# copy requirements FIRST so Docker can cache the pip install layer.
# if only your .py files change, rebuilds skip the slow install step
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# now copy the actual app code
COPY . .

# don't run as root inside the container
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# Render sets $PORT, locally and in k8s we fall back to 8000.
# JSON form so Docker doesn't wrap it in a shell. We still call sh -c ourselves
# because ${PORT:-8000} needs a shell to expand, then `exec` replaces sh with
# uvicorn so uvicorn is PID 1 and gets SIGTERM directly on shutdown.
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
