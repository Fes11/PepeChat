export const validateRegistration = ({ login, password, passwordConfirm }) => {
  const errors = {};

  if (!login.trim()) errors.login = ["Введите логин."];
  if (!password) errors.password = ["Введите пароль."];

  if (!passwordConfirm) {
    errors.password_confirm = ["Повторите пароль."];
  } else if (password !== passwordConfirm) {
    errors.password_confirm = ["Пароли не совпадают."];
  }

  return errors;
};
