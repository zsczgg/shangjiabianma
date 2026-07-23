#!/bin/sh
set -eu

mkdir -p /data
npx prisma db push --skip-generate
exec npm start -- -H 0.0.0.0 -p "${PORT:-3210}"

