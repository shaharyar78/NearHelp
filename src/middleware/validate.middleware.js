export function validate(rules = []) {
  return function validateRequest(req, res, next) {
    const errors = [];

    for (const rule of rules) {
      const value = req.body?.[rule.field];

      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push(`${rule.field} is required.`);
        continue;
      }

      if (value !== undefined && rule.type && typeof value !== rule.type) {
        errors.push(`${rule.field} must be of type ${rule.type}.`);
        continue;
      }

      if (typeof value === "string" && rule.minLength && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters.`);
      }

      if (typeof value === "string" && rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.field} must be ${rule.maxLength} characters or fewer.`);
      }

      if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
        errors.push(`${rule.field} has an invalid format.`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed.", details: errors });
    }

    return next();
  };
}
