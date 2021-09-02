//클라이언트에서 API콜을 받았을때 현재 접속해있는 유저가 해당 워크스페이스 방의 멤버인지 아닌지를 판별하는 middleware 함수입니다.
const Rooms = require('../schemas/room');

module.exports = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = res.locals.user._id;
        const room = await Rooms.findOne({ roomId: roomId });

        if (!room) {
            res.status(400).send({
                'ok': false,
                errorMessage: '해당 방은 존재하지 않습니다',
            })
            return;
        }
        if (room.members.includes(userId) === false) {
            res.status(400).send({
                'ok': false,
                errorMessage: '본 유저는 방의 멤버가 아닙니다.'
            })
            return;
        }
        next();
    } catch (error) {
        console.log('member check error', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: isMember 체크 실패'
        });
        return;
    }
}