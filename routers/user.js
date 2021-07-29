const express = require('express');
const User = require('../schemas/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth-middleware')
const dotenv = require('dotenv');
dotenv.config();
const Joi = require('joi');
const router = express.Router();


function createJwtToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_SEC });
}

const registerValidator = Joi.object({
    email: Joi.string().email().required(),
    nickname: Joi.string().min(3).max(20).required(),
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9]).{5,30}$')) //5자 ~ 30자, 영어와 숫자만 허용
        .required(), 
    confirmPassword: Joi.ref('password')
}).with('password','confirmPassword')


router.post('/register', async (req, res, next) => {
    try {
        const { email, nickname, password, confirmPassword } = await registerValidator.validateAsync(req.body);
        // password가 일치한지 확인해야한다.
        if (password !== confirmPassword) {
            res.status(400).send({
                errorMessage: "패스워드가 일치하지 않습니다.",
            });
            return;
        }

        // email or nickname이 동일한게 이미 있는지 확인하기 위해 가져온다.
        const existsUsers = await User.findOne({
            $or: [{ email }, { nickname }],
        });
        if (existsUsers) {
            res.status(400).send({
                errorMessage: "이메일 또는 닉네임이 이미 사용중입니다.",
            });
            return;
        }
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(password, salt);

        const userId = await User.create({
            email,
            nickname,
            password: hashed,
        });
        const token = createJwtToken(userId)
        res.status(201).json({ token, email });

    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = await registerValidator.validateAsync(req.body);
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: '이메일 또는 패스워드가 틀렸습니다.' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '이메일 또는 패스워드가 틀렸습니다.' });
        }
        const token = createJwtToken(user.id);
        res.status(200).json({ token, email });
    } catch (err) {
        next(err);
    }
});

router.get('/token', authMiddleware, async (req, res, next) => {
    try {
        res.send({
            'ok': true,
            user: res.locals.user
        })
    } catch (err) {
        next(err)
    }
});

module.exports = router;


