import React, {useContext, useState} from "react";
import {Context} from "../../context";
import {TokenIcon} from '../Common/TokenIcon'
import {convertFromWei, formatAllUnits, bn} from "../../utils";
import {
    Progress, Button,
    Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap'

import {getDaoContract, updateSharesData, updateWalletData, BNB_ADDR, getGasPrice, getBNBBalance} from '../../client/web3'
import Notification from '../../components/Common/notification'

import {withNamespaces} from "react-i18next";
import {withRouter} from "react-router-dom";

import BigNumber from 'bignumber.js';

export const LPTableItem = (props) => {

    const context = useContext(Context)
    const [notifyMessage,setNotifyMessage] = useState("");
    const [notifyType,setNotifyType] = useState("dark");

    const units = new BigNumber(props.units)
    const locked = new BigNumber(props.locked)
    const total = units.plus(locked)
    const lockedPC = locked.dividedBy(total).times(100).toFixed(0)
    //const availPC = units.dividedBy(total).times(100).toFixed(0)

    const deposit = async (record) => {
        setNotifyMessage('...')
        let gasFee = 0
        let gasLimit = 0
        let contTxn = false
        const estGasPrice = await getGasPrice()
        let contract = getDaoContract()
        console.log('Estimating gas', '1', estGasPrice)
        await contract.methods.deposit(record.address, '1').estimateGas({
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
            console.log('Migrating', record.units, estGasPrice, gasLimit, gasFee)
            await contract.methods.deposit(record.address, record.units).send({
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
                    setNotifyMessage('Migrating Pending...')
                    setNotifyType('success')
                    contTxn = true
                }
            })
            if (contTxn === true) {
                setNotifyMessage('Migration Complete!')
                setNotifyType('success')
            }
        }
        await refreshData(record.symbAddr)
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

    const [isMember, setIsMember] = useState(false)
    const getIsMember = () => {
        if (props.member.weight > 0) {setIsMember(true)}
        if (props.member.weight === 0) {setIsMember(false)}
    }

    const [showLockModal, setShowLockModal] = useState(false)
    const [showUnlockModal, setShowUnlockModal] = useState(false)

    const toggleLock = () => {
        getIsMember()
        setShowLockModal(!showLockModal)
    }

    const toggleUnlock = () => {
        getIsMember()
        setShowUnlockModal(!showUnlockModal)
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

                        <button type="button" className="btn btn-info waves-effect waves-light m-1 w-75" onClick={()=>toggleUnlock()}>
                            <i className="bx bx-swim font-size-16 align-middle"/> Migrate {props.symbol} Liquidity
                        </button>
                    
                    <Notification type={notifyType} message={notifyMessage}/>

                </td>
            </tr>
}
        </>
)
};

export default withRouter(withNamespaces()(LPTableItem));