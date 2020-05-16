
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  const owner = accounts[0];
  const secondAirline = accounts[1];
  const thirdAirline = accounts[2];
  const fourthAirline = accounts[3];
  const fifthAirline = accounts[4];

  const passenger = accounts[5];

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
    assert.equal(await config.flightSuretyApp.isOperational(), true, "Incorrect initial operating status value for flightSuretyApp");
  });

  it("check to see if app can call the isOperational() function of the data contract", async() => {
    let status = await config.flightSuretyApp.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });


  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

/****************************************************************************************/
/*                          Airlines                                                    */
/****************************************************************************************/

  it("Contract owner is created as the first airline", async() => {
    //await FlightSuretyData.deployed();
    let isAirline = await config.flightSuretyData.isAirline.call(owner);
    let numAirlines = await config.flightSuretyApp.AirlineCount.call();
    //console.log(numAirlines)
    assert.equal(isAirline, true, "No airline registerd by contract owner");
    assert.equal(numAirlines, 1, "There should be only 1 airline after the contract deployment");
  });

    it("deploys with initial contract balance 0", async() => {
        let contractBalance = await config.flightSuretyApp.getContractBalance.call();
        assert.equal(contractBalance, 0, "Contract balance after deployment should be equal to 0");
    });
 
    it("checks if the first airline can send funds to the contract and change its 'isFunded' state", async() => {
        let airlineFee = await web3.utils.toWei("10", "ether");
        let airlineBalanceBefore = await web3.eth.getBalance(owner);
        await config.flightSuretyApp.fundAirline({from: owner, value: airlineFee});
        let airlineBalanceAfter = await web3.eth.getBalance(owner);
        assert.isAbove(Number(airlineBalanceBefore) - Number(airlineBalanceAfter), Number(airlineFee));
        let airline = await config.flightSuretyApp.getAirlineDetails.call(owner);
        let isFunded = airline[3];
        assert.equal(isFunded, true);
    });

    it('4 Airlines can apply for registration without multiparty consensus', async function () {
    let isAirline = await config.flightSuretyData.isAirline.call(owner);
    assert.equal(isAirline, true, "No airline registerd by contract owner");
    await config.flightSuretyApp.registerAirline(secondAirline, "Airline 2", {from:owner});
    //assert.equal(isAirline2, true, "No airline registerd by contract owner");
    airlinec = await config.flightSuretyData.AirlineCount()
    assert.equal(2, airlinec)
    await config.flightSuretyData.registerAirline(thirdAirline, "Airline 3", {from:owner});
    await config.flightSuretyApp.registerAirline(fourthAirline, "Airline 4", { from: owner });
    let numAirlines = await config.flightSuretyApp.AirlineCount.call();
    assert.equal(numAirlines, 4);
    let airline3details = await config.flightSuretyApp.getAirlineDetails(thirdAirline);
    assert.equal(airline3details[0], thirdAirline);
    assert.equal(airline3details[1], "Airline 3");
    assert.equal(airline3details[2], true);
    assert.equal(airline3details[3], false);
  });

  it('Unfunded airlines cannot register another airline', async function () {
    let isAirline = await config.flightSuretyData.isAirline.call(owner);
    assert.equal(isAirline, true, "No airline registerd by contract owner");
    let error = false;
    try {
        await config.flightSuretyApp.registerAirline(fifthAirline, "Airline 5", {from:secondAirline});
    }
    catch(err) {
        error = true;
    }
    assert.equal(error, true, "Non-Funded airline should not be able to register an airline");
  });

  it('5th Airline should not be registered without multiparty consensus', async function () {
    await config.flightSuretyApp.registerAirline(fifthAirline, "Airline 5", { from: owner });
    let isFifthAirline = await config.flightSuretyData.isAirline.call(fifthAirline);
    assert.equal(isFifthAirline, false, "Airline cannot be registered without consensus");
    let numAirlines = await config.flightSuretyApp.AirlineCount.call();
    assert.equal(Number(numAirlines), 5);
  });

  it("Checking if multiparty consensus works", async() => {
    let airlineFee = await web3.utils.toWei("10", "ether");
    await config.flightSuretyApp.fundAirline({from: secondAirline, value: airlineFee});
    await config.flightSuretyApp.fundAirline({from: thirdAirline, value: airlineFee});
    await config.flightSuretyApp.fundAirline({from: fourthAirline, value: airlineFee});
    let airline = await config.flightSuretyApp.getAirlineDetails.call(secondAirline);
    let isFunded = airline[3];
    assert.equal(isFunded, true);
    let numAirlines = await config.flightSuretyApp.AirlineCount.call();
    // there are 5 airlines in the list
    assert.equal(Number(numAirlines), 5);
    let airline5details = await config.flightSuretyApp.getAirlineDetails.call(fifthAirline);

    await config.flightSuretyApp.castVote(fifthAirline, {from:owner});
    airline5details = await config.flightSuretyApp.getAirlineDetails.call(fifthAirline);
    assert.equal(fifthAirline[2], false);
    let numVotes = await config.flightSuretyApp.numVotesCasted.call(fifthAirline);
    assert.equal(numVotes, 1)
    await config.flightSuretyApp.castVote(fifthAirline, {from:secondAirline});
    airline5details = await config.flightSuretyApp.getAirlineDetails.call(fifthAirline);
    assert.equal(airline5details[2], false);
    numVotes = await config.flightSuretyApp.numVotesCasted.call(fifthAirline);
    assert.equal(numVotes, 2)
    await config.flightSuretyApp.castVote(fifthAirline, {from:thirdAirline});
    airline5details = await config.flightSuretyApp.getAirlineDetails(fifthAirline);
    // after 3 out of 4 votes the 5th airline gets registered
    assert.equal(airline5details[2], true);
    numVotes = await config.flightSuretyApp.numVotesCasted.call(fifthAirline);
    assert.equal(numVotes, 3)
});


