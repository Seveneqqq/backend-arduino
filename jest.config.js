module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setup.js'],
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'api/**/*.js',
        '!**/node_modules/**'
    ]
};