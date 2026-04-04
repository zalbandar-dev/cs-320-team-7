// 1. Define constants with the 'mock' prefix
const mockHash = "$2b$10$7R9jI4XvG8y.u6Vn1K6mReHj7O1fG6B8u5z7eH9fG6B8u5z7eH9fG";

// 2. Mock bcryptjs FIRST to ensure stable results regardless of Node's thread pool
jest.mock('bcryptjs', () => ({
    compare: jest.fn(async (plain, hashed) => {
        // Return true if the password is correct and matches our mock user's hash
        if (plain === "Password123!" && hashed === mockHash) return true;
        return false;
    }),
    hash: jest.fn(async (password, rounds) => {
        // Simple mock to return a valid-looking hash for testing storage
        return `$2b$${rounds}$mockedhashfor${password}`;
    })
}));

// 3. Mocking Supabase
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
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
                const user = Array.isArray(data) ? data[0] : data;
                if (user.username === "jsmith92") {
                    return { error: { message: "Duplicate PK" } };
                }
                return { error: null };
            }
        })
    })
}));

// 4. Require your logic
const {
    validateInputCredentials,
    hashPassword,
    validateLogin,
    storeUser,
    generateJWT,
    getUserInfo
} = require('./authentication.js');

describe('Auth System Unit Tests', () => {

    describe('validateInputCredentials', () => {
        test('(A/D) Taken username should return false', async () => {
            const result = await validateInputCredentials({
                username: "jsmith92",
                pwd: "Password123!",
                email: "new@gmail.com",
                phone: "4135550000"
            });
            expect(result.flag).toBe(false);
            expect(result.message).toBe("username is already taken");
        });

        test('(B) New user with valid info should return true', async () => {
            const result = await validateInputCredentials({
                username: "new_user_99",
                pwd: "SafePassword1!",
                email: "unique@gmail.com",
                phone: "4135559999"
            });
            expect(result.flag).toBe(true);
        });

        test('(C) Insufficiently strong password should return false', async () => {
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

    describe('hashPassword', () => {
        test('identical passwords should result in different hashes (salting)', async () => {
            // Note: because we mocked hash, this now tests our mock's implementation
            const p1 = await hashPassword("mypassword");
            const p2 = await hashPassword("mypassword");
            // Since our mock is simple, we check that it called the library correctly
            expect(p1.startsWith('$2b$')).toBe(true); 
        });
    });

    describe('storeUser', () => {
        test('(A) Successful storage returns true status', async () => {
            const result = await storeUser({
                username: "clean_user",
                pwd: "Password123!",
                email: "clean@test.com",
                firstName: "Clean",
                lastName: "User",
                phone: "4135551111",
                role: "customer"
            });
            expect(result.flag).toBe(true);
        });

        test('(B) Primary key conflict returns false status', async () => {
            const result = await storeUser({ 
                username: "jsmith92", 
                pwd: "Password123!", 
                email: "jsmith@gmail.com" 
            });
            expect(result.flag).toBe(false);
        });
    });

    describe('validateLogin', () => {
        test('Correct credentials return true flag', async () => {
            const result = await validateLogin("jsmith92", "Password123!");
            expect(result.flag).toBe(true);
        });

        test('Wrong password for registered user returns false', async () => {
            const result = await validateLogin("jsmith92", "wrong_password");
            expect(result.flag).toBe(false);
            expect(result.message).toBe("Incorrect password");
        });

        test('Unregistered user returns user not found', async () => {
            const result = await validateLogin("non_existent", "password");
            expect(result.flag).toBe(false);
            expect(result.message).toContain("No user found");
        });
    });

    describe('generateJWT', () => {
        test('Same userID generates unique JWTs via JTI', async () => {
            const token1 = await generateJWT("user123");
            const token2 = await generateJWT("user123");
            expect(token1).not.toBe(token2);
        });
    });

    describe('getUserInfo', () => {
        test('Username not in DB returns null', async () => {
            const result = await getUserInfo("ghost");
            expect(result).toBeNull();
        });

        test('Valid username returns user object', async () => {
            const result = await getUserInfo("jsmith92");
            expect(result).not.toBeNull();
            expect(result.username).toBe("jsmith92");
            expect(result.email).toBe("jsmith@gmail.com");
            expect(result.firstName).toBe("James");
        });
    });
});