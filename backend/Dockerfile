# Use official Python image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy project files to the container
COPY . /app

# Install dependencies
RUN pip install -r requirements.txt

# Expose Flask default port
EXPOSE 5000

# Command to run the application
CMD ["python", "app.py"]
