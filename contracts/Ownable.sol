pragma solidity >=0.4.21 <0.6.0;

contract Ownable {
  event LogOwnerChanged(address indexed previousOwner, address indexed newOwner);

  address private owner;

  constructor() public {
    owner = msg.sender;
  }

  function getOwner() public view returns (address) {
    return owner;
  }

  function changeOwner(address newOwner) public onlyOwner {
    require(newOwner != address(0), "New owner can't be zero address!");
    emit LogOwnerChanged(owner, newOwner);
    owner = newOwner;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can do this!");
    _;
  }
}
