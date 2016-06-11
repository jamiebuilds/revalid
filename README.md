# revalid

Composable validators.

## Install

```sh
$ npm install --save revalid
```

## Example

```js
const {
  composeValidators,
  combineValidators,
  required, minLength, maxLength, pattern, matchesField
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

If you want to make a field optional, you need to explicitly make it so:

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
