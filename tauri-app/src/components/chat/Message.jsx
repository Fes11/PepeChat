import React, { useState } from "react";
import classes from "./Message.module.css"
import UserAvatar from "../UI/UserAvatar";

const Message = function (user) {

    if (user.user.auth_user) {
        return (
            <div className={classes.your_message}>
                <UserAvatar src={user.user.avatar} width="28px" height="28px" />

                <div className={classes.your_message__bubble}>Lorem ipsum dolor sit amet, consectetur adipiscing elit</div>
            </div>  
        )     
    }
    
    return (
        <div className={classes.message}>
            <div className={classes.message__bubble}>Lorem ipsum dolor sit amet, consectetur adipiscing elit</div>
            <UserAvatar src={user.user.avatar} width="28px" height="28px" />
        </div>
    )
}

export default Message;