import jwt from 'jsonwebtoken';
import { constants } from '../../config/constants.js';
import { AuthError } from '../../middleware/auth.js';
export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new AuthError('Authentication required');
        }
        const decoded = jwt.verify(token, constants.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof AuthError) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(401).json({ message: 'Invalid token' });
        }
    }
};
