import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import logger from '../config/logger';
import { CreateUserDTO, UpdateUserDTO, LoginDTO } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 10;

export class UserController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, full_name, role = 'user' }: CreateUserDTO = req.body;

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Username or email already exists'
        });
        return;
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, full_name, role, is_active, created_at, updated_at`,
        [username, email, password_hash, full_name, role]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET as jwt.Secret,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
      );

      logger.info(`User registered: ${username}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token
        }
      });
    } catch (error: any) {
      logger.error('Error registering user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: error.message
      });
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password }: LoginDTO = req.body;

      // Find user
      const result = await pool.query(
        `SELECT id, username, email, password_hash, full_name, role, is_active, created_at, updated_at
         FROM users
         WHERE username = $1`,
        [username]
      );

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
        return;
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        res.status(403).json({
          success: false,
          message: 'User account is inactive'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET as jwt.Secret,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
      );

      // Remove password_hash from response
      const { password_hash, ...userWithoutPassword } = user;

      logger.info(`User logged in: ${username}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error: any) {
      logger.error('Error logging in:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login',
        error: error.message
      });
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT id, username, email, full_name, role, is_active, created_at, updated_at
         FROM users
         ORDER BY created_at DESC`
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      logger.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT id, username, email, full_name, role, is_active, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const result = await pool.query(
        `SELECT id, username, email, full_name, role, is_active, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error fetching current user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: error.message
      });
    }
  }

  /**
   * Update current user's own profile (non-admin)
   */
  async updateCurrentUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { username, email, full_name } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      // Check if username or email already exists for another user
      if (username || email) {
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
          [username || '', email || '', userId]
        );

        if (existingUser.rows.length > 0) {
          res.status(409).json({
            success: false,
            message: 'Username or email already exists'
          });
          return;
        }
      }

      const result = await pool.query(
        `UPDATE users
         SET username = COALESCE($1, username),
             email = COALESCE($2, email),
             full_name = COALESCE($3, full_name)
         WHERE id = $4
         RETURNING id, username, email, full_name, role, is_active, created_at, updated_at`,
        [username, email, full_name, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      logger.info(`User profile updated: ${userId}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error updating user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { username, email, full_name, role, is_active }: UpdateUserDTO = req.body;

      // Check if username or email already exists for another user
      if (username || email) {
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
          [username || '', email || '', id]
        );

        if (existingUser.rows.length > 0) {
          res.status(409).json({
            success: false,
            message: 'Username or email already exists'
          });
          return;
        }
      }

      const result = await pool.query(
        `UPDATE users
         SET username = COALESCE($1, username),
             email = COALESCE($2, email),
             full_name = COALESCE($3, full_name),
             role = COALESCE($4, role),
             is_active = COALESCE($5, is_active)
         WHERE id = $6
         RETURNING id, username, email, full_name, role, is_active, created_at, updated_at`,
        [username, email, full_name, role, is_active, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      logger.info(`User updated: ${id}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id, username',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      logger.info(`User deleted: ${id}`);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Get user with password hash
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const user = result.rows[0];

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Hash new password
      const new_password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [new_password_hash, id]
      );

      logger.info(`Password changed for user: ${id}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      logger.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  }
}

export default new UserController();
