// Code guided by ChatGPT
// Xiao Ao, A0273305L
import { requireSignIn, isAdmin } from './authMiddleware.js';
import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';

jest.mock('jsonwebtoken');
jest.mock('../models/userModel.js');

describe('Auth Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: { authorization: 'test-token' }, user: { _id: '123' } };
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('requireSignIn calls next() if token is valid', async () => {
    // Arrange
    JWT.verify.mockReturnValue({ _id: '123' });

    // Act
    await requireSignIn(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
  });

  test('isAdmin calls next() if user is admin (role 1)', async () => {
    // Arrange
    userModel.findById.mockResolvedValue({ _id: '123', role: 1 });

    // Act
    await isAdmin(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
  });

  test('isAdmin returns 401 if user is not admin (role 0)', async () => {
    // Arrange
    userModel.findById.mockResolvedValue({ _id: '123', role: 0 });

    // Act
    await isAdmin(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('requireSignIn should log error when JWT.verify throws', async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    JWT.verify.mockImplementation(() => {
        throw new Error("Invalid Token");
    });

    // Act
    await requireSignIn(req, res, next);

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('isAdmin should send 401 on database error', async () => {
    // Arrange
    userModel.findById.mockRejectedValue(new Error("DB Error"));

    // Act
    await isAdmin(req, res, next);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "Error in admin middleware"
    }));
  });
});