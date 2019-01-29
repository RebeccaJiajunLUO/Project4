/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/



// Importing the module 'level'
const level = require('level');
// Declaring the folder path that store the data
const chainDB = './chaindata';
const hex2ascii = require('hex2ascii');

// Declaring a class
class LevelSandbox {


    // Declaring the class constructor
    constructor() {
      this.db = level(chainDB);
    }

    // Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
      //By using let self = this;, you can access the this object inside the Promise code.
        let self = this;
        return new Promise(function(resolve, reject) {
            self.db.put(key, value, function(err) {
                if (err) {
                    console.log('Block ' + key + ' submission failed', err);
                    reject(err);
                }
                resolve(value);
            });
        });
    }




    // Get data from levelDB with key (Promise)
    getLevelDBData(key){
      // because we are returning a promise we will need this to be able to reference 'this' inside the Promise constructor
        let self = this; 
        return new Promise(function(resolve, reject) {
            self.db.get(key, (err, value) => {
                if(err){
                    if (err.type == 'NotFoundError') {
                        resolve(undefined);
                    }else {
                        console.log('Block ' + key + ' get failed', err);
                        reject(err);
                    }
                }else {
                    resolve(value);
                }
            });
        });
    }

    // Add data to levelDB with value
    addDataToLevelDB(key,value) {
      let self = this;
      let i = 0;


      return new Promise(function(resolve,reject){
        self.db.createReadStream().on('data',function(data){
          i++;
        }).on('error',function(err){
          return console.log('Unable to read data stream!', err)
        }).on('close', function() {


          console.log('Block #' + key);

          self.addLevelDBData(key, value).then((value)=>{
          console.log('Block #' + key);
     
        }).catch((error) => {console.log(error)});

        

          resolve(value);
        });
      })
    }



     // Get block height
    getBlocksHeight(){
      // return this.chain.length-1;

        let self = this;

       return new Promise((resolve, reject) => {
       let i = -1;
       self.db.createReadStream()
        .on('data', data => {
          i++;
        })
        .on('error', err => reject(err))
        .on('close', () => {
          // i++;
          resolve(i);
        });
      });  
    }

    // Get block by hash
    getBlockByHash(hash){
      let self = this;
      let block = null;
       return new Promise((resolve, reject) => {
          
           self.db.createReadStream()
           .on('data', data => {
            //   console.log("enter data");
              var obj = JSON.parse(data.value);
         
              let Blockhash = obj.hash;
            //   console.log("Blockhash:"+ Blockhash);

               if(Blockhash === hash){
                //    console.log("enter if");
                block = data.value;
            }
           })
           .on('error', err => {
               reject(err)
           })
           .on('close',  () => {
            //    console.log("close");
            //    console.log("result:"+block);
               resolve(block);
           });
       });
    }

       // Get block by wallet address
       getBlockByaddress(address){
        let self = this;
        let blocks = [];
        let block = null;
         return new Promise((resolve, reject) => {
            
             self.db.createReadStream()
             .on('data', data => {
              //   console.log("enter data");
               block = JSON.parse(data.value);
           
                let Blockaddress = block.body.address;
                // console.log("Blockhash:"+ address);
  
                 if(Blockaddress === address){
                    // console.log("enter if");
                  block.body.star.storyDecoded = hex2ascii(block.body.star.story);
                  blocks.push(block);          
              }
             })
             .on('error', err => {
                 reject(err)
             })
             .on('close',  () => {
              //    console.log("close");
                  // console.log("result:"+block);
                 resolve(blocks);
             });
         });
      }
   


}

// // Export the class
 module.exports.LevelSandbox = LevelSandbox;

// // Creating the levelSandbox class object
// const db = new LevelSandbox();

// // Creating Data
// (function theLoop (i) {
//     setTimeout(function () {
//         //Test Object
//         let objAux = {id: i, data: `Data #: ${i}`};
//         db.addLevelDBData(i, JSON.stringify(objAux).toString()).then((result) => {
//             if(!result) {
//               console.log("Error Adding data");
//             }else {
//               console.log(result);
//             }
//         }).catch((err) => { console.log(err); });
//         i++;
//         if (i < 3) { 
//           theLoop(i) 
//         }
//         else
//         {
//             db.getBlocksCount().then((result)=>{
//                 if(!result){
//                     console.log("Error Adding data");
//                 }else{
//                     console.log(result)
//                 }
//             }).catch((err)=>{console.log(err);});
            
//         }
//     }, 100);
//   })(0);
