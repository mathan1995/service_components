const { sampleFunction } = require('Services/sample-function');

describe('Services/sample-function', () => {
  describe('sampleFunction()', () => {
    test('should return Hello World!', () => {
      expect(sampleFunction()).toBe('Hello World!');
    });
  });
});
