const express = require('express');
const User = require('../models/user.js');
const auth = require('../middleware/auth.js');
const multer = require('multer');
const sharp = require('sharp');
const router = express.Router();

//CRUD
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthToken();

        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.put('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidaOperation = updates.every(update => {
        return allowedUpdates.includes(update);
    });
    if (!isValidaOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        await req.user.save();
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id);
        //
        // if (!user) {
        //     return res.status(400).send();
        // }

        await req.user.remove();
        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user: user, token});
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

const upload = multer({
    // dest: 'avatar', //if remove, multer won't save the file, it'll pass the data of file to the function below
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File must be in image format!'));
        }

        cb(undefined, true); //accept
    }
}); //use array instead of single to upload multiple files
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
        .resize({
            width: 250,
            height: 250
        })
        .png()
        .toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png'); //set header
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
});

module.exports = router;