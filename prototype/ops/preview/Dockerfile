# The static site with mocked data, served by the same Caddy the preview box already runs.
FROM caddy:2.11.4-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY site /srv
EXPOSE 3000
