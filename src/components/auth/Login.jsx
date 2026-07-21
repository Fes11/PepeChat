import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../../main";
import classes from "./Login.module.css";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { getFieldError } from "../../utils/errors";

const Login = () => {
  const navigate = useNavigate();
  const { AuthStore, MediaStore } = useContext(Context);

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginError = getFieldError(errors, "login");
  const passwordError = getFieldError(errors, "password");
  const formError = getFieldError(errors, "non_field_errors");

  const clearFieldError = (field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      non_field_errors: undefined,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const clientErrors = {};
    if (!login.trim()) clientErrors.login = ["Введите логин."];
    if (!password) clientErrors.password = ["Введите пароль."];
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await AuthStore.login(login, password);

      if (result.ok) {
        MediaStore.initializeDevices({ requestMicrophone: true });
        navigate("/chat/"); // переход после успешного входа
      } else {
        setErrors(result.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={classes.login}>
      <div className="auth_img">
        <img src="/login.png" alt="login" />
      </div>

      <div className={classes.login__main}>
        <form className={classes.login__form} onSubmit={handleLogin} noValidate>
          <div className={classes.login__form_title}>
            <h1>Welcome!</h1>
            <p>Залогинся или зарегайся, чтобы использовать чат</p>
          </div>

          {passwordError && (
            <p className={classes.login__form_error}>{passwordError}</p>
          )}
          {formError && (
            <p className={classes.login__form_error}>{formError}</p>
          )}

          <input
            value={login}
            onChange={(e) => {
              setLogin(e.target.value);
              clearFieldError("login");
            }}
            type="text"
            placeholder="Enter login"
            className={`${classes.login__form_input} ${
              loginError || formError ? classes.login__form_input_error : ""
            }`}
          />
          {loginError && (
            <p className={classes.login__form_error}>{loginError}</p>
          )}
          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            type="password"
            placeholder="Password"
            className={`${classes.login__form_input} ${
              passwordError || formError ? classes.login__form_input_error : ""
            }`}
          />

          <button
            type="submit"
            className={classes.login__form_btn}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span className={classes.login__form_loader} aria-label="Выполняется вход" />
            ) : (
              "Continue"
            )}
          </button>

          <div className={classes.login__form_bottom}>
            <button
              type="button"
              className={classes.login__form_btn2}
              onClick={() => navigate("/registration")}
            >
              Зарегистрироваться
            </button>
            <p className={classes.login_p}>
              При регистрации вы соглашаетесь с пользовательским соглашением и
              майнерами
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default observer(Login);
