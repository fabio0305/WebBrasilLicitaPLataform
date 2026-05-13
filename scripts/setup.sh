#!/bin/bash
# Prepara o ambiente para rodar o Licita Brasil Web

set -e

if [ -f .env ]; then
  echo "Arquivo .env já existe. Pulando criação."
else
  cp .env.example .env
  echo "Arquivo .env criado a partir de .env.example"
  echo "ATENÇÃO: Edite o .env com suas credenciais antes de subir os serviços."
fi
