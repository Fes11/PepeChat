import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../../main";
import classes from "./Login.module.css";
import { observer } from "mobx-react-lite";

const Login = () => {
  const navigate = useNavigate();
  const { store } = useContext(Context);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Trying login with:", email, password);
    await store.login(email, password);
    if (store.isAuth) {
      navigate("/"); // переход после успешного входа
    }
  };

  return (
    <div className={classes.login}>
      <div className={classes.login__img}>
        <img src="login.png" alt="login" />
      </div>

      <div className={classes.login__main}>
        <form className={classes.login__form} onSubmit={handleLogin}>
          <div className={classes.login__form_title}>
            <h1>Welcome!</h1>
            <p>Log in to your account or register to use the chat</p>
          </div>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Enter email"
            className={classes.login__form_input}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className={classes.login__form_input}
          />

          <a href="#" className={classes.login__link}>
            Forgot your password?
          </a>

          <button type="submit" className={classes.login__form_btn}>
            Continue
          </button>

          <div className={classes.login__form_bottom}>
            <a href="#" className={classes.login__link}>
              Don’t have an account?
            </a>
            <button type="button" className={classes.login__form_btn2}>
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
