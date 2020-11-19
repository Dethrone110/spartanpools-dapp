import React, {Component, useEffect, useState} from 'react';
import ReactApexChart from 'react-apexcharts';
import axios from "axios";
import {withNamespaces} from "react-i18next";
import withRouter from "react-router-dom/es/withRouter";

const url = 'https://api.coingecko.com/api/v3/coins/spartan-protocol-token/market_chart?vs_currency=usd&days=6&interval=daily';

export const SpLineApexChart = () => {

    const [isLoaded, setIsLoaded] = useState(false);
    const [prices, setPrices] = useState([]);
    const [items, setItems] = useState([]);

    useEffect(() => {
        getData()
    }, []);

    const getData = async () => {
        const res = await axios.get(url);
        const result = res.data;
        console.log(result);
        setIsLoaded(true);
        setItems(result);
        getPrices(result.prices)
    };

    const getPrices = (results) => {
        let itemPrices = [];
        for (let i = 0; i < results.length; i++) {
            itemPrices.push(results[i][1].toFixed(5));
        }
        setPrices(itemPrices);
        console.log(itemPrices)
    };


    let chartData = {
        series: [{
            name: 'series1',
            data: prices
        }],
        options: {
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 3,
            },

            colors: ['#556ee6', '#34c38f'],
            xaxis: {
                type: 'datetime',
                categories: ["2020-11-13", "2020-11-14", "2020-11-15", "2020-11-16", "2020-11-17", "2020-11-18","2020-11-19"],
            },
            grid: {
                borderColor: '#f1f1f1',
            },
            tooltip: {
                x: {
                    format: 'dd/MM/yy HH:mm'
                },
            }
        }

    };

    return (
        <React.Fragment>

            {/*{!isLoaded &&*/}
            {/*<div>Loading...</div>*/}
            {/*}*/}
            {/*{isLoaded &&*/}
            {/*<ul>*/}
            {/*    {prices.map(price => (*/}
            {/*        <li key={price.id}>{price}</li>*/}
            {/*    ))}*/}

            {/*    /!*{items.map(item => (*!/*/}
            {/*    /!*    <li key={item.id}>*!/*/}
            {/*    /!*        {item.name} {item.symbol}*!/*/}
            {/*    /!*    </li>*!/*/}
            {/*    /!*))}*!/*/}

            {/*</ul>*/}
            {/*}*/}
            <ReactApexChart options={chartData.options} series={chartData.series} type="area" height="350" />
        </React.Fragment>
    )
}


export default withRouter(withNamespaces()(SpLineApexChart));