import React from 'react';
import { useHistory } from 'react-router-dom';

const IndexPage = (props) => {
    const history = useHistory();
    React.useEffect(() => {
        const token = localStorage.getItem('CC_Token');
        console.log(token);
        if (!token) {
            history.push('/login');
        } else {
            history.push('/dashboard');
        }
        // eslint-disable-next-line
    }, [0]);
    return <div></div>;
};

export default IndexPage;
