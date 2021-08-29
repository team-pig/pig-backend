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
    } catch (error) {
        console.log('injection CATCH', error);
    }
}

injection();
