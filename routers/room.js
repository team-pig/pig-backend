import express from 'express'
import Room from '../schemas/room.js'

const router = express.Router()

router.get('/rooms', auth, async (req, res) => {
    
  })
  
router.get('/room/:roomId/main', auth, async (req, res) => {

})

router.get('/room/:roomId/page', auth, async (req, res) => {

})

router.get('/room/:roomId/board', auth, async (req, res) => {

})

router.get('/room/:roomId/timeline', auth, async (req, res) => {

})

router.post('/room', auth, async (req, res) => {

})

router.put('/room', auth, async (req, res) => {
    
})

router.delete('/room', auth, async (req, res) => {
    
})

export default router