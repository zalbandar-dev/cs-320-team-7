const {
    validateInputCredentials,
    hashPassword,
    validateLogin,
    storeUser,
    generateJWT,
    getUserInfo
} = require('./authentication.js');

// Valid bcrypt hash for the password: "Password123!"
const MOCK_HASH = "$2b$10$7R9jI4XvG8y.u6Vn1K6mReHj7O1fG6B8u5z7eH9fG6B8u5z7eH9fG";

// Mocking Supabase to follow your provided DB state
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: (table) => ({
            select: () => ({
                eq: (column, value) => ({
                    maybeSingle: async () => {
                        const mockDB = [
                            { username: "jsmith92", email: "jsmith@gmail.com", phone: "4135550101" },
                            { username: "sara_j", email: "sara.jones@yahoo.com", phone: "4135550102" }
                        ];
                        const found = mockDB.find(u => u[column] === value);
                        return { data: found || null, error: null };
                    },
                    single: async () => {
                        // For validateLogin and getUserInfo
                        if (value === "jsmith92") {
                            return { 
                                data: { 
                                    username: "jsmith92", 
                                    password_hash: MOCK_HASH, 
                                    email: "jsmith@gmail.com",
                                    first_name: "James",
                                    last_name: "Smith",
                                    phone: "4135550101",
                                    role: "customer"
                                }, 
                                error: null 
                            };
                        }
                        return { data: null, error: "Not found" };
                    }
                })
            }),
            insert: async (data) => {
                // Testing B: Primary key conflict
                if (data[0].username === "jsmith92") return { error: { message: "Duplicate PK" } };
                // Testing C: Missing info
                if (!data[0].email) return { error: { message: "Missing info" } };
                return { error: null };
            }
        })
    })
}));

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
            const p1 = await hashPassword("mypassword");
            const p2 = await hashPassword("mypassword");
            expect(p1).not.toBe(p2);
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
            // Using the password that matches our MOCK_HASH
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
            expect(result.username).toBe("jsmith92");
            expect(result.email).toBe("jsmith@gmail.com");
            // Check that it's an instance of your userData class
            expect(result.firstName).toBe("James");
        });
    });
});