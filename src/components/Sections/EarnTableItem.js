import React, {useContext, useState} from "react";
import {Context} from "../../context";
import {TokenIcon} from '../Common/TokenIcon'
import {convertFromWei, formatAllUnits} from "../../utils";

import {getDaoContract, getPoolSharesData, getListedTokens} from '../../client/web3'
import Notification from '../../components/Common/notification'

import {withNamespaces} from "react-i18next";
import {withRouter} from "react-router-dom";

export const EarnTableItem = (props) => {

    const [notifyMessage,setNotifyMessage] = useState("");
    const [notifyType,setNotifyType] = useState("dark");

    const context = useContext(Context)

    const lock = async (record) => {
        let contract = getDaoContract()
        let tx = await contract.methods.lock(record.poolAddress, record.units).send({ from: context.walletData.address })
        console.log(tx.transactionHash)
        await refreshData()
    }

    const unlock = async (record) => {
        let contract = getDaoContract()
        let tx = await contract.methods.unlock(record.poolAddress).send({ from: context.walletData.address })
        console.log(tx.transactionHash)
        await refreshData()
    }

    const harvest = async () => {
        let contract = getDaoContract()
        let tx = await contract.methods.harvest().send({ from: context.walletData.address })
        console.log(tx.transactionHash)
        await refreshData()
    }

    const refreshData = async () => {
        let stakesData = await getPoolSharesData(context.walletData.address, await getListedTokens())
        context.setContext({ 'stakesData': stakesData })
        setNotifyMessage('Transaction Sent!');
        setNotifyType('success')
    }

    return (
        <>
            <Notification
                type={notifyType}
                message={notifyMessage}
            />

            <tr>
                <td>
                    <TokenIcon address={props.address}/>
                </td>
                <td>
                    {props.symbol}
                </td>
                <td className="">
                    {formatAllUnits(convertFromWei(props.units))}
                </td>
                <td className="">
                    {formatAllUnits(convertFromWei(props.locked))}
                </td>
                <td className="">
                    <button type="button" className="btn btn-primary waves-effect waves-light" onClick={() => harvest(props)}>
                        <i className="bx bx-log-in-circle font-size-16 align-middle mr-2"></i> Harvest
                    </button>
                </td>
                <td className="">
                    <button type="button" className="btn btn-primary waves-effect waves-light" onClick={() => lock(props)}>
                        <i className="bx bx-log-in-circle font-size-16 align-middle mr-2"></i> Lock
                    </button>
                </td>
                <td className="">
                    <button type="button" className="btn btn-primary waves-effect waves-light" onClick={() => unlock(props)}>
                        <i className="bx bx-transfer-alt font-size-16 align-middle mr-2"></i> Unlock
                    </button>
                </td>
            </tr>
        </>
)
};

export default withRouter(withNamespaces()(EarnTableItem));