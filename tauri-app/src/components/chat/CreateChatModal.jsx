import React, { useState } from "react";
import classes from "./CreateChatModal.module.css";
import Participant from "./Participant"

const CreateChatModal = function () {

    return (
        <div className={classes.content}>
            <div className={classes.header}>
                <p className={classes.title}>Create new chat</p>
                <button className={classes.close}>X</button>
            </div>

            <div className={classes.description}>
                <div className={classes.avatar}></div>

                <div className={classes.input_box}>
                    <input type="text" placeholder="Chat name" className={classes.input}/>
                    <button className={classes.search_user}>+ Add user</button>
                </div>
            </div>

            <div className={classes.partchipants__list}>
               <Participant />
               <Participant />
               <Participant />
            </div>
            
            <button className={classes.create_chat_btn}>Create chat</button>
        </div>
    )
}

export default CreateChatModal;
