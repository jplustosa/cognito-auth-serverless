// handlers/admin.js

const CognitoService = require('../auth/cognito-service');
const AuthMiddleware = require('../auth/auth-middleware');
const { successResponse, errorResponse } = require('../utils/response-helper');

/**
 * Listar usuários (apenas admin)
 */
const listUsers = async (event) => {
  try {
    // Verificar se é admin
    if (!AuthMiddleware.isAdmin(event)) {
      return errorResponse('Acesso negado. Apenas administradores.', 403);
    }

    const { limit = 10, paginationToken } = event.queryStringParameters || {};
    
    const result = await CognitoService.listUsers(
      parseInt(limit),
      paginationToken
    );

    // Filtrar informações sensíveis
    const users = result.users.map(user => ({
      userId: user.sub,
      email: user.email,
      name: user.name,
      role: user['custom:role'] || 'user',
      status: user.userStatus,
      enabled: user.enabled,
      createdAt: user.userCreateDate
    }));

    return successResponse({
      users,
      paginationToken: result.paginationToken,
      total: users.length
    });

  } catch (error) {
    console.error('List users error:', error);
    return errorResponse('Erro ao listar usuários', 500);
  }
};

/**
 * Buscar usuário específico (apenas admin)
 */
const getUser = async (event) => {
  try {
    if (!AuthMiddleware.isAdmin(event)) {
      return errorResponse('Acesso negado. Apenas administradores.', 403);
    }

    const { userId } = event.pathParameters;
    
    if (!userId) {
      return errorResponse('ID do usuário é obrigatório', 400);
    }

    const user = await CognitoService.adminGetUser(userId);

    return successResponse({
      user: {
        userId: user.sub,
        email: user.email,
        name: user.name,
        role: user['custom:role'] || 'user',
        status: user.userStatus,
        enabled: user.enabled,
        emailVerified: user.email_verified === 'true',
        createdAt: user.userCreateDate,
        updatedAt: user.userLastModifiedDate
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.code === 'UserNotFoundException') {
      return errorResponse('Usuário não encontrado', 404);
    }
    
    return errorResponse('Erro ao buscar usuário', 500);
  }
};

/**
 * Atualizar role do usuário (apenas admin)
 */
const updateUserRole = async (event) => {
  try {
    if (!AuthMiddleware.isAdmin(event)) {
      return errorResponse('Acesso negado. Apenas administradores.', 403);
    }

    const { userId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { role } = body;

    if (!userId || !role) {
      return errorResponse('ID do usuário e role são obrigatórios', 400);
    }

    const validRoles = ['admin', 'user', 'moderator'];
    if (!validRoles.includes(role)) {
      return errorResponse('Role inválida', 400);
    }

    await CognitoService.adminUpdateUserAttributes(userId, { role });

    return successResponse({
      message: 'Role do usuário atualizada com sucesso'
    });

  } catch (error) {
    console.error('Update user role error:', error);
    return errorResponse('Erro ao atualizar role do usuário', 500);
  }
};

module.exports = {
  listUsers,
  getUser,
  updateUserRole
};