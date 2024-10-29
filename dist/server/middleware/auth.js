import jwt from 'jsonwebtoken';
import { constants } from '@config/constants';
export class AuthError extends Error {
    status;
    constructor(message, status = 401) {
        super(message);
        this.status = status;
        this.name = 'AuthError';
    }
}
export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new AuthError('Authentication required');
        }
        try {
            const decoded = jwt.verify(token, constants.JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (jwtError) {
            throw new AuthError('Invalid or expired token');
        }
    }
    catch (error) {
        if (error instanceof AuthError) {
            res.status(error.status).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};
