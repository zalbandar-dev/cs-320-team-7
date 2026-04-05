const request = require('supertest');
const express = require('express');

// We mock the authentication utilities so we don't hit the real Supabase DB
jest.mock('../utils/authentication.js', () => ({
    validateInputCredentials: jest.fn(),
    storeUser: jest.fn(),
    validateLogin: jest.fn(),
    getUserInfo: jest.fn(),
    generateJWT: jest.fn()
}));

const authUtils = require('../utils/authentication.js');
const authRouter = require('../routes/auth.js');

// Setup a mini-app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes Integration Tests', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        test('Should return 201 on successful registration', async () => {
            // Mocking the chain of events
            authUtils.validateInputCredentials.mockResolvedValue({ flag: true });
            authUtils.storeUser.mockResolvedValue({ flag: true });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: "testuser",
                    pwd: "Password123!",
                    email: "test@umass.edu"
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe("User registered successfully");
        });

        test('Should return 400 if validation fails', async () => {
            authUtils.validateInputCredentials.mockResolvedValue({ 
                flag: false, 
                message: "username is already taken" 
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send({ username: "jsmith92" });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("username is already taken");
        });
    });

    describe('POST /api/auth/login', () => {
        test('Should return 200 and a token on valid login', async () => {
            authUtils.validateLogin.mockResolvedValue({ flag: true });
            authUtils.getUserInfo.mockResolvedValue({ 
                username: "testuser", 
                firstName: "Test", 
                role: "customer" 
            });
            authUtils.generateJWT.mockResolvedValue("mock-jwt-token");

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: "testuser", pwd: "Password123!" });

            expect(response.statusCode).toBe(200);
            expect(response.body.token).toBe("mock-jwt-token");
            expect(response.body.user.username).toBe("testuser");
        });

        test('Should return 401 for incorrect credentials', async () => {
            authUtils.validateLogin.mockResolvedValue({ 
                flag: false, 
                message: "Incorrect password" 
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: "testuser", pwd: "wrongpassword" });

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe("Incorrect password");
        });
    });
});

afterAll(done => {
    done();
});