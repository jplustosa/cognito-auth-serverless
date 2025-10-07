#!/bin/bash

# Script de deploy para Cognito Auth API
set -e

STAGE=${1:-dev}
REGION="us-east-1"

echo "🚀 Iniciando deploy para ambiente: $STAGE"

# Verificar dependências
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework não encontrado"
    echo "Instale com: npm install -g serverless"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Executar testes
echo "🧪 Executando testes..."
npm test

# Fazer deploy
echo "🔨 Realizando deploy..."
serverless deploy --stage $STAGE --region $REGION

echo "✅ Deploy concluído com sucesso!"

# Mostrar outputs
echo ""
echo "📋 Outputs do deploy:"
serverless info --stage $STAGE --region $REGION

echo ""
echo "🌐 URLs da API:"
echo "Health Check: https://$(serverless info --stage $STAGE --region $REGION | grep 'GET -' | grep health | head -1 | awk '{print $3}')"
echo ""
echo "🔑 Configurações do Cognito:"
echo "User Pool ID: $(serverless info --stage $STAGE --region $REGION | grep UserPoolId | awk '{print $2}')"
echo "Client ID: $(serverless info --stage $STAGE --region $REGION | grep UserPoolClientId | awk '{print $2}')"