pragma solidity >=0.4.21 <0.6.0;

import "./Pausable.sol";

contract Remittance is Pausable {
  address public carol;
  bytes32 private withdrawHash;

  event LogDeposited(address indexed sender, uint256 amount, bytes32 hash, address indexed carol);
  event LogWithdrawn(address indexed sender, uint256 amount);

  constructor(bool paused) Pausable(paused) public {
  }

  function generateHash(address _carol, bytes32 _bobPassword, bytes32 _carolPassword) public view returns(bytes32) {
     return keccak256(abi.encodePacked(this, _carol, _bobPassword, _carolPassword));
  }

  function deposit(bytes32 _hash, address _carol) external payable onlyOwner whenRunning whenAlive {
    require(_carol != address(0), "Carol's address must not be zero!");
    require(msg.value > 0, "The value of deposit must be more than zero ether!");
    carol = _carol;
    withdrawHash = _hash;
    emit LogDeposited(msg.sender, msg.value, _hash, _carol);
  }

  function withdraw(bytes32 _bobPassword, bytes32 _carolPassword) external whenRunning whenAlive {
    require(msg.sender == carol, "Only Carol can withdraw!");
    uint256 contractBalance = address(this).balance;
    require(contractBalance > 0, "Can't withdraw since the contract balance is zero!");

    bytes32 hashValue = generateHash(msg.sender, _bobPassword, _carolPassword);
    require(hashValue == withdrawHash, "Can't withdraw when the passwords are wrong!");
    emit LogWithdrawn(msg.sender, contractBalance);
    msg.sender.transfer(contractBalance);
  }
}
