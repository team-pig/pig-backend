//Front End에서 Todo의 멤버리스트 객체에 유저 avatar와 color를 추가해달라는 요구에 만든 함수입니다.
//이미 DB에 저장되어있는 모든 Todo에 배정된 각 유저의 avatar와 color를 객체에 주입해줍니다. 

const Todos = require('./schemas/todo');
const Users = require('./schemas/users');
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);

const connect = require('./schemas/index');
connect();

async function injection() {
    try {
        const allTodos = await Todos.find({});
        for (let i = 0; i < allTodos.length; i++) {
            //todo에 멤버가 배정되어있을때만 이중for문이 실행됩니다.
            if (allTodos[i].members.length > 0 && allTodos[i].members[0].color == null) {
                const todoId = allTodos[i].todoId;
                for (let k = 0; k < allTodos[i].members.length; k++) {
                    const userId = allTodos[i].members[k].memberId;
                    const user = await Users.findOne({ _id: userId });
                    const nickname = user.nickname;
                    const avatar = user.avatar;
                    const color = user.color;
                    const add = { memberId: userId, memberName: nickname, avatar: avatar, color: color };
                    const remove = { memberId: userId, memberName: nickname }
                    await Todos.updateOne({ todoId: todoId }, { $pull: { members: remove } });
                    await Todos.updateOne({ todoId: todoId }, { $push: { members: add } });
                }
            }
        }
        console.log('injection complete');
    } catch (error) {
        console.log('injection CATCH', error);
    }
}

injection();
