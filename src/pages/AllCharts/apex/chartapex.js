import React, {useEffect, useState} from 'react';
import ReactApexChart from 'react-apexcharts';
import {withRouter} from "react-router-dom"
import {withNamespaces} from "react-i18next";
import axios from 'axios'

// const url = 'https://api.coingecko.com/api/v3/coins/spartan-protocol-token?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';

//const url = 'https://api.coingecko.com/api/v3/coins/list';

const url = 'https://api.coingecko.com/api/v3/coins/spartan-protocol-token/market_chart?vs_currency=usd&days=5&interval=daily';

export const LineApexChart = () => {





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
        series: [{name: "High - 2018", data: [0.0844, 0.0854, 0.0834, 0.0834, 0.0824, 0.0844, 0.0824]}, {
            name: "Low - 2018",
            data: prices
        }],
        options: {
            chart: {zoom: {enabled: !1}, toolbar: {show: !1}},
            colors: ["#556ee6", "#34c38f"],
            dataLabels: {enabled: !0},
            stroke: {width: [3, 3], curve: "straight"},
            title: {text: "Average High & Low Temperature", align: "left"},
            grid: {row: {colors: ["transparent", "transparent"], opacity: .2}, borderColor: "#f1f1f1"},
            markers: {style: "inverted", size: 6},
            xaxis: {categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"], title: {text: "Month"}},
            yaxis: {title: {text: "Temperature"}, min: 5, max: 40},
            legend: {position: "top", horizontalAlign: "right", floating: !0, offsetY: -25, offsetX: -5},
            responsive: [{breakpoint: 600, options: {chart: {toolbar: {show: !1}}, legend: {show: !1}}}]
        }
    };

    return (
        <React.Fragment>

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
            <ReactApexChart options={chartData.options} series={chartData.series} type="line" height="380"/>
        </React.Fragment>
    )
}

export default withRouter(withNamespaces()(LineApexChart));