import React from "react";


const Login = function () {

    return (
        <div className="login">
            <div className="login__img">
                <img src="login.png" alt="" />
            </div>

            <div className="login__main">
                <div className="login__form">
                    <div className="login__form_title">
                        <h1>Welcome!</h1>
                        <p>Log in to your account or register to use the chat</p>
                    </div>

                    <input type="text" placeholder="Enter username or email" className="login__form_input"/>
                    <input type="text" placeholder="Password" className="login__form_input"/>
                    <a href="http://localhost:3000/">Forgot your password?</a>
                    <button className="login__form_btn">Continue</button>

                    <div className="login__form_bottom">
                        <a href="http://localhost:3000/">Don’t have an account?</a>
                        <button className="login__form_btn2">Sign up</button>
                        <p>By registering, you accept the User Agreement</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login;
