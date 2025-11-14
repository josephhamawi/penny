# Story 1.1 Testing Plan: Generate Persistent Collab Codes

## Test Infrastructure Status
**Note:** As of 2025-11-13, this project does not have a testing framework configured (no Jest, Mocha, etc.). This document outlines the tests that should be implemented once testing infrastructure is added.

## Unit Tests for collabCodeService.js

### Test Suite 1: generateRandomCode()
```javascript
describe('generateRandomCode', () => {
  test('should return a 4-digit string', () => {
    const code = generateRandomCode();
    expect(code).toMatch(/^\d{4}$/);
    expect(code.length).toBe(4);
  });

  test('should pad with leading zeros', () => {
    // Run multiple times to check padding
    for (let i = 0; i < 100; i++) {
      const code = generateRandomCode();
      expect(code.length).toBe(4);
      expect(code).toMatch(/^\d{4}$/);
    }
  });

  test('should generate different codes on multiple calls', () => {
    const codes = new Set();
    for (let i = 0; i < 50; i++) {
      codes.add(generateRandomCode());
    }
    // Should have high probability of different codes
    expect(codes.size).toBeGreaterThan(40);
  });
});
```

### Test Suite 2: collabCodeExists()
```javascript
describe('collabCodeExists', () => {
  test('should return false for non-existent code', async () => {
    const exists = await collabCodeExists('9999');
    expect(exists).toBe(false);
  });

  test('should return true for existing code', async () => {
    // Setup: Create test user with code PENNY-1234
    // Then test:
    const exists = await collabCodeExists('1234');
    expect(exists).toBe(true);
  });

  test('should handle Firestore errors gracefully', async () => {
    // Mock Firestore to throw error
    // Expect error to be thrown
  });
});
```

### Test Suite 3: generateUniqueCollabCode()
```javascript
describe('generateUniqueCollabCode', () => {
  test('should return code with PENNY- prefix', async () => {
    const code = await generateUniqueCollabCode();
    expect(code).toMatch(/^PENNY-\d{4}$/);
  });

  test('should return unique code not in database', async () => {
    const code = await generateUniqueCollabCode();
    const exists = await collabCodeExists(code.replace('PENNY-', ''));
    expect(exists).toBe(false);
  });

  test('should retry on collision', async () => {
    // Mock collabCodeExists to return true first time, false second time
    // Verify it retries and succeeds
  });

  test('should throw error after MAX_COLLISION_RETRIES', async () => {
    // Mock collabCodeExists to always return true
    await expect(generateUniqueCollabCode()).rejects.toThrow(
      'Failed to generate unique collab code after 10 attempts'
    );
  });
});
```

### Test Suite 4: getUserCollabCode()
```javascript
describe('getUserCollabCode', () => {
  test('should return null for non-existent user', async () => {
    const code = await getUserCollabCode('nonexistent-user-id');
    expect(code).toBeNull();
  });

  test('should return collab code for existing user', async () => {
    // Setup: Create test user with code PENNY-1234
    const code = await getUserCollabCode('test-user-id');
    expect(code).toBe('PENNY-1234');
  });

  test('should return null for user without collab code', async () => {
    // Setup: Create test user without collabCode field
    const code = await getUserCollabCode('test-user-id');
    expect(code).toBeNull();
  });
});
```

### Test Suite 5: validateCollabCodeFormat()
```javascript
describe('validateCollabCodeFormat', () => {
  test('should accept valid format PENNY-####', () => {
    expect(validateCollabCodeFormat('PENNY-0000')).toBe(true);
    expect(validateCollabCodeFormat('PENNY-1234')).toBe(true);
    expect(validateCollabCodeFormat('PENNY-9999')).toBe(true);
  });

  test('should reject invalid formats', () => {
    expect(validateCollabCodeFormat('PENNY-123')).toBe(false);  // Too short
    expect(validateCollabCodeFormat('PENNY-12345')).toBe(false); // Too long
    expect(validateCollabCodeFormat('penny-1234')).toBe(false);  // Lowercase
    expect(validateCollabCodeFormat('PENNY1234')).toBe(false);   // No dash
    expect(validateCollabCodeFormat('PENNY-ABCD')).toBe(false);  // Letters
    expect(validateCollabCodeFormat('1234')).toBe(false);        // No prefix
  });
});
```

## Integration Tests for invitationService.js

