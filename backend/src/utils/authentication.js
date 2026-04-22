require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require('crypto');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

class status{
    constructor(flag, message){
        this.flag = flag; //Should be a boolean
        this.message = message; //Should be a string
    }
}

class userData{
    constructor(username, pwd, email, firstName, lastName, phone, role){
        this.username = username;
        this.pwd = pwd;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.role = role;
    }
    debug_display(){
        console.log(`Username: ${this.username}, Password: ••••••••, Email: ${this.email}, First Name: ${this.firstName}, Last Name: ${this.lastName}, Phone: ${this.phone}, Role: ${this.role}`);
    }
    redactSensitiveData(){
        return new userData(this.username, "••••••••", this.email, this.firstName, this.lastName, this.phone, this.role);
    }
}

//Registration Workflow
async function validateInputCredentials(userData) {
    if (!userData.pwd || userData.pwd.length < 8 || !/[A-Z]/.test(userData.pwd) || !/[a-z]/.test(userData.pwd) || !/[0-9]/.test(userData.pwd) || !/[@$!%*?&]/.test(userData.pwd)) {
        //Passwords must have length >= 8, at least one uppercase letter, one lowercase letter, one number, and one special character
        return new status(false, "insufficiently strong password"); 
    }
    
    //Check for valid username format (alphanumeric and underscores, 3-30 characters)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(userData.username)) {
        return new status(false, "invalid username format");
    }

    //Check for valid email format
    if (!validator.isEmail(userData.email)) {
        return new status(false, "invalid email format");
    }

    //Check for valid phone number format (basic check for digits and length)
    if (!validator.isMobilePhone(userData.phone, 'en-US')) {
        return new status(false, "invalid phone number format");
    }

    const { data: existingUsers, error } = await supabase
    .from('users')
    .select('username, email, phone')
    .or(`username.eq.${userData.username},email.eq.${userData.email},phone.eq.${userData.phone}`);

    if (error) {
        return new status(false, "Database connection error: " + error.message);
    }

    if (existingUsers && existingUsers.length > 0) {
        for (const user of existingUsers) {
            if (user.username === userData.username) {
                return new status(false, "username is already taken");
            }
            if (user.email === userData.email) {
                return new status(false, "email is already registered");
            }
            if (user.phone === userData.phone) {
                return new status(false, "phone number is already registered");
            }
        }
    }

    return new status(true, "");
}

async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

async function validateLogin(username, pwd) {
    const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error || !user) {
        return new status(false, "No user found with the provided username");
    }

    const isMatch = await bcrypt.compare(pwd.trim(), user.password_hash.trim());

    if (!isMatch) {
        return new status(false, "Incorrect password");
    }

    return new status(true, "");
}

async function storeUser(userData) {
    const userDict = {
        username: userData.username,
        password_hash: await hashPassword(userData.pwd),
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        role: userData.role
    };
    const { error } = await supabase
        .from('users')
        .insert([userDict]);

    if (error) {
        return new status(false, "Failed to store user data: " + error.message);
    }
    return new status(true, "");
}

async function generateJWT(userID, userId) {
    const secret = process.env.JWT_SECRET;

    const payload = {
        sub: userId,     // integer user_id — for DB foreign-key lookups (provider_id, user_id FKs)
        username: userID,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex')
    };

    return jwt.sign(payload, secret, { expiresIn: '24h' });
}

async function getUserInfo(username) {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (error || !user) return null;
    const u = new userData(user.username, user.password_hash, user.email, user.first_name, user.last_name, user.phone, user.role);
    u.id = user.user_id; // integer primary key — needed for DB foreign-key lookups (provider_id, user_id FKs)
    return u;
}

//TO DO: Get Cron Job working for removing expired JWT tokens from the blacklist table
async function removeJWT(token) {
    const secret = process.env.JWT_SECRET;

    try {
        const decoded = jwt.verify(token, secret); //Get payload

        const { error } = await supabase
            .from('jwt_blacklist')
            .insert([
                {
                    token: decoded.jti,
                    user_id: decoded.sub,
                    expires_at: new Date(decoded.exp * 1000).toISOString(),
                    blacklisted_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        return { success: true };
    } catch (err) {
        console.error("Blacklisting failed:", err.message);
        return { success: false, error: err.message };
    }
}

//On Delete Cascade in database tables handles the rest
async function deleteUser(username) {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('username', username); //Matches the row where username equals the input

    if (error) {
        return new status(false, "Failed to delete user: " + error.message);
    }

    return new status(true, "User deleted successfully");
}

function redactSensitiveData(user) {
    if (!user) return null;

    // Create a copy and remove sensitive fields
    const { password_hash, ...publicData } = user;

    return publicData;
}

async function getPublicProfile(username) {
    const user = await getUserInfo(username);
    if (!user) return new status(false, "User not found");

    const redacted = redactSensitiveData(user);
    return new status(true, "", redacted);
}

async function generateResetToken() {
    // Generate 32 bytes of random data and convert to hex string
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token immediately (SHA-256)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    // Set expiration (e.g., 1 hour from now)
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    return { rawToken, hashedToken, expiresAt };
}

function hashResetToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/*
async function sendResetLink(email, rawToken) {
    const resetUrl = `https://yourdomain.com/reset-password?token=${rawToken}`;
    
    // Example using a fetch request to a mailing service (like Resend)
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'noreply@yourdomain.com',
            to: email,
            subject: 'Reset Your Password',
            html: `
                <p>You requested a password reset.</p>
                <p>Click the link below to set a new password. This link expires in 1 hour.</p>
                <a href="${resetUrl}">Reset Password</a>
            `
        })
    });

    return response.ok;
}
*/

module.exports = {
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
};

