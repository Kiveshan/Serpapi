const { addDhetAccreditationToPublications } = require('../../service/publications/dhet.service');

// Check DHET accreditation for publications
const checkDhetAccreditationController = async (req, res) => {
  try {
    const { publications } = req.query;
    
    if (!publications) {
      return res.status(400).json({ error: 'Publications data is required' });
    }

    let parsedPublications;
    try {
      parsedPublications = JSON.parse(publications);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid publications data format' });
    }

    if (!Array.isArray(parsedPublications)) {
      return res.status(400).json({ error: 'Publications must be an array' });
    }

    // Add DHET accreditation info to publications
    const publicationsWithAccreditation = await addDhetAccreditationToPublications(parsedPublications);

    // Return just the accreditation status for each publication
    const accreditationResults = publicationsWithAccreditation.map(pub => ({
      title: pub.title,
      accredited: pub.dhetAccredited
    }));

    res.json(accreditationResults);

  } catch (error) {
    console.error('Error checking DHET accreditation:', error);
    res.status(500).json({ 
      error: 'Failed to check DHET accreditation',
      message: error.message 
    });
  }
};

module.exports = {
  checkDhetAccreditationController
};
