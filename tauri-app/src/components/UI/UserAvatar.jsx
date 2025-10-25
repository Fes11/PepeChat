import React, { useState } from "react";
import classes from "./UserAvatar.module.css"


const UserAvatar = function ({...props}) {

    return (
        <div className={classes.user_avatar}>
            <img {...props} alt="Avatar" />
        </div>
    )
}

export default UserAvatar;