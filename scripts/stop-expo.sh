#!/usr/bin/env bash
# Encerra processos Expo/Metro nas portas 8081–8083
for port in 8081 8082 8083; do
  fuser -k "${port}/tcp" 2>/dev/null || true
done
pkill -f "expo start" 2>/dev/null || true
echo "Portas 8081-8083 liberadas."
