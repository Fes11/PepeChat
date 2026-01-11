import classes from "./DateDivider.module.css";
import { format, isToday, isYesterday } from "date-fns";
import { ru } from "date-fns/locale";

const getDateLabel = (date) => {
  if (isToday(date)) return "Сегодня";
  if (isYesterday(date)) return "Вчера";
  return format(date, "d MMMM yyyy", { locale: ru });
};

const DateDivider = ({ date }) => {
  return <div className={classes.date_divider}>{getDateLabel(date)}</div>;
};

export default DateDivider;
