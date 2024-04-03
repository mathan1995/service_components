const fs = require('fs');
const { down, up } = require('Handler/migration');

// Get list of migration files in alphabetically order
const migrationFiles = fs
  .readdirSync('src/database/migrations/')
  .filter((file) => file.endsWith('.js'));

describe('Handler/migration', () => {
  describe('up()', () => {
    test('should return success', async () => {
      const result = await up();
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.length).toBe(migrationFiles.length);
      expect(body.map(({ name }) => name)).toEqual(expect.arrayContaining(migrationFiles));
    });
  });

  describe('down()', () => {
    test('should return success', async () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const file of migrationFiles.reverse()) {
        // eslint-disable-next-line no-await-in-loop
        const result = await down();
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.length).toBe(1);
        expect(body.map(({ name }) => name)).toEqual(expect.arrayContaining([file]));
      }
    });
  });
});
