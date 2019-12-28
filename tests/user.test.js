const request = require('supertest');
const app = require('../src/app.js');
const User = require('../src/models/user.js');
const {userOneId, userOne, setUpDatabase} = require('./fixtures/db.js');

const badUser = {
    name: 'Bad Guy',
    email: 'badcredentials@gmail.com',
    password: 'xxxxxxx',
    age: 18
};

beforeEach(setUpDatabase);

// beforeEach(async () => {
//     await User.deleteMany({});
//     await new User(userOne).save();
// });

// afterEach(() => {
//     console.log('After each test');
// });

test('Should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Long',
        email: 'chaulongdbp@gmail.com',
        password: 'long1778',
        age: 22
    }).expect(201);

    //Assert that database was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    //Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Long',
            email: 'chaulongdbp@gmail.com'
        },
        token: user.tokens[0].token
    });

    expect(user.password).not.toBe('long1778');
});

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(response.body.user._id);
    expect(response.body.token).toBe(user.tokens[0].token);
});

test('Should not login non-exist user', async () => {
    await request(app).post('/users/login').send({
        email: badUser.email,
        password: badUser.password
    }).expect(400);
});

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
});

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
});

test('Should delete account for user', async () => {
    const response = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(userOne._id);
    expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
});

// Fixtures folder is things that allow you to setup the environment
// ur tests are going to run in. For uploading file, we can put an image
// inside this folder
test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200);

    const user = await User.findById(userOneId);
    expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
    await request(app)
        .put('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Ánh xinh đẹp'
        }).expect(200);

    const user = await User.findById(userOneId);
    expect(user.name).toBe('Ánh xinh đẹp');
});

test('Should not update invalid user fields', async () => {
    await request(app)
        .put('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Somewhere out of space'
        }).expect(400, {"error": "Invalid updates!"});

    const user = await User.findById(userOneId);
    expect(user["location"]).not.toEqual(expect.any(Object));
});

