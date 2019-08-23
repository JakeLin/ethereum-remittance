pragma solidity >=0.4.21 <0.6.0;

import "./Pausable.sol";

contract Remittance is Pausable {
  struct Escrow {
    address carol;
    uint256 amount;
  }

  mapping (bytes32 => Escrow) public escrows;

  event LogDeposited(address indexed sender, uint256 amount, bytes32 hash, address indexed carol);
  event LogWithdrawn(address indexed sender, bytes32 hash, uint256 amount);

  constructor(bool paused) Pausable(paused) public {
  }

  function generateHash(address carol, bytes32 bobPassword, bytes32 carolPassword) public view returns(bytes32) {
     return keccak256(abi.encodePacked(this, carol, bobPassword, carolPassword));
  }

  function deposit(bytes32 hash, address carol) external payable onlyOwner whenRunning whenAlive {
    require(carol != address(0), "Carol's address must not be zero!");
    require(msg.value > 0, "The value of deposit must be more than zero ether!");
    escrows[hash] = Escrow(carol, msg.value);
    emit LogDeposited(msg.sender, msg.value, hash, carol);
  }

  function withdraw(bytes32 bobPassword, bytes32 carolPassword) external whenRunning whenAlive {
    bytes32 hash = generateHash(msg.sender, bobPassword, carolPassword);
    Escrow memory escrow = escrows[hash];
    uint256 amount = escrow.amount;
    require(amount > 0, "Can't withdraw when the information is wrong, please check the passwords and only Carol can withdraw.");

    delete escrows[hash];
    emit LogWithdrawn(msg.sender, hash, amount);
    msg.sender.transfer(amount);
  }
}
