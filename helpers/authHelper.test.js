// Code guided by ChatGPT
// Xiao Ao, A0273305L
import { hashPassword, comparePassword } from './authHelper';
import bcrypt from 'bcrypt';

// Arrange: Mock the entire bcrypt module
jest.mock('bcrypt');

describe('Auth Helper Unit Tests', () => {
  
  describe('hashPassword', () => {
    test('should return a hashed password when successful', async () => {
      // Arrange
      const plainPassword = 'password123';
      const mockHashedPassword = 'hashed_result';
      bcrypt.hash.mockResolvedValue(mockHashedPassword);

      // Act
      const result = await hashPassword(plainPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
      expect(result).toBe(mockHashedPassword);
    });

    test('should log error if bcrypt.hash fails', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      bcrypt.hash.mockRejectedValue(new Error('Hash error'));

      // Act
      await hashPassword('password123');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('comparePassword', () => {
    test('should return true if passwords match', async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await comparePassword('password123', 'hashed_result');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_result');
      expect(result).toBe(true);
    });
  });
});