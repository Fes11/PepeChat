import React, { useState } from "react";
import classes from "./Select.module.css";

const Select = function ({ children, ...props }) {
  return (
    <div className={classes.select}>
      <select {...props} className={classes.select_choise}>
        {children}
      </select>
    </div>
  );
};

export default Select;
