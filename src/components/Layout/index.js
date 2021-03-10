import React, { useState } from "react";
import { withRouter } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import Rightbar from "./Rightbar";

const Layout = (props) => {
  const title = props.location.pathname;
  let currentage = title.charAt(1).toUpperCase() + title.slice(2);

  document.title =
    "Spartan Protocol | " + currentage;

  return (
    <React.Fragment>

      <div id="layout-wrapper">
        <Header
          theme={props.topbarTheme}
          changeStates={props.changeStates}
          changeNotification={props.changeNotification}
          connectedTokens={props.connectedTokens}
          connectingTokens={props.connectingTokens}
        />
       
        <Footer />
      </div>

      <Rightbar/>
    </React.Fragment>
  );
}

export default withRouter(Layout);
