import React, {useState} from "react";
import axios from "axios";


const Login = function () {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const Loging = (e) => {
        e.preventDefault();

        try {
            const responce = axios.post("http://localhost:8000/api/users/login/", { email, password });
            console.log("Login sucsses: ", responce)
        } catch(e) {
            console.log("Ошибка авторизации: ", e)
        } 
    }

    return (
        <div className="login">
            <div className="login__img">
                <img src="login.png" alt="" />
            </div>

            <div className="login__main">
                <form className="login__form">
                    <div className="login__form_title">
                        <h1>Welcome!</h1>
                        <p>Log in to your account or register to use the chat</p>
                    </div>

                    <input 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        type="email" 
                        placeholder="Enter email" 
                        className="login__form_input"
                    />
                    <input 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        type="password" 
                        placeholder="Password" 
                        className="login__form_input"
                    />
                    <a href="http://localhost:3000/">Forgot your password?</a>
                    <button onClick={Loging} className="login__form_btn">Continue</button>

                    <div className="login__form_bottom">
                        <a href="http://localhost:3000/">Don’t have an account?</a>
                        <button className="login__form_btn2">Sign up</button>
                        <p>By registering, you accept the User Agreement</p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login;
