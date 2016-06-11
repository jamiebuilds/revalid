const assert = require('assert');
const {
  composeValidators, combineValidators, optional,
  minLength, maxLength, min, max, pattern, equalTo, oneOf, matchesField
} = require('./revalid');

suite('revalid', () => {
  test('end-to-end', function() {
    const containsLetters = pattern(/[a-zA-Z]/, 'containsLetters');
    const containsNumbers = pattern(/[0-9]/, 'containsNumbers');

    const password = composeValidators(minLength(8), containsLetters, containsNumbers);
    const passwordConfirm = composeValidators(password, matchesField('password'));

    const validatePasswordForm = combineValidators({
      password,
      passwordConfirm
    });

    const validResult = validatePasswordForm({
      password: 'GoodPassword123',
      passwordConfirm: 'GoodPassword123'
    });

    const invalidResult = validatePasswordForm({
      password: 'ThisPasswordIsNotSecureEnough',
      passwordConfirm: 'ThisIsADifferentPassword1'
    });

    assert.deepEqual(validResult, {
      isValid: true,
      validationErrors: {}
    });

    assert.deepEqual(invalidResult, {
      isValid: false,
      validationErrors: {
        password: {
          type: 'pattern',
          label: 'containsNumbers',
          pattern: /[0-9]/,
          value: 'ThisPasswordIsNotSecureEnough'
        },
        passwordConfirm: {
          type: 'matchesField',
          fieldName: 'password',
          value: 'ThisIsADifferentPassword1',
          other: 'ThisPasswordIsNotSecureEnough'
        }
      }
    });
  });

  test('optional()', () => {
    const fields = { a: 1 };
    const validator = optional(matchesField('a'));

    assert.deepEqual(validator(undefined, fields), false);
    assert.deepEqual(validator(null, fields), false);
    assert.deepEqual(validator('', fields), false);
    assert.deepEqual(validator(1, fields), false);
    assert.deepEqual(validator(2, fields), { type: 'matchesField', fieldName: 'a', value: 2, other: 1 });
  });

  suite('validators', () => {
    test('minLength()', () => {
      assert.deepEqual(minLength(5)('123456'), false);
      assert.deepEqual(minLength(5)('12345'), false);
      assert.deepEqual(minLength(5)('1234'), { type: 'minLength', minLength: 5, value: '1234' });
    });

    test('maxLength()', () => {
      assert.deepEqual(maxLength(5)('1234'), false);
      assert.deepEqual(maxLength(5)('12345'), false);
      assert.deepEqual(maxLength(5)('123456'), { type: 'maxLength', maxLength: 5, value: '123456' });
    });

    test('min()', () => {
      assert.deepEqual(min(5)(6), false);
      assert.deepEqual(min(5)(5), false);
      assert.deepEqual(min(5)(4), { type: 'min', min: 5, value: 4 });
    });

    test('max()', () => {
      assert.deepEqual(max(5)(4), false);
      assert.deepEqual(max(5)(5), false);
      assert.deepEqual(max(5)(6), { type: 'max', max: 5, value: 6 });
    });

    test('pattern()', () => {
      assert.deepEqual(pattern(/^abc$/, "ABC")("abc"), false);
      assert.deepEqual(pattern(/^abc$/, "ABC")("xyz"), { type: 'pattern', label: 'ABC', pattern: /^abc$/, value: "xyz" });
    });

    test('equalTo()', () => {
      const a = {};
      const b = {};
      assert.deepEqual(equalTo(a)(a), false);
      assert.deepEqual(equalTo(a)(b), { type: 'equalTo', other: {}, value: {} });
    });

    test('oneOf()', () => {
      const a = {};
      const b = {};
      const c = {};
      assert.deepEqual(oneOf([a, b])(a), false);
      assert.deepEqual(oneOf([a, b])(b), false);
      assert.deepEqual(oneOf([a, b])(c), { type: 'oneOf', values: [a, b], value: c });
    });

    test('matchesField()', () => {
      const fields = { a: 1, b: 2 };
      assert.deepEqual(matchesField('a')(1, fields), false);
      assert.deepEqual(matchesField('b')(1, fields), { type: 'matchesField', fieldName: 'b', value: 1, other: 2 });
    });
  });
});
