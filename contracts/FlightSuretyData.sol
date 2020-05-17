pragma solidity >=0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping (address=>bool) private authorizedCallers;
    uint number_of_airlines = 0;
    uint number_of_flights;
    uint public MAX_AUTO_REGISTERED_AIRLINES = 4;

    struct Airline {
    address airlineAddress;
    string name;
    bool isRegistered;
    bool isFunded;
    address[] voters;
    uint256 minVotes;
    }

    Airline[] private airlinesList;
    mapping(address => Airline) internal airlines;

    mapping(address => bytes32[]) private insuredFlights;
    mapping(address => mapping(bytes32 => uint256)) private insuredBalance;

    struct Flight {
    string code;
    string from;
    string to;
    bool isRegistered;
    bool isInsured;
    uint8 statusCode;
    uint256 departureDate;
    address airline;
    address[] insuredPassengers;
    }

    Flight[] private flightsList;
    mapping(bytes32 => Flight) internal flights;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                )
                                public
    {
        contractOwner = msg.sender;
        // Authorizing yourself to call own functions, that can be called
        // externally and hence require authorization
        authorizedCallers[address(this)] = true;
        authorizedCallers[contractOwner] = true;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier verifyCallerIsAuthorized()
    {
        require(authorizedCallers[msg.sender] == true, "The caller is not authorized to call this operation");
        _;
    }

    modifier requireAirline() {
    if (number_of_airlines >= 1) {
        require(isAirline(tx.origin), "Only airlines are permitted to use this function");
    }
    _;
    }

    modifier notAirline() {
    require(!isAirline(msg.sender), "Airlines cannot access this function.");
    _;
    }

    modifier requireAirlineFunding() {
    if (number_of_airlines >= 1) {
        require(isAirlineFunded(tx.origin), "Airlines need to be funded to access this feature");
    }
    _;
    }


    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }

    function isAirline(address userAddress) public view returns(bool) {
        return airlines[userAddress].isRegistered;
    }

    function isAirlineFunded(address userAddress) public view returns(bool) {
        return airlines[userAddress].isFunded;
    }

    function getAirlineByIndex(uint airlineNum) external view returns(address, string memory, bool, bool, address[] memory) {
        Airline memory airline = airlinesList[airlineNum];
        return (airline.airlineAddress, airline.name, airline.isRegistered, airline.isFunded, airline.voters);
    }

    function getFlightByIndex(uint flightNum) external view returns(string memory, string memory, string memory,
     bool, bool, uint8, uint256, address, address[] memory) {
        Flight memory flight = flightsList[flightNum];
        return (flight.code, flight.from, flight.to, flight.isRegistered, flight.isInsured, flight.statusCode, flight.departureDate, flight.airline, flight.insuredPassengers);
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner
    {
        operational = mode;
    }

    function authorizeCaller(address contractAddress) external requireContractOwner requireIsOperational {
    authorizedCallers[contractAddress] = true;
    }

    /**
    * @dev
    *
    * Make a check to see if the flight is already insured
    */
    function isInsured(address _airlineAddress, address _passengerAddress, string memory _flightCode,
     uint departureDate) public view returns(bool) {
    bool insured = false;
    bytes32 flightHash = getFlightKey(_airlineAddress, _flightCode, departureDate);
    for (uint counter = 0; counter < insuredFlights[_passengerAddress].length; counter++) {
        if (insuredFlights[_passengerAddress][counter] == flightHash) {
            insured = true;
            break;
        }
    }
    return insured;
    }

    // get the current insurance fund balance
    function getContractBalance() external requireIsOperational view returns(uint) {
        return address(this).balance;
    }

    function getInsuredKeysLength(address _passengerAddress) external view returns(uint256) {
        return insuredFlights[_passengerAddress].length;
    }

    function getInsuredFlights(address _passengerAddress, uint _index) external view returns(bytes32) {
        return insuredFlights[_passengerAddress][_index];
    }


     /**
    * @dev
    *
    * Calculates insurance payout
    */
    // function getInsurancePayoutValue(bytes32 flightKey) public view requireIsOperational returns(uint256){
    // InsuranceInfo memory insurance = insurances[flightKey];
    // uint256 insurancePayoutValue = insurance.value.div(2);
    // return insurancePayoutValue.add(insurance.value);
    // }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function AirlineCount() external view returns(uint) {
        return airlinesList.length;
    }
   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(address airlineAddress, string calldata airlineName)
                            external requireAirline requireIsOperational requireAirlineFunding
    {
        require(!airlines[airlineAddress].isRegistered, "Airline must not be already registered");
            airlines[airlineAddress] = Airline({
                airlineAddress: airlineAddress,
                name: airlineName,
                isRegistered: number_of_airlines < MAX_AUTO_REGISTERED_AIRLINES,
                isFunded: false,
                voters: new address[](0),
                minVotes: number_of_airlines.add(1).div(2)
            });
            number_of_airlines = number_of_airlines.add(1);
            airlinesList.push(airlines[airlineAddress]);
    }

    function AddVote(address _airlineAddress) public requireAirline requireAirlineFunding requireIsOperational verifyCallerIsAuthorized{
        // check if the airline has already voted
        require(!alreadyVoted(tx.origin, _airlineAddress), "This airline has already voted");
        // check if the airline that is being voted on is not registered yet
        require(!airlines[_airlineAddress].isRegistered, "This airline has not registered yet to be able to vote");
        Airline storage airlineToUpdate = airlines[_airlineAddress];
        airlineToUpdate.voters.push(tx.origin);
    }

    function numVotesCasted(address _airlineAddress) external view returns(uint) {
        return airlines[_airlineAddress].voters.length;
    }

    function updateAirlineRegistration(address _airlineAddress) public requireAirline
    requireAirlineFunding requireIsOperational verifyCallerIsAuthorized{
        airlines[_airlineAddress].isRegistered = true;
    }

    function alreadyVoted(address _voter, address _airlineAddress) public view returns(bool) {
        bool voted = false;
        for (uint counter=0; counter<airlines[_airlineAddress].voters.length; counter++) {
            if (airlines[_airlineAddress].voters[counter] == _voter) {
                voted = true;
                break;
            }
        }
        return voted;
    }

