import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./Registration.module.css";
import AvatarPicker from "../chat/AvatarPicker";
import { Context } from "../../main";

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

const Registration = function () {
  const navigate = useNavigate();
  const { AuthStore, MediaStore } = useContext(Context);

  const [avatar, setAvatar] = useState(null);
  const [login, setLogin] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState({});

  const loginError = getErrorMessage(errors, "login");
  const usernameError = getErrorMessage(errors, "username");
  const emailError = getErrorMessage(errors, "email");
  const passwordError = getErrorMessage(errors, "password");
  const passwordConfirmError = getErrorMessage(errors, "password_confirm");
  const avatarError = getErrorMessage(errors, "avatar");
  const formError = getErrorMessage(errors, "non_field_errors");

  const clearFieldError = (field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      non_field_errors: undefined,
    }));
  };

  const sendRegistration = async (e) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData();
    formData.append("login", login);
    formData.append("username", username);
    formData.append("email", email);
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
  };

  return (
    <div className={classes.registration}>
      <div className={classes.registration_img}>
        <img src="/login.png" alt="login" />
      </div>

      <div className={classes.registration_main}>
        <div className={classes.registration_header}>
          <h2>Registration</h2>
          <button
            className={classes.registration__close}
            onClick={() => navigate("/login")}
          >
            <img src="/back.png" alt="" />
          </button>
        </div>

        <form onSubmit={sendRegistration}>
          <div className={classes.registration__form_header}>
            <div className={classes.registration__avatar_box}>
              <AvatarPicker avatar={avatar} onSelectAvatar={setAvatar} />
              {avatarError && (
                <p className={classes.registration__form_error}>{avatarError}</p>
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
                placeholder="Login"
                className={`${classes.registration__form_input} ${
                  loginError ? classes.registration__form_input_error : ""
                }`}
              />
              {loginError && (
                <p className={classes.registration__form_error}>{loginError}</p>
              )}
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearFieldError("username");
                }}
                type="text"
                placeholder="Username"
                className={`${classes.registration__form_input} ${
                  usernameError ? classes.registration__form_input_error : ""
                }`}
              />
              {usernameError && (
                <p className={classes.registration__form_error}>
                  {usernameError}
                </p>
              )}
            </div>
          </div>

          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            type="email"
            placeholder="Email"
            className={`${classes.registration__form_input} ${
              emailError ? classes.registration__form_input_error : ""
            }`}
          />
          {emailError && (
            <p className={classes.registration__form_error}>{emailError}</p>
          )}
          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            type="password"
            placeholder="Password"
            className={`${classes.registration__form_input} ${
              passwordError ? classes.registration__form_input_error : ""
            }`}
          />
          {passwordError && (
            <p className={classes.registration__form_error}>{passwordError}</p>
          )}
          <input
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              clearFieldError("password_confirm");
            }}
            type="password"
            placeholder="Repeat password"
            className={`${classes.registration__form_input} ${
              passwordConfirmError
                ? classes.registration__form_input_error
                : ""
            }`}
          />
          {passwordConfirmError && (
            <p className={classes.registration__form_error}>
              {passwordConfirmError}
            </p>
          )}
          {formError && (
            <p className={classes.registration__form_error}>{formError}</p>
          )}

          <button type="submit" className={classes.registration__form_btn}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registration;
