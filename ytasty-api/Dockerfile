FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --locked --no-dev --no-install-project

COPY . .

RUN uv sync --locked --no-dev

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "ytasty.main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "src"]