it("checks that a non-airline user cannot register another airline", async() => {
    let user2 = accounts[7];
    let numAirlines = await config.flightSuretyApp.AirlineCount.call();
    assert.equal(numAirlines, 5, "INVALID NUMBER OF AIRLINES");
    let error;
    try {
        await config.flightSuretyApp.registerAirline(user2, "Fraudulant airlines", {from:user2});
    } catch(err) {
        error = true;
    }
    assert.equal(error, true, "Non-airline user should not be able to register an airline");
});

/****************************************************************************************/
/* Flights                                                                              */
/****************************************************************************************/

it("Check if a funded airline can register a flight", async() => {
    let airline1 = owner;
    let airline1Details = await config.flightSuretyApp.getAirlineDetails.call(airline1);
    // the first airline should be funded
    assert.equal(airline1Details[3], true);
    let dateString = "2020-05-28T14:45:00Z"
    let departureDate = new Date(dateString).getTime();
    await config.flightSuretyApp.registerFlight("ABC123", "NYC", "DEL", departureDate, {from:airline1});

    let numFlights = await config.flightSuretyApp.getFlightCount.call();
    assert.equal(numFlights, 1);

    let flightHash = await config.flightSuretyApp.getFlightKey.call(airline1, "ABC123", departureDate);
    let flightInfo = await config.flightSuretyApp.getFlightDetails.call(flightHash);

    assert.equal(flightInfo[0], "ABC123");
    assert.equal(flightInfo[3], true);
    assert.equal(flightInfo[4], false);
    assert.equal(flightInfo[6], departureDate);
    assert.equal(flightInfo[7], airline1);
});

it("Check if a non-funded airline can register a flight", async() => {
    let airline2 = accounts[10];
    let airline2Details = await config.flightSuretyApp.getAirlineDetails.call(airline2);
    // the airline should not be funded
    assert.equal(airline2Details[3], false, "This is a funded airline");
    let dateString = "2020-06-28T14:45:00Z"
    let departureDate = new Date(dateString).getTime();
    let accessDenied = false;
    try 
    {
        await config.flightSuretyApp.registerFlight("ABCD123", "NYC", "DEL", departureDate, {from:airline2});
    }
    catch(e) {
        accessDenied = true;
    }

    assert.equal(accessDenied, true, "Access not blocked for unfunded airline");    

});



