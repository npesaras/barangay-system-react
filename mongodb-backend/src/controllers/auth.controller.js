const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Authentication Controller
 * Handles user authentication and registration logic
 */
class AuthController {
  /**
   * Register admin user
   */
  static async registerAdmin(req, res) {
    try {
      const { username, password, adminCode } = req.body;

      // Verify admin registration code
      if (adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
        return res.status(403).json({
          success: false,
          message: 'Invalid admin registration code'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new admin user
      const user = new User({
        username,
        password: hashedPassword,
        role: 'admin'
      });

      await user.save();

      // Generate token for immediate login
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error in registerAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating admin user'
      });
    }
  }

  /**
   * Register regular user
   */
  static async registerUser(req, res) {
    try {
      const { username, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new regular user
      const user = new User({
        username,
        password: hashedPassword,
        role: 'user'
      });

      await user.save();

      // Generate token for immediate login
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error in registerUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user'
      });
    }
  }

  /**
   * User login
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({
        success: false,
        message: 'Error during login'
      });
    }
  }

  /**
   * Verify token
   */
  static async verify(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }

  /**
   * Get all users (debug endpoint)
   */
  async getUsers(req, res) {
    try {
      const users = await User.find({}, { password: 0 });
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Error checking users' });
    }
  }

  /**
   * Logout user
   */
  static async logout(req, res) {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

module.exports = AuthController; 