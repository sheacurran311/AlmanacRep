import { ARService } from '../../services/arService.js';
export const getARExperience = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }
        const arService = new ARService();
        const experience = await arService.getARExperience({
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        });
        res.json(experience);
    }
    catch (error) {
        console.error('Error fetching AR experience:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const createARAnchor = async (req, res) => {
    try {
        const { location, assetType, assetUrl, metadata } = req.body;
        if (!location || !assetType || !assetUrl) {
            return res.status(400).json({ message: 'Location, asset type, and asset URL are required' });
        }
        const arService = new ARService();
        const anchorId = await arService.createARAnchor({
            id: '',
            location,
            assetType,
            assetUrl,
            metadata
        });
        res.status(201).json({ anchorId });
    }
    catch (error) {
        console.error('Error creating AR anchor:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
