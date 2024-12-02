docker rmi -f $(docker images -q)
docker tag csportal:latest csportal:previous
docker-compose up -d --build