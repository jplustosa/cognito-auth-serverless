// auth/auth-middleware.js

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const CognitoService = require('./cognito-service');
const { errorResponse } = require('../utils/response-helper');

class AuthMiddleware {
  constructor() {
    this.region = process.env.REGION;
    this.userPoolId = process.env.USER_POOL_ID;
    
    this.client = jwksClient({
      jwksUri: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`
    });
  }

  /**
   * Middleware para verificar token JWT
   */
  authenticate() {
    return {
      before: async (handler) => {
        try {
          const token = this.extractToken(handler.event);
          
          if (!token) {
            return errorResponse('Token de acesso não fornecido', 401);
          }

          const decoded = await this.verifyToken(token);
          handler.event.user = decoded;
          
          return Promise.resolve();
        } catch (error) {
          console.error('Authentication error:', error);
          return errorResponse('Token inválido ou expirado', 401);
        }
      }
    };
  }

  /**
   * Middleware para verificar permissões
   */
  authorize(requiredRoles = []) {
    return {
      before: async (handler) => {
        try {
          if (!handler.event.user) {
            return errorResponse('Usuário não autenticado', 401);
          }

          if (requiredRoles.length > 0) {
            const userRole = handler.event.user['custom:role'] || 'user';
            
            if (!requiredRoles.includes(userRole)) {
              return errorResponse('Acesso negado. Permissões insuficientes.', 403);
            }
          }

          return Promise.resolve();
        } catch (error) {
          console.error('Authorization error:', error);
          return errorResponse('Erro de autorização', 403);
        }
      }
    };
  }

  /**
   * Extrair token do header
   */
  extractToken(event) {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Verificar token JWT
   */
  async verifyToken(token) {
    return new Promise((resolve, reject) => {
      const getKey = (header, callback) => {
        this.client.getSigningKey(header.kid, (err, key) => {
          if (err) {
            callback(err);
          } else {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
          }
        });
      };

      jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`
      }, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }

  /**
   * Obter usuário atual do contexto
   */
  getCurrentUser(event) {
    return event.user || null;
  }

  /**
   * Verificar se usuário é admin
   */
  isAdmin(event) {
    const user = this.getCurrentUser(event);
    return user && user['custom:role'] === 'admin';
  }

  /**
   * Verificar se usuário é o próprio ou admin
   */
  isOwnerOrAdmin(event, userId) {
    const user = this.getCurrentUser(event);
    if (!user) return false;
    
    const isOwner = user.sub === userId;
    const isAdmin = user['custom:role'] === 'admin';
    
    return isOwner || isAdmin;
  }
}

module.exports = new AuthMiddleware();