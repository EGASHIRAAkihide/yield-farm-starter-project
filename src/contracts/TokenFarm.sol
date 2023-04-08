pragma solidity ^0.5.0;

import "./DappToken.sol";
import "./MockDaiToken.sol";

contract TokenFarm{
  string public name = 'DApp Token Farm';
  address public owner;
  DappToken public dappToken;
  DaiToken public daiToken;

  // これまでにステーキングを行なった全てのアドレスを追跡する配列を作成 
  address[] public stakers;

  // 投資家のアドレスと、彼らのステーキングしたトークンの量を紐付けるmappingを作成
  mapping (address => uint) public stakingBalance;

  // 投資家のアドレスをもとに彼らがステーキングを行ったか否かを紐づけるmappingを作成
  mapping (address => bool) public hasStaked;

  // 投資家の最新のstatusを記録するmappingを作成
  mapping (address => bool) public isStaking;

  constructor(DappToken _dappToken, DaiToken _daiToken) public {
    dappToken = _dappToken;
    daiToken = _daiToken;
    owner = msg.sender;
  }

  function stakeTokens(uint _amount) public {
    require(_amount > 0, "amount can't be 0");
    daiToken.transferFrom(msg.sender, address(this), _amount);

    stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

    if(!hasStaked[msg.sender]) {
      stakers.push(msg.sender);
    }

    isStaking[msg.sender] = true;
    hasStaked[msg.sender] = true;
  }

  function issueTokens() public {
    require(msg.sender == owner, 'caller must be the owner');

    for(uint i = 0; i < stakers.length; i++) {
      address recipient = stakers[i];
      uint balance = stakingBalance[recipient];
      if(balance > 0) {
        dappToken.transfer(recipient, balance);
      }
    }
  }

  function unstakeTokens(uint _amount) public {
    uint balance = stakingBalance[msg.sender];
    require(balance > _amount, "staking balance should be more than unstaked amount");
    
    daiToken.transfer(msg.sender, _amount);
    dappToken.transfer(msg.sender, _amount);
    stakingBalance[msg.sender] = balance - _amount;
    isStaking[msg.sender] = false;
  }
}