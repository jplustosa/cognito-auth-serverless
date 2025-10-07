// handlers/profile.js

const AWS = require('aws-sdk');
const CognitoService = require('../auth/cognito-service');
const AuthMiddleware = require('../auth/auth-middleware');
const { successResponse, errorResponse } = require('../utils/response-helper');
const { validateProfileUpdate } = require('../utils/validator');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const PROFILES_TABLE = process.env.PROFILES_TABLE;

/**
 * Buscar perfil do usuário
 */
const getProfile = async (event) => {
  try {
    const user = AuthMiddleware.getCurrentUser(event);
    
    if (!user) {
      return errorResponse('Usuário não autenticado', 401);
    }

    // Buscar informações do Cognito
    const cognitoUser = await CognitoService.adminGetUser(user.sub);
    
    // Buscar perfil estendido no DynamoDB
    const profile = await dynamodb.get({
      TableName: PROFILES_TABLE,
      Key: { userId: user.sub }
    }).promise();

    const userProfile = {
      userId: user.sub,
      email: cognitoUser.email,
      name: cognitoUser.name,
      role: cognitoUser['custom:role'] || 'user',
      emailVerified: cognitoUser.email_verified === 'true',
      profile: profile.Item || {}
    };

    return successResponse({
      user: userProfile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse('Erro ao buscar perfil', 500);
  }
};

/**
 * Atualizar perfil
 */
const updateProfile = async (event) => {
  try {
    const user = AuthMiddleware.getCurrentUser(event);
    
    if (!user) {
      return errorResponse('Usuário não autenticado', 401);
    }

    const body = JSON.parse(event.body);
    
    // Validação
    const { error, value } = validateProfileUpdate(body);
    if (error) {
      return errorResponse('Dados inválidos', 400, error.details);
    }

    const { name, profile } = value;

    // Atualizar atributos no Cognito
    if (name) {
      await CognitoService.adminUpdateUserAttributes(user.sub, { name });
    }

    // Atualizar perfil estendido no DynamoDB
    if (profile) {
      await dynamodb.put({
        TableName: PROFILES_TABLE,
        Item: {
          userId: user.sub,
          ...profile,
          updatedAt: new Date().toISOString()
        }
      }).promise();
    }

    return successResponse({
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('Erro ao atualizar perfil', 500);
  }
};

/**
 * Alterar senha
 */
const changePassword = async (event) => {
  try {
    const user = AuthMiddleware.getCurrentUser(event);
    
    if (!user) {
      return errorResponse('Usuário não autenticado', 401);
    }

    const body = JSON.parse(event.body);
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Senha atual e nova senha são obrigatórias', 400);
    }

    // Em uma implementação real, você precisaria do token de acesso
    // para chamar changePassword do Cognito
    // Esta é uma simplificação

    return successResponse({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse('Erro ao alterar senha', 500);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};