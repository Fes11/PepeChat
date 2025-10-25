import React, { useState } from "react";
import UserAvatar from "../UI/UserAvatar.jsx"

const Participant = function () {

    return (
        <div className="participant">
            <UserAvatar src="./test_avatar2.jpg" width="28px" height="28px"/>
            <p>username</p>
        </div>
    )
}

export default Participant;