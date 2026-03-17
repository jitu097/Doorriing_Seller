const admin = require('firebase-admin');
const config = require('./env');
const fs = require('fs');
const path = require('path');

let credential;

// 1. Fallback to serviceAccountKey.json if in development/local
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
    console.log('Firebase: Found serviceAccountKey.json, using it for initialization');
    try {
        credential = admin.credential.cert(require(serviceAccountPath));
    } catch (err) {
        console.error('Firebase: Error loading serviceAccountKey.json:', err.message);
    }
}

// 2. If no JSON file, attempt to use environment variables
if (!credential) {
    if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey && config.firebase.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log('Firebase: No JSON file found. Initializing with environment variables');
        try {
            credential = admin.credential.cert({
                projectId: config.firebase.projectId,
                clientEmail: config.firebase.clientEmail,
                privateKey: config.firebase.privateKey,
            });
        } catch (err) {
            console.error('Firebase: Error initializing with environment variables:', err.message);
            console.log('Private Key Preview:', config.firebase.privateKey.substring(0, 50) + '...');
        }
    }
}

if (!credential) {
    console.error('CRITICAL: Firebase initialization failed. No valid credentials found.');
    throw new Error('Firebase credentials missing or invalid');
}

admin.initializeApp({ credential });

module.exports = admin;
