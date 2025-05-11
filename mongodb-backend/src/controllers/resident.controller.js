const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const Resident = require('../models/resident.model');

/**
 * Resident Controller
 * Handles resident-related operations
 */
class ResidentController {
  /**
   * Create a new resident
   */
  static async createResident(req, res) {
    try {
      const residentData = req.body;
      
      // Add profile image path if uploaded
      if (req.file) {
        residentData.profileImage = req.file.filename;
      }

      const resident = new Resident(residentData);
      await resident.save();

      res.status(201).json({
        success: true,
        message: 'Resident created successfully',
        data: resident
      });
    } catch (error) {
      console.error('Error creating resident:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating resident'
      });
    }
  }

  /**
   * Get all residents
   */
  static async getAllResidents(req, res) {
    try {
      const residents = await Resident.find().sort({ createdAt: -1 });
      res.json({
        success: true,
        data: residents
      });
    } catch (error) {
      console.error('Error fetching residents:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching residents'
      });
    }
  }

  /**
   * Get resident by ID
   */
  static async getResidentById(req, res) {
    try {
      const resident = await Resident.findById(req.params.id);
      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found'
        });
      }

      res.json({
        success: true,
        data: resident
      });
    } catch (error) {
      console.error('Error fetching resident:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching resident'
      });
    }
  }

  /**
   * Update resident
   */
  static async updateResident(req, res) {
    try {
      const residentData = req.body;
      const oldResident = await Resident.findById(req.params.id);

      if (!oldResident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found'
        });
      }

      // Handle profile image update
      if (req.file) {
        // Delete old profile image if it exists
        if (oldResident.profileImage) {
          const oldImagePath = path.join(__dirname, '../../uploads/profiles', oldResident.profileImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        residentData.profileImage = req.file.filename;
      }

      const resident = await Resident.findByIdAndUpdate(
        req.params.id,
        residentData,
        { new: true }
      );

      res.json({
        success: true,
        message: 'Resident updated successfully',
        data: resident
      });
    } catch (error) {
      console.error('Error updating resident:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating resident'
      });
    }
  }

  /**
   * Delete resident
   */
  static async deleteResident(req, res) {
    try {
      const resident = await Resident.findById(req.params.id);

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found'
        });
      }

      // Delete profile image if it exists
      if (resident.profileImage) {
        const imagePath = path.join(__dirname, '../../uploads/profiles', resident.profileImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await resident.deleteOne();

      res.json({
        success: true,
        message: 'Resident deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting resident:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting resident'
      });
    }
  }

  /**
   * Get resident statistics
   */
  static async getResidentStats(req, res) {
    try {
      const totalResidents = await Resident.countDocuments();
      
      // Gender statistics
      const maleCount = await Resident.countDocuments({ gender: 'Male' });
      const femaleCount = await Resident.countDocuments({ gender: 'Female' });
      
      // Voter statistics
      const registeredVoters = await Resident.countDocuments({ votersStatus: 'Registered' });
      const nonRegisteredVoters = await Resident.countDocuments({ votersStatus: 'Not-Registered' });

      // Purok statistics
      const purokStats = await Resident.aggregate([
        { $group: { _id: '$purok', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        success: true,
        data: {
          total: totalResidents,
          gender: {
            male: maleCount,
            female: femaleCount
          },
          voters: {
            registered: registeredVoters,
            notRegistered: nonRegisteredVoters
          },
          purok: purokStats
        }
      });
    } catch (error) {
      console.error('Error getting resident statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting resident statistics'
      });
    }
  }

  /**
   * Import residents from CSV
   */
  static async importCSV(req, res) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;

    try {
      // Read CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => {
            // Clean and transform the data
            const cleanedData = {
              firstName: data['First Name'] || data.firstName || '',
              middleName: data['Middle Name'] || data.middleName || '',
              lastName: data['Last Name'] || data.lastName || '',
              alias: data['Alias'] || data.alias || '',
              birthplace: data['Birthplace'] || data.birthplace || '',
              birthdate: data['Birthdate'] || data.birthdate || '',
              age: parseInt(data['Age'] || data.age || '0'),
              civilStatus: data['Civil Status'] || data.civilStatus || '',
              gender: data['Gender'] || data.gender || '',
              purok: data['Purok'] || data.purok || '',
              votersStatus: data['Voters Status'] || data.votersStatus || '',
              identifiedAs: data['Identified As'] || data.identifiedAs || '',
              email: data['Email'] || data.email || '',
              contactNumber: data['Contact Number'] || data.contactNumber || '',
              occupation: data['Occupation'] || data.occupation || '',
              citizenship: data['Citizenship'] || data.citizenship || 'Filipino',
              householdNo: data['Household No'] || data.householdNo || '',
              address: data['Address'] || data.address || '',
              precinctNo: data['Precinct No'] || data.precinctNo || ''
            };

            // Convert date string to Date object if present
            if (cleanedData.birthdate) {
              try {
                cleanedData.birthdate = new Date(cleanedData.birthdate);
                if (isNaN(cleanedData.birthdate.getTime())) {
                  throw new Error('Invalid date format');
                }
              } catch (error) {
                console.error('Error parsing date:', error);
                cleanedData.birthdate = null;
              }
            }

            results.push(cleanedData);
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Remove temporary file
      fs.unlinkSync(req.file.path);

      // Validate and insert records
      for (const record of results) {
        try {
          // Basic validation
          if (!record.firstName || !record.lastName) {
            throw new Error('First name and last name are required');
          }

          // Validate gender
          if (!['Male', 'Female', 'Other'].includes(record.gender)) {
            throw new Error('Invalid gender value. Must be Male, Female, or Other');
          }

          // Validate civil status
          if (!['Single', 'Married', 'Widowed', 'Divorced'].includes(record.civilStatus)) {
            throw new Error('Invalid civil status. Must be Single, Married, Widowed, or Divorced');
          }

          // Validate voters status
          if (!['Registered', 'Not-Registered'].includes(record.votersStatus)) {
            throw new Error('Invalid voters status. Must be Registered or Not-Registered');
          }

          const resident = new Resident(record);
          await resident.save();
          processedCount++;
        } catch (error) {
          console.error('Error saving resident:', error);
          errors.push({
            data: record,
            error: error.message
          });
        }
      }

      // Send response with detailed results
      res.json({
        success: true,
        message: `CSV import completed. ${processedCount} records imported successfully, ${errors.length} failed.`,
        totalProcessed: results.length,
        successCount: processedCount,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error importing CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Error importing CSV file: ' + error.message
      });
    }
  }

  /**
   * Export residents to CSV
   */
  static async exportCSV(req, res) {
    try {
      const residents = await Resident.find();

      if (residents.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No residents found to export'
        });
      }

      // Define CSV header
      const csvWriter = createCsvWriter({
        path: 'residents_export.csv',
        header: [
          { id: 'firstName', title: 'First Name' },
          { id: 'middleName', title: 'Middle Name' },
          { id: 'lastName', title: 'Last Name' },
          { id: 'alias', title: 'Alias' },
          { id: 'birthplace', title: 'Birthplace' },
          { id: 'birthdate', title: 'Birthdate' },
          { id: 'age', title: 'Age' },
          { id: 'civilStatus', title: 'Civil Status' },
          { id: 'gender', title: 'Gender' },
          { id: 'purok', title: 'Purok' },
          { id: 'votersStatus', title: 'Voters Status' },
          { id: 'identifiedAs', title: 'Identified As' },
          { id: 'email', title: 'Email' },
          { id: 'contactNumber', title: 'Contact Number' },
          { id: 'occupation', title: 'Occupation' },
          { id: 'citizenship', title: 'Citizenship' },
          { id: 'householdNo', title: 'Household No' },
          { id: 'address', title: 'Address' },
          { id: 'precinctNo', title: 'Precinct No' }
        ]
      });

      // Format dates and prepare data
      const records = residents.map(resident => ({
        ...resident.toObject(),
        birthdate: resident.birthdate ? new Date(resident.birthdate).toISOString().split('T')[0] : ''
      }));

      // Write to CSV file
      await csvWriter.writeRecords(records);

      // Send file to client
      res.download('residents_export.csv', 'residents_export.csv', (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }
        // Delete file after sending
        fs.unlinkSync('residents_export.csv');
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting residents to CSV'
      });
    }
  }

  /**
   * Get resident's profile image
   */
  static async getProfileImage(req, res) {
    try {
      const resident = await Resident.findById(req.params.id);
      
      if (!resident || !resident.profileImage) {
        return res.status(404).json({
          success: false,
          message: 'Profile image not found'
        });
      }

      const imagePath = path.join(__dirname, '../../uploads/profiles', resident.profileImage);
      
      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({
          success: false,
          message: 'Profile image file not found'
        });
      }

      res.sendFile(imagePath);
    } catch (error) {
      console.error('Error fetching profile image:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching profile image'
      });
    }
  }
}

module.exports = ResidentController; 