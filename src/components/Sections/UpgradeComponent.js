import React, { useContext, useEffect, useState } from "react"
import { Context } from "../../context"
import queryString from 'query-string';
import {
    getBondv2Contract, getBondv3Contract, BNB_ADDR, WBNB_ADDR, BONDv3_ADDR, getClaimableLPBondv2, getClaimableLPBondv3, getUtilsContract, updateSharesData, getBNBBalance,
    getTokenContract, getBondedv2MemberDetails, getBondedv3MemberDetails, SPARTA_ADDR, getPoolData, getTokenData, updateWalletData, getBaseAllocation, getGasPrice,
} from "../../client/web3"
import Notification from '../Common/notification'

import { bn, one, formatBN, convertFromWei, convertToWei, formatAllUnits, formatGranularUnits, daysSince, hoursSince } from '../../utils'

import {
    Row, Col, InputGroup, InputGroupAddon, Label, UncontrolledTooltip,
    FormGroup, Card, CardTitle, CardSubtitle, CardBody,Container,
    Spinner, Input, Modal, ModalHeader, ModalBody, ModalFooter, Button, Progress
} from "reactstrap"

import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import { withNamespaces } from 'react-i18next'
import { withRouter, Link } from "react-router-dom"


const UpgradeComponent = (props) => {

    const context = useContext(Context)
    const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    function getSteps() {
        return ['DAO Migration', 'Pool Liquidity Migration', 'Bonded Assets Migration'];
    }

    function getStepContent(step) {
        switch (step) {
            case 0:
                return `Migrate your DAO weighting `;
            case 1:
                return 'Migrate your liquidity';
            case 2:
                return `Migrate your bonded lps`;
            default:
                return 'Unknown step';
        }
    }

    const [activeStep, setActiveStep] = React.useState(0);
    const steps = getSteps();

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    return (
        <>
            <Card >
                <Row >
                     <Col sm={10} className="mr-20">
                                <div>
                                    <Stepper activeStep={activeStep} orientation="vertical">
                                        {steps.map((label, index) => (
                                            <Step key={label}>
                                                <StepLabel>{label}</StepLabel>
                                                <StepContent>
                                                    <Typography>{getStepContent(index)}</Typography>
                                                    <div className="m-2">
                                                        <div>
                                                            <Button
                                                                disabled={activeStep === 0}
                                                                onClick={handleBack}
                                                                className={"m-2"}
                                                            > Back </Button>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={handleNext}
                                                                className={"m-2"}
                                                            >
                                                                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </StepContent>
                                            </Step>
                                        ))}
                                    </Stepper>
                                    {activeStep === steps.length && (
                                        <Paper square elevation={0} className="p-3">
                                            <Typography>All steps completed - you&apos;re finished :P</Typography>
                                            <Button onClick={'/'} color="primary" className={"m-2"}>
                                               Lets Go - DappV2!
                                          </Button>
                                        </Paper>
                                    )}
                                </div>
                        
                     
                    </Col>
                </Row>
            </Card>
      
        </>
    )
};

export default withRouter(withNamespaces()(UpgradeComponent));
