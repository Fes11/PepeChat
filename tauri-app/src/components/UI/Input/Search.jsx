import React, { useState } from "react";
import classes from './Search.module.css';

const Search = function () {

    return (
        <input className={classes.search} type="text" placeholder="Search..."/>
    )
}

export default Search;
