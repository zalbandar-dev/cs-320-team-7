const request = require('supertest');
const express = require('express');

// 1. Mock jsonwebtoken FIRST to bypass signature verification in middleware
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn((token) => {
        if (token === 'mock-valid-token') {
            // Return a payload that includes the 'jti' for the blacklist check
            return { sub: 'user-123', username: 'testuser', jti: 'mock-jti' };
        }
        throw new Error('invalid token');
    })
}));

// 2. Mock the authentication utilities
jest.mock('../utils/authentication.js', () => ({
    validateInputCredentials: jest.fn(),
    storeUser: jest.fn(),
    validateLogin: jest.fn(),
    getUserInfo: jest.fn(),
    generateJWT: jest.fn(),
    removeJWT: jest.fn()
}));

const authUtils = require('../utils/authentication.js');
const authRouter = require('../routes/auth.js');

// 3. Setup a mini-app for testing
const app = express();
app.use(express.json());

// Mock a Supabase instance on the app object for the middleware's blacklist check
app.set('supabase', {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }) // data: null means NOT blacklisted
});

app.use('/api/auth', authRouter);

describe('Auth Routes Integration Tests', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        test('Should return 201 on successful registration', async () => {
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

    describe('POST /api/auth/logout', () => {
        test('Should return 200 on successful logout', async () => {
            // Mock removeJWT to return success
            authUtils.removeJWT.mockResolvedValue({ success: true });

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer mock-valid-token');

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Logout successful");
            // Verify our utility was actually called with the raw token
            expect(authUtils.removeJWT).toHaveBeenCalledWith('mock-valid-token');
        });

        test('Should return 500 if blacklisting fails', async () => {
            authUtils.removeJWT.mockResolvedValue({ 
                success: false, 
                error: "Database connection timed out" 
            });

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer mock-valid-token');

            expect(response.statusCode).toBe(500);
            expect(response.body.error).toContain("Logout failed");
        });

        test('Should return 401 if no token is provided', async () => {
            const response = await request(app)
                .post('/api/auth/logout'); 

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe("No token provided");
        });
    });
});

afterAll(done => {
    done();
});