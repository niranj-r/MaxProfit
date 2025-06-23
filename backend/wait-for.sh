#!/bin/sh
# wait-for.sh

host="$1"
shift
cmd="$@"

until nc -z "$host" 3306; do
  >&2 echo "⏳ Waiting for MySQL at $host:3306..."
  sleep 1
done

>&2 echo "✅ MySQL is up - executing command"
exec $cmd
