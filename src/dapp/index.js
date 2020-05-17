
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import {flightCodes} from "./flightData.js";


(async() => {

    let result = null;
    //console.log("test");


    let contract = new Contract('localhost', () => {

        // add onfo about the owner of the contract
        (async() => {
            let owner = contract.owner;
            try {
                let airlineInfo = await contract.getAirline(owner);
                let address = airlineInfo[0];
                let airlineName = airlineInfo[1];
                let isRegistered = airlineInfo[2];
                let isFunded = airlineInfo[3];
                let contractOwnerElement = document.getElementById("contractOwner");
                let ownerInfoList = document.createElement("ul");
                for (let c = 0; c <= 3; c++) {
                    let listElement = document.createElement("li");
                    switch (c) {
                        case 0:
                            listElement.innerHTML = `Address: ${address}`;
                            break;
                        case 1:
                            listElement.innerHTML = `Airline: ${airlineName}`;
                            break;
                        case 2:
                            listElement.innerHTML = `Is registered: ${isRegistered}`;
                            break;
                        case 3:
                            listElement.innerHTML = `Is funded: ${isFunded}`;
                            break;
                        }
                    ownerInfoList.appendChild(listElement);
                }
                contractOwnerElement.appendChild(ownerInfoList);
                let showBalanceBtn = document.createElement("button");
                showBalanceBtn.innerHTML = "Show contract balance";
                showBalanceBtn.setAttribute("class", "btn btn-primary");
                showBalanceBtn.addEventListener("click", async function() {
                    let currentBalance = await contract.getContractBalance();
                    alert(`Current contract balance is: ${currentBalance / 10**18} ether`);
                });
                contractOwnerElement.appendChild(showBalanceBtn);

            } catch(e) {
                console.log(e);
            }
        })();

        // register all the airlines from the initial list - do it only once
        (async() => {
            var owner = contract.owner;
            let initialAirlineNames = ["Indian airlines",
                                        "American airlines",
                                        "Virgin airlines"
                                    ];
            let numAirlines = await contract.AirlineCount();
            if (numAirlines < 4) {
                for(let c = 0; c < initialAirlineNames.length; c++) {
                    try {
                        await contract.registerAirline(owner, contract.airlines[c+1], initialAirlineNames[c]);
                        console.log(`Airline ${initialAirlineNames[c]} is being registered...`);
                    } catch(error) {
                        console.log("There was an error");
                        console.log(error);
                    }
                }
                numAirlines = await contract.AirlineCount();
                console.log(Number(numAirlines));
            }
        })();

        // add the selector options with all the airlines to the airline registration form
        (async() => {
            let selectAirlineAddress = document.getElementById("selAddress");
            let airlines = contract.airlines;
            for (let c = 0; c < airlines.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", airlines[c]);
                newOption.innerHTML = `${c}: ${airlines[c]}`;
                selectAirlineAddress.appendChild(newOption);
            }
            selectAirlineAddress.addEventListener("change", () => {
                let addressParagraph = document.getElementById("currentAddress");
                addressParagraph.innerHTML = selectAirlineAddress.value;
            })
        })();

        // add the selector options with all the users
        (async() => {
            let allUsers = contract.allAccounts;
            let airlineRegAddressElement = document.getElementById("airlineReg-address");
            for (let c = 0; c < allUsers.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", allUsers[c]);
                newOption.innerHTML = `${c}: ${allUsers[c]}`;
                airlineRegAddressElement.appendChild(newOption);
            }
        })();

        (async() => {
            let allUsers = contract.allAccounts;
            let airlineFundAddressElement = document.getElementById("airlineFund-address");
            for (let c = 0; c < allUsers.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", allUsers[c]);
                newOption.innerHTML = `${c}: ${allUsers[c]}`;
                airlineFundAddressElement.appendChild(newOption);
            }
        })();

        (async() => {
            let allUsers = contract.allAccounts;
            let passengerAddressElement = document.getElementById("selPassengerAddress");
            for (let c = 0; c < allUsers.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", allUsers[c]);
                newOption.innerHTML = `${c}: ${allUsers[c]}`;
                passengerAddressElement.appendChild(newOption);
            }
            passengerAddressElement.addEventListener("change", async function() {
                let passengerPlaceholderElement = document.getElementById("currentPassengerAddress");
                passengerPlaceholderElement.innerHTML = passengerAddressElement.value;
            });
        })();

        (async() => {
            let flightDataKeys = Object.keys(flightCodes);
            let flightOriginElement = document.getElementById("flightOrigin");
            let flightDestinationElement = document.getElementById("flightDestination");
            for (let c = 0; c < flightDataKeys.length; c++) {
                let newOption = document.createElement("option");
                newOption.setAttribute("value", flightDataKeys[c]);
                newOption.innerHTML = flightDataKeys[c];
                flightOriginElement.appendChild(newOption);
                newOption = document.createElement("option");
                newOption.innerHTML = flightDataKeys[c];
                flightDestinationElement.appendChild(newOption);
            }

            flightOriginElement.addEventListener("change", () => {
                let originCodeElement = document.getElementById("originCode");
                originCodeElement.innerHTML = flightCodes[flightOriginElement.value];
            });

            flightDestinationElement.addEventListener("change", () => {
                let destinationCodeElement = document.getElementById("destinationCode");
                destinationCodeElement.innerHTML = flightCodes[flightDestinationElement.value];
            });

        })();

        (async() => {
            let flightDeptDateElement = document.getElementById("flightDepartureDay");
            flightDeptDateElement.addEventListener("change", () => {
                alert(flightDeptDateElement.value);
            })
        })();

        // fill in the hour and minute selectors - register flight functionality
        (async() => {
            let hourElem2 = document.getElementById("submit-oracle-departure-hour");
            let minuteElem2 = document.getElementById("submit-oracle-departure-min");

            for (let c = 0; c < 24; c++) {
                let newOption = document.createElement("option");
                if (c < 10) {
                    newOption.setAttribute("value", `0${c}`);
                    newOption.innerHTML = `0${c}`;
                } else {
                    newOption.setAttribute("value", c);
                    newOption.innerHTML = c;
                }
                hourElem2.appendChild(newOption);
            }
            for (let c = 0; c < 60; c++) {
                let newOption = document.createElement("option");
                if (c < 10) {
                    newOption.setAttribute("value", `0${c}`);
                    newOption.innerHTML = `0${c}`;
                } else {
                    newOption.setAttribute("value", c);
                    newOption.innerHTML = c;
                }
                minuteElem2.appendChild(newOption);
            }
        })();

        // fill in the hour and minute selectors - register flight functionality
        (async() => {
            let hourElem = document.getElementById("flightHour");
            let minuteElem = document.getElementById("flightMinute");

            for (let c = 0; c < 24; c++) {
                let newOption = document.createElement("option");
                if (c < 10) {
                    newOption.setAttribute("value", `0${c}`);
                    newOption.innerHTML = `0${c}`;
                } else {
                    newOption.setAttribute("value", c);
                    newOption.innerHTML = c;
                }
                hourElem.appendChild(newOption);
            }
            for (let c = 0; c < 60; c++) {
                let newOption = document.createElement("option");
                if (c < 10) {
                    newOption.setAttribute("value", `0${c}`);
                    newOption.innerHTML = `0${c}`;
                } else {
                    newOption.setAttribute("value", c);
                    newOption.innerHTML = c;
                }
                minuteElem.appendChild(newOption);
            }
        })();
        

        // end: adding select options

        // add the register flight functionality

        (async() => {
            let regFlightBtn = document.getElementById("reg-flight");
            regFlightBtn.addEventListener("click", async function() {
                let airlineAddress = document.getElementById("selAddress").value;

                let flightCode = document.getElementById("flightCode").value;
                let flightOrigin = document.getElementById("flightOrigin").value;
                let flightDestination = document.getElementById("flightDestination").value;

                let flightDeptDay = document.getElementById("flightDepartureDay").value;
                let flightDeptHour = document.getElementById("flightHour").value;
                let flightDeptMinute = document.getElementById("flightMinute").value;

                let departureDate = new Date(flightDeptDay + "T" + flightDeptHour + ":" + flightDeptMinute + ":00Z");
                //console.log(flightDeptDay + "T" + flightDeptHour + ":" + flightDeptMinute + ":00Z");
                departureDate = departureDate.getTime();
                console.log(departureDate);
                console.log(airlineAddress, " Airline address");
                console.log(flightCode, " flight code");
                console.log(flightOrigin, " origin");
                console.log(flightDestination, " destination");
                console.log(departureDate, " dept date");
                try {
                    await contract.registerFlight(airlineAddress, flightCode, flightOrigin, flightDestination, departureDate);
                } catch(err) {
                    console.log(err);
                }

            });
        })();

        (async() => {
            let showFlightsBtn = document.getElementById("show-flights");

            showFlightsBtn.addEventListener("click", showFlights);
        })();

        (async() => {
            let showAirlinesBtn = document.getElementById("show-airlines");
            showAirlinesBtn.addEventListener("click", showAirlines);
        })();

        // add the 'register airline functionality'
        (() => {
            let registerAirlineBtn = document.getElementById("register-airline");
            registerAirlineBtn.addEventListener("click", async function() {
                let senderAirlineAddr = document.getElementById("selAddress").value;
                let newAirlineAddress = document.getElementById("airlineReg-address").value;
                let newAirlineName = document.getElementById("airlineName").value;
                console.log(senderAirlineAddr);
                console.log(newAirlineAddress);
                console.log(newAirlineName);
                try {
                    await contract.registerAirline(senderAirlineAddr, newAirlineAddress, newAirlineName);
                    contract.airlines.push(newAirlineAddress);
                    console.log(contract.airlines);
                } catch(error) {
                    console.log(error);
                }
            });
        })();

        async function showAirlines() {
            let airlines = contract.airlines;
            let airlinesDisplayElement = document.getElementById("showRegisteredAirlines");
            airlinesDisplayElement.innerHTML = "";
            let table = document.createElement("table");
            let tableHeaders = `
            <tr><th>Address</th>
            <th>Name</th>
            <th>isRegistered</th>
            <th>isFunded</th>
            <th>voteToInclude</th>
            </tr>`;
            table.innerHTML = tableHeaders;
            let numAirlines = await contract.AirlineCount();
            console.log(Number(numAirlines));
            console.log(contract.airlines);
            for (let c = 0; c < numAirlines; c++) {
                let airlineAddress = contract.airlines[c];
                let airlineInfo = await contract.getAirline(airlineAddress);
                let tableRow = document.createElement("tr");
                let tabledata1 = document.createElement("td");
                tabledata1.innerHTML = airlineAddress;
                let tabledata2 = document.createElement("td");
                tabledata2.innerHTML = airlineInfo[1];
                let tabledata3 = document.createElement("td");
                tabledata3.innerHTML = airlineInfo[2];
                let tabledata4 = document.createElement("td");
                tabledata4.innerHTML = airlineInfo[3];
                tableRow.appendChild(tabledata1);
                tableRow.appendChild(tabledata2);
                tableRow.appendChild(tabledata3);
                tableRow.appendChild(tabledata4);
                if (!airlineInfo[2]) {
                    let tabledata5 = document.createElement("td");
                    let voteBtn = document.createElement("button");
                    voteBtn.innerHTML = "Cast vote";
            		//detailBtn.setAttribute("id", i+1);
            		voteBtn.addEventListener("click", async function() {

                        let sender = document.getElementById("selAddress").value;
                        await contract.castVote(airlineAddress, sender);
                        alert("Vote cast!");
                    });
                    tabledata5.appendChild(voteBtn);
                    tableRow.appendChild(tabledata5);
                }
                table.appendChild(tableRow);
            }
            airlinesDisplayElement.appendChild(table);
        };

        // add the show flights functionality
        async function showFlights() {
            let currentPassenger = document.getElementById("selPassengerAddress").value;
            let numFlights = await contract.getFlightCount();
            alert(`There are ${numFlights} flight(s) registered`);
            let flightDisplayElement = document.getElementById("showRegisteredFlights");
            flightDisplayElement.innerHTML = "";

            let table = document.createElement("table");
            let tableHeaders = `
            <tr><th>Airline</th>
            <th>Flight Code</th>
            <th>From</th>
            <th>To</th>
            <th>departureDate</th>
            <th>insureFlight (airlines)</th>
            <th>Status Code</th>
            <th>buyInsurance (passengers)</th>
            <th>Fetch status</th>
            </tr>`;
            table.innerHTML = tableHeaders;

            for (let c = 0; c < numFlights; c++) {
                let flightInfoTemp = await contract.getFlightByIndex(c);
                let airlineAddress = flightInfoTemp[7];
                let flightCode = flightInfoTemp[0];
                let departureDate = flightInfoTemp[6];

                let flightKey = await contract.getFlightKey(airlineAddress, flightCode, departureDate);
                let airlineInfo = await contract.getAirline(airlineAddress);
                let airlineName = airlineInfo[1];

                let flightInfo = await contract.getFlight(flightKey);
                console.log(flightInfo);

                let tableRow = document.createElement("tr");
                let tabledata1 = document.createElement("td");
                tabledata1.innerHTML = airlineName;
                let tabledata2 = document.createElement("td");
                tabledata2.innerHTML = flightInfo[0];
                let tabledata3 = document.createElement("td");
                tabledata3.innerHTML = flightInfo[1];
                let tabledata4 = document.createElement("td");
                tabledata4.innerHTML = flightInfo[2];
                let tabledata5 = document.createElement("td");
                tabledata5.innerHTML = new Date(Number(flightInfo[6])).toGMTString();

                tableRow.appendChild(tabledata1);
                tableRow.appendChild(tabledata2);
                tableRow.appendChild(tabledata3);
                tableRow.appendChild(tabledata4);
                tableRow.appendChild(tabledata5);

                let tabledata6 = document.createElement("td");
                let tabledata8 = document.createElement("td");
                let tabledata9 = document.createElement("td");
                console.log(flightInfo[4]);
                if (flightInfo[4]) {
                    tabledata6.innerHTML = "Insured";
                    let fetchStatusBtn = document.createElement("button");
                    fetchStatusBtn.innerHTML = "Get flight status";
                    fetchStatusBtn.addEventListener("click", async function() {
                        try {
                            let flightCode = flightInfo[0];
                            let departureDate = flightInfo[6];
                            await contract.getFlightStatus(currentPassenger, airlineAddress, flightCode, departureDate);
                            alert(`Fetching status of the flight ${flightCode}`);
                        } catch(err) {
                            console.log(flightCode);
                            alert(`There has been an error`);
                        }
                    });
                    tabledata9.appendChild(fetchStatusBtn);


                    let buyInsuranceBtn = document.createElement("button");
                    buyInsuranceBtn.innerHTML = "Buy insurance";
                    buyInsuranceBtn.addEventListener("click", async function() {
                        let passengerAddress = document.getElementById("selPassengerAddress").value;
                        let insurancePremium = document.getElementById("premiumVal").value;
                        insurancePremium = await contract.web3.utils.toWei(insurancePremium, "ether");
                        let flightCode = flightInfo[0];
                        let departureDate = flightInfo[6];
                        console.log(passengerAddress);
                        console.log(insurancePremium);
                        console.log(flightCode);
                        console.log(departureDate);
                        try {
                            await contract.buyInsurance(
                                passengerAddress,
                                airlineAddress,
                                departureDate,
                                flightCode,
                                insurancePremium);
                            alert(`Insurance for the flight ${flightCode} is being processed`);
                        } catch(err) {
                            console.log(err);
                            alert("There has been an error");
                        }
                    });
                    tabledata8.appendChild(buyInsuranceBtn);

                } else {
                    let insureFlightBtn = document.createElement("button");
                    insureFlightBtn.innerHTML = "Insure Flight";
                    insureFlightBtn.addEventListener("click", async function() {
                        let airlineSender = document.getElementById("selAddress").value;
                        console.log(airlineSender);
                        let flightCode = flightInfo[0];
                        console.log(flightCode);
                        let departureDate = Number(flightInfo[6]);
                        console.log(departureDate, typeof departureDate);
                        try {
                            await contract.insureFlight(airlineSender, flightCode, departureDate);
                            alert(`Flight ${flightCode} is being processed`);
                        } catch(err) {
                            console.log(err);
                            alert("There has been an error");
                        }
                    });
                    tabledata6.appendChild(insureFlightBtn);
                }
                tableRow.appendChild(tabledata6);


                let tabledata7 = document.createElement("td");
                let statusCode = flightInfo[5];
                tabledata7.innerHTML = statusCode;
                tableRow.appendChild(tabledata7);
                tableRow.appendChild(tabledata8);
                tableRow.appendChild(tabledata9);
                table.appendChild(tableRow);
            }
            flightDisplayElement.appendChild(table);
        }

        async function showInsuredFlights() {
            let passengerAddress = document.getElementById("selPassengerAddress").value;
            let numFlightsInsured = await contract.getInsuredKeysLength(passengerAddress);
            if (numFlightsInsured == 0) {
                alert(`There are no flights insured by the passenger ${passengerAddress}`);
            }
            console.log("Flights insured, ", numFlightsInsured);

            let insuredFlightsBox = document.getElementById("insuredFlightsBox");
            insuredFlightsBox.innerHTML = "";
            let table = document.createElement("table");
            let tableHeaders = `
            <tr><th>Airline</th>
            <th>Flight Code</th>
            <th>From</th>
            <th>To</th>
            <th>departureDate</th>
            <th>Status Code</th>
            <th>Insurer balance (ether)</th>
            <th>Withdraw funds</th>
            </tr>`;
            table.innerHTML = tableHeaders;

            for (let c = 0; c < numFlightsInsured; c ++) {
                let flightKey = await contract.getInsuredFlights(passengerAddress, c);
                let flightInfo = await contract.getFlight(flightKey);

                let airlineInfo = await contract.getAirline(flightInfo[7]);
                let airlineName = airlineInfo[1];
                let flightCode = flightInfo[0];
                let departureDate = flightInfo[6];
                let from = flightInfo[1];
                let to = flightInfo[2];
                let statCode = flightInfo[5];

                let insurerBalance = await contract.getInsuranceBalance(passengerAddress, flightKey);
                let insurerBalanceMod = await contract.web3.utils.fromWei(insurerBalance, "ether");

                let tableRow = document.createElement("tr");
                let tableData1 = document.createElement("td");
                tableData1.innerHTML = airlineName;
                let tableData2 = document.createElement("td");
                tableData2.innerHTML = flightCode;
                let tableData3 = document.createElement("td");
                tableData3.innerHTML = from;
                let tableData4 = document.createElement("td");
                tableData4.innerHTML = to;
                let tableData5 = document.createElement("td");
                tableData5.innerHTML = new Date(Number(departureDate)).toGMTString();
                let tableData6 = document.createElement("td");
                tableData6.innerHTML = statCode;
                let tableData7 = document.createElement("td");
                tableData7.innerHTML = insurerBalanceMod;
                let tableData8 = document.createElement("td");
                let withdrawBtn = document.createElement("button");
                withdrawBtn.innerHTML = "Withdraw funds";
                withdrawBtn.addEventListener("click", async function() {
                    if (insurerBalance != 0) {
                        try {
                            await contract.payOut(passengerAddress, flightKey, insurerBalance);
                            alert(`Withdrawing funds for flight ${flightCode} insurance`);
                        } catch(err) {
                            console.log(err);
                        }
                    } else {
                        alert("The user has no funds");
                    }
                });
                tableData8.appendChild(withdrawBtn);
                tableRow.appendChild(tableData1);
                tableRow.appendChild(tableData2);
                tableRow.appendChild(tableData3);
                tableRow.appendChild(tableData4);
                tableRow.appendChild(tableData5);
                tableRow.appendChild(tableData6);
                tableRow.appendChild(tableData7);
                tableRow.appendChild(tableData8);
                table.appendChild(tableRow);
            }
            insuredFlightsBox.appendChild(table);
        }

        // add show insured flight function to a button
        (async() => {
            let showInsuredBtn = document.getElementById("showInsuredFlights");
            showInsuredBtn.addEventListener("click", showInsuredFlights);
        })();

        // add fund airline function to a button
        (async() => {
            let fundBtn = document.getElementById("fund-airline");
            fundBtn.addEventListener("click", async function() {
                let selectAirlineAddress = document.getElementById("selAddress").value;
                let airlineToBeFunded = document.getElementById("airlineFund-address").value;
                try {
                    alert(`The airline ${airlineToBeFunded} is about to be funded`);
                    await contract.fundAirline(airlineToBeFunded);
                } catch(error) {
                    console.log(error);
                }
            })
        })();

        // User-submitted transaction
        DOM.elid("submit-oracle").addEventListener("click", async () => {
            let request = {
                airline: DOM.elid("submit-oracle-airline-address").value,
                flight: DOM.elid("submit-oracle-flight-code").value,
                departureDate: new Date(DOM.elid("submit-oracle-departure-day").value +
                 "T" + DOM.elid("submit-oracle-departure-hour").value +
                  ":" + DOM.elid("submit-oracle-departure-min").value + ":00Z").valueOf(),
            };
            let err, result;
            try {
                result = await contract.fetchFlightStatus(request);
            } catch (e) {
                console.log(e);
                err = e;
            } finally {
                display('Flight Status',
                    'Send the request to Oracle server to get the flight status code for this flight',
                    [
                       { label: 'Flight Status Code', error: err, value: result}
                        ]
                );

            }
        });

    });


})();

function display(title, description, results) {
    console.log(results);
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}
