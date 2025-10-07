// utils/validator.js

const Joi = require('joi');

const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(100).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  profile: Joi.object({
    phone: Joi.string().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional()
    }).optional(),
    preferences: Joi.object().optional()
  }).optional()
});

const validateSignUp = (data) => {
  return signUpSchema.validate(data, { abortEarly: false });
};

const validateLogin = (data) => {
  return loginSchema.validate(data, { abortEarly: false });
};

const validateProfileUpdate = (data) => {
  return profileUpdateSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateSignUp,
  validateLogin,
  validateProfileUpdate
};