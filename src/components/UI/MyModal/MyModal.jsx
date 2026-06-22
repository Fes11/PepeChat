import React from 'react';
import cl from './MyModal.module.css';

const MyModal = ({children, visable, setVisable}) => {

    const rootClasses = [cl.myModal]

    if (visable) {
        rootClasses.push(cl.active);
    }

    return (
        <div className={rootClasses.join(' ')} onClick={() => setVisable(false)}>
            <div className={cl.myModal__content} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    )
}

export default MyModal;