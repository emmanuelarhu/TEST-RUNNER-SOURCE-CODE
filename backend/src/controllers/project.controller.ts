import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';
import { CreateProjectDTO } from '../models/types';

export class ProjectController {
  /**
   * Get all projects
   */
  async getAllProjects(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT p.*,
                COUNT(DISTINCT ts.id) as suite_count,
                COUNT(DISTINCT tc.id) as test_count,
                u.username as created_by_username
         FROM projects p
         LEFT JOIN test_suites ts ON p.id = ts.project_id
         LEFT JOIN test_cases tc ON ts.id = tc.suite_id
         LEFT JOIN users u ON p.created_by = u.id
         GROUP BY p.id, u.username
         ORDER BY p.created_at DESC`
      );

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      logger.error('Error fetching projects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
        error: error.message
      });
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const projectResult = await pool.query(
        `SELECT p.*, u.username as created_by_username
         FROM projects p
         LEFT JOIN users u ON p.created_by = u.id
         WHERE p.id = $1`,
        [id]
      );

      if (projectResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      // Get test suites for this project
      const suitesResult = await pool.query(
        `SELECT ts.*, COUNT(tc.id) as test_count
         FROM test_suites ts
         LEFT JOIN test_cases tc ON ts.id = tc.suite_id
         WHERE ts.project_id = $1
         GROUP BY ts.id
         ORDER BY ts.created_at DESC`,
        [id]
      );

      res.json({
        success: true,
        data: {
          ...projectResult.rows[0],
          test_suites: suitesResult.rows
        }
      });
    } catch (error: any) {
      logger.error('Error fetching project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project',
        error: error.message
      });
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if project exists
      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1',
        [id]
      );

      if (projectCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      // Get comprehensive statistics
      const statsQuery = `
        WITH project_suites AS (
          SELECT id FROM test_suites WHERE project_id = $1
        ),
        project_cases AS (
          SELECT tc.id, tc.suite_id
          FROM test_cases tc
          INNER JOIN project_suites ps ON tc.suite_id = ps.id
        ),
        project_executions AS (
          SELECT te.*
          FROM test_executions te
          INNER JOIN project_cases pc ON te.test_case_id = pc.id
        )
        SELECT
          (SELECT COUNT(*) FROM project_suites) as total_suites,
          (SELECT COUNT(*) FROM project_cases) as total_cases,
          (SELECT COUNT(*) FROM project_executions) as total_executions,
          (SELECT COUNT(*) FROM project_executions WHERE status = 'passed') as passed_executions,
          (SELECT COUNT(*) FROM project_executions WHERE status = 'failed') as failed_executions,
          (SELECT COUNT(*) FROM project_executions WHERE status = 'running') as running_executions,
          (SELECT AVG(duration) FROM project_executions WHERE status IN ('passed', 'failed')) as avg_duration
      `;

      const statsResult = await pool.query(statsQuery, [id]);

      const stats = statsResult.rows[0];
      const passRate = stats.total_executions > 0
        ? ((parseInt(stats.passed_executions) / parseInt(stats.total_executions)) * 100).toFixed(2)
        : '0.00';

      res.json({
        success: true,
        data: {
          total_suites: parseInt(stats.total_suites),
          total_cases: parseInt(stats.total_cases),
          total_executions: parseInt(stats.total_executions),
          passed_executions: parseInt(stats.passed_executions),
          failed_executions: parseInt(stats.failed_executions),
          running_executions: parseInt(stats.running_executions),
          pass_rate: parseFloat(passRate),
          avg_duration: stats.avg_duration ? parseFloat(stats.avg_duration) : 0
        }
      });
    } catch (error: any) {
      logger.error('Error fetching project stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project statistics',
        error: error.message
      });
    }
  }

  /**
   * Create a new project
   */
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, base_url }: CreateProjectDTO = req.body;
      const userId = (req as any).user?.id;

      const result = await pool.query(
        `INSERT INTO projects (name, description, base_url, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, description, base_url, userId]
      );

      logger.info(`Project created: ${name}`);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project',
        error: error.message
      });
    }
  }

  /**
   * Update a project
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, base_url, status } = req.body;

      const result = await pool.query(
        `UPDATE projects
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             base_url = COALESCE($3, base_url),
             status = COALESCE($4, status)
         WHERE id = $5
         RETURNING *`,
        [name, description, base_url, status, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      logger.info(`Project updated: ${id}`);

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      logger.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project',
        error: error.message
      });
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM projects WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      logger.info(`Project deleted: ${id}`);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        error: error.message
      });
    }
  }
}

export default new ProjectController();
