const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const crypto = require('node:crypto');

function setup() {
    let pending;
    let sentCode;
    const users = [];
    const User = {
        init: async () => {},
        findOne: async (query) => users.find((user) => Object.entries(query).every(([key, value]) => user[key] === value)),
        exists: async (query) => users.some((user) => query.$or.some((condition) => Object.entries(condition).every(([key, value]) => user[key] === value))),
        create: async (user) => { users.push(user); return user; },
    };
    const Pending = {
        findOne: async () => pending,
        findOneAndUpdate: async (filter, update) => {
            if (update.$inc) {
                if (!pending || pending.attempts >= 5 || pending.expiresAt <= new Date()) return null;
                pending.attempts++;
                return { ...pending };
            }
            pending = { ...update, _id: 'pending' };
            return pending;
        },
        findOneAndDelete: async () => { const result = pending; pending = null; return result; },
        deleteOne: async () => { pending = null; },
    };
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/authController'), 'utf8'), {
        module, process, console, Date,
        require: (name) => ({
            '../models/User': User, '../models/PendingRegistration': Pending,
            bcryptjs: { hash: async () => 'hashed-password', compare: async (password) => password === 'secret123' }, jsonwebtoken: { sign: () => 'test-token' }, crypto,
            '../services/emailService': { sendRegistrationOtp: async (_, code) => { sentCode = code; } },
        })[name],
    });
    const call = async (method, body) => {
        const res = { status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
        await module.exports[method]({ body }, res);
        return res;
    };
    return { call, users, code: () => sentCode, pending: () => pending };
}
const registration = { name: 'Test User', email: ' TEST@example.com ', mobile: '+91 9876543210', password: 'secret123', gender: 'male' };

test('registration creates no account until the emailed code is verified, and code cannot be reused', async () => {
    const s = setup();
    assert.equal((await s.call('registerUser', registration)).code, 200);
    assert.equal(s.users.length, 0);
    assert.match(s.code(), /^\d{6}$/);
    assert.notEqual(s.pending().otpHash, s.code());
    assert.equal((await s.call('verifyRegistration', { email: registration.email, otp: s.code() })).code, 201);
    assert.equal(s.users[0].email, 'test@example.com');
    assert.equal(s.users[0].mobile, '+919876543210');
    assert.equal(s.users[0].emailVerified, true);
    assert.equal((await s.call('verifyRegistration', { email: registration.email, otp: s.code() })).code, 400);
    assert.equal(s.users.length, 1);
});

test('wrong codes exhaust attempts and expired codes cannot register', async () => {
    const s = setup();
    await s.call('registerUser', registration);
    for (let i = 0; i < 5; i++) assert.equal((await s.call('verifyRegistration', { email: registration.email, otp: '000000' })).code, 400);
    assert.equal((await s.call('verifyRegistration', { email: registration.email, otp: s.code() })).code, 400);
    assert.equal(s.users.length, 0);
    s.pending().attempts = 0;
    s.pending().expiresAt = new Date(0);
    assert.equal((await s.call('verifyRegistration', { email: registration.email, otp: s.code() })).code, 400);
});

test('resend cooldown and invalid mobile numbers are enforced', async () => {
    const s = setup();
    assert.equal((await s.call('registerUser', { ...registration, mobile: 'abc' })).code, 400);
    assert.equal((await s.call('registerUser', { ...registration, mobile: '' })).code, 400);
    assert.equal((await s.call('registerUser', { ...registration, mobile: '9876543210' })).code, 400);
    assert.equal((await s.call('registerUser', registration)).code, 200);
    assert.equal((await s.call('registerUser', registration)).code, 429);
});


test('duplicate emails and mobile numbers cannot register with different details', async () => {
    const s = setup();
    s.users.push({ email: 'test@example.com', mobile: '+919876543210' });
    assert.equal((await s.call('registerUser', { ...registration, mobile: '+919999999999' })).code, 409);
    assert.equal((await s.call('registerUser', { ...registration, email: 'other@example.com' })).code, 409);
    assert.equal((await s.call('registerUser', { ...registration, email: 'other@example.com', mobile: '0091 (98765) 43210' })).code, 409);
    assert.equal(s.pending(), undefined);
});

test('mobile claimed after OTP was sent cannot create a duplicate account', async () => {
    const s = setup();
    await s.call('registerUser', registration);
    s.users.push({ email: 'other@example.com', mobile: '+919876543210' });
    assert.equal((await s.call('verifyRegistration', { email: registration.email, otp: s.code() })).code, 409);
    assert.equal(s.users.length, 1);
});


test('login accepts email, mobile and legacy email payloads with the correct password', async () => {
    const s = setup();
    s.users.push({ email: 'test@example.com', mobile: '+919876543210', password: 'hashed-password', save: async () => {} });
    for (const credentials of [
        { identifier: ' TEST@example.com ' },
        { identifier: '+91 (98765) 43210' },
        { identifier: '00919876543210' },
        { email: 'test@example.com' },
        { mobile: '+919876543210' },
    ]) {
        const response = await s.call('loginUser', { ...credentials, password: 'secret123' });
        assert.equal(response.code, 200);
        assert.equal(response.body.token, 'test-token');
    }
});

test('login rejects invalid identifiers, missing fields, unknown numbers and wrong passwords', async () => {
    const s = setup();
    s.users.push({ email: 'test@example.com', mobile: '+919876543210', password: 'hashed-password', save: async () => {} });
    for (const identifier of ['', '9876543210', 'bad@email', { $ne: null }]) {
        assert.equal((await s.call('loginUser', { identifier, password: 'secret123' })).code, 400);
    }
    assert.equal((await s.call('loginUser', { identifier: '+919876543210' })).code, 400);
    assert.equal((await s.call('loginUser', { identifier: '+919999999999', password: 'secret123' })).code, 404);
    assert.equal((await s.call('loginUser', { identifier: '+919876543210', password: 'incorrect' })).code, 401);
});
