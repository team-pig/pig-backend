const jwt = require('jsonwebtoken');
const User = require('../schemas/users')
const dotenv = require('dotenv');
dotenv.config();

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = authorization.split(' ');

    if (tokenType !== 'Bearer') {
        res.status(401).send({
            errorMessage: '로그인 후 사용하세요',
        });
        return;
    }

    try {
        const { userId } = jwt.verify(tokenValue, process.env.JWT_SECRET_KEY);
        User.findById(userId).exec().then((user) => {
            res.locals.user = user;
            next();
        });
    } catch (error) {
        res.status(401).send({
            errorMessage: '로그인 후 사용하세요',
        });
        return;
    }
}