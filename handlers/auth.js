// handlers/auth.js

const CognitoService = require('../auth/cognito-service');
const { successResponse, errorResponse } = require('../utils/response-helper');
const { validateSignUp, validateLogin } = require('../utils/validator');

/**
 * Health check
 */
const health = async () => {
  return successResponse({
    status: 'healthy',
    service: 'cognito-auth-api',
    timestamp: new Date().toISOString()
  });
};

/**
 * Registrar novo usuário
 */
const signup = async (event) => {
  try {
    const body = JSON.parse(event.body);
    
    // Validação
    const { error, value } = validateSignUp(body);
    if (error) {
      return errorResponse('Dados inválidos', 400, error.details);
    }

    const { email, password, name } = value;
    
    const result = await CognitoService.signUp(email, password, { name });
    
    return successResponse({
      message: 'Usuário registrado com sucesso. Verifique seu email para confirmar a conta.',
      userConfirmed: result.userConfirmed,
      codeDeliveryDetails: result.codeDeliveryDetails
    }, 201);

  } catch (error) {
    console.error('Signup error:', error);
    return errorResponse(error.message, 400);
  }
};

/**
 * Confirmar registro
 */
const confirmSignup = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, code } = body;

    if (!email || !code) {
      return errorResponse('Email e código são obrigatórios', 400);
    }

    await CognitoService.confirmSignUp(email, code);
    
    return successResponse({
      message: 'Email confirmado com sucesso. Você já pode fazer login.'
    });

  } catch (error) {
    console.error('Confirm signup error:', error);
    return errorResponse(error.message, 400);
  }
};

/**
 * Login
 */
const login = async (event) => {
  try {
    const body = JSON.parse(event.body);
    
    // Validação
    const { error, value } = validateLogin(body);
    if (error) {
      return errorResponse('Dados inválidos', 400, error.details);
    }

    const { email, password } = value;
    
    const tokens = await CognitoService.login(email, password);
    
    return successResponse({
      message: 'Login realizado com sucesso',
      ...tokens
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.code === 'UserNotConfirmedException') {
      return errorResponse('Usuário não confirmado. Verifique seu email.', 400);
    }
    
    return errorResponse('Credenciais inválidas', 401);
  }
};

/**
 * Refresh token
 */
const refreshToken = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, refreshToken } = body;

    if (!email || !refreshToken) {
      return errorResponse('Email e refresh token são obrigatórios', 400);
    }

    const tokens = await CognitoService.refreshToken(email, refreshToken);
    
    return successResponse({
      message: 'Token atualizado com sucesso',
      ...tokens
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(error.message, 400);
  }
};

/**
 * Esqueci a senha
 */
const forgotPassword = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email } = body;

    if (!email) {
      return errorResponse('Email é obrigatório', 400);
    }

    await CognitoService.forgotPassword(email);
    
    return successResponse({
      message: 'Código de recuperação enviado para seu email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(error.message, 400);
  }
};

/**
 * Confirmar nova senha
 */
const confirmPassword = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return errorResponse('Email, código e nova senha são obrigatórios', 400);
    }

    await CognitoService.confirmPassword(email, code, newPassword);
    
    return successResponse({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Confirm password error:', error);
    return errorResponse(error.message, 400);
  }
};

module.exports = {
  health,
  signup,
  confirmSignup,
  login,
  refreshToken,
  forgotPassword,
  confirmPassword
};