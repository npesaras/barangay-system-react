const BarangayInfo = require('../models/barangayInfo.model');
const path = require('path');
const fs = require('fs');

// Helper: get the singleton document
async function getSingleton() {
  let info = await BarangayInfo.findOne();
  if (!info) {
    info = await BarangayInfo.create({
      barangay: 'Barangay Records',
      municipality: 'Dumaguete',
      province: 'Negros Oriental',
      phoneNumber: '0930624702',
      emailAddress: 'barangayrecords@gmail.com',
      logo: ''
    });
  }
  return info;
}

module.exports = {
  // GET /api/barangay-info
  async getInfo(req, res) {
    try {
      const info = await getSingleton();
      res.json({ success: true, data: info });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // PUT /api/barangay-info (with optional logo upload)
  async updateInfo(req, res) {
    try {
      let info = await getSingleton();
      const { barangay, municipality, province, phoneNumber, emailAddress } = req.body;
      let logo = info.logo;
      if (req.file) {
        // Remove old logo if exists
        if (logo && fs.existsSync(path.join(__dirname, '../../uploads/profiles', logo))) {
          fs.unlinkSync(path.join(__dirname, '../../uploads/profiles', logo));
        }
        logo = req.file.filename;
        // Log the uploaded file
        console.log('Barangay logo uploaded:', logo);
        // Check if file exists after upload
        const uploadedPath = path.join(__dirname, '../../uploads/profiles', logo);
        if (!fs.existsSync(uploadedPath)) {
          return res.status(500).json({ success: false, message: 'Logo upload failed. File not found after upload.' });
        }
      }
      info.barangay = barangay;
      info.municipality = municipality;
      info.province = province;
      info.phoneNumber = phoneNumber;
      info.emailAddress = emailAddress;
      info.logo = logo;
      await info.save();
      res.json({ success: true, data: info });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/barangay-info/logo
  async getLogo(req, res) {
    try {
      const info = await getSingleton();
      if (!info.logo) return res.status(404).json({ success: false, message: 'No barangay logo set. Please upload a logo.' });
      const logoPath = path.join(__dirname, '../../uploads/profiles', info.logo);
      if (!fs.existsSync(logoPath)) return res.status(404).json({ success: false, message: 'Barangay logo file not found on server.' });
      res.sendFile(logoPath);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}; 