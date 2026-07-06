import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../../main";
import classes from "./Login.module.css";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";

const getErrorMessage = (errors, field) => {
  const value = errors[field];

  if (Array.isArray(value)) {
    return value.join(" ");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
};

const Login = () => {
  const navigate = useNavigate();
  const { AuthStore, MediaStore } = useContext(Context);

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const loginError = getErrorMessage(errors, "login");
  const passwordError = getErrorMessage(errors, "password");
  const formError = getErrorMessage(errors, "non_field_errors");

  const clearFieldError = (field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      non_field_errors: undefined,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    console.log("Trying login with:", login, password);
    const result = await AuthStore.login(login, password);

    if (result.ok) {
      MediaStore.initializeDevices({ requestMicrophone: true });
      navigate("/chat/"); // переход после успешного входа
    } else {
      setErrors(result.errors);
    }
  };

  return (
    <div className={classes.login}>
      <div className="auth_img">
        <img src="/login.png" alt="login" />
      </div>

      <div className={classes.login__main}>
        <form className={classes.login__form} onSubmit={handleLogin}>
          <div className={classes.login__form_title}>
            <h1>Welcome!</h1>
            <p>Log in to your account or register to use the chat</p>
          </div>

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
          {loginError && <p className={classes.login__form_error}>{loginError}</p>}
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
          {passwordError && (
            <p className={classes.login__form_error}>{passwordError}</p>
          )}
          {formError && <p className={classes.login__form_error}>{formError}</p>}

          <a href="#" className={classes.login__link}>
            Forgot your password?
          </a>

          <button type="submit" className={classes.login__form_btn}>
            Continue
          </button>

          <div className={classes.login__form_bottom}>
            <Link to="/registration" className={classes.login__link}>
              Don’t have an account?
            </Link>
            <button
              type="button"
              className={classes.login__form_btn2}
              onClick={() => navigate("/registration")}
            >
              Sign up
            </button>
            <p>By registering, you accept the User Agreement</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default observer(Login);
