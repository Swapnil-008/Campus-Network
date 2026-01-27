import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {

    const token = req.header('x-auth-token');
    console.log('Token received:', token);

    if(!token) {
        return res.status(401).json({message: 'No token, authorization denied'});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Contains userId and role
        next();
    } catch(err) {
        console.log('Token verification error:', err.message);
        return res.status(401).json({message: 'Token is not valid'});
    }
};

export default auth;