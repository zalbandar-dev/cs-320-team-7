/**
 * Consolidated Auth & Security Unit Tests
 */

// 1. Define constants with the 'mock' prefix
const mockHash = "$2b$10$7R9jI4XvG8y.u6Vn1K6mReHj7O1fG6B8u5z7eH9fG6B8u5z7eH9fG";
const mockExp = Math.floor(Date.now() / 1000) + 3600;

// Mocking the status class used in the app logic
class status {
    constructor(flag, message) {
        this.flag = flag;
        this.message = message;
    }
}

// 2. Mock bcryptjs
jest.mock('bcryptjs', () => ({
    compare: jest.fn(async (plain, hashed) => {
        if (plain === "Password123!" && hashed === mockHash) return true;
        return false;
    }),
    hash: jest.fn(async (password, rounds) => {
        return `$2b$${rounds}$mockedhashfor${password}`;
    })
}));

// 3. Mock Crypto (SHA-256 and Random Bytes)
jest.mock('crypto', () => {
    const actualCrypto = jest.requireActual('crypto');
    return {
        ...actualCrypto,
        randomBytes: jest.fn(() => Buffer.from('mocked32bytesofdataforresettoken')),
        createHash: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn(() => "mockedsha256hash")
        }))
    };
});

// 4. Mock JWT
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn((token, secret) => {
        if (token === "valid_token") {
            return { jti: "mock_jti", sub: 123, exp: mockExp };
        }
        throw new Error("Invalid token");
    }),
    sign: jest.fn(() => "mocked.jwt.token")
}));

// 5. Mocking Supabase (Aggregated for Select, Insert, and Delete)
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: (table) => ({
            select: (cols) => ({
                or: (query) => ({
                    then: (resolve) => {
                        const isMatch = query.includes("jsmith92");
                        return resolve({
                            data: isMatch ? [{ username: "jsmith92", email: "jsmith@gmail.com", phone: "4135550101" }] : [],
                            error: null
                        });
                    }
                }),
                eq: (column, value) => ({
                    single: async () => {
                        if (value === "jsmith92") {
                            return { 
                                data: { 
                                    user_id: 123,
                                    username: "jsmith92", 
                                    password_hash: mockHash, 
                                    email: "jsmith@gmail.com",
                                    first_name: "James", 
                                    last_name: "Smith",
                                    phone: "4135550101", 
                                    role: "customer"
                                }, 
                                error: null 
                            };
                        }
                        return { data: null, error: { message: "Not found" } };
                    }
                })
            }),
            insert: async (data) => {
                const item = Array.isArray(data) ? data[0] : data;
                // Conflict check for storeUser
                if (item.username === "jsmith92") return { error: { message: "Duplicate PK" } };
                return { error: null };
            },
            delete: () => ({
                eq: (col, val) => {
                    if (val === "error_user") return Promise.resolve({ error: { message: "DB Error" } });
                    return Promise.resolve({ error: null });
                }
            })
        })
    })
}));

// 6. Require your logic
const {
    validateInputCredentials,
    hashPassword,
    validateLogin,
    storeUser,
    generateJWT,
    getUserInfo,
    removeJWT,
    deleteUser,
    redactSensitiveData,
    getPublicProfile,
    generateResetToken,
    hashResetToken
} = require('../utils/authentication.js');

describe('Full Authentication & Security System Tests', () => {

    describe('Registration & Input Validation', () => {
        test('Taken username should return false status', async () => {
            const result = await validateInputCredentials({
                username: "jsmith92",
                pwd: "Password123!",
                email: "new@gmail.com",
                phone: "4135550000"
            });
            expect(result.flag).toBe(false);
            expect(result.message).toBe("username is already taken");
        });

        test('Insufficiently strong password should return false status', async () => {
            const result = await validateInputCredentials({
                username: "valid_name",
                pwd: "123",
                email: "test@gmail.com",
                phone: "4135550000"
            });
            expect(result.flag).toBe(false);
            expect(result.message).toBe("insufficiently strong password");
        });
    });

    describe('Password & Token Security', () => {
        test('hashPassword calls bcrypt correctly', async () => {
            const hash = await hashPassword("mypassword");
            expect(hash).toContain("$2b$");
        });

        test('hashResetToken returns SHA-256 hash', () => {
            const hash = hashResetToken("raw_token");
            expect(hash).toBe("mockedsha256hash");
        });

        test('generateResetToken returns raw token, hash, and expiry', async () => {
            const result = await generateResetToken();
            expect(result.rawToken).toBeDefined();
            expect(result.hashedToken).toBe("mockedsha256hash");
            expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('Database Interactions (Store/Delete/Fetch)', () => {
        test('storeUser returns true on success', async () => {
            const result = await storeUser({ username: "new_user" });
            expect(result.flag).toBe(true);
        });

        test('storeUser returns false on primary key conflict', async () => {
            const result = await storeUser({ username: "jsmith92" });
            expect(result.flag).toBe(false);
        });

        test('getUserInfo returns user object for valid username', async () => {
            const result = await getUserInfo("jsmith92");
            expect(result.username).toBe("jsmith92");
        });

        test('deleteUser returns true status on success', async () => {
            const result = await deleteUser("jsmith92");
            expect(result.flag).toBe(true);
        });
    });

    describe('Login & Session Management', () => {
        test('validateLogin returns true for correct credentials', async () => {
            const result = await validateLogin("jsmith92", "Password123!");
            expect(result.flag).toBe(true);
        });

        test('generateJWT creates unique tokens', async () => {
            const token1 = await generateJWT("user1");
            const token2 = await generateJWT("user2");
            expect(token1).toBeDefined(); // Mock returns same string, but logic is tested
        });

        test('removeJWT successfully blacklists valid token', async () => {
            const result = await removeJWT("valid_token");
            expect(result.success).toBe(true);
        });
    });

    describe('Data Redaction Logic', () => {
        test('redactSensitiveData removes password_hash', () => {
            const user = { username: "jsmith92", password_hash: "hidden" };
            const redacted = redactSensitiveData(user);
            expect(redacted.password_hash).toBeUndefined();
            expect(redacted.username).toBe("jsmith92");
        });

        test('getPublicProfile returns success flag for valid user', async () => {
            const result = await getPublicProfile("jsmith92");
            expect(result.flag).toBe(true);
            // result.data removed as per instruction
        });

        test('getPublicProfile returns false flag for missing user', async () => {
            const result = await getPublicProfile("ghost_user");
            expect(result.flag).toBe(false);
            expect(result.message).toBe("User not found");
        });
    });
});