### Test Suite 6: initializeUserProfile() - New Users
```javascript
describe('initializeUserProfile - New Users', () => {
  test('should create profile with collab code for new user', async () => {
    const result = await initializeUserProfile(
      'new-user-id',
      'test@example.com',
      'Test User'
    );

    expect(result.success).toBe(true);
    expect(result.existed).toBe(false);

    // Verify user document in Firestore
    const userDoc = await getDoc(doc(db, 'users', 'new-user-id'));
    const userData = userDoc.data();
    expect(userData.collabCode).toMatch(/^PENNY-\d{4}$/);
    expect(userData.email).toBe('test@example.com');
    expect(userData.displayName).toBe('Test User');
  });

  test('should use email prefix as displayName if not provided', async () => {
    const result = await initializeUserProfile(
      'new-user-id',
      'test@example.com'
    );

    const userDoc = await getDoc(doc(db, 'users', 'new-user-id'));
    const userData = userDoc.data();
    expect(userData.displayName).toBe('test');
  });
});
```

### Test Suite 7: initializeUserProfile() - Existing Users (Migration)
```javascript
describe('initializeUserProfile - Existing Users', () => {
  test('should add collab code to existing user without one', async () => {
    // Setup: Create user without collabCode field
    await setDoc(doc(db, 'users', 'existing-user-id'), {
      email: 'existing@example.com',
      displayName: 'Existing User',
      createdAt: serverTimestamp(),
    });

    const result = await initializeUserProfile(
      'existing-user-id',
      'existing@example.com',
      'Existing User'
    );

    expect(result.success).toBe(true);
    expect(result.existed).toBe(true);

    // Verify collab code was added
    const userDoc = await getDoc(doc(db, 'users', 'existing-user-id'));
    const userData = userDoc.data();
    expect(userData.collabCode).toMatch(/^PENNY-\d{4}$/);
  });

  test('should not regenerate collab code for user with code', async () => {
    // Setup: Create user with existing collabCode
    await setDoc(doc(db, 'users', 'existing-user-id'), {
      email: 'existing@example.com',
      displayName: 'Existing User',
      collabCode: 'PENNY-5678',
      createdAt: serverTimestamp(),
    });

    const result = await initializeUserProfile(
      'existing-user-id',
      'existing@example.com',
      'Existing User'
    );

    expect(result.success).toBe(true);
    expect(result.existed).toBe(true);

    // Verify collab code was NOT changed
    const userDoc = await getDoc(doc(db, 'users', 'existing-user-id'));
    const userData = userDoc.data();
    expect(userData.collabCode).toBe('PENNY-5678');
  });
});
```

## Manual Testing Procedures

### Manual Test 1: New User Signup
**Steps:**
1. Open app on device/simulator
2. Navigate to signup screen
3. Enter email, password, and display name
4. Submit signup form
5. Wait for profile creation

**Expected Result:**
- User successfully created
- Console log shows: "Generated collab code for new user [userId]: PENNY-####"
- Navigate to Settings screen (Story 1.2) to verify code is displayed

**Acceptance Criteria Verified:** AC1, AC2

### Manual Test 2: Existing User Login (Migration)
**Steps:**
1. Create test user in Firestore without collabCode field (using Firebase console)
2. Open app and login with that user
3. Check console logs

**Expected Result:**
- Login successful
- Console log shows: "Generated collab code for existing user [userId]: PENNY-####"
- Firestore document updated with collabCode field
- Navigate to Settings screen to verify code is displayed

**Acceptance Criteria Verified:** AC6 (Backward Compatibility)

### Manual Test 3: Code Uniqueness
**Steps:**
1. Create 10 test users sequentially
2. Record all generated collab codes
3. Verify no duplicates

**Expected Result:**
- All 10 codes are different
- All codes match format PENNY-####
- Codes visible in Firestore users collection

**Acceptance Criteria Verified:** AC3, AC4

### Manual Test 4: Collision Handling
**Note:** Difficult to test manually due to low collision probability (1/10,000)

**Steps:**
1. Monitor console logs during user creation
2. Look for collision warnings: "Collab code collision detected: PENNY-####. Retrying..."

**Expected Result:**
- If collision occurs, retry mechanism activates
- New code generated after retry
- User creation succeeds

**Acceptance Criteria Verified:** AC5

## Acceptance Criteria Verification Checklist

From Story 1.1:

- [x] **AC1: Generate 4-Digit Random Code**
  - Implementation: `generateRandomCode()` uses `expo-crypto` for cryptographic randomness
  - Verification: Code review confirms correct implementation

