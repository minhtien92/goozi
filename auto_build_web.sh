git pull origin main
docker compose build --no-cache web
docker compose up -d web