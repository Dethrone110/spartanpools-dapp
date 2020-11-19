import React, {useEffect, useState} from 'react';
import ReactApexChart from 'react-apexcharts';
import { withRouter } from "react-router-dom"
import {withNamespaces} from "react-i18next";
import axios from 'axios'

// const url = 'https://api.coingecko.com/api/v3/coins/spartan-protocol-token?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';

//const url = 'https://api.coingecko.com/api/v3/coins/list';

const url = 'https://api.coingecko.com/api/v3/coins/spartan-protocol-token/market_chart?vs_currency=usd&days=5&interval=daily';

export const LineApexChart = () => {

    const [isLoaded,setIsLoaded] = useState(false)
    const [prices,setPrices] = useState([])
    const [items,setItems] = useState([])

    useEffect(() => {
        getData()
    },[])

    const getData = async () => {
        const res = await axios.get(url)
        const result = res.data
        console.log(result)
        setIsLoaded(true)
        setItems(result)
        getPrices(result.prices)
    }

    const getPrices = (results) => {
        let itemPrices = []
        for (let i = 0; i < results.length; i++) {
            itemPrices.push(results[i][1])
        }
        setPrices(itemPrices)
        console.log(itemPrices)
    }

    return (
        <>
            {!isLoaded &&
                <div>Loading...</div>
            }
            {isLoaded && 
                <ul>
                    {prices.map(price => (
                        <li key={price.id}>{price}</li>
                    ))}
                    
                    {/*{items.map(item => (*/}
                    {/*    <li key={item.id}>*/}
                    {/*        {item.name} {item.symbol}*/}
                    {/*    </li>*/}
                    {/*))}*/}

                </ul>
            }
        </>
    )
}

export default withRouter(withNamespaces()(LineApexChart));