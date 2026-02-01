import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./Registration.module.css";
import AvatarPicker from "../chat/AvatarPicker";
import { Context } from "../../main";

const Registration = function () {
  const navigate = useNavigate();
  const { AuthStore } = useContext(Context);

  const [avatar, setAvatar] = useState(null);
  const [login, setLogin] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const sendRegistration = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("login", login);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("password_confirm", passwordConfirm);

    if (avatar) {
      formData.append("avatar", avatar);
    }

    await AuthStore.registration(formData);

    if (AuthStore.isAuth) {
      navigate("/chat/");
    }
  };

  return (
    <div className={classes.registration}>
      <div className="auth_img">
        <img src="login.png" alt="login" />
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
            <AvatarPicker avatar={avatar} onSelectAvatar={setAvatar} />

            <div className={classes.registration__box}>
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                type="text"
                placeholder="Login"
                className={classes.registration__form_input}
              />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="text"
                placeholder="Username"
                className={classes.registration__form_input}
              />
            </div>
          </div>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className={classes.registration__form_input}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className={classes.registration__form_input}
          />
          <input
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            type="password"
            placeholder="Repeat password"
            className={classes.registration__form_input}
          />

          <button type="submit" className={classes.registration__form_btn}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registration;
