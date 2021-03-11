import React, { useContext, useEffect, useState } from "react"
import { Context } from "../../context"
import queryString from 'query-string';
import {getRewards, getDaoContract, 
    updateWalletData, BNB_ADDR, SPARTA_ADDR,
    getMemberDetail, getTotalWeight, getGasPrice, getBNBBalance,
} from "../../client/web3"
import Notification from '../Common/notification'

import { bn, one, formatBN, convertFromWei, convertToWei, formatAllUnits, formatGranularUnits, daysSince, hoursSince } from '../../utils'
import "../../assets/scss/custom/components/_rightbar.scss";
import BigNumber from 'bignumber.js';
import {
    Row, Col, InputGroup, InputGroupAddon, Label, UncontrolledTooltip,
    FormGroup, Card, CardTitle, Table, CardSubtitle, CardBody,Container,
    Spinner, Input, Modal, ModalHeader, ModalBody, ModalFooter, Button, Progress
} from "reactstrap"
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import { TokenIconChart } from '../Common/TokenIconChart'
import { Doughnut } from 'react-chartjs-2';
import { withNamespaces } from 'react-i18next'
import { withRouter, Link } from "react-router-dom"
import EarnTableItem from "./EarnTableItem"

const UpgradeComponent = (props) => {

    const context = useContext(Context)
    const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    function getSteps() {
        return [<CardTitle className="mt-2"><h4>DAO Migration</h4></CardTitle>, <CardTitle className="mt-2"><h4>Pool Liquidity Migration</h4></CardTitle>, <CardTitle className="mt-2"><h4>Bonded Assets Migration</h4></CardTitle>];
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
        }, 3000);
        return () => clearInterval(interval)
        // eslint-disable-next-line
    }, [context.walletData, context.account])

    const getData = async () => {
        let data = await Promise.all([getRewards(context.account), getMemberDetail(context.account), getTotalWeight()])
        let rewards = data[0]
        let memberDetails = data[1]
        let weight = data[2]
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

    function getStepContent(step) {
        switch (step) {
            case 0:
                return  context.sharesData &&
                    <div key={0} className="table-responsive">
                        
                        <CardSubtitle className="mb-3">
                            <br/>Unlock your LP tokens from the DAO to join the new Shield Wall!<br/>
                        </CardSubtitle>
                        <Table className="table-centered mb-0">

                            <thead className="center">
                            <tr>
                                <th className="d-none d-lg-table-cell" scope="col">{props.t("Icon")}</th>
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
                                        locked={c.locked}
                                        member={member}
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
                    </div>
                
        ;
            case 1:
                return <Row>
                <Col sm="2">
                  <PoolShareTable />
                </Col>
              </Row>;
            case 2:
                return `Migrate your bonded lps`;
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
                                    <h1 className="text-center m-2 ">Spartan Protocol Migration</h1>
                                    
                                    <Stepper className ="m-2"activeStep={activeStep} orientation="vertical">
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
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={handleNext}
                                                                className={"m-2"}
                                                            >
                                                                {activeStep === steps.length - 1 ? 'Finish' : 'Complete Step'}
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
export const PoolShareTable = () => {

    const context = useContext(Context)
  
    //useEffect(() => {
      //console.log(context.sharesData)
      // getPoolSharess()
      // console.log(context.stakes)
      // eslint-disable-next-line
    //}, [])
  
    return (
      <>
        <div>
          <Row>
            <Col>
              {!context.sharesData &&
                <div className="text-center m-2"><i className="bx bx-spin bx-loader"/></div>
              }
              {context.sharesData &&
                <Table className="text-center">
                  <tbody>                  
                    {context.sharesData.filter(x => (x.units + x.locked) > 0).sort((a, b) => (parseFloat(a.units + a.locked) > parseFloat(b.units + b.locked)) ? -1 : 1).map(c =>
                      <PoolItem 
                        key={c.address}
                        symbol={c.symbol}
                        address={c.address}
                        units={c.units}
                        locked={c.locked}
                      />
                    )}
                    <tr>
                        <td colSpan="5">
                            {context.sharesDataLoading === true &&
                                <div className="text-center m-2"><i className="bx bx-spin bx-loader"/></div>
                            }
                            {context.sharesDataLoading !== true && context.sharesDataComplete === true &&
                                <div className="text-center m-2">All Pool LP Tokens Loaded</div>
                            }
                        </td>
                    </tr>
                  </tbody>
                </Table>
              }
            </Col>
          </Row>
        </div>
      </>
    )
  }
  

export const PoolItem = (props) => {

    const units = new BigNumber(props.units)
    const locked = new BigNumber(props.locked)
    const total = units.plus(locked)
    //const lockedPC = locked.dividedBy(total).times(100).toFixed(0)
    var symbol = props.symbol
    symbol = symbol.substring(symbol.indexOf("-") + 1)
    
    const donutData = {
      labels: [
        "Available",
        "Locked"
      ],
      datasets: [
        {
          data: [convertFromWei(units).toFixed(2), convertFromWei(locked).toFixed(2)],
          backgroundColor: [
            "#a80005",
            "#556ee6"
          ],
          hoverBackgroundColor: [
            "#a80005",
            "#556ee6"
          ],
          borderWidth:1,
          borderColor:'#121212',
          hoverBorderColor: "#fff"
        }
      ]
    }
    
    const donutOptions = {
      legend: {
          display: false,
      },
      cutoutPercentage:60,
      tooltips: {
        // Disable the on-canvas tooltip
        enabled: false,
    
        custom: function(tooltipModel) {
            // Tooltip Element
            var tooltipEl = document.getElementById('chartjs-tooltip');
    
            // Create element on first render
            if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.id = 'chartjs-tooltip';
                tooltipEl.innerHTML = '<table></table>';
                document.body.appendChild(tooltipEl);
            }
    
            // Hide if no tooltip
            if (tooltipModel.opacity === 0) {
                tooltipEl.style.opacity = 0;
                return;
            }
    
            // Set caret Position
            tooltipEl.classList.remove('above', 'below', 'no-transform');
            if (tooltipModel.yAlign) {
                tooltipEl.classList.add(tooltipModel.yAlign);
            } else {
                tooltipEl.classList.add('no-transform');
            }
    
            function getBody(bodyItem) {
                return bodyItem.lines;
            }
    
            // Set Text
            if (tooltipModel.body) {
                var titleLines = tooltipModel.title || [];
                var bodyLines = tooltipModel.body.map(getBody);
    
                var innerHtml = '<thead>';
    
                titleLines.forEach(function(title) {
                    innerHtml += '<tr><th>' + title + '</th></tr>';
                });
                innerHtml += '</thead><tbody>';
    
                bodyLines.forEach(function(body, i) {
                    var colors = tooltipModel.labelColors[i];
                    var style = 'background:' + colors.backgroundColor;
                    style += '; border-color:' + colors.borderColor;
                    style += '; border-width: 2px';
                    var span = '<span style="' + style + '"></span>';
                    innerHtml += '<tr><td>' + span + body + '</td></tr>';
                });
                innerHtml += '</tbody>';
    
                var tableRoot = tooltipEl.querySelector('table');
                tableRoot.innerHTML = innerHtml;
            }
    
            // `this` will be the overall tooltip
            var position = this._chart.canvas.getBoundingClientRect();
    
            // Display, position, and set styles for font
            tooltipEl.style.opacity = 1;
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.left = position.left + window.pageXOffset - 20 + tooltipModel.caretX + 'px';
            tooltipEl.style.top = position.top + window.pageYOffset - 20 + tooltipModel.caretY + 'px';
            tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
            tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
            tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
            tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.zIndex = '10000';
            tooltipEl.style.background = 'rgba(0, 0, 0, .7)';
            tooltipEl.style.color = '#fff';
            tooltipEl.style.borderRadius = '3px';
        }
      }
    }
   
      return (
        <>
          <tr>
            <td className="align-middle w-50 p-4" style={{position:'relative'}}>
              <Doughnut width={68} height={68} data={donutData} options={donutOptions}/>
              
              <TokenIconChart address={props.address}/>
            </td>
            <td className="align-middle w-50 p-1">
              <h6>{symbol}:SPARTA</h6>
              <p className='m-2 font-size-12'>({props.symbol})</p>
              <h5 className='m-2'>{formatAllUnits(convertFromWei(total))}</h5>
            </td>
          </tr>
        </>
      )
    
    }