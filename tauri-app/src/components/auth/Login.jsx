import React, {useState} from "react";
import { useNavigate } from "react-router-dom"
import axios from "axios";
import classes from "./Login.module.css"


const Login = function () {

    const navigate = useNavigate()
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const Loging = (e) => {
        e.preventDefault();

        try {
            const responce = axios.post("http://localhost:8000/api/users/login/", { email, password });

            localStorage.setItem("auth", responce.data.access);
            navigate("/", { replace: true })

            console.log("Login sucsses: ", responce)
        } catch(e) {
            console.log("Ошибка авторизации: ", e)
        } 
    }

    return (
        <div className={classes.login}>
            <div className={classes.login__img}>
                <img src="login.png" alt="" />
            </div>

            <div className={classes.login__main}>
                <form className={classes.login__form}>
                    <div className={classes.login__form_title}>
                        <h1>Welcome!</h1>
                        <p>Log in to your account or register to use the chat</p>
                    </div>

                    <input 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        type="email" 
                        placeholder="Enter email" 
                        className={classes.login__form_input}
                    />
                    <input 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        type="password" 
                        placeholder="Password" 
                        className={classes.login__form_input}
                    />
                    <a href="http://localhost:3000/" className={classes.login__link}>Forgot your password?</a>
                    <button onClick={Loging} className={classes.login__form_btn}>Continue</button>

                    <div className={classes.login__form_bottom}>
                        <a href="http://localhost:3000/" className={classes.login__link}>Don’t have an account?</a>
                        <button className={classes.login__form_btn2}>Sign up</button>
                        <p>By registering, you accept the User Agreement</p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login;
