// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lottery {
    address[] public participants;
    uint public ticketPrice;
    address public lastWinner;
    bool public isOpen;

    constructor(uint _ticketPrice) {
        ticketPrice = _ticketPrice;
        isOpen = true;
    }

    function enter() public payable {
        require(isOpen, "Lottery closed");
        require(msg.value == ticketPrice, "Incorrect ticket price");
        participants.push(msg.sender);
    }

    // For demonstration; in production, use Chainlink VRF or similar for randomness
    function pickWinner() public {
        require(participants.length > 0, "No participants");
        uint winnerIndex = uint(
            keccak256(abi.encodePacked(block.timestamp, block.difficulty))
        ) % participants.length;
        lastWinner = participants[winnerIndex];
        payable(lastWinner).transfer(address(this).balance);
        delete participants;
        isOpen = false;
    }

    function startNewRound() public {
        require(!isOpen, "Lottery already open");
        isOpen = true;
    }
}
