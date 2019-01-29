/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

//Importing levelSandbox class
const LevelSandboxClass = require('./levelSandbox.js');

// // Creating the levelSandbox class object
// const db = new LevelSandboxClass.LevelSandbox();

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""

    }
}

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
    if (height == 0) {

      const block = new Block("First block in the chain - Genesis block");
      
      await this.addBlock(block);
      
      console.log("Genesis block has been created");
    }
  }

  // Add new block
  async addBlock(newBlock){
 //    // Block height
 //    newBlock.height = this.chain.length;
 //    // UTC timestamp
 //    newBlock.time = new Date().getTime().toString().slice(0,-3);
 //    // previous block hash
 //    if(this.chain.length>0){
 //      newBlock.previousBlockHash = this.chain[this.chain.length-1].hash;
 //    }
 //    // Block hash with SHA256 using newBlock and converting to a string
 //    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
 //    // Adding block object to chain
 // // 	this.chain.push(newBlock);


    // Block height
      newBlock.height = await this.getBlockHeight();

    // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);

    // previous block hash
    //check if it is a genesis block
      if(newBlock.height>0){
          // newBlock.previousBlockHash = self.chain[self.chain.length-1].hash;
          let previousBlock = await this.getBlock(newBlock.height - 1);
   
          // console.log("previous BLOCK:"+ previousBlock);

          var obj = JSON.parse(previousBlock)
          // console.log("previous hash:"+ obj.hash);
          newBlock.previousBlockHash = obj.hash;
         
      }
    // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

      // console.log("real value :"+JSON.stringify(newBlock).toString());

      this.db.addDataToLevelDB(newBlock.height, JSON.stringify(newBlock).toString());

      return newBlock;

 

  }

  // Get block height
     getBlockHeight(){
      // return this.chain.length-1;
      return this.db.getBlocksCount();

  
    }

    // get block
    getBlock(blockHeight){
      // return object as a single string
      // return JSON.parse(JSON.stringify(this.chain[blockHeight]));
      return this.db.getLevelDBData(blockHeight);
    


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
      // let validBlockHash = SHA256(JSON.stringify(block)).toString();
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
      // let errorLog = [];
      // for (var i = 0; i < this.chain.length-1; i++) {
      //   // validate block
      //   if (!this.validateBlock(i)) errorLog.push(i);
      //   // compare blocks hash link
      //   let blockHash = this.chain[i].hash;
      //   let previousHash = this.chain[i+1].previousBlockHash;
      //   if (blockHash!==previousHash) {
      //     errorLog.push(i);
      //   }
      // }
      // if (errorLog.length>0) {
      //   console.log('Block errors = ' + errorLog.length);
      //   console.log('Blocks: '+errorLog);
      // } else {
      //   console.log('No errors detected');
      // }
   

       let errorLog = [];
       let correctBlocks = [];
       let Length = await this.getBlockHeight();

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
      } else {
        console.log('No errors detected');
      }

    }



    
}

// let myBlockChain = new Blockchain();
// (function theLoop (i) {
//     setTimeout(function () {
//         let blockTest = new Block("Test Block - "+ (i + 1));
//         myBlockChain.addBlock(blockTest).then((result) => {
//             console.log(result);

//             i++;
//             if (i < 3) theLoop(i);
//         });
//     }, 1000);
//   })(0);

//   let validateBlockResult = myBlockChain.validateBlock(2);
//   if(validateBlockResult)
//   {
//         console.log("Block 2 is not changed！");
//   }

//   myBlockChain.validateChain();