// tests/auth.test.js

const { signup, login, health } = require('../handlers/auth');

describe('Auth Handlers', () => {
  test('health check should return healthy status', async () => {
    const result = await health();
    const body = JSON.parse(result.body);
    
    expect(result.statusCode).toBe(200);
    expect(body.status).toBe('healthy');
  });

  test('signup should validate required fields', async () => {
    const event = {
      body: JSON.stringify({
        email: 'invalid-email',
        password: '123'
      })
    };
    
    const result = await signup(event);
    const body = JSON.parse(result.body);
    
    expect(result.statusCode).toBe(400);
    expect(body.error).toBe(true);
  });

  // Mais testes...
});