const express = require('express');
const User = require('../schemas/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth-middleware');
const dotenv = require('dotenv');
dotenv.config();
const Joi = require('joi');
const {v4} = require('uuid');
const Auth = require('../schemas/auth');
const transport = require('../services/mail.transport');
const router = express.Router();

let refreshTokens = []


//인증코드 발급
router.post('/resetPassword/sendEmail', async (req, res, next) => {
  try {
    const { email } = req.body
    const findEmail = await User.findOne({ email: email }, { email: true })
    const userId = findEmail._id
    if (findEmail.email != email) {
        return res.status(400).json({ errorMessage: '협업돼지에 등록되지 않은 이메일입니다.' })
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
          from: `협업돼지 <${process.env.MAIL_ID}>`,
          to: email,
          subject: '[협업돼지] 인증번호가 도착했습니다.',
          text: '123456',
          html: `
          <div style="text-align: center;">
            <h3 style="color: #FA5882">협업돼지</h3>
            <br />
            <div>비밀번호 초기화를 위해
            <A href="http://13.125.222.70/resetPassword/${token}"> 여기를 클릭하세요! </A>
            </div>
          </div>
        `,
        })
        .then((send) => res.json(send))
        .catch((err) => next(err))
    }
  } catch (error) {
    console.log ({ errorMessage: '인증코드 발급에 실패했습니다.' })
    res.status(500).json({ errorMessage: '인증코드 발급에 실패했습니다. 관리자에게 문의하세요.' })
  }
})

router.get('/resetPassword/:token', async (req, res) => {
  res.json({ message: '정상적으로 이동하였습니다.' })
})

router.post('/resetPassword/:token', async (req, res) => {
  // 입력받은 token 값이 Auth 테이블에 존재하며 아직 유효한지 확인
  try {
    const token = req.params.token
    const {password, confirmPassword} = req.body
    const findAuth = await Auth.findOne({ token: token })
    // 인증코드는 5분의 유효기간(300000ms) (개발 시 풀어놓기)
    // if (Date.now() - findAuth.createdAt > 300000) {
    //   return res.status(400).json({ message: '인증코드가 만료되었습니다. ' })
    // }
    if(password != confirmPassword) {
        res.status(400).json({ errorMessage: '패스워드가 일치하지 않습니다.'})
    }
    const userId = findAuth.userId
    const salt = await bcrypt.genSalt()
    const hashed = await bcrypt.hash(password, salt)
    const findUser = await User.findOneAndUpdate({ _id: userId }, { $set: { password: hashed } })
    console.log(findUser)
    res.status(201).json({
      message: '비밀번호 재설정 성공',
      email: findUser.email,
      nickname: findUser.nickname,
    })
  } catch (error) {
    res.status(400).json({ errorMessage: '잘못된 token값 또는 유저 정보를 찾을 수 없어요.' })
  }
})

// function createJwtToken(id, color, avatar) {
//     return jwt.sign({ id, color, avatar}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

// }


const registerValidator = Joi.object({
    email: Joi.string().email().required(),
    nickname: Joi.string().min(3).max(20).required(),
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9]).{5,30}$')) //5자 ~ 30자, 영어와 숫자만 허용
        .required(), 
    confirmPassword: Joi.ref('password'),
    color: Joi.string().allow(''),
    avatar: Joi.string().allow('')
}).with('password','confirmPassword')


router.post('/register', async (req, res, next) => {
    try {
        const { email, nickname, password, confirmPassword, color, avatar } = await registerValidator.validateAsync(req.body);
        // password가 일치한지 확인해야한다.
        if (password !== confirmPassword) {
            res.status(400).send({
                errorMessage: "패스워드가 일치하지 않습니다.",
            });
            return;
        }
        
        // 닉네임 3글자 미만은 회원가입 불가.
        const nickName = await User.findOne({ nickname })
        if (nickName != null && nickName.length < 3 ) {
            res.status(400).send({
                errorMessage: '닉네임에 적합하지 않습니다.'
            });
            return;
        }

        // email and nickname이 동일한게 이미 있는지 확인하기 위해 가져온다.
        const existsEmail = await User.findOne({ email })
        const existsNickname = await User.findOne({ nickname })
        if (existsEmail) {
            res.status(400).send({
                errorMessage: "이메일이 이미 사용중입니다.",
            });
            return;
        }
        if (existsNickname) {
            res.status(400).send({
                errorMessage: "닉네임이 이미 사용중입니다."
            });
            return;
        }
        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(password, salt);

        const user = await User.create({
            email,
            nickname,
            password: hashed,
            color,
            avatar
        });
        res.status(201).json({
            ok:true, 
            message: '회원가입 성공',
            email: user.email,
            color: user.color,
            avatar: user.avatar
        });

    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ errorMessage: '이메일 또는 패스워드가 틀렸습니다.' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ errorMessage: '이메일 또는 패스워드가 틀렸습니다.' });
        }
        let accessToken = jwt.sign({ id: user.id, color: user.color, avatar: user.avatar }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        let refreshToken = jwt.sign({ id: user.id } , process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1d'})
        refreshTokens.push(refreshToken);

        res.status(200).json({
            ok: true, 
            message:'로그인 성공',
            accessToken: accessToken, refreshToken: refreshToken, 
            email: email,
        });
    } catch (error) {
        res.status(400).send({
            ok: false, 
            errorMessage: '서버 실패: 로그인 실패',
        })
        next(error);
    }
});

router.get('/token', authMiddleware, async (req, res, next) => {
    try {
        res.status(200).send({
            ok: true,
            message:'토큰 인증 성공',
            user: res.locals.user
        })
    } catch (err) {
        res.status(400).send({
            ok: false, 
            errorMessage: '토큰 인증 실패'
        })
        next(err)
    }
});


router.post('/token', (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ errorMessage: 'User not authenticated'})
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if(!err) {
            const accessToken = jwt.sign({ id: user.id, color: user.color, avatar: user.avatar }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
            return res.status(201).json({
                ok: true,
                message: 'accessToken 재발급 성공', 
                accessToken: accessToken });
        } else {
        return res.status(403).json({ errorMessage: 'User not authenticated, 리프레시 토큰 검증 안됩니다.'})
        }
    })
});
// 회원 탈퇴 시 혼자 있던 room 찾아서 하위 항목들 다 삭제예정 현재는 임시 미완성 API
router.delete('/userInfo', async (req, res) => {
  try {
    const email = req.body.email
    // await findUser.delete({})
    const remove = await User.findOneAndRemove({ email: email })
    if(!remove) {
        return res.status(400).json({ message: '이메일이 잘못되었습니다.'})
    }
    res.json({ message: '회원탈퇴 성공' })
  } catch (err) {
    res.status(500).json({ message: '회원탈퇴 실패' })
  }
})

module.exports = router;

