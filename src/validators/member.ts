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
  if (!options.email && !options.username) {
    return [
      { field: 'email or username', message: 'username or email is required' },
    ];
  }
  return;
};
