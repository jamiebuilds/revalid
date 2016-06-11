exports.composeValidators = (...validators) => (value, fields) => {
  for (let i = 0; i < validators.length; i++) {
    const validator = validators[i];
    const result = validator(value, fields);
    if (result) {
      return result;
    }
  }
  return false;
};

exports.combineValidators = validators => {
  const keys = Object.keys(validators);
  return function validate(fields) {
    let validationErrors = {};
    let isValid = true;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const validator = validators[key];
      const result = validator(fields[key], fields);

      if (result) {
        isValid = false;
        validationErrors[key] = result;
      }
    }

    return { isValid, validationErrors };
  };
};

exports.optional = validator => (value, fields) => {
  if (value === undefined || value === null || value === '') {
    return false;
  } else {
    return validator(value, fields);
  }
};

exports.minLength = minLength => value => {
  if (value && value.length >= minLength) {
    return false;
  } else {
    return { type: 'minLength', minLength, value };
  }
};

exports.maxLength = maxLength => value => {
  if (value && value.length <= maxLength) {
    return false;
  } else {
    return { type: 'maxLength', maxLength, value };
  }
};

exports.min = min => value => {
  if (isFinite(value) && parseFloat(value) >= min) {
    return false;
  } else {
    return { type: 'min', min, value };
  }
};

exports.max = max => value => {
  if (isFinite(value) && parseFloat(value) <= max) {
    return false;
  } else {
    return { type: 'max', max, value };
  }
};

exports.pattern = (pattern, label) => value => {
  if (pattern.test(value)) {
    return false;
  } else {
    return { type: 'pattern', label, pattern, value };
  }
};

exports.equalTo = other => value => {
  if (value === other) {
    return false;
  } else {
    return { type: 'equalTo', other, value };
  }
};

exports.oneOf = values => value => {
  if (values.indexOf(value) > -1) {
    return false;
  } else {
    return { type: 'oneOf', values, value };
  }
};

exports.matchesField = fieldName => (value, fields) => {
  const other = fields[fieldName];
  if (value === other) {
    return false;
  } else {
    return { type: 'matchesField', fieldName, value, other };
  }
};
