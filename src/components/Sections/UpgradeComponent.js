import React, { useContext, useEffect, useState } from "react"
import { Context } from "../../context"
import {getRewards, getDaoContract, 
    updateWalletData, BNB_ADDR, SPARTA_ADDR,
    getMemberDetail, getTotalWeight, getGasPrice, getBNBBalance, getMigrationContract,
} from "../../client/web3"
import Notification from '../Common/notification'

import { bn, hoursSince } from '../../utils'
import "../../assets/scss/custom/components/_rightbar.scss";
import {
    Row, Col, Card, CardTitle, Table, CardSubtitle,
    Button
} from "reactstrap"
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import './upgrade.scss'

import { withNamespaces } from 'react-i18next'
import { withRouter, Link } from "react-router-dom"
import EarnTableItem from "./EarnTableItem"
import LPTableItem from "./LPTableItem"
import Bondv2TableItem from "./Bondv2TableItem"
import Bondv3TableItem from "./Bondv3TableItem"

const UpgradeComponent = (props) => {

    const context = useContext(Context)
    const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    function getSteps() {
        return [<CardTitle className="mt-2"><h4>DAO Migration</h4></CardTitle>,
         <CardTitle className="mt-2"><h4>Pool Liquidity Migration</h4></CardTitle>, 
        <CardTitle className="mt-2"><h4>Bondv2 Migration</h4></CardTitle>,
        <CardTitle className="mt-2"><h4>Bondv3 Migration</h4></CardTitle>];
    }
  
    const [reward, setReward] = useState(0)
    const [member, setMember] = useState([])
    const [totalWeight, setTotalWeight] = useState(0)
    const [notifyMessage, setNotifyMessage] = useState("")
    const [notifyType, setNotifyType] = useState("dark")
    const [loadingHarvest, setLoadingHarvest] = useState(false)
    const [lastHarvest,setlastHarvest] = useState('100')

    useEffect(() => {
        const interval = setInterval(() => {
            if (context.account && context.walletData) {
                getData()
            }
        }, 5000);
        return () => clearInterval(interval)
        // eslint-disable-next-line
    }, [context.walletData, context.account])

    const getData = async () => {
        let data = await Promise.all([getRewards(context.account), getMemberDetail(context.account), getTotalWeight()])
        let rewards = data[0]
        console.log(rewards)
        let memberDetails = data[1]
        console.log(memberDetails)
        let weight = data[2]
        console.log(weight)
        setReward(rewards)
        setMember(memberDetails)
        setTotalWeight(weight)
        setlastHarvest(hoursSince(memberDetails.lastBlock))
    }

    const harvest = async () => {
        setNotifyMessage('...')
        setLoadingHarvest(true)
        let gasFee = 0
        let gasLimit = 0
        let contTxn = false
        const estGasPrice = await getGasPrice()
        let contract = getDaoContract()
        console.log('Estimating gas', estGasPrice)
        await contract.methods.harvest().estimateGas({
            from: context.account,
            gasPrice: estGasPrice,
        }, function(error, gasAmount) {
            if (error) {
                console.log(error)
                setNotifyMessage('Transaction error, do you have enough BNB for gas fee?')
                setNotifyType('warning')
                setLoadingHarvest(false)
            }
            gasLimit = (Math.floor(gasAmount * 1.5)).toFixed(0)
            gasFee = (bn(gasLimit).times(bn(estGasPrice))).toFixed(0)
        })
        let enoughBNB = true
        var gasBalance = await getBNBBalance(context.account)
        if (bn(gasBalance).comparedTo(bn(gasFee)) === -1) {
            enoughBNB = false
            setNotifyMessage('You do not have enough BNB for gas fee!')
            setNotifyType('warning')
            setLoadingHarvest(false)
        }
        else if (enoughBNB === true) {
            console.log('Harvesting SPARTA', estGasPrice, gasLimit, gasFee)
            await contract.methods.harvest().send({
                from: context.account,
                gasPrice: estGasPrice,
                gas: gasLimit,
            }, function(error, transactionHash) {
                if (error) {
                    console.log(error)
                    setNotifyMessage('Transaction cancelled')
                    setNotifyType('warning')
                    setLoadingHarvest(false)
                }
                else {
                    console.log('txn:', transactionHash)
                    setNotifyMessage('Harvest Pending...')
                    setNotifyType('success')
                    contTxn = true
                }
            })
            if (contTxn === true) {
                setNotifyMessage('Harvested SPARTA!')
                setNotifyType('success')
                setLoadingHarvest(false)
            }
        }
        await refreshData()
    }

    const refreshData = async () => {
        if (context.walletDataLoading !== true) {
            // Refresh BNB & SPARTA balance
            context.setContext({'walletDataLoading': true})
            let walletData = await updateWalletData(context.account, context.walletData, BNB_ADDR)
            walletData = await updateWalletData(context.account, walletData, SPARTA_ADDR)
            context.setContext({'walletData': walletData})
            context.setContext({'walletDataLoading': false})
        }
        // Notification to show txn complete
        setNotifyMessage('Transaction Sent!')
        setNotifyType('success')
    }

    const migrateLiq = async () => {
        setNotifyMessage('...')
        setLoadingHarvest(true)
        let gasFee = 0
        let gasLimit = 0
        let contTxn = false
        const estGasPrice = await getGasPrice()
        let contract = getMigrationContract()
        console.log('Estimating gas', estGasPrice)
        await contract.methods.migrateLiquidity().estimateGas({
            from: context.account,
            gasPrice: estGasPrice,
        }, function(error, gasAmount) {
            if (error) {
                console.log(error)
                setNotifyMessage('Transaction error, do you have enough BNB for gas fee?')
                setNotifyType('warning')
                setLoadingHarvest(false)
            }
            gasLimit = (Math.floor(gasAmount * 1.5)).toFixed(0)
            gasFee = (bn(gasLimit).times(bn(estGasPrice))).toFixed(0)
        })
        let enoughBNB = true
        var gasBalance = await getBNBBalance(context.account)
        if (bn(gasBalance).comparedTo(bn(gasFee)) === -1) {
            enoughBNB = false
            setNotifyMessage('You do not have enough BNB for gas fee!')
            setNotifyType('warning')
            setLoadingHarvest(false)
        }
        else if (enoughBNB === true) {
            console.log('Migrating Liquidity', estGasPrice, gasLimit, gasFee)
            await contract.methods.migrateLiquidity().send({
                from: context.account,
                gasPrice: estGasPrice,
                gas: gasLimit,
            }, function(error, transactionHash) {
                if (error) {
                    console.log(error)
                    setNotifyMessage('Transaction cancelled')
                    setNotifyType('warning')
                    setLoadingHarvest(false)
                }
                else {
                    console.log('txn:', transactionHash)
                    setNotifyMessage('Liquidity migration pending...')
                    setNotifyType('success')
                    contTxn = true
                }
            })
            if (contTxn === true) {
                setNotifyMessage('Liquidity migration complete!')
                setNotifyType('success')
                setLoadingHarvest(false)
            }
        }
        await refreshData()
    }

    function getStepContent(step) {
        switch (step) {
            case 0:
                return context.sharesData &&
                    <div key={0} className="table-responsive">
                        
                        {context.sharesData.filter(x => x.locked > 0).length > 0 &&
                            <>
                                <CardSubtitle className="mt-1 mb-3">
                                    <br/>Unlock your LP tokens from the DAO to join the new Spartan Shield Wall!<br/>
                                </CardSubtitle>

                                <Table className="table-centered mb-0">

                                    <thead className="center">
                                    <tr>
                                        <th className="d-none d-lg-table-cell" scope="col">{props.t("Pool")}</th>
                                        <th className="d-none d-lg-table-cell" scope="col">{props.t("Locked")}</th>
                                        <th scope="col">{props.t("Action")}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        {context.sharesData.filter(x => x.units + x.locked > 0).sort((a, b) => (parseFloat(a.units + a.locked) > parseFloat(b.units + b.locked)) ? -1 : 1).map(c =>
                                            <EarnTableItem 
                                                key={c.address}
                                                symbAddr={c.address}
                                                address={c.poolAddress}
                                                symbol={c.symbol}
                                                units={c.units}
                                                member={member}
                                                locked={c.locked}
                                                harvest={harvest}
                                                loadingHarvest={loadingHarvest}
                                                lastHarvest={lastHarvest}
                                            />
                                        )}
                                        <tr>
                                            <td colSpan="5">
                                                {context.sharesDataLoading !== true && context.sharesDataComplete === true && context.sharesData.filter(x => x.units + x.locked > 0).length > 0 &&
                                                    <div className="text-center m-2">All Locked LP Tokens Loaded</div>
                                                }
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </>
                        }
                        {context.sharesData.filter(x => x.locked > 0).length === 0 &&
                            <>
                                <CardSubtitle className="mt-1 mb-3">
                                    'Dao' migration complete!<br/>
                                    Click 'Next Step' to proceed to 'Liquidity' migration
                                </CardSubtitle>
                                <div class="circle-loader load-complete">
                                    <div class="checkmark draw" style={{display: "block"}}></div>
                                </div>
                            </>
                        }
                    </div>
                
        ;
            case 1:
                return context.sharesData &&
                <div key={0} className="table-responsive">

                {context.sharesData.filter(x => x.locked > 0).length === 0 && context.sharesData.filter(x => x.units > 0).length > 0 &&   
                    <>
                        <CardSubtitle className="mt-1 mb-3">
                            Migrate your pooled liquidity into the new Spartan Pools to resume earning Fees + Dividends.<br/>
                            Pools that aren't available in DAppV2 will be withdrawn to your wallet.
                        </CardSubtitle>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => migrateLiq()}
                            className={"m-2"}
                        >
                            <i className="bx bx-swim align-middle"/><br/>
                            Migrate Liquidity
                        </Button>
                        
                    </>
                }
                {context.sharesData.filter(x => x.locked > 0).length === 0 && context.sharesData.filter(x => x.units > 0).length === 0 &&   
                    <>
                        <div class="circle-loader">
                            <div class="checkmark draw"></div>
                        </div>
                        <CardSubtitle className="mt-1 mb-3">
                            Liquidity migration complete!<br/>
                            Click 'Next Step' to proceed to 'BondV2' migration
                        </CardSubtitle>
                        <div class="circle-loader load-complete">
                            <div class="checkmark draw"></div>
                        </div>
                    </>
                }
            </div>
            case 2:
                        return context.sharesData &&
                        <div key={0} className="table-responsive">


                {context.sharesData?.filter(x => x.locked > 0).length === 0 &&
                    context.sharesData.filter(x => x.units > 0).length === 0 &&
                    context.sharesData.filter(x => x.bondedv2LP > 0).length > 0 &&
                    <>
                        <CardSubtitle className="mt-1 mb-3">
                            Migrate your Bondv2 LP tokens into the new Spartan Pools to resume earning Fees + Dividends<br/>
                        </CardSubtitle>
                        <Table className="table-centered mb-0">

                            <thead className="center">
                            <tr>
                                <th className="d-none d-lg-table-cell" scope="col">{props.t("Pool")}</th>
                                <th className="d-none d-lg-table-cell" scope="col">{props.t("Bonded LP Tokens")}</th>
                                <th scope="col">{props.t("Action")}</th>
                            </tr>
                            </thead>
                            <tbody>

                            {context.sharesData.filter(x => (x.units + x.locked) > 0).sort((a, b) => (parseFloat(a.units + a.locked) > parseFloat(b.units + b.locked)) ? -1 : 1).map(c =>
                                    <Bondv2TableItem 
                                        key={c.address}
                                        symbAddr={c.address}
                                        address={c.poolAddress}
                                        symbol={c.symbol}
                                        bondedv2LP={c.bondedv2LP}
                                        bondv2Member={c.bondv2Member}
                                    />
                            )}
                                <tr>
                                    <td colSpan="5">
                                    {context.sharesData === true &&
                                        <div className="text-center m-2"><i className="bx bx-spin bx-loader"/></div>
                                    }
                                    {context.sharesData !== true && context.sharesData.filter(x => x.bondv2Member === true).length > 0 &&
                                        <div className="text-center m-2">Loaded all wallet LP tokens</div>
                                    }
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </>
                }
                {context.sharesData.filter(x => x.locked > 0).length === 0 && context.sharesData.filter(x => x.units > 0).length === 0 && context.sharesData.filter(x => x.bondedv2LP > 0).length === 0 &&
                    <>
                        <CardSubtitle className="mt-1 mb-3">
                            BondV2 migration complete!<br/>
                            Click 'Next Step' to proceed to 'BondV3' migration
                        </CardSubtitle>
                    </>
                }
                {/* {context.sharesData.filter(x => x.locked > 0).length === 0 && context.sharesData.filter(x => x.units > 0).length === 0 && context.sharesData.filter(x => x.bondedv2LP > 0).length === 0 && context.sharesData.filter(x => x.bondv2Member === true).length === 0 &&
                    <>
                        <CardSubtitle className="mt-1 mb-3">
                            This step is not relevant to your wallet<br/>
                            Click 'Next Step' to proceed to 'BondV3' migration
                        </CardSubtitle>
                    </>
                } */}
                        
            </div>
                
            case 3:

                return  context.sharesData &&
                <div key={0} className="table-responsive">

                {context.sharesData?.filter(x => x.locked > 0).length === 0 &&
                    context.sharesData.filter(x => x.units > 0).length === 0 &&
                    context.sharesData.filter(x => x.bondedv2LP > 0).length === 0 &&
                    context.sharesData.filter(x => x.bondedv3LP > 0).length > 0 &&
                    <>                        
                        <CardSubtitle className="mt-1 mb-3">
                            Migrate your Bondv3 LP tokens into the new Spartan Pools to resume earning Fees + Dividends<br/>
                        </CardSubtitle>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={console.log('migrate bondv3')}
                            className={"m-2"}
                        >
                            MIGRATE BONDV3
                        </Button>
                    </>
                }
                {context.sharesData.filter(x => x.locked > 0).length === 0 && context.sharesData.filter(x => x.units > 0).length === 0 && context.sharesData.filter(x => x.bondedv2LP > 0).length === 0 && context.sharesData.filter(x => x.bondedv3LP > 0).length === 0 &&
                    <>
                        <CardSubtitle className="mt-1 mb-3">
                            BondV3 migration complete!<br/>
                            *IMPORTANT* Click 'Finish' to finalise migration!
                        </CardSubtitle>
                    </>
                }
                {/* {context.sharesData.filter(x => x.locked > 0).length === 0 && context.sharesData.filter(x => x.units > 0).length === 0 && context.sharesData.filter(x => x.bondedv2LP > 0).length === 0 && context.sharesData.filter(x => x.bondedv3LP > 0).length === 0 && context.sharesData.filter(x => x.bondv3Member === true).length === 0 &&
                    <>
                        <CardSubtitle className="mt-1 mb-3">
                            Nearly done!<br/>
                            *IMPORTANT* Click 'Finish' to finalise migration!
                        </CardSubtitle>
                    </>
                } */}
            </div>
            // no default
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
            <Card>
                <Row>
                     <Col sm={12} className="mr-20">
                                <div>
                                    <h1 className="text-center m-2 ">Spartan Protocol Migration</h1>
                                    {context.walletDataLoading === true &&
                                                 <div className="text-center m-2"><i className="bx bx-spin bx-loader"/></div>
                                                 }
                                   {context.walletDataLoading !== true &&
                                    <Stepper id="card-migration" className ="m-2 px-0 px-sm-2" activeStep={activeStep} orientation="vertical">

                                        {steps.map((label, index) => (
                                            <Step key={index}>
                                                
                                                <StepLabel>{label}</StepLabel>
                                                
                                                <StepContent>
                                                    {getStepContent(index)}
                                                    <div className="m-2">
                                                        <div>
                                                            <Button
                                                                hidden={activeStep === 0}
                                                                onClick={handleBack}
                                                                className={"m-2"}
                                                            > Back </Button>
                                                            {activeStep === 0 && context.sharesData?.filter(x => x.locked > 0).length === 0 && 
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    onClick={handleNext}
                                                                    className={"m-2"}
                                                                >
                                                                    {activeStep === steps.length - 1 ? 'Finish' : 'Next Step'}
                                                                </Button>
                                                            }
                                                            {activeStep === 1 && context.sharesData?.filter(x => x.locked > 0).length === 0 &&
                                                                context.sharesData.filter(x => x.units > 0).length === 0 &&
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    onClick={handleNext}
                                                                    className={"m-2"}
                                                                >
                                                                    {activeStep === steps.length - 1 ? 'Finish' : 'Next Step'}
                                                                </Button>
                                                            }
                                                            {activeStep === 2 && context.sharesData?.filter(x => x.locked > 0).length === 0 &&
                                                                context.sharesData.filter(x => x.units > 0).length === 0 &&
                                                                context.sharesData.filter(x => x.bondedv2LP > 0).length === 0 &&
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    onClick={handleNext}
                                                                    className={"m-2"}
                                                                >
                                                                    {activeStep === steps.length - 1 ? 'Finish' : 'Next Step'}
                                                                </Button>
                                                            }
                                                            {activeStep === 2 && context.sharesData?.filter(x => x.locked > 0).length === 0 &&
                                                                context.sharesData.filter(x => x.units > 0).length === 0 &&
                                                                context.sharesData.filter(x => x.bondedv2LP > 0).length === 0 &&
                                                                context.sharesData.filter(x => x.bondedv3LP > 0).length === 0 &&
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    onClick={handleNext}
                                                                    className={"m-2"}
                                                                >
                                                                    {activeStep === steps.length - 1 ? 'Finish' : 'Next Step'}
                                                                </Button>
                                                            }
                                                        </div>
                                                    </div>
                                                </StepContent>
                                            </Step>
                                        ))}
                                    </Stepper>
}
                                    
                                    {activeStep === steps.length && (
                                        <Paper square elevation={0} className="p-3">
                                            <Typography>
                                                Migration to SpartanProtocolV2 Complete!
                                                If you were locked in Lock+Earn you will just need to lock-up again in DAppV2 with your new STP2 LP tokens!
                                            </Typography>
                                            <Button href={'https://dapp.spartanprotocol.org/'} color="primary" className={"m-2"}>
                                               Proceed to DappV2!
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
