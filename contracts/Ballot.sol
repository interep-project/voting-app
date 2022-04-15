//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@interep/contracts/IInterep.sol";

uint256 constant GITHUB_GOLD_GROUP_ID = 19792997538846952138225145850176205122934145224103991348074597128209030420613;

contract Ballot  {
    event BallotCreated(bytes32 name, bytes32[] proposals);
    event VoteAdded(bytes32 proposal);

    IInterep public interep;

    bytes32 public name;
    bytes32[] public proposals;

    constructor(address _interepAddress, bytes32 _name, bytes32[] memory _proposals) {
        interep = IInterep(_interepAddress);

        name = _name;

        for (uint i = 0; i < _proposals.length; i++) {
            proposals.push(_proposals[i]);
        }

        emit BallotCreated(_name, _proposals);
    }

    function vote(bytes32 _proposal, uint256 _nullifierHash, uint256[8] calldata _proof) public {
        interep.verifyProof(GITHUB_GOLD_GROUP_ID, _proposal, _nullifierHash, uint256(name), _proof);

        emit VoteAdded(_proposal);
    }
}
