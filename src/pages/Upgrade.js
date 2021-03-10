import React from 'react'
import UpgradeComponent from '../components/Sections/UpgradeComponent'
import { withRouter } from "react-router-dom";
import {withNamespaces} from "react-i18next";

import {Container, Row, Col} from "reactstrap";

const Upgrade = (props) => {

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col md="12">
                            <UpgradeComponent name='Upgrade' /> 
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )

}

export default withRouter(withNamespaces()(Upgrade));