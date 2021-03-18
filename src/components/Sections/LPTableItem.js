import React, {useContext, useState, useEffect} from "react";
import {Context} from "../../context";
import {TokenIcon} from '../Common/TokenIcon'
import {convertFromWei, formatAllUnits, bn} from "../../utils";
import {
    Progress, Button,
    Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap'

import {getDaoContract, updateSharesData, updateWalletData, BNB_ADDR, getGasPrice, getBNBBalance, getMigrationContract, MIGRATE_ADDR, getTokenContract} from '../../client/web3'
import Notification from '../../components/Common/notification'

import {withNamespaces} from "react-i18next";
import {withRouter} from "react-router-dom";

import BigNumber from 'bignumber.js';

export const LPTableItem = (props) => {

    const context = useContext(Context)
    const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    const [notifyMessage,setNotifyMessage] = useState("");
    const [notifyType,setNotifyType] = useState("dark");

    const [getDataCount, setGetDataCount] = useState(0)
    const [approvalToken, setApprovalToken] = useState(false)
    const [loadingApproval, setLoadingApproval] = useState(false)

    useEffect(() => {
        if (context.sharesData && context.walletData) {
            getData()
        }
        // eslint-disable-next-line
    }, [context.sharesData, context.walletData, getDataCount])

    const checkApproval = async () => {
        const contract = getTokenContract(props.address)
        const approvalToken = await contract.methods.allowance(context.account, MIGRATE_ADDR).call()
        if (+approvalToken > 0) {
            return true
        } else {
            return false
        }
    }

    const getData = async () => {
        await checkApproval(props.address) ? setApprovalToken(true) : setApprovalToken(false)
        await pause(2000)
        setGetDataCount(getDataCount + 1)
    }

    const refreshData = async (tokenAddr) => {
        if (context.walletDataLoading !== true) {
            // Refresh BNB balance
            context.setContext({'walletDataLoading': true})
            let walletData = await updateWalletData(context.account, context.walletData, BNB_ADDR)
            context.setContext({'walletData': walletData})
            context.setContext({'walletDataLoading': false})
        }
        if (context.sharesDataLoading !== true) {
            // Refresh sharesData for specific token
            console.log(tokenAddr)
            let sharesData = await updateSharesData(context.account, context.sharesData, tokenAddr)
            context.setContext({'sharesDataLoading': true})
            context.setContext({'sharesData': sharesData})
            context.setContext({'sharesDataLoading': false})
        }
        // Notification to show txn complete
        setNotifyMessage('Transaction Sent!');
        setNotifyType('success')
    }

    const unlock = async () => {
        setNotifyMessage('...')
        setLoadingApproval(true)
        let gasFee = 0
        let gasLimit = 0
        let contTxn = false
        const estGasPrice = await getGasPrice()
        const contract = getTokenContract(props.address)
        const supply = await contract.methods.totalSupply().call()
        await contract.methods.approve(MIGRATE_ADDR, supply).estimateGas({
            from: context.account,
            gasPrice: estGasPrice,
        }, function(error, gasAmount) {
            if (error) {
                console.log(error)
                setNotifyMessage('Transaction error, do you have enough BNB for gas fee?')
                setNotifyType('warning')
                setLoadingApproval(false)
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
            setLoadingApproval(false)
        }
        if (enoughBNB === true) {
            console.log('Approving token', estGasPrice, gasLimit, gasFee)
            await contract.methods.approve(MIGRATE_ADDR, supply).send({
                from: context.account,
                gasPrice: estGasPrice,
                gas: gasLimit,
            }, function (error, transactionHash) {
                if (error) {
                    console.log(error)
                    setNotifyMessage('Token Approval Cancelled')
                    setNotifyType('warning')
                    setLoadingApproval(false)
                }
                else {
                    console.log('txn:', transactionHash)
                    setNotifyMessage('Token Approval Pending...')
                    setNotifyType('success')
                    contTxn = true
                }
            })
            if (contTxn === true) {
                setNotifyMessage('Token Approved!')
                setNotifyType('success')
                setLoadingApproval(false)
                setApprovalToken(true)
                if (context.walletDataLoading !== true) {
                    // Refresh BNB balance
                    context.setContext({'walletDataLoading': true})
                    let walletData = await updateWalletData(context.account, context.walletData, BNB_ADDR)
                    context.setContext({'walletData': walletData})
                    context.setContext({'walletDataLoading': false})
                }
            }
        }
    }

    const migrate = async () => {
        setNotifyMessage('...')
        let gasFee = 0
        let gasLimit = 0
        let contTxn = false
        const estGasPrice = await getGasPrice()
        let contract = getMigrationContract()
        console.log('Estimating gas', estGasPrice)
        await contract.methods.migrateLiquidity(props.symbAddr, props.units).estimateGas({
            from: context.account,
            gasPrice: estGasPrice
        }, function(error, gasAmount) {
            if (error) {
                console.log(error)
                setNotifyMessage('Transaction error, do you have enough BNB for gas fee?')
                setNotifyType('warning')
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
        }
        else if (enoughBNB === true) {
            console.log('Migrating LP', estGasPrice, gasLimit, gasFee)
            await contract.methods.migrateLiquidity(props.symbAddr, props.units).send({
                from: context.account,
                gasPrice: estGasPrice,
                gas: gasLimit,
            }, function(error, transactionHash) {
                if (error) {
                    console.log(error)
                    setNotifyMessage('Transaction cancelled')
                    setNotifyType('warning')
                }
                else {
                    console.log('txn:', transactionHash)
                    setNotifyMessage('UnLock Pending...')
                    setNotifyType('success')
                    contTxn = true
                }
            })
            if (contTxn === true) {
                setNotifyMessage('UnLock Complete!')
                setNotifyType('success')
            }
        }
        await refreshData(props.symbAddr)
    }

    return (
        <>
        {props.units > 0 &&
            <tr>
            
                <td className="d-none d-lg-table-cell">
                    <TokenIcon address={props.symbAddr}/>
                </td>
                
           
                <td className="d-none d-lg-table-cell">
                    {formatAllUnits(convertFromWei(props.units))}
                </td>
                
                <td>
                    {approvalToken === false &&
                        <>
                            <button type="button" className="btn btn-info m-1 w-auto" onClick={()=>unlock()}>
                                1. Approve Allowance
                            </button>
                            <button type="button" className="btn btn-danger m-1 w-auto" disabled>
                                2. Migrate {props.symbol}:SPARTA<i className="bx bx-swim font-size-16 align-middle ml-1"/>
                            </button>
                        </>
                    }
                    {approvalToken === true &&
                        <>
                            <button type="button" className="btn btn-info m-1 w-auto" disabled>
                                1. Approval Complete!
                            </button>
                            <button type="button" className="btn btn-info m-1 w-auto" onClick={()=>migrate()}>
                                2. Migrate {props.symbol}:SPARTA<i className="bx bx-swim font-size-16 align-middle ml-1"/>
                            </button>
                        </>
                    }
                    <Notification type={notifyType} message={notifyMessage}/>
                </td>
            </tr>
}
        </>
)
};

export default withRouter(withNamespaces()(LPTableItem));