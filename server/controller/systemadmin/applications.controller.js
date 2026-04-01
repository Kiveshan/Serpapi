const {
  getAllApplications,
  getPendingApplicationsCount,
  getApplicationsByStatus,
  updateApplicationStatus,
  getApplicationById
} = require('../../model/systemadmin/applications.model');
const { getSignedDownloadUrl } = require('../../config/s3.config');

// Get all applications with pending count
const getAllApplicationsController = async (req, res) => {
  try {
    const [applications, pendingCount] = await Promise.all([
      getAllApplications(),
      getPendingApplicationsCount()
    ]);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pendingCount
      }
    });
  } catch (error) {
    console.error('Error in getAllApplicationsController:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
};

// Get pending applications only
const getPendingApplicationsController = async (req, res) => {
  try {
    const applications = await getApplicationsByStatus('pending');
    const pendingCount = applications.length;

    res.status(200).json({
      success: true,
      data: {
        applications,
        pendingCount
      }
    });
  } catch (error) {
    console.error('Error in getPendingApplicationsController:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending applications'
    });
  }
};

// Get application details by ID
const getApplicationByIdController = async (req, res) => {
  try {
    const { userid } = req.params;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const application = await getApplicationById(userid);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Error in getApplicationByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application details'
    });
  }
};

// Update application status
const updateApplicationStatusController = async (req, res) => {
  try {
    const { userid } = req.params;
    const { status, enabled } = req.body;

    if (!userid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, approved, or rejected'
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Enabled field must be a boolean'
      });
    }

    const updatedApplication = await updateApplicationStatus(userid, status, enabled);

    res.status(200).json({
      success: true,
      data: {
        application: updatedApplication,
        message: `Application status updated to ${status}`
      }
    });
  } catch (error) {
    console.error('Error in updateApplicationStatusController:', error);
    
    if (error.message === 'Application not found') {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update application status'
    });
  }
};

// Get applications by status
const getApplicationsByStatusController = async (req, res) => {
  try {
    const { status } = req.params;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, approved, or rejected'
      });
    }

    const applications = await getApplicationsByStatus(status);

    res.status(200).json({
      success: true,
      data: {
        applications,
        status
      }
    });
  } catch (error) {
    console.error('Error in getApplicationsByStatusController:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications by status'
    });
  }
};

// Get signed URL for document download
const getDocumentUrlController = async (req, res) => {
  try {
    const { userid } = req.params;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get user details to find certificate link
    const application = await getApplicationById(userid);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (!application.certificatelink) {
      return res.status(404).json({
        success: false,
        error: 'No certificate document found for this user'
      });
    }

    // Extract S3 key from the certificate link
    const url = new URL(application.certificatelink);
    const s3Key = url.pathname.substring(1); // Remove leading slash

    // Generate signed URL with 1 hour expiration
    const signedUrl = await getSignedDownloadUrl(s3Key, 3600);

    res.status(200).json({
      success: true,
      data: {
        signedUrl,
        fileName: application.certificatelink.split('/').pop() || 'document'
      }
    });
  } catch (error) {
    console.error('Error in getDocumentUrlController:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate document URL'
    });
  }
};

module.exports = {
  getAllApplicationsController,
  getPendingApplicationsController,
  getApplicationByIdController,
  updateApplicationStatusController,
  getApplicationsByStatusController,
  getDocumentUrlController
};