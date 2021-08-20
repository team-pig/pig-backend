const app = require('../server')
const supertest = require('supertest');
// const request = require('supertest')
const request = supertest(app);
const clearData = require('./clearData')
const undefinedData = require('./undefinedData')

let refresh = ""
let access = ""
let createdRoomId = ""

describe('test', () => {
  it('test', async () => {
    const res = await request.post('/tttt').send( 'hi' );
    expect(res.statusCode).toEqual(200);
  });
});

describe('유저 등록 성공', () => {
  it('register success', async () => {
    const response = await request.post('/register').send({
      email: clearData.email,
      nickname: clearData.nickname,
      password: clearData.password,
      confirmPassword: clearData.confirmPassword
    })
    expect(response.body.message).toBe('회원가입 성공')
    expect(response.statusCode).toBe(201); 
  })
})

describe('유저 등록 실패', () => {
  it('Register failed 이미 존재하는 email', async () => {
    const response = await request.post('/register').send({
      email: clearData.registerEmail,
      nickname: clearData.nickname,
      password: clearData.password,
      confirmPassword: clearData.confirmPassword
    })
    expect(response.statusCode).toBe(400); 
  })

  it('Register failed 이미 존재하는 nickname', async () => {
    const response = await request.post('/register').send({
      email: clearData.email,
      nickname: clearData.registerNickname,
      password: clearData.password,
      confirmPassword: clearData.confirmPassword
    })
    expect(response.statusCode).toBe(400); 
  })
})

describe('로그인 성공', () => {
  it('login success', async () => {
    const response = await request.post('/login').send({
      email: clearData.registerEmail,
      password: clearData.registerPassword,
    })
    refresh = response.body.refreshToken;
    access = response.body.accessToken;
    expect(response.statusCode).toBe(200);
    expect(response.body.refreshToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
  })
})

describe('로그인 실패', () => {
  it('login failed 존재하지 않는 email, password', async () => {
    const response = await request.post('/login').send({
      email: undefinedData.email,
      password: undefinedData.password,
    })
    expect(response.statusCode).toBe(401);
  })
  it('login failed: password 불일치', async () => {
    const response = await request.post('/login').send({
      email: clearData.registerEmail,
      password: 'tttqwe',
    })
    expect(response.statusCode).toBe(401);
  })
})

describe('방 만들기 성공', () => {
  it('create room success', async () => {
    const res = await request.post('/room').auth(access, {type: 'bearer'}).send({
    roomName: clearData.room.roomName,
    roomImage: clearData.room.roomImage,
    subtitle: clearData.room.subtitle,
    tag: clearData.room.tag,
    desc: clearData.room.desc })
    createdRoomId = res.body.room.roomId
    expect(res.statusCode).toBe(200)
    expect(res.body.room.roomName).toBe(clearData.room.roomName)
  })
})

describe('방 삭제 성공', () => {
  it('delete room success', async () => {
    const res = await request.delete('/room').auth(access, {type: 'bearer'}).send({
    roomId: createdRoomId })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('방 삭제 성공')
  })
})

describe('회원 탈퇴하기', () => {
  it('delete userInfo success', async () => {
    const res = await request.delete('/userInfo').send({
      email: clearData.email
    });
    expect(res.body.message).toBe('회원탈퇴 성공');
    expect(res.statusCode).toBe(200);
  })

  it('delete userInfo false', async () => {
    const res = await request.delete('/userInfo').send({
      email: undefinedData.email
    });
    expect(res.statusCode).toBe(400);
  })
})