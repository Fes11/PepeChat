import React, { useState } from "react";
import classes from './Search.module.css';

const Search = function ({children, ...props}) {

    return (
        <input className={classes.search} type="text" {...props}/>
    )
}

export default Search;
