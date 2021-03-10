import React from "react";

import {BrowserRouter as Router, Switch, Route} from "react-router-dom";

import Layout from "./components/Layout";
import "./assets/scss/app-dark.scss";
import Upgrade from './pages/Upgrade'
import ScrollToTop from "./components/Common/ScrollToTop"

const Base = () => {
    
    const changeStates = (props) => {
      //if (props === 'connectingTokens') {setConnectingTokens(true)}
      //if (props === 'notConnectingTokens') {setConnectingTokens(false)}
      //if (props === 'connectedTokens') {setConnectedTokens(true)}
      //if (props === 'notConnectedTokens') {setConnectedTokens(false)}
    }

    const changeNotification = (message, type) => {
        //setNotifyMessage(message)
        //setNotifyType(type)
    }

    const tempDisable = false

    return (
        <>
        <Router>
            <Layout
                changeStates={changeStates}
                changeNotification={changeNotification}
                //connectedTokens={connectedTokens}
                //connectingTokens={connectingTokens}
            />
            {/*}
            <Notification
                type={notifyType}
                message={notifyMessage}
            />
            */}
            <div className="wrapper">
                <ScrollToTop />
                {tempDisable === false &&
                    <Switch>
                        <Route path="/" exact component={Upgrade}/>
                        <Route path="/upgrade"><Upgrade/></Route>
                    </Switch>
                }
                {tempDisable === true &&
                <>
                    <div className='mt-5'>...</div>
                    <div className='mt-5'>...</div>
                    <h3 className='mt-5 text-center'>DApp temporarily disabled for smart contract upgrades</h3>
                </>
                }
            </div>
        </Router>
        </>
    );
};

export default Base;
