const admin = require('firebase-admin');
const config = require('./env');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey
    })
});

module.exports = admin;
