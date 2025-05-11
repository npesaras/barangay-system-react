const Student = require('../models/Student');
const fs = require('fs');
const path = require('path');

/**
 * Student Controller
 * Handles student-related operations
 */
class StudentController {
  /**
   * Create new student
   */
  async createStudent(req, res) {
    try {
      const studentData = req.body;
      
      // Check if student ID already exists
      const existingStudent = await Student.findOne({ studentId: studentData.studentId });
      if (existingStudent) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }

      if (req.file) {
        studentData.profileImage = req.file.path.replace(/\\/g, '/');
      }

      const student = new Student(studentData);
      await student.save();

      res.status(201).json({
        message: 'Student added successfully',
        student
      });
    } catch (error) {
      console.error('Error adding student:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Error adding student' });
    }
  }

  /**
   * Get all students
   */
  async getAllStudents(req, res) {
    try {
      const students = await Student.find();
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Error fetching students' });
    }
  }

  /**
   * Get student by ID
   */
  async getStudentById(req, res) {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ message: 'Error fetching student' });
    }
  }

  /**
   * Update student
   */
  async updateStudent(req, res) {
    try {
      const studentData = req.body;

      // Check if updating student ID and if it already exists
      if (studentData.studentId) {
        const existingStudent = await Student.findOne({ 
          studentId: studentData.studentId,
          _id: { $ne: req.params.id }
        });
        if (existingStudent) {
          return res.status(400).json({ message: 'Student ID already exists' });
        }
      }

      if (req.file) {
        // Delete old image if exists
        const oldStudent = await Student.findById(req.params.id);
        if (oldStudent?.profileImage) {
          try {
            fs.unlinkSync(oldStudent.profileImage);
          } catch (err) {
            console.error('Error deleting old image:', err);
          }
        }
        studentData.profileImage = req.file.path.replace(/\\/g, '/');
      }

      const student = await Student.findByIdAndUpdate(
        req.params.id,
        studentData,
        { new: true, runValidators: true }
      );

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json({
        message: 'Student updated successfully',
        student
      });
    } catch (error) {
      console.error('Error updating student:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Error updating student' });
    }
  }

  /**
   * Delete student
   */
  async deleteStudent(req, res) {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Delete profile image if exists
      if (student.profileImage) {
        try {
          fs.unlinkSync(student.profileImage);
        } catch (err) {
          console.error('Error deleting profile image:', err);
        }
      }

      await student.remove();
      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ message: 'Error deleting student' });
    }
  }

  /**
   * Get student statistics
   */
  async getStudentStats(req, res) {
    try {
      const stats = {
        totalStudents: await Student.countDocuments(),
        gradeStats: {},
        genderStats: {}
      };

      // Get grade level statistics
      const gradeAgg = await Student.aggregate([
        {
          $group: {
            _id: '$gradeLevel',
            count: { $sum: 1 }
          }
        }
      ]);

      gradeAgg.forEach(item => {
        if (item._id) {
          stats.gradeStats[item._id] = item.count;
        }
      });

      // Get gender statistics
      const genderAgg = await Student.aggregate([
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 }
          }
        }
      ]);

      genderAgg.forEach(item => {
        if (item._id) {
          stats.genderStats[item._id] = item.count;
        }
      });

      res.json(stats);
    } catch (error) {
      console.error('Error fetching student stats:', error);
      res.status(500).json({ message: 'Error fetching student stats' });
    }
  }

  /**
   * Export students to CSV
   */
  async exportStudentsCSV(req, res) {
    try {
      const students = await Student.find();
      
      const fields = [
        'Student ID',
        'First Name',
        'Middle Name',
        'Last Name',
        'Grade Level',
        'Section',
        'Gender',
        'Birthdate',
        'Age',
        'Address',
        'Parent/Guardian Name',
        'Contact Number'
      ];
      
      const csvRows = [
        fields.join(','),
        ...students.map(student => [
          student.studentId,
          student.firstName,
          student.middleName,
          student.lastName,
          student.gradeLevel,
          student.section,
          student.gender,
          student.birthdate,
          student.age,
          student.address,
          student.guardianName,
          student.contactNumber
        ].map(field => `"${field || ''}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
      res.send(csvRows);
    } catch (error) {
      console.error('Error exporting students:', error);
      res.status(500).json({ message: 'Error exporting students' });
    }
  }

  /**
   * Get student profile image
   */
  getProfileImage(req, res) {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../../uploads/profiles', filename);
    
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  }
}

module.exports = new StudentController(); 