it("check if a registered a flight can be insured", async() => {
    let airline1 = owner;
    let airline1Details = await config.flightSuretyApp.getAirlineDetails.call(airline1);
    // the first airline should be funded
    assert.equal(airline1Details[3], true);
    // get the registered flight

    let dateString = "2020-05-28T14:45:00Z"
    let departureDate = new Date(dateString).getTime();
    let flightHash = await config.flightSuretyApp.getFlightKey.call(airline1, "ABC123", departureDate);

    let flightInfo = await config.flightSuretyApp.getFlightDetails(flightHash);

    assert.equal(flightInfo[3], true);
    assert.equal(flightInfo[4], false);
    assert.equal(flightInfo[6], departureDate);
    assert.equal(flightInfo[7], airline1);

    await config.flightSuretyApp.insureFlight("ABC123", departureDate);
    flightInfo = await config.flightSuretyApp.getFlightDetails(flightHash);
    assert.equal(flightInfo[4], true);
});

/****************************************************************************************/
/* Passenger Insurance                                                                  */
/****************************************************************************************/

it("checks that a passenger is able to buy insurance for a flight", async() => {
    let passenger1 = passenger;
    let airline1 = owner;
    let dateString = "2020-05-28T14:45:00Z"
    let departureDate = new Date(dateString).getTime();
    let flightHash = await config.flightSuretyApp.getFlightKey.call(airline1, "ABC123", departureDate);
    let flightInfo = await config.flightSuretyApp.getFlightDetails(flightHash);
    let insuranceFee = await web3.utils.toWei("0.5", "ether");
    await config.flightSuretyApp.buyInsurance(airline1, departureDate, "ABC123", {from: passenger1, value: insuranceFee});
    let isInsured = await config.flightSuretyApp.isInsured(airline1, passenger1, "ABC123", departureDate);
    assert.equal(isInsured, true);
    let insuredBalance = await config.flightSuretyApp.getInsuranceBalance.call(passenger1, flightHash);
    assert.equal(insuranceFee, insuredBalance);
});

it("checks that if the oracles' decision is 'LATE_AIRLINE' users' balance is multiplied by 1.5", async() => {
    let passenger1 = passenger;
    let airline1 = owner;
    let dateString = "2020-05-28T14:45:00Z"
    let departureDate = new Date(dateString).getTime();
    let flightHash = await config.flightSuretyApp.getFlightKey.call(airline1, "ABC123", departureDate);
    // the user is insured
    let isInsured = await config.flightSuretyApp.isInsured(airline1, passenger1, "ABC123", departureDate);
    assert.equal(isInsured, true);
    // check the previous balance
    let prevBalance = await config.flightSuretyApp.getInsuranceBalance.call(passenger1, flightHash);
    // send and process the oracles' decision
    await config.flightSuretyApp.processFlightStatus(airline1, "ABC123", departureDate, 20);
    let flightInfo = await config.flightSuretyApp.getFlightDetails(flightHash);
    assert.equal(flightInfo[5], 20);
    let afterBalance = await config.flightSuretyApp.getInsuranceBalance.call(passenger1, flightHash);
    assert.equal(afterBalance, prevBalance * 1.5);
});

it("check whether a user can withdraw their balance", async() => {
    let passenger1 = passenger;
    let airline1 = owner;
    let dateString = "2020-05-28T14:45:00Z"
    let departureDate = new Date(dateString).getTime();
    let flightHash = await config.flightSuretyApp.getFlightKey.call(airline1, "ABC123", departureDate);
    let passengerBalanceBefore = await web3.eth.getBalance(passenger1);
    let amountToWithdraw = await config.flightSuretyApp.getInsuranceBalance.call(passenger1, flightHash);
    await config.flightSuretyApp.payOut(flightHash, amountToWithdraw, {from:passenger1});
    let passengerBalanceAfter = await web3.eth.getBalance(passenger1);
    console.log(passengerBalanceBefore, " Before");
    console.log(passengerBalanceAfter, " After");
    assert.isAbove(Number(passengerBalanceAfter - passengerBalanceBefore), Number(web3.utils.toWei("0.5", "ether")));
});

});
