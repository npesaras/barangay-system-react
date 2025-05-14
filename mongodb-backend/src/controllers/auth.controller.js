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

  /**
   * Get current user info (except password)
   */
  static async getMe(req, res) {
    try {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update current user info (username, email, phone, profile image)
   */
  static async updateMe(req, res) {
    try {
      console.log('[updateMe] req.body:', req.body);
      console.log('[updateMe] req.file:', req.file);
      const updates = {};
      if (req.body.username) updates.username = req.body.username;
      if (req.body.email) updates.email = req.body.email;
      if (req.body.phoneNumber) updates.phoneNumber = req.body.phoneNumber;
      if (req.file) updates.profileImage = req.file.filename;
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, user });
    } catch (error) {
      if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
        return res.status(400).json({ success: false, message: 'Username already in use' });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Change current user password
   */
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Old and new password are required' });
      }
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Old password is incorrect' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AuthController; 