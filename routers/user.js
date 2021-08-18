const express = require('express');
const User = require('../schemas/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth-middleware')
const dotenv = require('dotenv');
dotenv.config();
const Joi = require('joi');
const router = express.Router();
const {v4} = require('uuid')
const Auth = require('../schemas/auth')
// const nodemailer = require('nodemailer');
const transport = require('../services/mail.transport')

// let refreshTokens = []

//인증코드 발급
router.post('/forget', async (req, res) => {
  try {
    const { email } = req.body
    const findEmail = await User.findOne({ email: email }, { email: true })
    const userId = findEmail._id
    console.log(findEmail)
    if (findEmail.email != email) {
        return res.status(400).json({ message: 'email 정보가 존재하지 않아요.' })
    }
    if (findEmail.email == email) {
      const token = v4()
      const data = {
        // 데이터 정리
        token,
        userId: userId,
        createdAt: Date.now(),
      }
      Auth.create(data)

      transport
        .sendMail({
          from: `협업돼지 <awrde26@gmail.com>`,
          to: email,
          subject: '[협업돼지] 인증번호가 도착했습니다.',
          text: '123456',
          html: `
          <div style="text-align: center;">
            <h3 style="color: #FA5882">ABC</h3>
            <br />
            <p>비밀번호 초기화를 위해 URL을 클릭하세요! http://localhost:3000/password/${token}</p>
          </div>
        `,
        })
        .then((send) => res.json(send))
        .catch((err) => next(err))
    }
  } catch (error) {
    res.status(500).json({ message: '인증코드 발급에 실패했습니다. 관리자에게 문의하세요.' })
  }
})

router.post('/password/:token', async (req, res) => {
  // 입력받은 token 값이 Auth 테이블에 존재하며 아직 유효한지 확인
  try {
    const token = req.params.token
    const password = req.body.password
    const findAuth = await Auth.findOne({ token: token })
    // 인증코드는 5분의 유효기간(300000ms)
    if (Date.now() - findAuth.createdAt > 300000) {
      return res.status(400).json({ message: '인증코드가 만료되었습니다. ' })
    }
    const userId = findAuth.userId
    const salt = await bcrypt.genSalt()
    const hashed = await bcrypt.hash(password, salt)
    const findUser = await User.findOneAndUpdate({ _id: userId }, { $set: { password: hashed } })
    console.log(findUser)
    res.status(201).json({
      ok: true,
      message: '비밀번호 재설정 성공',
      email: findUser.email,
      nickname: findUser.nickname,
    })
  } catch (error) {
    res.status(400).json({ message: '잘못된 token값 또는 유저 정보를 찾을 수 없어요.' })
  }
})

function createJwtToken(id) {
    return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

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
        const accessToken = createJwtToken(userId)
        res.status(201).json({
            ok:true, 
            message: '회원가입 성공',
            accessToken: accessToken, 
            email: email,
        });

    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    console.log(process.env.ACCESS_TOKEN_SECRET)
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: '이메일 또는 패스워드가 틀렸습니다.' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '이메일 또는 패스워드가 틀렸습니다.' });
        }
        const accessToken = createJwtToken(user.id);

        const refreshToken = jwt.sign({ id: user.id } , process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
        // refreshTokens.push(refreshToken);

        res.status(200).json({
            ok: true, 
            message:'로그인 성공',
            accessToken: accessToken, refreshToken: refreshToken, 
            email: email,
        });
    } catch (err) {
        res.status(400).send({
            ok: false, 
            message: '서버 실패: 로그인 실패',
        })
        next(err);
    }
});

router.get('/token', authMiddleware, async (req, res, next) => {
    try {
        res.send({
            ok: true,
            message:'토큰 인증 성공',
            user: res.locals.user
        })
    } catch (err) {
        res.status(400).send({
            ok: false, 
            message: '토큰 인증 실패'
        })
        next(err)
    }
});


router.post('/token', (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        console.log('리프레시 토큰이 없습니다.')
        console.log(req.body)
        return res.status(403).json({ message: 'User not authenticated, 리프레시 토큰이 없습니다.'})
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if(!err) {
            const accessToken = createJwtToken(user.id);
            return res.status(201).json({ accessToken: accessToken });
        } else {
            console.log('리프레시 토큰 검증이 안됩니다.')
            return res.status(403).json({ message: 'User not authenticated, 리프레시 토큰 검증 안됩니다.'})
        }

    })
});

module.exports = router;

