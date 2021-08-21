const app = require('../server')
const supertest = require('supertest');
// const request = require('supertest')
const request = supertest(app);
const clearData = require('./clearData')
const undefinedData = require('./undefinedData')

let refresh = ''
let access = ''
let createdRoomId = ''

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
    expect(response.statusCode).toBe(201) 
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
      email: clearData.email,
      password: clearData.password,
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

describe('방 전체 목록 불러오기 pagination 성공', () => {
  it('GET roomList success', async () => {
    const res = await request.get('/rooms/?page=1&size=12').auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(200)
    expect(res.body.totalPages).toBeGreaterThan(0)
  })
})

describe('즐겨찾기 된 방 불러오기 성공', () => {
  it('GET markedList success', async () => {
    const res = await request.
    get('/rooms/markedlist')
    .auth(access, { type: 'bearer' }).send({})
    expect(res.statusCode).toBe(200)
    expect(res.body.markedList).toBeTruthy()
  })
})

describe('즐겨찾기 안된 방 불러오기 성공', () => {
  it('GET unMarkedList success', async () => {
    const res = await request.
    get('/rooms/unmarkedlist')
    .auth(access, { type: 'bearer' }).send({})
    expect(res.statusCode).toBe(200)
    expect(res.body.unMarkedList).toBeTruthy()
  })
})

describe('방 검색하기 성공', () => {
  it('GET room search success', async () => {
    const res = await request.get(`/rooms/search?roomName=hangle 1`).auth(access, {type: 'bearer'})
    expect(res.statusCode).toBe(200)
    expect(res.body.room).toBeTruthy()
  })
})

describe('방 메인페이지 불러오기 성공', () => { 
  it('GET mainPage success', async () => {
    const res = await request.get(`/room/${createdRoomId}/main`).auth(access, {type: 'bearer'})
    expect(res.statusCode).toBe(200)
    expect(res.body.result.roomId).toBe(createdRoomId)
    expect(res.body.result.createdAt).toBeTruthy()
  })
})

describe('방 유저 현황 불러오기 성공', () => { 
  it('GET memberStatus, projectStatus success', async () => {
    const res = await request.get(`/room/${createdRoomId}/main/status`).auth(access, {type: 'bearer'})
    expect(res.statusCode).toBe(200)
    expect(res.body.projectStatus).toBeTruthy()
    expect(res.body.memberStatus).toBeTruthy()
  })
})

describe('방의 멤버 정보 불러오기 성공', () => { 
  it('Get information about users in a room', async () => {
    const res = await request.get(`/room/${createdRoomId}/members`).auth(access, {type: 'bearer'})
    expect(res.statusCode).toBe(200)
    expect(res.body.allMembers[0]).toBeTruthy()
  })
})

describe('방 프로필 수정하기 성공', () => {
  it('Patch room myprofile success', async () => {
    const res = await request.patch(`/room/${createdRoomId}/myprofile`).auth(access, { type: 'bearer' }).send({
      desc: clearData.myprofile.desc,
      tags: clearData.myprofile.tags,
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBeTruthy()
  })
})

describe('방 즐겨찾기 성공', () => {
  it('Post bookmark room success', async () => {
    const res = await request.post(`/room/${createdRoomId}/bookmark`).auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBeTruthy()
    expect(res.body.markedList[0].roomId).toBeTruthy()
    expect(res.body.bookmarkedRoom.roomId).toBe(createdRoomId)
  })
})

describe('방 즐겨찾기 취소', () => {
  it('Delete bookmark room success', async () => {
    const res = await request.delete(`/room/${createdRoomId}/bookmark`).auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe("즐겨찾기가 취소되었습니다.")
    expect(res.body.markedList).toBeTruthy()
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