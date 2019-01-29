/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

//Importing levelSandbox class
const LevelSandboxClass = require('./levelSandbox.js');
const BlockClass = require('./Block.js');

// // Creating the levelSandbox class object
// const db = new LevelSandboxClass.LevelSandbox();


/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this.db = new LevelSandboxClass.LevelSandbox();

     this.checkIsHasGenesisBlock();
    // this.addBlock(new Block("First block in the chain - Genesis block"));
  }

  async checkIsHasGenesisBlock()
  {
    const height = await this.getBlockHeight();
    if (height == -1) {

      const block = new BlockClass.Block("First block in the chain - Genesis block");
      
      await this.addBlock(block);
      console.log(block);
      
      console.log("Genesis block has been created");
    }
  }

  // Add new block
  async addBlock(newBlock){

    // Block height
      newBlock.height = (await this.getBlockHeight())+1;
      console.log("height:"+ newBlock.height);

    // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);

    // previous block hash
    //check if it is a genesis block
      if(newBlock.height>0){
          // newBlock.previousBlockHash = self.chain[self.chain.length-1].hash;
          let previousBlock = await this.getBlock(newBlock.height - 1);

          var obj = JSON.parse(previousBlock)
         
          newBlock.previousBlockHash = obj.hash;
         
      }
    // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      this.db.addDataToLevelDB(newBlock.height, JSON.stringify(newBlock).toString());

      return newBlock;

 

  }

  // Get block height
     getBlockHeight(){
      return this.db.getBlocksHeight();

  
    }

    // get block by height
    getBlock(blockHeight){
      return this.db.getLevelDBData(blockHeight);
    }

    //get block by hash
    getBlockHash(blockhash){
      return this.db.getBlockByHash(blockhash);
    }

    //get block by wallet address
    getBlockAddress(address){
      return this.db.getBlockByaddress(address);

    }

    // validate block
    async validateBlock(blockHeight){
      // get block object
      let block = await this.getBlock(blockHeight);

      var obj = JSON.parse(block);

      // get block hash
      let blockHash = obj.hash;
      // remove block hash to test block integrity
      obj.hash = '';


      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(obj)).toString();
      // Compare
      if (blockHash===validBlockHash) {
          return true;
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          return false;
        }
    }

   // Validate blockchain
   async validateChain(){


       let errorLog = [];
       let correctBlocks = [];
       let Length = (await this.getBlockHeight())+1;

       for(var i=0; i < Length; i++ ){
         // validate block
         if(!this.validateBlock(i)){
          errorLog.push(i);
         }

        // compare blocks hash link
        
        if( i < Length-1)//avoid chain overflow
        {
          let blockHash =  JSON.parse( await this.getBlock(i)).hash;
          let previousHash = JSON.parse(await this.getBlock(i+1)).previousBlockHash;
          if (blockHash!==previousHash) {
            errorLog.push(i);
          }
        }
       
       }
       if (errorLog.length>0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: '+errorLog);
        return false;
      } else {
        
        return true;
      }

    }


    
}


// let myBlockChain = new Blockchain();

// (function theLoop (i) {
//     setTimeout(function () {
//         let blockTest = new BlockClass.Block("Test Block - "+ (i + 1));
//         myBlockChain.addBlock(blockTest).then((result) => {
//             console.log(result);//output block details
//             i++;
//             if (i < 3) theLoop(i);
//         });
//     }, 1000);
//   })(0);

// //为了验证getBlockHash函数是否真的可以根据hash返回block信息
//   let firsthash = "7d2ec04c5addc3eca81f224b2d3542f6f9e5495893619b811306094f7710813e"

//   myBlockChain.getBlockHash(firsthash).then((result) => {
//     console.log(result);//output block details
// });

  // let block_resolve = myBlockChain.getBlockHash(firsthash);
  // console.log("block resolve:"+ block_resolve);

  // let block_test = myBlockChain.getBlock(0);
  // console.log(block_test);



 

  // let validateBlockResult = myBlockChain.validateBlock(2);
  // if(validateBlockResult)
  // {
  //       console.log("Block 2 is not changed！");
  // }

  // let validateChain = myBlockChain.validateChain();
  // if(validateChain)
  // {
  //    console.log('No errors detected');
  // }


  // module.exports.Blockchain = Blockchain;


  module.exports = Blockchain;