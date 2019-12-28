const request = require('supertest');
const app = require('../src/app.js');
const Task = require('../src/models/task.js');
const User = require('../src/models/user.js');
const {
    userOneId, userOne,
    userTwoId, userTwo,
    taskOne, taskTwo, taskThree,
    setUpDatabase
} = require('./fixtures/db.js');

//To avoid conflict between user and task tests
//when their 2 files run at the same time
//simply append `--runInBand` to test script in package.json
//This will make our tests run in series
beforeEach(setUpDatabase);

test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'Love you again'
        }).expect(201);
    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.completed).toEqual(false);
});

test('Should return all task of user one', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send().expect(200);
    expect(response.body.length).toBe(2);
});

test('Should fail to delete second user\'s first task', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send().expect(404);
    expect(await Task.findById(taskOne._id)).not.toBeNull();
});