#!/usr/bin/env bash
echo "Starting Interview AI Development Environment..."
npm run dev --prefix apps/api-node &
npm run dev --prefix apps/web &
wait
