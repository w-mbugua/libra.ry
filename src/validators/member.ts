import { LoginInput, NewMemberInput } from '../resolvers/Member';

export const validateRegister = (options: NewMemberInput) => {
  if (!options.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return [{ field: 'email', message: 'invalid email' }];
  }
  if (options.password.length <= 6) {
    return [
      {
        field: 'password',
        message: 'password length must be greater than 6',
      },
    ];
  }
  return;
};

export const validateLogin = (options: LoginInput) => {
  if (!options.email && !options.phoneNumber) {   
    return [
      { field: 'email or phone number', message: 'phone number or email is required' },
    ];
  }
  if (options.password.length < 6) {
    return [
      { field: 'password', message: 'password length must be longer than 5' },
    ];
  }
  return;
};