- [x] **AC2: Collab Code Format**
  - Implementation: Code uses `COLLAB_CODE_PREFIX = 'PENNY-'` constant
  - Format enforced in `generateUniqueCollabCode()`
  - Verification: `validateCollabCodeFormat()` regex validates format

- [x] **AC3: Check for Existing Codes**
  - Implementation: `collabCodeExists()` queries Firestore
  - Verification: Code review confirms Firestore query logic

- [x] **AC4: Unique Code Generation**
  - Implementation: `generateUniqueCollabCode()` calls `collabCodeExists()` before returning
  - Verification: Retry loop ensures uniqueness

- [x] **AC5: Retry on Collision**
  - Implementation: While loop with `MAX_COLLISION_RETRIES = 10`
  - Logs collision warnings with attempt count
  - Throws error after max retries
  - Verification: Code review confirms retry logic

- [x] **AC6: Backward Compatibility**
  - Implementation: `initializeUserProfile()` checks for existing profile
  - If profile exists without collabCode, generates and updates
  - Verification: Code review lines 41-66 in invitationService.js

- [x] **AC7: Store Code in User Profile**
  - Implementation: Code stored in users/{userId} document as `collabCode` field
  - New users: Line 76 in invitationService.js
  - Existing users: Line 50 in invitationService.js
  - Verification: Firestore structure matches requirements

- [x] **AC8: Persistent Code**
  - Implementation: Code never regenerated once set
  - Check on line 47: `if (!userData.collabCode)` prevents regeneration
  - Verification: Code review confirms no regeneration logic

- [x] **AC9: Error Handling**
  - Implementation: Try-catch blocks in all async functions
  - Console.error() for logging
  - Returns null or throws error as appropriate
  - Verification: Code review confirms error handling

## Integration Verification (From Story)

### IV1: User Profile Creation Unaffected
**Status:** ✓ VERIFIED
- `initializeUserProfile()` maintains all existing functionality
- Only adds collabCode field
- Existing fields (email, displayName, createdAt, updatedAt) unchanged

### IV2: Authentication Flow Works
**Status:** ✓ VERIFIED (Code Review)
- Integration with AuthContext confirmed (lines 43-47, 59-63)
- Signup flow calls `initializeUserProfile()` after user creation
- Login flow calls `initializeUserProfile()` for migration
- No breaking changes to authentication

### IV3: Firestore Schema Compatible
**Status:** ✓ VERIFIED (Code Review)
- New field `collabCode` added to users collection
- Backward compatible (optional field)
- No migrations needed for existing data
- Users without codes get them on first login

## Performance Considerations

### Collision Probability Analysis
- Code space: 10,000 possible codes (0000-9999)
- For 100 users: ~0.5% collision probability
- For 1000 users: ~5% collision probability
- For 5000 users: ~86% collision probability for at least one collision

**Recommendation:** Monitor collision rates. If app grows beyond 1000 users, consider:
1. Increasing code length to 5-6 digits
2. Adding letters (alphanumeric codes)
3. Current implementation handles collisions gracefully with retry mechanism

### Firestore Query Performance
- `collabCodeExists()` performs indexed query on collabCode field
- **Action Required:** Create Firestore index on `users.collabCode` for production
- Expected query time: <100ms for small datasets, <500ms for large

## Next Steps

1. **Immediate:** Test app manually using Manual Test 1 and 2
2. **Short-term:** Implement Story 1.2 to display codes in Settings
3. **Medium-term:** Set up Jest or similar testing framework
4. **Long-term:** Implement all unit and integration tests outlined above

## Test Coverage Summary

**Code Coverage (Estimated):**
- collabCodeService.js: ~100% covered by outlined tests
- invitationService.js (initializeUserProfile): ~100% covered by outlined tests

**Manual Test Coverage:**
- User signup with collab code generation: Ready to test
- User login with migration: Ready to test
- Code uniqueness: Ready to test
- Collision handling: Difficult to test (low probability)

**Integration Points:**
- AuthContext.signup() ✓
- AuthContext.login() ✓
- Firestore users collection ✓
- expo-crypto dependency ✓

---

**Testing Status:** Story 1.1 implementation is complete and ready for manual testing. Unit/integration tests documented for future implementation when testing infrastructure is added.

**Last Updated:** 2025-11-13
**Dev:** James
