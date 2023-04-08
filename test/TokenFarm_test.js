const DappToken = artifacts.require(`DappToken`)
const DaiToken = artifacts.require(`DaiToken`)
const TokenFarm = artifacts.require(`TokenFarm`)

// chaiのテストライブラリ・フレームワークを読み込む
const { assert } = require('chai');
require(`chai`)
  .use(require('chai-as-promised'))
  .should()

// 任意のETHの値をWeiに変換する関数
function tokens(n) {
  return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor]) => {
  let daiToken, dappToken, tokenFarm
  
  before(async () => {
    daiToken = await DaiToken.new()
    dappToken = await DappToken.new()
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

    await dappToken.transfer(tokenFarm.address, tokens('1000000'))
    await daiToken.transfer(investor, tokens('100'), { from: owner })
  })

  // DaiToken
  describe('Mock DAI deployment', async () => {
    it('has a name', async () => {
      const name = await daiToken.name()
      assert.equal(name, 'Mock DAI Token')
    })
  })

  // DappToken
  describe('DApp Token deployment', async () => {
    it('has a name', async () => {
      const name = await dappToken.name()
      assert.equal(name, 'DApp Token')
    })
  })

  // TokenFarm
  describe('Token Farm Deployment', async () => {
    it('has a name', async () => {
      const name = await tokenFarm.name()
      assert.equal(name, 'DApp Token Farm')
    })

    it('contract has tokens', async () => {
      let balance = await dappToken.balanceOf(tokenFarm.address)
      assert.equal(balance.toString(), tokens('1000000'))
    })
  })

  describe('Farming tokens', async () => {
    it('rewards investors for staking mDai tokens', async () => {
      let result

      // stakingの前に投資家の残高を確認
      result = await daiToken.balanceOf(investor)
      assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct before staking')

      // 偽のDAI tokenを確認
      await daiToken.approve(tokenFarm.address, tokens('100'), {from: investor})
      await tokenFarm.stakeTokens(tokens('100'), {from: investor})

      // staking後の投資家の残高を確認
      result = await daiToken.balanceOf(investor)
      assert.equal(result.toString(), tokens('0'), 'investor Mock DAI wallet balance correct after staking')

      // staking後のtokenFarmの残高を確認
      result = await daiToken.balanceOf(tokenFarm.address)
      assert.equal(result.toString(), tokens('100'), 'Token Farm mock DAI balance correct after staking')

      // 投資家がtokenFarmにstakingした残高を確認
      result = await tokenFarm.stakingBalance(investor)
      assert.equal(result.toString(), tokens('100'), 'investor staking balance correct after staking')

      // stakingを行った投資家の状態を確認
      result = await tokenFarm.isStaking(investor)
      assert.equal(result.toString(), 'true', 'investor staking status correct after staking')

      // tokenを発行する
      await tokenFarm.issueTokens({ from: owner })

      // tokenを発行した後の投資家のDapp残高を確認
      result = await dappToken.balanceOf(investor)
      assert.equal(result.toString(), tokens('100'), 'investor DApp Token wallet balance correct after staking')

      await tokenFarm.issueTokens({ from: investor }).should.be.rejected

      // tokenをunstakingする
      await tokenFarm.unstakeTokens(tokens("60"), { from: investor })
      
      // unstakingの結果を確認する
      result = await daiToken.balanceOf(investor)
      assert.equal(result.toString(), tokens("60"), "investor Mock DAI wallet balance correct after staking")

      // 投資家がunstakingした後のtoken Farm内に存在する偽のDai残高を確認
      result = await daiToken.balanceOf(tokenFarm.address)
      assert.equal(result.toString(), tokens("40"), "Token Farm Mock DAI balance correct after staking")

      // 投資家がunstagingした後の投資家の残高を確認
      result = await tokenFarm.stakingBalance(investor)
      assert.equal(result.toString(), tokens('40'), "investor staking status correct after staking")

      // 投資家がunstakingした後の投資家の状態を確認
      result = await tokenFarm.isStaking(investor)
      assert.equal(result.toString(), 'false', "investor staking status correct after staking")
    })
  })
})