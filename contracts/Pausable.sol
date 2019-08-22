pragma solidity >=0.4.21 <0.6.0;

import "./Ownable.sol";

contract Pausable is Ownable {
  event LogPaused(address indexed account);
  event LogUnpaused(address indexed account);
  event LogKilled(address indexed account);

  bool private paused;
  bool private killed;

  constructor(bool _paused) public {
    paused = _paused;
  }

  modifier whenRunning() {
    require(!paused, "Can't do that when the contract is paused!");
    _;
  }

  modifier whenPaused() {
    require(paused, "Can't do that when the contract is running!");
    _;
  }

  modifier whenAlive() {
    require(!killed, "Can't do that when the contract is killed!");
    _;
  }

  modifier whenKilled() {
    require(killed, "Can't do that when the contract is alive!");
    _;
  }

  function isPaused() public view returns (bool) {
    return paused;
  }

  function pause() public onlyOwner whenRunning {
    paused = true;
    emit LogPaused(msg.sender);
  }

  function resume() public onlyOwner whenPaused whenAlive {
    paused = false;
    emit LogUnpaused(msg.sender);
  }

  function isKilled() public view returns (bool) {
    return killed;
  }

  function kill() public onlyOwner whenPaused whenAlive {
    killed = true;
    emit LogKilled(msg.sender);
  }
}
