const express = require("express");
const Posts = require("../schemas/posts");

const router = express.Router();


router.get("/posts/:contentId", async (req, res, next) => {
  try {
    const { contentId } = req.params;
    posts = await Posts.findOne({ contentId: contentId });
    res.json({ posts: posts });
  } catch (err) {
    console.error(err);
    next(err);
  }

});

router.get("/posts", async (req, res, next) => {
  try {
    // const { category } = req.query;
    const posts = await Posts.find().sort('-contentId');
    res.json({ posts: posts });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post("/posts", async (req, res, next) => {
  try {
    const { contentId, title, name, password, content } = req.body;
    await Posts.create({ contentId, title, name, password, content });
    res.send({ result: "success" });
  } catch (err) {
    console.error(err);
    next(err);
  }

});

router.post("/edit", async (req, res, next) => {
  try {
    const { contentId, title, name, password, content } = req.body;
    await Posts.updateOne({ 'contentId': contentId, 'password': password }, { $set: { 'title': title, 'name': name, 'content': content } });
    res.send({ result: "success" });
  } catch (err) {
    console.error(err);
    next(err);
  }

});

router.post("/delete", async (req, res, next) => {
  try {
    const { contentId, password } = req.body;
    await Posts.deleteOne({ 'contentId': contentId, 'password': password });
    res.send({ result: "success" });
  } catch (err) {
    console.error(err);
    next(err);
  }



});


module.exports = router;