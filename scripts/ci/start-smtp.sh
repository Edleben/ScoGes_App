#!/usr/bin/env bash
set -euo pipefail
: "${RUNNER_TEMP:?Disposable runner directory required}"
: "${GITHUB_ENV:?GitHub environment file required}"
: "${SMTP_USER:?SMTP fixture user required}"
: "${SMTP_PASSWORD:?SMTP fixture password required}"
directory="$RUNNER_TEMP/scoges-smtp"
mkdir -p "$directory"
chmod 700 "$directory"
openssl req -x509 -newkey rsa:2048 -noenc -days 1 \
  -keyout "$directory/ca.key" -out "$directory/ca.crt" \
  -subj '/CN=ScoGes CI SMTP CA' -addext 'basicConstraints=critical,CA:TRUE' >/dev/null 2>&1
openssl req -new -newkey rsa:2048 -noenc \
  -keyout "$directory/server.key" -out "$directory/server.csr" -subj '/CN=localhost' >/dev/null 2>&1
printf 'subjectAltName=DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n' > "$directory/extensions"
openssl x509 -req -in "$directory/server.csr" -CA "$directory/ca.crt" -CAkey "$directory/ca.key" \
  -CAcreateserial -out "$directory/server.crt" -days 1 -extfile "$directory/extensions" >/dev/null 2>&1
export MP_SMTP_AUTH="$SMTP_USER:$SMTP_PASSWORD"
export MP_SMTP_ALLOWED_RECIPIENTS='@example\.invalid$'
mailpit --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025 \
  --smtp-tls-cert "$directory/server.crt" --smtp-tls-key "$directory/server.key" \
  --smtp-require-starttls --smtp-disable-rdns > "$directory/mailpit.log" 2>&1 &
echo "$!" > "$directory/pid"
echo "NODE_EXTRA_CA_CERTS=$directory/ca.crt" >> "$GITHUB_ENV"
curl --fail --silent --retry 20 --retry-connrefused --retry-delay 1 --max-time 2 \
  http://127.0.0.1:8025/api/v1/info >/dev/null
echo 'Isolated TLS SMTP mail catcher is ready; outgoing relay is not configured.'
