const express = require('express');
require('./db/mongoose.js');
const userRouter = require('./router/user.js');
const taskRouter = require('./router/task.js');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter, taskRouter);

module.exports = app;