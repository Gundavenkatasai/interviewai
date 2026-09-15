FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and local JobSpy package
COPY app.py .
COPY JobSpy ./JobSpy

# Install local JobSpy
RUN pip install --no-cache-dir ./JobSpy

# Expose port
EXPOSE 8000

# Start server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
