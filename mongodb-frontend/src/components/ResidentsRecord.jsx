/**
 * ResidentsRecord Component
 * 
 * This component manages the display and interaction with resident records.
 * It renders a DataTable with residents' information and provides functionality
 * for adding, viewing, editing, and deleting residents.
 * 
 * Features:
 * - Display residents in a paginated, searchable table
 * - View detailed resident information
 * - Add new residents (admin only)
 * - Edit existing residents (admin only)
 * - Delete residents (admin only)
 * - Export residents data to CSV
 * - Role-based access control for data modification
 */
import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import AddResidentModal from './AddResidentModal';
import EditResidentModal from './EditResidentModal';
import { residentService } from '../services/residentService';
import { showToast } from '../utils/toast';
import { getImageUrl } from '../utils/imageUtils';
import { FaPlus, FaFileExport, FaFileImport, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import './ResidentsRecord.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = 'http://localhost:5000';

export const ResidentsRecord = () => {
  // State management for residents data and UI
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal visibility states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Currently selected resident for view/edit operations
  const [selectedResident, setSelectedResident] = useState(null);
  
  // DataTable configuration
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track image loading errors
  const [imageError, setImageError] = useState(false);
  
  // User role for permission control
  const [userRole, setUserRole] = useState('user');

  // Add state for import results
  const [showImportResults, setShowImportResults] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Fetch residents data on component mount and check user role
  useEffect(() => {
    fetchResidents();
    
    // Get user role from localStorage
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  /**
   * Checks if the current user has admin privileges
   * @returns {boolean} True if user is an admin
   */
  const isAdmin = () => {
    return userRole === 'admin';
  };

  /**
   * Fetches all residents from the API
   * Handles loading state and errors
   */
  const fetchResidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await residentService.getAllResidents();
      
      // Log the response for debugging
      console.log('Raw response from getAllResidents:', response);
      
      // Handle the response data structure
      let residentsData = [];
      if (response && response.success) {
        residentsData = response.data || [];
      } else if (Array.isArray(response)) {
        residentsData = response;
      }
      
      // Ensure we have an array
      if (!Array.isArray(residentsData)) {
        console.error('Invalid residents data format:', residentsData);
        throw new Error('Invalid data format received from server');
      }
      
      console.log('Processed residents data:', residentsData);
      setResidents(residentsData);
    } catch (error) {
      console.error('Error fetching residents:', error);
      setError(error.message || 'Failed to fetch residents');
      showToast.error(error.message || 'Failed to fetch residents');
      setResidents([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the view modal for a resident
   * @param {Object} resident - The resident to view
   */
  const handleView = (resident) => {
    setSelectedResident(resident);
    setImageError(false);
    setShowViewModal(true);
  };

  /**
   * Opens the edit modal for a resident
   * @param {Object} resident - The resident to edit
   */
  const handleEdit = (resident) => {
    // Check if user has admin privileges
    if (!isAdmin()) {
      showToast.error('You do not have permission to edit residents');
      return;
    }
    
    setSelectedResident(resident);
    setShowEditModal(true);
  };

  /**
   * Updates a resident with the provided form data
   * @param {string} id - The ID of the resident to update
   * @param {Object} formData - The updated resident data
   */
  const handleUpdateResident = async (id, formData) => {
    // Double check permissions before updating
    if (!isAdmin()) {
      showToast.error('You do not have permission to update residents');
      return;
    }
    
    try {
      // Show a loading toast with longer timeout for image uploads
      showToast.info('Updating resident...', { autoClose: 10000 });
      
      await residentService.updateResident(id, formData);
      showToast.success('Resident updated successfully');
      setShowEditModal(false);
      
      // Reset the selected resident to avoid stale data
      setSelectedResident(null);
      
      // Fetch fresh data
      fetchResidents();
    } catch (error) {
      console.error('Error updating resident:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to update resident';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. The image may be too large.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast.error(errorMessage);
    }
  };

  /**
   * Deletes a resident after confirmation
   * @param {Object} resident - The resident to delete
   */
  const handleDelete = async (resident) => {
    // Check if user has admin privileges
    if (!isAdmin()) {
      showToast.error('You do not have permission to delete residents');
      return;
    }
    
    // Confirm deletion with the user
    if (!window.confirm('Are you sure you want to delete this resident?')) {
      return;
    }
    
    try {
      await residentService.deleteResident(resident._id);
      showToast.success('Resident deleted successfully');
      fetchResidents();
    } catch (error) {
      console.error('Error deleting resident:', error);
      showToast.error('Failed to delete resident');
    }
  };

  /**
   * Adds a new resident with the provided form data
   * @param {Object} formData - The new resident data
   */
  const handleAddResident = async (formData) => {
    // Check if user has admin privileges
    if (!isAdmin()) {
      showToast.error('You do not have permission to add residents');
      return;
    }
    
    try {
      await residentService.createResident(formData);
      showToast.success('Resident added successfully');
      setShowAddModal(false);
      fetchResidents();
    } catch (error) {
      console.error('Error adding resident:', error);
      showToast.error('Failed to add resident');
    }
  };

  /**
   * Handles CSV file import
   * @param {Event} event - The file input change event
   */
  const handleImportCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      showToast.info('Importing residents...', { autoClose: false });
      const result = await residentService.importCSV(file);
      showToast.success(result.message);
      
      // Refresh the residents list
      fetchResidents();
    } catch (error) {
      console.error('Import error:', error);
      showToast.error(error.response?.data?.message || 'Error importing CSV file');
    } finally {
      // Reset the file input
      event.target.value = '';
    }
  };

  /**
   * Handles CSV export
   */
  const handleExportCSV = async () => {
    try {
      showToast.info('Preparing export...', { autoClose: false });
      await residentService.exportCSV();
      showToast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      showToast.error('Error exporting residents to CSV');
    }
  };

  /**
   * Handles PDF export
   */
  const handlePrintPDF = () => {
    const doc = new jsPDF();
    doc.text('Residents Record', 14, 16);
    const tableColumn = [
      'Fullname',
      'Citizenship',
      'Age',
      'Civil Status',
      'Gender',
      'Voter Status',
    ];
    const tableRows = filteredResidents.map(resident => [
      `${resident.firstName || ''} ${resident.middleName ? resident.middleName + ' ' : ''}${resident.lastName || ''}`,
      resident.citizenship || 'N/A',
      resident.age || 'N/A',
      resident.civilStatus || 'N/A',
      resident.gender || 'N/A',
      resident.votersStatus || 'N/A',
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 153, 225] },
    });
    doc.save('residents_record.pdf');
  };

  // Define columns for the DataTable
  const columns = [
    {
      header: 'Fullname',
      accessor: (resident) => `${resident.firstName || ''} ${resident.middleName ? resident.middleName + ' ' : ''}${resident.lastName || ''}`,
    },
    {
      header: 'Citizenship',
      accessor: (resident) => resident.citizenship || 'N/A',
    },
    {
      header: 'Age',
      accessor: (resident) => resident.age || 'N/A',
    },
    {
      header: 'Civil Status',
      accessor: (resident) => resident.civilStatus || 'N/A',
    },
    {
      header: 'Gender',
      accessor: (resident) => resident.gender || 'N/A',
    },
    {
      header: 'Voter Status',
      accessor: (resident) => resident.votersStatus || 'N/A',
    }
  ];

  /**
   * Filter residents based on search term
   * Searches in name, citizenship, purok, and voter status fields
   */
  const filteredResidents = Array.isArray(residents) ? residents.filter(resident => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${resident?.firstName || ''} ${resident?.middleName || ''} ${resident?.lastName || ''}`.toLowerCase();
    
    return fullName.includes(searchLower) ||
           (resident?.citizenship && resident.citizenship.toLowerCase().includes(searchLower)) ||
           (resident?.purok && resident.purok.toLowerCase().includes(searchLower)) ||
           (resident?.votersStatus && resident.votersStatus.toLowerCase().includes(searchLower));
  }) : [];

  // Add error display
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Residents</h2>
        <p>{error}</p>
        <button onClick={fetchResidents} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  // Add loading display
  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading Residents...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  // Render the component UI
  return (
    <div className="residents-record">
      <h2>Residents Record</h2>
      
      {/* Action buttons for adding residents and exporting data */}
      <div className="actions-bar">
        {/* Only show Add Resident button for admin users */}
        {isAdmin() && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <FaPlus /> Add Resident
          </button>
        )}
        {/* Print PDF button */}
        <button 
          className="btn btn-secondary"
          onClick={handlePrintPDF}
          disabled={loading || residents.length === 0}
        >
          <FaFileExport /> Print PDF
        </button>
        {/* CSV Import/Export buttons */}
        <label className="btn btn-secondary">
          <FaFileImport /> Import CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            style={{ display: 'none' }}
          />
        </label>
        <button 
          className="btn btn-secondary"
          onClick={handleExportCSV}
          disabled={loading || residents.length === 0}
        >
          <FaFileExport /> Export CSV
        </button>
      </div>

      {residents.length === 0 && !error ? (
        <div className="no-data-message">
          No residents found. {isAdmin() ? 'Add a new resident to get started.' : 'No resident records available.'}
        </div>
      ) : (
        <DataTable
          data={filteredResidents}
          columns={columns}
          onView={handleView}
          onEdit={isAdmin() ? handleEdit : null} // Only provide edit handler for admins
          onDelete={isAdmin() ? handleDelete : null} // Only provide delete handler for admins
          loading={loading}
          entriesPerPage={entriesPerPage}
          setEntriesPerPage={setEntriesPerPage}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}

      {/* View resident modal */}
      {showViewModal && selectedResident && (
        <div className="modal">
          <div className="modal-content">
            <h2>Resident Details</h2>
            <div className="view-details">
              <div className={`profile-image-container ${imageError ? 'error' : ''}`}>
                {selectedResident.profileImage ? (
                  <img 
                    src={getImageUrl(selectedResident.profileImage)} 
                    alt={`${selectedResident.firstName}'s profile`}
                    onError={(e) => {
                      console.error('Image load error:', e);
                      console.log('Attempted image URL:', e.target.src);
                      setImageError(true);
                    }}
                    style={{ display: imageError ? 'none' : 'block' }}
                  />
                ) : (
                  <div className="profile-image-fallback">
                    {selectedResident.firstName?.[0]?.toUpperCase() || 'N/A'}
                  </div>
                )}
                {imageError && selectedResident.profileImage && (
                  <div className="profile-image-fallback">
                    {selectedResident.firstName?.[0]?.toUpperCase() || 'N/A'}
                  </div>
                )}
              </div>
              {/* Resident details section */}
              <div className="detail-row">
                <label>First Name:</label>
                <span>{selectedResident.firstName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Middle Name:</label>
                <span>{selectedResident.middleName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Last Name:</label>
                <span>{selectedResident.lastName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Alias:</label>
                <span>{selectedResident.alias || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Birthplace:</label>
                <span>{selectedResident.birthplace || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Birthdate:</label>
                <span>{selectedResident.birthdate || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Age:</label>
                <span>{selectedResident.age || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Civil Status:</label>
                <span>{selectedResident.civilStatus || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Gender:</label>
                <span>{selectedResident.gender || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Purok:</label>
                <span>{selectedResident.purok || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Voters Status:</label>
                <span>{selectedResident.votersStatus || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Identified As:</label>
                <span>{selectedResident.identifiedAs || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{selectedResident.email || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Contact Number:</label>
                <span>{selectedResident.contactNumber || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Occupation:</label>
                <span>{selectedResident.occupation || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Citizenship:</label>
                <span>{selectedResident.citizenship || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Address:</label>
                <span>{selectedResident.address || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Household No.:</label>
                <span>{selectedResident.householdNo || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Precinct No.:</label>
                <span>{selectedResident.precinctNo || 'N/A'}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add resident modal - only shown if user is admin */}
      {isAdmin() && (
        <AddResidentModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddResident}
        />
      )}

      {/* Edit resident modal - only shown if user is admin */}
      {isAdmin() && (
        <EditResidentModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateResident}
          resident={selectedResident}
        />
      )}
    </div>
  );
}; 