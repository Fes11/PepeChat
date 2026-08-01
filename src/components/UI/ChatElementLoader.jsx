import styles from "./ChatElementLoader.module.css";

const ChatElementLoader = () => {
  return <div className={`${styles.loader} ${styles.shimmer}`}></div>;
};

export default ChatElementLoader;
