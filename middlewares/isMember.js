const Rooms = require('../schemas/room');

module.exports = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = res.locals.user._id;
        const room = await Rooms.findOne({ roomId: roomId });

        if (room.members.includes(userId) === false) {
            res.status(400).send({
                'ok': false,
                message: '본 유저는 방의 멤버가 아닙니다.'
            })
            return;
        }
        next();
    } catch (error) {
        console.log('member check error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: isMember 체크 실패'
        });
    }
}