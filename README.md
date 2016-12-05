# revalid

Composable validators

---

**Table of Contents:**
[**Install**](#install) ·
[**Example**](#example) ·
[**How it works**](#how-it-works) ·
[**API**](#api) ·
[**Validators**](#validators)

---

## Install

```sh
$ npm install --save revalid
```

## Example

```js
const {
  composeValidators,
  combineValidators,
  minLength, maxLength, pattern, matchesField
} = require('revalid');

const containsLetters = pattern(/[a-zA-Z]/, 'letters');
const containsNumbers = pattern(/[0-9]/, 'numbers');

const password = composeValidators(minLength(8), containsLetters, containsNumbers);
const passwordConfirm = composeValidators(password, matchesField('password'));

const validatePasswordForm = combineValidators({
  password,
  passwordConfirm
});

const result = validatePasswordForm({
  password: 'ThisPasswordIsNotSecureEnough',
  passwordConfirm: 'ThisIsADifferentPassword'
});
// {
//   isValid: false,
//   validationErrors: {
//     password: {
//       type: 'pattern',
//       label: 'numbers',
//       pattern: /[0-9]/,
//       value: 'ThisPasswordIsNotSecureEnough'
//     },
//     passwordConfirm: {
//       type: 'matchesField',
//       fieldName: 'password',
//       value: 'ThisIsADifferentPassword',
//       other: 'ThisPasswordIsNotSecureEnough'
//     }
//   }
// }
```

If you want to make a field **optional**, you need to explicitly make it so:

```js
const { composeValidators, minLength, maxLength, optional } = require('revalid');

const firstName = composeValidators(minLength(2), maxLength(30));
const optionalFirstName = optional(firstName);

optionalFirstName(undefined) // >> false
optionalFirstName(null) // >> false
optionalFirstName("") // >> false
optionalFirstName("x") // >> { type: 'minLength', minLength: 2, value: 'x' }
optionalFirstName("xyz") // >> true
```

> Note: There is no `required`, validators are required by default.

## How it works

Lets start by taking a look at one of our validators: `matchesField`.

Validators in **revalid** are just plain functions that return functions. So
let's start by doing that.

```js
function matchesField(fieldName) {
  return function(value, fields) {
    // ...
  };
}
```

Notice how the returned function  accepts two arguments: `value` and `fields`.

Now we can write the actual validation logic. There are two things that the
inner function can return:

  1. `false` for when the validator **has no error**.
  2. `{ type: String, ... }` for when the validator **has an error**.

Let's write our success case:

```js
function matchesField(fieldName) {
  return function(value, fields) {
    const other = fields[fieldName];
    if (value === other) {
      return false;
    }
  };
}
```

Again, see that the success case is returning `false` because there isn't an
error.

Now for the error case which will return a plain object with a `type` that
describes the validator and any additional properties that explain the error
further.

```js
function matchesField(fieldName) {
  return function(value, fields) {
    const other = fields[fieldName];
    if (value === other) {
      return false;
    } else {
      return { type: 'matchesField', fieldName, value, other };
    }
  };
}
```

And that's it! That is our validator. Now let's use it.

If we want to use the validator directly, we do so like this:

```js
const { matchesField } = require('revalid');

const fields = { password: 'hunter2' };
const matchesPassword = matchesField('password');

const validationError1 = matchesPassword('hunter2'); // >> false
const validationError2 = matchesPassword('hunter3'); // >> { type: 'matchesField', ... }
```

We can `composeValidators` together like so:

```js
const { composeValidators, minLength, maxLength } = require('revalid');

const firstName = composeValidators(minLength(2), maxLength(30));

const validationError1 = matchesPassword('Hunter'); // >> false
const validationError2 = matchesPassword('Q'); // >> { type: 'minLength', ... }
```

Finally, you can `combineValidators` together to validate multiple fields at
once.

```js
const { combineValidators, ... } = require('revalid');

// ...

const validatePasswordForm = combineValidators({
  password,
  passwordConfirm
});

const formData = {
  password: 'ThisPasswordIsNotSecureEnough',
  passwordConfirm: 'ThisIsADifferentPassword'
};

const result = validatePasswordForm(formData);
```

In the above example, `result` is the following:

```js
{
  isValid: false,
  validationErrors: {
    password: {
      type: 'pattern',
      label: 'numbers',
      pattern: /[0-9]/,
      value: 'ThisPasswordIsNotSecureEnough'
    },
    passwordConfirm: {
      type: 'matchesField',
      fieldName: 'password',
      value: 'ThisIsADifferentPassword',
      other: 'ThisPasswordIsNotSecureEnough'
    }
  }
}
```

A successful result will look like this:

```js
{
  isValid: true,
  validationErrors: {}
}
```

## API

##### `composeValidators(...validators) => validator`

Compose together multiple validators into a single validator. The validators
will run serially until one of them returns a validation error returning that
validation error. If no errors are returned then it will return `false` (just
like any other validator).

Composed validators can be nested within other composed validators.

```js
const { composeValidators } = require('revalid');

const twoToThirty = composeValidators(minLength(2), maxLength(30));
const twoToThirtyLetters = composeValidators(twoToThirty, pattern(/^[a-zA-Z]+$/));
```

##### `combineValidators({ [key]: validator }) => combinedValidator`

Create a function that can validate multiple fields at once.

```js
const { combineValidators } = require('revalid');

const validateForm = combineValidators({
  password: password,
  passwordConfirm: passwordConfirm
});

const result = validateForm({
  password: 'examplepassword',
  passwordConfirm: 'examplepassword'
});
```

When there are no errors:

```js
{
  isValid: true,
  validationErrors: {}
}
```

When there are errors:

```js
{
  isValid: false,
  validationErrors: {
    password: {
      // ...
    }
  }
}
```

##### `optional(validator) => validator`

Take an existing validator and make it optional, meaning that it can be
`undefined`, `null`, or `''`.

```js
const { optional, ... } = require('revalid');

const validator = minLength(10);
const optionalValidator = optional(validator);

validator(''); // error – { type: 'minLength', ... }
optionalValidator(''); // success – false
optionalValidator('abc');  // error – { type: 'minLength', ... }
```

### Validators

##### `minLength(length) => validator`

Creates a validator that passes when it has a string that is at least `length`
characters long.

**Example Error:**

```js
{ type: 'minLength', minLength: 15, value: "example-string" }
```

##### `maxLength(length) => validator`

Creates a validator that passes when it has a string that is at most `length`
characters long.

**Example Error:**

```js
{ type: 'maxLength', minLength: 13, value: "example-string" }
```

##### `min(number) => validator`

Creates a validator that passes when it has a string that is greater than or
equal to `number`.

**Example Error:**

```js
{ type: 'min', min: 10, value: 9 }
```

##### `max(number) => validator`

Creates a validator that passes when it has a string that is less than or
equal to `number`.

**Example Error:**

```js
{ type: 'max', min: 10, value: 11 }
```

##### `pattern(regex, label) => validator`

Creates a validator that passes when the `regex` matches a string. `label`
should be used to describe the `regex`.

**Example Error:**

```js
{ type: 'pattern', label: 'containsNumbers', pattern: /[0-9]/, value: 'abc' }
```

##### `equalTo(other) => validator`

Creates a validator that passes when a value is strictly equal `===` to
`other`.

**Example Error:**

```js
{ type: 'equalTo', other: 'foo', value: 'bar' }
```

##### `oneOf(array) => validator`

Creates a validator that passes when a value is equal to another one of the
values in `array` (uses `indexOf`).

**Example Error:**

```js
{ type: 'oneOf', values: [1, 2, 3], value: 4 }
```

##### `matchesField(fieldName) => validator`

Creates a validator that passes when a value is equal to the `fieldName`
field's value (Useful for email or password confirmation).

**Example Error:**

```js
{ type: 'matchesField', fieldName: 'password', value: 'hunter3', other: 'hunter2' }
```
