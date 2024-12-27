const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(30000);

process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

let mongoServer;

// Przed wszystkimi testami
beforeAll(async () => {
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

afterAll(async () => {

    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {

    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});

global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
};

jest.mock('../SerialPortManager', () => ({
    executeCommand: jest.fn(),
    startSensorReading: jest.fn(),
    closePort: jest.fn(),
    addDataHandler: jest.fn(),
    removeDataHandler: jest.fn()
}));

global.generateTestToken = (userId = 1) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { id: userId, login: 'testUser' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};