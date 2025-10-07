# Serverless Authentication API with Amazon Cognito

API de autenticação serverless usando Amazon Cognito, API Gateway, Lambda e DynamoDB.

## 🚀 Funcionalidades

- ✅ Registro e confirmação de usuários
- ✅ Login com email/senha
- ✅ Refresh Token
- ✅ Recuperação de senha
- ✅ Perfil de usuário
- ✅ Autorização baseada em roles
- ✅ Admin dashboard
- ✅ Validação de dados
- ✅ Logs e monitoramento

## 📋 Pré-requisitos

- Node.js 18.x+
- AWS CLI configurado
- Conta AWS com permissões adequadas
- Serverless Framework

## 🛠️ Instalação

```bash
git clone https://github.com/seu-usuario/cognito-auth-serverless.git
cd cognito-auth-serverless
npm install



🚀 Deploy
bash
# Deploy no ambiente de desenvolvimento
npm run deploy:dev

# Configurar usuário admin
./scripts/setup-cognito.sh dev

# Deploy produção
npm run deploy:prod



📝 Endpoints da API
Públicos
GET /health - Health check

POST /auth/signup - Registrar usuário

POST /auth/confirm - Confirmar registro

POST /auth/login - Login

POST /auth/refresh - Refresh token

POST /auth/forgot-password - Esqueci senha

POST /auth/confirm-password - Confirmar nova senha

Protegidos
GET /profile - Buscar perfil

PUT /profile - Atualizar perfil

PUT /profile/password - Alterar senha

Admin (apenas role admin)
GET /admin/users - Listar usuários

GET /admin/users/{id} - Buscar usuário

PUT /admin/users/{id}/role - Atualizar role

🔐 Fluxo de Autenticação
Registro: POST /auth/signup

Confirmação: POST /auth/confirm (com código do email)

Login: POST /auth/login

Acesso: Usar accessToken no header Authorization: Bearer <token>

Refresh: POST /auth/refresh (quando token expirar)



🏗️ Arquitetura
text
Client → API Gateway → Lambda → Cognito/DynamoDB
                     ↓
             CloudWatch Logs
🔧 Variáveis de Ambiente
USER_POOL_ID - ID do User Pool do Cognito

USER_POOL_CLIENT_ID - ID do Client do Cognito

USERS_TABLE - Tabela DynamoDB para usuários

PROFILES_TABLE - Tabela DynamoDB para perfis



🧪 Testes
bash
# Executar testes
npm test

# Desenvolvimento local
npm run dev



📊 Monitoramento
Logs no CloudWatch

Métricas do API Gateway

Rastreamento X-Ray

🛡️ Segurança
Validação de dados com Joi

Tokens JWT assinados

Roles e permissões

CORS configurado

Senhas com política forte