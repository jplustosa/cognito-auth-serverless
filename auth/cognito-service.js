// auth/cognito-service.js

const AWS = require('aws-sdk');
const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} = require('amazon-cognito-identity-js');

class CognitoService {
  constructor() {
    this.userPoolId = process.env.USER_POOL_ID;
    this.clientId = process.env.USER_POOL_CLIENT_ID;
    this.region = process.env.REGION;
    
    this.cognitoISP = new AWS.CognitoIdentityServiceProvider({
      region: this.region
    });

    this.userPool = new CognitoUserPool({
      UserPoolId: this.userPoolId,
      ClientId: this.clientId
    });
  }

  /**
   * Registrar novo usuário
   */
  async signUp(email, password, attributes = {}) {
    return new Promise((resolve, reject) => {
      const attributeList = [];

      // Atributos padrão
      if (attributes.name) {
        attributeList.push(
          new CognitoUserAttribute({
            Name: 'name',
            Value: attributes.name
          })
        );
      }

      if (attributes.role) {
        attributeList.push(
          new CognitoUserAttribute({
            Name: 'custom:role',
            Value: attributes.role
          })
        );
      }

      // Email é obrigatório
      attributeList.push(
        new CognitoUserAttribute({
          Name: 'email',
          Value: email
        })
      );

      this.userPool.signUp(
        email,
        password,
        attributeList,
        null,
        (err, result) => {
          if (err) {
            reject(this.handleCognitoError(err));
          } else {
            resolve({
              userConfirmed: result.userConfirmed,
              userSub: result.userSub,
              codeDeliveryDetails: result.codeDeliveryDetails
            });
          }
        }
      );
    });
  }

  /**
   * Confirmar registro com código
   */
  async confirmSignUp(email, code) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      });

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(this.handleCognitoError(err));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Login de usuário
   */
  async login(email, password) {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve({
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.getIdToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
            expiresIn: result.getAccessToken().getExpiration(),
            tokenType: 'Bearer'
          });
        },
        onFailure: (err) => {
          reject(this.handleCognitoError(err));
        },
        newPasswordRequired: (userAttributes) => {
          reject({
            code: 'NEW_PASSWORD_REQUIRED',
            message: 'New password required',
            userAttributes
          });
        }
      });
    });
  }

  /**
   * Refresh token
   */
  async refreshToken(email, refreshToken) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      });

      cognitoUser.refreshSession(
        {
          getToken: () => refreshToken
        },
        (err, session) => {
          if (err) {
            reject(this.handleCognitoError(err));
          } else {
            resolve({
              accessToken: session.accessToken.jwtToken,
              idToken: session.idToken.jwtToken,
              expiresIn: session.accessToken.payload.exp
            });
          }
        }
      );
    });
  }

  /**
   * Esqueci a senha
   */
  async forgotPassword(email) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      });

      cognitoUser.forgotPassword({
        onSuccess: (data) => {
          resolve(data);
        },
        onFailure: (err) => {
          reject(this.handleCognitoError(err));
        }
      });
    });
  }

  /**
   * Confirmar nova senha
   */
  async confirmPassword(email, code, newPassword) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve({ success: true });
        },
        onFailure: (err) => {
          reject(this.handleCognitoError(err));
        }
      });
    });
  }

  /**
   * Alterar senha (requer autenticação)
   */
  async changePassword(accessToken, previousPassword, proposedPassword) {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();

      if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
          if (err) {
            reject(this.handleCognitoError(err));
            return;
          }

          cognitoUser.changePassword(
            previousPassword,
            proposedPassword,
            (err, result) => {
              if (err) {
                reject(this.handleCognitoError(err));
              } else {
                resolve(result);
              }
            }
          );
        });
      } else {
        reject(new Error('User not authenticated'));
      }
    });
  }

  /**
   * Buscar informações do usuário
   */
  async getUserInfo(accessToken) {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();

      if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
          if (err) {
            reject(this.handleCognitoError(err));
            return;
          }

          cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
              reject(this.handleCognitoError(err));
            } else {
              const userInfo = {};
              attributes.forEach(attr => {
                userInfo[attr.Name] = attr.Value;
              });
              resolve(userInfo);
            }
          });
        });
      } else {
        reject(new Error('User not authenticated'));
      }
    });
  }

  /**
   * Buscar usuário pelo ID (Admin)
   */
  async adminGetUser(username) {
    const params = {
      UserPoolId: this.userPoolId,
      Username: username
    };

    try {
      const result = await this.cognitoISP.adminGetUser(params).promise();
      return this.formatUserAttributes(result);
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Listar usuários (Admin)
   */
  async listUsers(limit = 10, paginationToken = null) {
    const params = {
      UserPoolId: this.userPoolId,
      Limit: limit
    };

    if (paginationToken) {
      params.PaginationToken = paginationToken;
    }

    try {
      const result = await this.cognitoISP.listUsers(params).promise();
      return {
        users: result.Users.map(user => this.formatUserAttributes(user)),
        paginationToken: result.PaginationToken
      };
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Atualizar atributos do usuário (Admin)
   */
  async adminUpdateUserAttributes(username, attributes) {
    const userAttributes = Object.keys(attributes).map(key => ({
      Name: key.startsWith('custom:') ? key : `custom:${key}`,
      Value: attributes[key]
    }));

    const params = {
      UserPoolId: this.userPoolId,
      Username: username,
      UserAttributes: userAttributes
    };

    try {
      await this.cognitoISP.adminUpdateUserAttributes(params).promise();
      return { success: true };
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Formatar atributos do usuário
   */
  formatUserAttributes(userData) {
    const attributes = {};
    
    if (userData.UserAttributes) {
      userData.UserAttributes.forEach(attr => {
        attributes[attr.Name] = attr.Value;
      });
    }

    return {
      username: userData.Username,
      enabled: userData.Enabled,
      userStatus: userData.UserStatus,
      userCreateDate: userData.UserCreateDate,
      userLastModifiedDate: userData.UserLastModifiedDate,
      ...attributes
    };
  }

  /**
   * Tratamento de erros do Cognito
   */
  handleCognitoError(error) {
    console.error('Cognito Error:', error);
    
    const cognitoErrors = {
      'UserNotFoundException': 'Usuário não encontrado',
      'NotAuthorizedException': 'Credenciais inválidas',
      'UserNotConfirmedException': 'Usuário não confirmado',
      'UsernameExistsException': 'Usuário já existe',
      'InvalidParameterException': 'Parâmetros inválidos',
      'CodeMismatchException': 'Código de verificação inválido',
      'ExpiredCodeException': 'Código expirado',
      'LimitExceededException': 'Limite de tentativas excedido'
    };

    return {
      code: error.code || 'CognitoError',
      message: cognitoErrors[error.code] || error.message,
      originalError: error
    };
  }
}

module.exports = new CognitoService();