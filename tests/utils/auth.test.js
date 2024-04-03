const { getIdFromToken, generateAccessToken } = require('Utils/auth');
const { accessTokenNoSub, accessTokenSub1 } = require('../fixtures/access-token');
const { mockUdifyGenerateToken, nock } = require('../mocks/axios');

describe('Utils/auth', () => {
  beforeEach(() => {
    mockUdifyGenerateToken();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getIdFromToken()', () => {
    test('should return null if no token', () => {
      expect(getIdFromToken(null)).toBe(null);
    });

    test('should return null if token is invalid string', () => {
      expect(getIdFromToken('random')).toBe(null);
    });

    test('should return null if token has no sub', () => {
      expect(getIdFromToken(accessTokenNoSub)).toBe(null);
    });

    test('should return ID if token has sub', () => {
      expect(getIdFromToken(accessTokenSub1)).toBe(1);
    });

    test('should return personal access token', async () => {
      const accessToken = await generateAccessToken();
      expect(accessToken).toBe('access_token');
    });
  });
});
