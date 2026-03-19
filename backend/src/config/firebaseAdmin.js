const admin = require('firebase-admin');
const config = require('./env');

const normalizePrivateKey = (privateKey) => {
    if (!privateKey || typeof privateKey !== 'string') {
        return null;
    }

    return privateKey.replace(/\\n/g, '\n').trim();
};

const getFirebaseCredential = () => {
    const projectId = config.firebase.projectId || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = config.firebase.clientEmail || process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = normalizePrivateKey(
        config.firebase.privateKey || process.env.FIREBASE_PRIVATE_KEY
    );

    if (!projectId || !clientEmail || !privateKey) {
        console.error('Firebase Admin initialization failed: missing required environment variables.');
        return null;
    }

    if (
        !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
        !privateKey.includes('-----END PRIVATE KEY-----')
    ) {
        console.error('Firebase Admin initialization failed: FIREBASE_PRIVATE_KEY is malformed.');
        return null;
    }

    return admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    });
};

try {
    if (!admin.apps.length) {
        const credential = getFirebaseCredential();

        if (!credential) {
            throw new Error('Firebase Admin credential creation failed.');
        }

        admin.initializeApp({ credential });
        console.log('Firebase Admin initialized successfully.');
    }
} catch (error) {
    console.error('Firebase Admin initialization error:', error.message);
    throw error;
}

module.exports = admin;
