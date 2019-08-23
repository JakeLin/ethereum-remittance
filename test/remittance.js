const truffleAssert = require('truffle-assertions');
const Remittance = artifacts.require('Remittance');

const { toBN, toWei, fromAscii } = web3.utils;

const zeroAddress = '0x0000000000000000000000000000000000000000';

contract('Remittance', accounts => {
  const [owner, carol, someoneElse] = accounts;
  let remittance;

  const bobCorrectPassword = fromAscii('bob-super-secure-password');
  const carolCorrectPassword = fromAscii('carol-super-secure-password');

  const bobWrongPassword = fromAscii('bob-wrong-password');
  const carolWrongPassword = fromAscii('carol-wrong-password');

  beforeEach('creating new instance', async () => {
    remittance = (await Remittance.new(false, { from: owner, gas: 3000000 })).contract;
  });

  context('constructor()', () => {
    it('should deploy the remittance correctly', async () => {
      assert.ok((await web3.eth.getTransaction(remittance.transactionHash)).blockNumber);
      assert.strictEqual(await remittance.methods.getOwner().call(), owner);
      assert.strictEqual(await remittance.methods.isPaused().call(), false);
    });
  });
  
  
  context('deposit()', async () => {
    let hash;
    beforeEach(async () => {
      // Arrange
      hash = await remittance.methods.generateHash(carol, bobCorrectPassword, carolCorrectPassword).call();
    });

    context('when Carol address is a zero address', () => {
      it('should fail', async () => {
        // Act & Assert
        await truffleAssert.reverts(
          remittance.methods.deposit(hash, zeroAddress).send({from: owner, value: 2}),
          'Carol\'s address must not be zero!'
        );
      });
    });

    context('when deposit zero ether', () => {
      it('should fail', async () => {
        // Act & Assert
        await truffleAssert.reverts(
          remittance.methods.deposit(hash, carol).send({from: owner, value: 0}),
          'The value of deposit must be more than zero ether!'
        );
      });
    });

    context('when not owner deposits', () => {
      it('should fail', async () => {
        // Act & Assert
        await truffleAssert.reverts(
          remittance.methods.deposit(hash, carol).send({from: someoneElse, value: 2}),
          'Only owner can do this!'
        );
      });
    });

    context('when deposit more than zero ether', () => {
      beforeEach(async () => {
        // Act
        tx = await remittance.methods.deposit(hash, carol).send({from: owner, value: toWei('2', 'ether')});
      });
  
      it('should deposit two ethers to the remittance\'s balance', async () => {
        // Assert
        assert.strictEqual(await web3.eth.getBalance(remittance.options.address), toWei('2', 'ether'));
      });

      it('should set Carol\'s address correctly', async () => {
        // Assert
        assert.strictEqual(await remittance.methods.carol().call(), carol);
      });

      it('should emit the LogDeposited event', async () => {
        // Assert
        assert.strictEqual(tx.events.LogDeposited.event, 'LogDeposited');
        assert.strictEqual(tx.events.LogDeposited.returnValues.sender, owner);
        assert.strictEqual(tx.events.LogDeposited.returnValues.amount, toWei('2', 'ether'));
        assert.strictEqual(tx.events.LogDeposited.returnValues.hash, hash);
        assert.strictEqual(tx.events.LogDeposited.returnValues.carol, carol);
      });
    });
  });

  context('withdraw()', async () => {
    beforeEach(async () => {
      // Arrange
      const hash = await remittance.methods.generateHash(carol, bobCorrectPassword, carolCorrectPassword).call();
      remittance.methods.deposit(hash, carol).send({from: owner, value: toWei('2', 'ether')});
    });

    context('when not Carol withdraws with correct passwords', () => {
      it('should fail', async () => {
        // Act & Assert
        await truffleAssert.reverts(
          remittance.methods.withdraw(bobCorrectPassword, carolCorrectPassword).send({from: someoneElse}),
          'Can\'t withdraw when the information is wrong, please check the passwords and only Carol can withdraw.'
        );
      });
    });

    context('when the remittance balance is zero', () => {
      beforeEach(async () => {
        // Arrange
        await remittance.methods.withdraw(bobCorrectPassword, carolCorrectPassword).send({from: carol})
      });

      it('should fail', async () => {
        // Act & Assert
        await truffleAssert.reverts(
          remittance.methods.withdraw(bobCorrectPassword, carolWrongPassword).send({from: carol}),
          'Can\'t withdraw since the contract balance is zero!'
        );
      });
    });
 
    context('when Carol withdraws with incorrect passwords', () => {
      it('should fail', async () => {
        // Act & Assert
        await truffleAssert.reverts(
          remittance.methods.withdraw(bobCorrectPassword, carolWrongPassword).send({from: carol}),
          'Can\'t withdraw when the information is wrong, please check the passwords and only Carol can withdraw.'
        );

        await truffleAssert.reverts(
          remittance.methods.withdraw(bobWrongPassword, carolCorrectPassword).send({from: carol}),
          'Can\'t withdraw when the information is wrong, please check the passwords and only Carol can withdraw.'
        );

        await truffleAssert.reverts(
          remittance.methods.withdraw(bobWrongPassword, carolWrongPassword).send({from: carol}),
          'Can\'t withdraw when the information is wrong, please check the passwords and only Carol can withdraw.'
        );
      });
    });

    context('when Carol withdraws with correct passwords', () => {
      let caroulBeforeWithdrawBalance;
      let tx
      beforeEach(async () => {
        // Arrange
        caroulBeforeWithdrawBalance = toBN(await web3.eth.getBalance(carol));

        // Act
        tx = await remittance.methods.withdraw(bobCorrectPassword, carolCorrectPassword).send({from: carol})
      });

      it('the remittance balance should became zero', async () => {
        // Assert
        assert.strictEqual(await web3.eth.getBalance(remittance.options.address), '0');
      });

      it('should withdraw the ethers to Carol\'s account', async () => {
        // Assert
        const gasPrice = toBN((await web3.eth.getTransaction(tx.transactionHash)).gasPrice);
        const gasFee = toBN(tx.gasUsed).mul(gasPrice);
        assert.strictEqual(toBN(await web3.eth.getBalance(carol)).sub(caroulBeforeWithdrawBalance).toString(10), toBN(toWei('2', 'ether')).sub(gasFee).toString(10));
      });

      it('should emit the LogWithdrawn event', async () => {
        // Assert
        assert.strictEqual(tx.events.LogWithdrawn.event, 'LogWithdrawn');
        assert.strictEqual(tx.events.LogWithdrawn.returnValues.sender, carol);
        assert.strictEqual(tx.events.LogWithdrawn.returnValues.amount, toWei('2', 'ether'));
      });
    });
  });
});
