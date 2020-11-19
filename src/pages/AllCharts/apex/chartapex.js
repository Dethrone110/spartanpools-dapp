import React, {Component} from 'react';
import ReactApexChart from 'react-apexcharts';

// const url = 'https://api.coingecko.com/api/v3/coins/spartan-protocol-token?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';

//const url = 'https://api.coingecko.com/api/v3/coins/list';

const url = 'https://api.coingecko.com/api/v3/coins/spartan-protocol-token/market_chart?vs_currency=usd&days=5&interval=daily';


class chartapex extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            prices: []
        };
    }

    componentDidMount() {
        fetch(url)
            .then(res => res.json())
            .then((result) => {
                    console.log(result);
                    this.setState({
                        isLoaded: true,
                        items: result //  FILTER ?
                    });


                },
                (error) => {
                    this.setState({
                        isLoaded: true,
                        error
                    });
                }
            )
    }


    render() {
        const {error, isLoaded, items} = this.state;
        if (error) {
            return <div>Error: {error.message}</div>;
        } else if (!isLoaded) {
            return <div>Loading...</div>;
        } else {
            return (
                <ul>
                    <p>{items.prices}</p>
                    {/*{items.map(item => (*/}
                    {/*    <li key={item.id}>*/}
                    {/*        {item.name} {item.symbol}*/}
                    {/*    </li>*/}
                    {/*))}*/}

                </ul>
            );
        }
    }
}

export default chartapex;