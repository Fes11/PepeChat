import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./Registration.module.css";
import AvatarPicker from "../UI/AvatarPicker/AvatarPicker";
import { Context } from "../../main";
import { getFieldError } from "../../utils/errors";
import {
  LOGIN_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from "../../constants/limits.js";
import { validateRegistration } from "./registrationValidation.js";

const Registration = function () {
  const navigate = useNavigate();
  const { AuthStore, MediaStore } = useContext(Context);

  const [avatar, setAvatar] = useState(null);
  const [login, setLogin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginError = getFieldError(errors, "login");
  const usernameError = getFieldError(errors, "username");
  const passwordError = getFieldError(errors, "password");
  const passwordConfirmError = getFieldError(errors, "password_confirm");
  const avatarError = getFieldError(errors, "avatar");
  const formError = getFieldError(errors, "non_field_errors");

  const clearFieldError = (field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      non_field_errors: undefined,
    }));
  };

  const sendRegistration = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const clientErrors = validateRegistration({
      login,
      password,
      passwordConfirm,
    });
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("login", login);
      formData.append("username", username);
      formData.append("password", password);
      formData.append("password_confirm", passwordConfirm);

      if (avatar) {
        formData.append("avatar", avatar);
      }

      const result = await AuthStore.registration(formData);

      if (result.ok) {
        MediaStore.initializeDevices({ requestMicrophone: true });
        navigate("/chat/");
      } else {
        setErrors(result.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={classes.registration}>
      <div className={classes.registration_img}>
        <img src="/login.png" alt="login" />
      </div>

      <div className={classes.registration_main}>
        <div className={classes.registration_header}>
          <h2>Регистрация</h2>
          <button
            className={classes.registration__close}
            onClick={() => navigate("/login")}
          >
            <img src="/back.png" alt="" />
          </button>
        </div>

        <form onSubmit={sendRegistration} noValidate>
          {passwordConfirmError && (
            <p className={classes.registration__form_error}>
              {passwordConfirmError}
            </p>
          )}
          {formError && (
            <p className={classes.registration__form_error}>{formError}</p>
          )}
          {passwordError && (
            <p className={classes.registration__form_error}>{passwordError}</p>
          )}
          {usernameError && (
            <p className={classes.registration__form_error}>{usernameError}</p>
          )}
          {loginError && (
            <p className={classes.registration__form_error}>{loginError}</p>
          )}

          <div className={classes.registration__form_header}>
            <div className={classes.registration__avatar_box}>
              <AvatarPicker avatar={avatar} onSelectAvatar={setAvatar} />
              {avatarError && (
                <p className={classes.registration__form_error}>
                  {avatarError}
                </p>
              )}
            </div>

            <div className={classes.registration__box}>
              <input
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value);
                  clearFieldError("login");
                }}
                type="text"
                maxLength={LOGIN_MAX_LENGTH}
                placeholder="Логин"
                className={`${classes.registration__form_input} ${
                  loginError ? classes.registration__form_input_error : ""
                }`}
              />

              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearFieldError("username");
                }}
                type="text"
                maxLength={USERNAME_MAX_LENGTH}
                placeholder="Имя пользователя"
                className={`${classes.registration__form_input} ${
                  usernameError ? classes.registration__form_input_error : ""
                }`}
              />
            </div>
          </div>

          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            type="password"
            maxLength={PASSWORD_MAX_LENGTH}
            placeholder="Пароль"
            className={`${classes.registration__form_input} ${
              passwordError ? classes.registration__form_input_error : ""
            }`}
          />

          <input
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              clearFieldError("password_confirm");
            }}
            type="password"
            maxLength={PASSWORD_MAX_LENGTH}
            placeholder="Повторите пароль"
            className={`${classes.registration__form_input} ${
              passwordConfirmError ? classes.registration__form_input_error : ""
            }`}
          />

          <button
            type="submit"
            className={classes.registration__form_btn}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span
                className={classes.registration__form_loader}
                aria-label="Выполняется регистрация"
              />
            ) : (
              "Продолжить"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registration;
