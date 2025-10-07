#!/bin/bash

# Script para configurar usuário admin no Cognito
set -e

STAGE=${1:-dev}
REGION="us-east-1"

echo "🔧 Configurando usuário admin no Cognito..."

# Obter outputs do CloudFormation
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name cognito-auth-serverless-$STAGE \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
  --output text \
  --region $REGION)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name cognito-auth-serverless-$STAGE \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
  --output text \
  --region $REGION)

echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"

# Criar usuário admin
read -p "Digite o email para o usuário admin: " ADMIN_EMAIL
read -s -p "Digite a senha para o usuário admin: " ADMIN_PASSWORD
echo ""

echo "👤 Criando usuário admin..."

# Criar usuário
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $ADMIN_EMAIL \
  --temporary-password "TempPassword123!" \
  --user-attributes Name=email,Value=$ADMIN_EMAIL Name=email_verified,Value=true Name=custom:role,Value=admin Name=name,Value="Admin User" \
  --region $REGION

# Definir senha permanente
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username $ADMIN_EMAIL \
  --password $ADMIN_PASSWORD \
  --permanent \
  --region $REGION

echo "✅ Usuário admin criado com sucesso!"
echo "📧 Email: $ADMIN_EMAIL"
echo "🎯 Role: admin"