import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResidentsRecord } from '../../components/ResidentsRecord';
import { residentService } from '../../services/residentService';
import { showToast } from '../../utils/toast';

// Mock the services and utilities
jest.mock('../../services/residentService');
jest.mock('../../utils/toast');

describe('ResidentsRecord Component - CSV Import', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage for user role
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'userRole') return 'admin';
      if (key === 'token') return 'fake-token';
      return null;
    });
  });

  it('should show import button for admin users', () => {
    render(<ResidentsRecord />);
    const importButton = screen.getByLabelText(/Import CSV/i);
    expect(importButton).toBeInTheDocument();
  });

  it('should not show import button for non-admin users', () => {
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'userRole') return 'user';
      return null;
    });
    
    render(<ResidentsRecord />);
    const importButton = screen.queryByLabelText(/Import CSV/i);
    expect(importButton).not.toBeInTheDocument();
  });

  it('should handle successful CSV import', async () => {
    // Mock successful import
    residentService.importCSV.mockResolvedValueOnce({
      success: true,
      message: 'CSV import completed. 2 records imported successfully.',
      successCount: 2,
      errorCount: 0
    });

    render(<ResidentsRecord />);

    // Create a file input event
    const file = new File(
      ['First Name,Last Name,Gender,Civil Status,Voters Status\nJohn,Doe,Male,Single,Registered'],
      'residents.csv',
      { type: 'text/csv' }
    );

    const input = screen.getByLabelText(/Import CSV/i);
    await userEvent.upload(input, file);

    // Verify import was called
    expect(residentService.importCSV).toHaveBeenCalledWith(file);

    // Verify success message was shown
    await waitFor(() => {
      expect(showToast.success).toHaveBeenCalledWith(
        expect.stringContaining('2 records imported successfully')
      );
    });
  });

  it('should handle CSV import with validation errors', async () => {
    // Mock import with validation errors
    residentService.importCSV.mockResolvedValueOnce({
      success: true,
      message: 'CSV import completed. 0 records imported successfully, 1 failed.',
      successCount: 0,
      errorCount: 1,
      errors: [{
        data: { firstName: 'John', lastName: 'Doe' },
        error: 'Invalid gender value'
      }]
    });

    render(<ResidentsRecord />);

    const file = new File(
      ['First Name,Last Name,Gender,Civil Status,Voters Status\nJohn,Doe,Invalid,Single,Registered'],
      'residents.csv',
      { type: 'text/csv' }
    );

    const input = screen.getByLabelText(/Import CSV/i);
    await userEvent.upload(input, file);

    // Verify error message was shown
    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalledWith(
        expect.stringContaining('0 records imported successfully, 1 failed')
      );
    });
  });

  it('should handle network errors during import', async () => {
    // Mock network error
    residentService.importCSV.mockRejectedValueOnce(new Error('Network error'));

    render(<ResidentsRecord />);

    const file = new File(
      ['First Name,Last Name,Gender,Civil Status,Voters Status\nJohn,Doe,Male,Single,Registered'],
      'residents.csv',
      { type: 'text/csv' }
    );

    const input = screen.getByLabelText(/Import CSV/i);
    await userEvent.upload(input, file);

    // Verify error message was shown
    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalledWith(
        expect.stringContaining('Error importing CSV file')
      );
    });
  });

  it('should handle invalid file type', async () => {
    render(<ResidentsRecord />);

    const file = new File(
      ['not a csv file'],
      'residents.txt',
      { type: 'text/plain' }
    );

    const input = screen.getByLabelText(/Import CSV/i);
    await userEvent.upload(input, file);

    // Verify error message was shown
    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid file type')
      );
    });
  });

  it('should refresh resident list after successful import', async () => {
    // Mock successful import
    residentService.importCSV.mockResolvedValueOnce({
      success: true,
      message: 'CSV import completed. 2 records imported successfully.',
      successCount: 2,
      errorCount: 0
    });

    // Mock getAllResidents
    residentService.getAllResidents.mockResolvedValueOnce({
      success: true,
      data: [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Doe' }
      ]
    });

    render(<ResidentsRecord />);

    const file = new File(
      ['First Name,Last Name,Gender,Civil Status,Voters Status\nJohn,Doe,Male,Single,Registered'],
      'residents.csv',
      { type: 'text/csv' }
    );

    const input = screen.getByLabelText(/Import CSV/i);
    await userEvent.upload(input, file);

    // Verify residents list was refreshed
    await waitFor(() => {
      expect(residentService.getAllResidents).toHaveBeenCalled();
    });
  });
}); 