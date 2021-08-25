const app = require('../server')
const supertest = require('supertest');
// const request = require('supertest')
const request = supertest(app);
const clearData = require('./clearData')
const undefinedData = require('./undefinedData')

let refresh = ''
let access = ''
let refresh2 = ''
let access2 = ''
let createdRoomId = ''
let createdRoomId2 = ''
let inviteCode = ''
let createdDocumentId = ''
let createdDocumentNickname = ''

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

  it('register2 success', async () => {
    const response = await request.post('/register').send({
      email: clearData.email2,
      nickname: clearData.nickname2,
      password: clearData.password2,
      confirmPassword: clearData.confirmPassword2
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

  it('login2 success', async () => {
    const response = await request.post('/login').send({
      email: clearData.email2,
      password: clearData.password2,
    })
    refresh2 = response.body.refreshToken;
    access2 = response.body.accessToken;
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
    inviteCode = res.body.room.inviteCode
    expect(res.statusCode).toBe(200)
    expect(res.body.room.roomName).toBe(clearData.room.roomName)
  })

  it('create room2 success', async () => {
    const res = await request.post('/room').auth(access, {type: 'bearer'}).send({
    roomName: clearData.room2.roomName,
    roomImage: clearData.room2.roomImage,
    subtitle: clearData.room2.subtitle,
    tag: clearData.room2.tag,
    desc: clearData.room2.desc })
    createdRoomId2 = res.body.room.roomId
    expect(res.statusCode).toBe(200)
    expect(res.body.room.roomName).toBe(clearData.room2.roomName)
  })
})

describe('방 불러오기(inviteCode) 성공', () => {
  it('Get room information success', async () => {
    const res = await request.get(`/rooms/room/${inviteCode}`).auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(200)
    expect(res.body.inviteCode).toBe(inviteCode)
  })
})

describe('방 불러오기(inviteCode) 실패', () => {
  it('Get room information failed: 잘못된 초대코드', async () => {
    const res = await request.get(`/rooms/room/1j23oijsdlkjfds`).auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(400)
    expect(res.body.errorMessage).toBe('방을 찾을 수 없어요! 초대코드를 확인하세요.')
  })
})

describe('Documents 모두 불러오기 성공: 방 안에 문서가 없을 때', () => {
  it('Get all documents in room success: There are no documents in the room', async() => {
    const res = await request.get(`/room/${createdRoomId}/documents`).auth(access, { type: 'bearer' })
    createdDocumentId = res.body.documentId;
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toBe('이 방에는 아직 도큐먼트가 없습니다.')
    expect(res.body.result).toEqual([])
  })
})

describe('Document 작성 성공', () => {
  it('Post document success', async() => {
    const res = await request.post(`/room/${createdRoomId}/document`).auth(access, { type: 'bearer' }).send({
      title: clearData.document.title,
      content: clearData.document.content,
    })
    createdDocumentId = res.body.documentId;
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toBe('document 작성 성공')
  })
})

describe('Documents 모두 불러오기 성공: 방 안에 문서가 하나라도 있을 때', () => {
  it('Get all documents in room success: There is one or more documents in the room', async() => {
    const res = await request.get(`/room/${createdRoomId}/documents`).auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toBe('도큐먼트 보여주기 성공')
    expect(res.body.result[0].documentId).toBe(createdDocumentId)
  })
})

describe('Document 상세 불러오기 성공', () => {
  it('Get document success', async() => {
    const res = await request.get(`/room/${createdRoomId}/document/${createdDocumentId}`).auth(access, { type: 'bearer' })
    createdDocumentNickname = res.body.result.nickname
    expect(res.statusCode).toBe(200)
  })
})

describe('방 추가하기(inviteCode) 성공', () => {
  it('Post entering the room success', async () => {
    const res = await request.post('/room/member').auth(access2, { type: 'bearer' }).send({
      inviteCode: inviteCode,
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.room.roomId).toBe
  })
})

describe('방 추가하기(inviteCode) 실패', () => {
  it('Post entering the room 이미 추가된 방 입장하기: failed ', async () => {
    const res = await request.post('/room/member').auth(access, { type: 'bearer' }).send({
      inviteCode: inviteCode,
    })
    expect(res.statusCode).toBe(400)
    expect(res.body.errorMessage).toBe('이미 추가 된 방입니다.')
  })

  it('Post entering the room 잘못된 초대코드: failed ', async () => {
    const res = await request.post('/room/member').auth(access, { type: 'bearer' }).send({
      inviteCode: 'asdflkj-2134lkjdas0u',
    })
    expect(res.statusCode).toBe(400)
    expect(res.body.errorMessage).toBe('초대코드가 잘못됐거나 방을 찾을 수 없어요')
  })
})

describe('Document 수정가능 성공', () => {
  it('patch document success: 수정가능 하여 문서내부 진입', async() => {
    const res = await request.patch(`/room/${createdRoomId}/document`).auth(access, { type: 'bearer' }).send({
      documentId : createdDocumentId
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toBe('수정가능')
    expect(res.body.canEdit).toBe(true)
  })

})

describe('Document 도큐먼트 수정 중 성공', () => {
  it('patch document success: 누군가 수정 중', async() => {
    const res = await request.patch(`/room/${createdRoomId}/document`).auth(access, { type: 'bearer' }).send({
      documentId : createdDocumentId
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toBe('도큐먼트 수정중')
    expect(res.body.canEdit).toBe(false)
    expect(res.body.nickname).toBe(createdDocumentNickname)
  })

  it('patch document success: 누군가 수정 중', async() => {
    const res = await request.patch(`/room/${createdRoomId}/document`).auth(access2, { type: 'bearer' }).send({
      documentId : createdDocumentId
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toBe('도큐먼트 수정중')
    expect(res.body.canEdit).toBe(false)
    expect(res.body.nickname).toBe(createdDocumentNickname)
  })
})

describe('Document 수정 성공', () => {
  it('put document success: document 수정 성공', async() => {
    const res = await request.put(`/room/${createdRoomId}/document`).auth(access, { type: 'bearer' }).send({
      documentId : createdDocumentId,
      title: clearData.editDocument.title,
      content: clearData.editDocument.content
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toBe('도큐먼트 수정 성공')
  })
})

describe('Document 삭제 성공', () => {
  it ('Delete a document success', async() => {
    const res = await request.delete(`/room/${createdRoomId}/document`).auth(access, { type: 'bearer' }).send({
      documentId : createdDocumentId,
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('도큐먼트 삭제 성공')
    expect(res.body.ok).toBe(true)
  })
})

describe('방 나가기 성공', () => {
  it('Delete leave the room success', async () => {
    const res = await request.delete(`/room/member/${createdRoomId}`).auth(access2, { type: 'bearer' })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('방 나가기 성공')
  })
})

describe('방 나가기 실패', () => {
  it('Delete leave the room failed: 방에 혼자 남았을 때', async () => {
    const res = await request.delete(`/room/member/${createdRoomId2}`).auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(400)
    expect(res.body.errorMessage).toBe('방에 혼자 있어서 나갈 수 없어요. 정말 나가려면 방 삭제버튼을 눌러주세요.')
  })

  it('Delete leave the room failed: 유효하지 않은 토큰일 때', async () => {
    const res = await request.delete(`/room/member/${createdRoomId}`).auth('adsfljk4280uj', { type: 'bearer' })
    expect(res.statusCode).toBe(401)
    expect(res.body.errorMessage).toBe('로그인 후 사용하세요')
  })
})

describe('방 전체 목록 불러오기 pagination 성공', () => {
  it('GET roomList success', async () => {
    const res = await request.get('/rooms/?page=1&size=12').auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(200)
    expect(res.body.totalPages).toBeGreaterThan(0)
  })
})

describe('방 전체 목록 불러오기 pagination 실패', () => {
  it('GET roomList failed: size와 page 미입력', async () => {
    const res = await request.get('/rooms').auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(400)
    expect(res.body.errorMessage).toBe('페이지 또는 사이즈를 입력하지 않았어요.')
  })

  it('GET roomList failed: size 미입력', async () => {
    const res = await request.get('/rooms/?page=1').auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(400)
    expect(res.body.errorMessage).toBe('페이지 또는 사이즈를 입력하지 않았어요.')
  })

  it('GET roomList failed: size 미입력', async () => {
    const res = await request.get('/rooms/?size=1').auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(400)
    expect(res.body.errorMessage).toBe('페이지 또는 사이즈를 입력하지 않았어요.')
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

describe('방 검색하기 실패', () => {
  it('GET room search failed: ', async () => {
    const res = await request.get(`/rooms/search?roomName=hangle 1`).auth('asdasd', {type: 'bearer'})
    expect(res.statusCode).toBe(401)
    expect(res.body.errorMessage).toBeTruthy()
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

describe('방 유저 현황 불러오기 실패', () => { 
  it('GET memberStatus, projectStatus failed: 존재하지 않는 roomId', async () => {
    const res = await request.get(`/room/asdlkjue098123e213e/main/status`).auth(access, {type: 'bearer'})
    expect(res.statusCode).toBe(400)
    expect(res.body.errorMessage).toBe('roomId를 찾을 수 없습니다')
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

describe('방 즐겨찾기 취소 성공', () => {
  it('Delete bookmark room success', async () => {
    const res = await request.delete(`/room/${createdRoomId}/bookmark`).auth(access, { type: 'bearer' })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe("즐겨찾기가 취소되었습니다.")
    expect(res.body.markedList).toBeTruthy()
  })
})

describe('방 수정하기 성공', () => {
  it('Patch room success', async () => {
    const res = await request.patch(`/room`).auth(access, { type: 'bearer' }).send({
      roomId: createdRoomId,
      roomName: clearData.room2.roomName,
      roomImage: clearData.room2.roomImage,
      subtitle: clearData.room2.subtitle,
      tag: clearData.room2.tag,
      desc: clearData.room2.desc,
      endDate: clearData.room2.endDate
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe("방 수정이 성공적으로 이뤄졌습니다.")
    expect(res.body.room.roomId).toBe(createdRoomId)
    expect(res.body.room.roomName).toBe(clearData.room2.roomName)
    expect(res.body.room.roomImage).toBe(clearData.room2.roomImage)
    expect(res.body.room.subtitle).toBe(clearData.room2.subtitle)
    expect(res.body.room.tag).toStrictEqual(clearData.room2.tag)
    expect(res.body.room.desc).toBe(clearData.room2.desc)
    expect(res.body.room.endDate).toBe(String(clearData.room2.endDate))
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

describe('방 삭제 성공', () => {
  it('delete room success', async () => {
    const res = await request.delete('/room').auth(access, {type: 'bearer'}).send({
    roomId: createdRoomId2 })
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('방 삭제 성공')
  })
})

describe('비밀번호 변경페이지 링크가 담긴 이메일 보내기 성공', () => {
  it('Send password change email success', async () => {
    const res = await request.post('/resetPassword/sendEmail').send({
      email: clearData.email
    });
    expect(res.body.accepted[0]).toEqual(clearData.email);
    expect(res.statusCode).toBe(200);
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

  it('delete userInfo2 success', async () => {
    const res = await request.delete('/userInfo').send({
      email: clearData.email2
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