/**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (address _airlineAddress, uint departureDate, string calldata flightCode)
                            external
                            requireIsOperational
                            notAirline
                            payable
    {
        require(!isInsured(_airlineAddress, msg.sender, flightCode, departureDate),
         "User has already bought insurance for this flight");
        require(msg.value <= 1 ether && msg.value > 0 ether, "Invalid Insurance Amount");
        bytes32 flightHash = getFlightKey(_airlineAddress, flightCode, departureDate);
        insuredFlights[tx.origin].push(flightHash);
        // store the paid premium
        insuredBalance[tx.origin][flightHash] = msg.value;
        // register the insured passenger
        Flight storage flightToUpdate = flights[flightHash];
        flightToUpdate.insuredPassengers.push(tx.origin);
    }

    function getInsuranceBalance(address _passengerAddress, bytes32 _flightHash) external view returns(uint) {
        return insuredBalance[_passengerAddress][_flightHash];
    }

    function setInsuranceBalance(address _passengerAddress, bytes32 _flightHash, uint newVal) external {
        insuredBalance[_passengerAddress][_flightHash] = newVal;
    }

    function updateFlightStatus(bytes32 _flightHash, uint8 newStatus) external requireIsOperational {
        Flight storage flightToUpdate = flights[_flightHash];
        flightToUpdate.statusCode = newStatus;
    }

    function updateInsuredBalance(bytes32 _flightHash) external requireIsOperational {
        Flight storage flightToUpdate = flights[_flightHash];
        for (uint c = 0; c < flightToUpdate.insuredPassengers.length; c++) {
            address insured = flightToUpdate.insuredPassengers[c];
            // update the insured balance
            insuredBalance[insured][_flightHash] = insuredBalance[insured][_flightHash].mul(15);
            insuredBalance[insured][_flightHash] = insuredBalance[insured][_flightHash].div(10);
        }
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (bytes32 _flightHash, uint amount
                                )
                                external
                                requireIsOperational
                                requireAirlineFunding
    {
        require(insuredBalance[msg.sender][_flightHash] >= amount, "Not enough funds");
        insuredBalance[msg.sender][_flightHash] = insuredBalance[msg.sender][_flightHash].sub(amount);
        msg.sender.transfer(amount);
    }

        function fundAirline(address _airlineAddress) external payable requireAirline {
        require(msg.value == 10 ether, "The initial airline fee is equal to 10 ether");
        airlines[_airlineAddress].isFunded = true;
    }

    function registerFlight(string calldata _flightCode,
    string calldata _origin, string calldata _destination, uint256 _departureDate)
    external requireAirline requireIsOperational requireAirlineFunding {
        bytes32 flightHash = getFlightKey(tx.origin, _flightCode, _departureDate);
        require(!flights[flightHash].isRegistered, "The flight has already been registered");
        flights[flightHash] = Flight({
            code: _flightCode,
            from: _origin,
            to: _destination,
            isRegistered: true,
            isInsured: false,
            statusCode: 0,
            departureDate: _departureDate,
            airline: tx.origin,
            insuredPassengers: new address[](0)
        });
    flightsList.push(flights[flightHash]);
    number_of_flights = number_of_flights.add(1);
}

    function getFlightCount() external view returns(uint) {
        return flightsList.length;
    }

    function getFlight(bytes32 _flightHash) external view returns(string memory,
      string memory, string memory, bool, bool, uint8, uint256, address) {
        Flight memory flight = flights[_flightHash];
        return (flight.code, flight.from, flight.to,
        flight.isRegistered, flight.isInsured, flight.statusCode, flight.departureDate, flight.airline);
    }

    function getFlightCode(bytes32 _flightHash) external view returns(uint8 ) {
        Flight memory flight = flights[_flightHash];
        return flight.statusCode;
    }

    function insureFlight(string calldata _flightCode, uint256 _departureDate) external requireAirline requireAirlineFunding
    requireIsOperational {
        bytes32 flightHash = getFlightKey(tx.origin, _flightCode, _departureDate);
        require(flights[flightHash].airline == tx.origin);
        Flight storage flightToUpdate = flights[flightHash];
        flightToUpdate.isInsured = true;
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(bytes32 _flightHash, uint amount) external payable requireIsOperational {
        require(insuredBalance[tx.origin][_flightHash] >= amount, "Insufficient funds");
        insuredBalance[tx.origin][_flightHash] = insuredBalance[tx.origin][_flightHash].sub(amount);
        tx.origin.transfer(amount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */

    function getAirline(address _airlineAddress) external view returns(address, string memory, bool, bool, address[] memory) {
        Airline memory airline = airlines[_airlineAddress];
        return (airline.airlineAddress, airline.name, airline.isRegistered, airline.isFunded, airline.voters);
    }

    function fund(address _airlineAddress) external payable requireAirline {
        require(msg.value == 10 ether, "The initial airline fee is equal to 10 ether");
        airlines[_airlineAddress].isFunded = true;
    }

    // function fund
    //                         (
    //                         )
    //                         public
    //                         payable
    // {
        
    // }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    // function()
    //                         external
    //                         payable
    // {
    //     fund();
    // }


}

