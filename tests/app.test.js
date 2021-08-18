const app = require('../server')
const supertest = require('supertest');
// const request = require('supertest')
const request = supertest(app);
describe('test', () => {
  it('test', async () => {
    const res = await request.post('/tttt').send( 'hi' );
    expect(res.statusCode).toEqual(200);
  });

});
// 현재 유저 등록만 이뤄지고 삭제가 안이뤄져서 테스트코드 재활용이 불가능함 유저 삭제 테스트 코드를 추가하고 넣어야 함
describe('유저 등록', () => {
  it('register success', async () => {
    const response = await request.post('/register').send({
      email: "qwertyt@naver.com",
      nickname: "qwertyt",
      password: "test11",
      confirmPassword: "test11"
    })
  
    expect(response.body.message).toBe('회원가입 성공')
    expect(response.statusCode).toBe(201); 
  })

  // it('register delete', async () => {
  //   const response = await request.
  // })

})

it('get rooms', () => {

})