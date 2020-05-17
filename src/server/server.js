import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

require("babel-polyfill");


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

let numOracles = 30;
var oracleAddresses = [];
var contractOwner;

var statusList = [0, 10, 20, 30, 40, 50];

(async() => {
    let accounts = await web3.eth.getAccounts();
    contractOwner = accounts[0];
    //console.log(contractOwner);
    let registrationFee = await web3.utils.toWei("1", "ether");

    for (let c = accounts.length - numOracles; c < accounts.length; c++) {
        let oracleAddress = accounts[c];
        try {
            await flightSuretyApp.methods.registerOracle().send({from:oracleAddress, value:registrationFee, gas:2000000});
            oracleAddresses.push(oracleAddress);
        } catch(err) {
            console.log(err);
        }
    }

    flightSuretyApp.events.OracleRequest({
        fromBlock: 0
    }, async function (error, event) {
        if (error) {
            console.log(error);
        } else {
            //console.log(event);
            console.log("Index chosen: ", event.returnValues[0]);
            console.log("Airline address: ", event.returnValues[1]);
            console.log("Flight Code: ", event.returnValues[2]);
            console.log("Departure date: ", new Date(Number(event.returnValues[3])).toGMTString());
            let numOracles = oracleAddresses.length;
            let indexChosen = event.returnValues[0];
            let airlineAddress = event.returnValues[1];
            let flightCode = event.returnValues[2];
            let deptDate = event.returnValues[3];
            for (let c = 0; c < numOracles; c++) {
                let oracleInfo = await flightSuretyApp.methods.getOracleInfo(oracleAddresses[c]).call({from:contractOwner});
                // if the oracle contains the chosen index in its list
                console.log(oracleInfo)
                if (oracleInfo[1].includes(indexChosen)) {
                    let randomInt = Math.floor(Math.random() * 9);
                    // raise the chances of STATUS_CODE_LATE_AIRLINE being chosen
                    if (randomInt < 4) {
                        try {
                            await flightSuretyApp.methods.submitOracleResponse(Number(indexChosen), airlineAddress, flightCode, deptDate, 20).send({from:oracleAddresses[c], gas:1000000});
                            console.log(`Response from the oracle ${c} with indices ${oracleInfo[1]}: 20`);
                        } catch(err) {
                            console.log(err);
                        }

                    } else {
                        switch (randomInt) {
                            case 5:
                                try {
                                    await flightSuretyApp.methods.submitOracleResponse(Number(indexChosen), airlineAddress, flightCode, deptDate, 0).send({from:oracleAddresses[c], gas:1000000});
                                    console.log(`Response from the oracle ${c} with indices ${oracleInfo[1]}: 0`);
                                    break;
                                } catch(err) {
                                    console.log(err);
                                }

                            case 6:
                                try {
                                    await flightSuretyApp.methods.submitOracleResponse(Number(indexChosen), airlineAddress, flightCode, deptDate, 30).send({from:oracleAddresses[c], gas:1000000});
                                    console.log(`Response from the oracle ${c} with indices ${oracleInfo[1]}: 30`);
                                    break;
                                } catch(err) {
                                    console.log(err);
                                }

                            case 7:
                                try {
                                    await flightSuretyApp.methods.submitOracleResponse(Number(indexChosen), airlineAddress, flightCode, deptDate, 40).send({from:oracleAddresses[c], gas:1000000});
                                    console.log(`Response from the oracle ${c} with indices ${oracleInfo[1]}: 40`);
                                    break;
                                } catch(err) {
                                    console.log(err);
                                }

                            case 8:
                                try {
                                    await flightSuretyApp.methods.submitOracleResponse(Number(indexChosen), airlineAddress, flightCode, deptDate, 50).send({from:oracleAddresses[c], gas:1000000});
                                    console.log(`Response from the oracle ${c} with indices ${oracleInfo[1]}: 50`);
                                    break;
                                } catch(err) {
                                    console.log(err);
                                }
                        }
                    }
                }
            }
        }
    });

})();

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;
