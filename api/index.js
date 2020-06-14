"use strict";

const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const { MongoClient } = require("mongodb");

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost";

let DATABASE_NAME = "PlanAndPrioritize";

/* Do not modify or remove this line. It allows us to change the database for grading */
if (process.env.DATABASE_NAME) DATABASE_NAME = process.env.DATABASE_NAME;

let api = express.Router();
let conn;
let db;
let Users, Posts;

module.exports = async (app) => {
  app.set("json spaces", 2);

  // Connect to MongoDB
  //conn = await MongoClient.connect("mongodb://localhost", { useUnifiedTopology: true });
  conn = await MongoClient.connect(MONGODB_URL, { useUnifiedTopology: true });
  db = conn.db(DATABASE_NAME);
  Users = db.collection("users");
  Posts = db.collection("posts");

  app.use("/api", api);
};

api.use(bodyParser.json());
api.use(cors());

api.get("/", (req, res) => {
  res.json({ message: "API running" });
});


api.get("/users", async (req, res) => {
  let users = await Users.find().toArray();
  res.json({ users: users.map(user => user.id) });
});

/* Middleware to lookup student */
api.use("/users/:id", async (req, res, next) => {
  let id = req.params.id;
  let user = await Users.findOne({ id });
  if (!user) {
    res.status(404).json({ error: "User doesn't exist" } );
    return;
  }
  res.locals.user = user;
  next();
});

/* getting user info given their id */
api.get("/users/:id", (req, res) => {
  let user = res.locals.user;
  let { id, name, avatarURL, following } = user;
  res.json({ id, name, avatarURL, following });
});


/* Create a new user. The new user's name is the same as their ID,
their avatar URL is the empty string, and they are not following anyone. */
api.post("/users", async (req, res) => {
  //console.log(res.json({id: req.body}));
  if (Object.keys(req.body).length === 0) {
    res.status(400).json({error: "missing id"});
    return;
  }
  let id_entered = req.body.id;

  if (await Users.findOne({id: id_entered})) {
    res.status(400).json({error: "user already exists"});
    return;
  }

  await Users.insertOne({id: id_entered, name: "", avatarURL: "", following: []});
  res.json({ id: id_entered, name: "", avatarURL: "", following:[] });
});

/* Update user */
api.patch("/users/:id", async (req, res) => {
  let user = res.locals.user;
  if (user === null) {
    res.status(400).json({ error: "User doesn't exist" });
    return;
  }
  let namee = user.name;
  let avatarURLL = user.avatarURL;
  if ('name' in req.body) {
    namee = req.body.name;
  }
  if ('avatarURL' in req.body) {
    avatarURLL = req.body.avatarURL;
  }
  user.name = namee;
  user.avatarURL = avatarURLL;
  console.log(user);
  await Users.replaceOne({ id: user.id }, user);
  let { id, name, avatarURL, following } = user;
  res.json({ id, name, avatarURL, following });
});

/* get feed of user */
api.get("/users/:id/feed", async (req, res) => {
  let dict = {};
  dict["posts"] = [];
  let user = res.locals.user;
  if (user === null) {
    res.status(400).json({ error: "User doesn't exist" });
    return;
  }
  user.following.push(user.id);

  let posts = await Posts.find({userId : { $in: user.following }}).toArray();
  for (let post of posts) {
  //await Posts.find({userId : { $in: user.following } }).toArray().forEach(async function(post){ // This doesnt work
    let c_user = await Users.findOne({id: post.userId});
    let user_info = {"id": c_user.id, "name": c_user.name, "avatarURL": c_user.avatarURL};
    let formatted_post = {"user": user_info, "time": post.time, "text": post.text, "x": post.x, "y": post.y};
    dict["posts"].push(formatted_post);
  }
  //});
  dict["posts"].sort((a,b) => b.time - a.time);
  res.json(dict);
});

// Adding a post
api.post("/users/:id/posts", async (req, res) => {
  let user = res.locals.user;
  if (user === null) {
    res.status(400).json({ error: "User doesn't exist"});
    return;
  }
  // TO CHECK
  if (Object.keys(req.body).length === 0) {
    res.status(404).json({error: "text is empty or text property missing"});
    return;
  }
  await Posts.insertOne({userId: user.id, time: new Date(), text: req.body.text, x: req.body.x, y: req.body.y});
  res.json({success: true});
});

// Follow another user
api.post("/users/:id/follow", async (req, res) => {
  let user = res.locals.user;
  if (user === null) {
    res.status(400).json({ error: "User doesn't exist"});
    return;
  }

  if (Object.keys(req.query).length === 0) {
    res.status(404).json({error: "target is empty or target property missing"});
    return;
  }
  // Get the target user
  let target = await Users.findOne({id: req.query.target});
  if (target === null) {
    res.status(400).json({error: "target user does not exist"});
    return;
  }
  if (target.id === user.id) {
    res.status(400).json({error: "Requesting user same as target"});
    return;
  }
  if (user.following.includes(target.id)) {
    res.status(400).json({error: "User already following target"});
    return;
  }
  user.following.push(target.id);
  await Users.replaceOne({id: user.id}, user);
  res.json({success: true});
});

// Delete post/goal
api.delete("/users/:id/posts/delete", async (req, res) => {
  let user = res.locals.user;
  if (user === null) {
    res.status(400).json({ error: "User doesn't exist"});
    return;
  }
  if (Object.keys(req.query).length === 0) {
    res.status(404).json({error: "target is empty or targer property missing"});
    return;
  }
  console.log(user.id);
  console.log(req.query.target);
  let post = await Posts.findOne({userId: user.id, text: req.query.target});
  if (post === null) {
    res.status(400).json({error: "A problem occurred: you cannot delete goal of another user"});
    return;
  }

  await Posts.remove({userId: user.id, text: req.query.target});
  res.json({success: true});
});


// Have user stop following target user
api.delete("/users/:id/follow", async (req, res) => {
  let user = res.locals.user;
  if (user === null) {
    res.status(400).json({ error: "User doesn't exist"});
    return;
  }
  // TO CHECK
  if (Object.keys(req.query).length === 0) {
    res.status(404).json({error: "target is empty or targer property missing"});
    return;
  }
  // Get the target user
  let target = await Users.findOne({id: req.query.target});
  if (target === null) {
    res.status(400).json({error: "target user does not exist"});
    return;
  }

  if (!user.following.includes(target.id)) {
    res.status(400).json({error: "Target user is not being followed by the requesting user"});
    return;
  }
  let index_following = user.following.indexOf(target.id)
  user.following.splice(index_following, 1);
  await Users.replaceOne({id: user.id}, user);
  res.json({success: true});
});

/* Catch-all route to return a JSON error if endpoint not defined */
api.all("/*", (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.url}` });
});
