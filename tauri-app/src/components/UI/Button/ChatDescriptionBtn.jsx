import React, { useState } from "react";
import classes from "./ChatDescriptionBtn.module.css"

const ChatDescriptionBtn = function ({children, ...props}) {

    return (
        <button {...props} className={classes.description_btn}>
            {children}
        </button>
    )
}

export default ChatDescriptionBtn;