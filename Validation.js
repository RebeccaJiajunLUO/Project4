const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./Block.js');
const Blockchain = require('./simpleChain.js');
const hex2ascii = require('hex2ascii');
const blockchain = new Blockchain();


function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}
/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class ValidationController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app 
     */
    constructor(app) {
        this.app = app;
        this.blocks = [];
        this.mempool = [];
        this.timeoutRequests = [];
        this.mempoolValid = [];
        this.newValidmempool = [];
        // this.initializeMockData();
        // this.getBlockByIndex();
        this.postRequest();
        this.validateRequest();
        this.postBlock();
        this.getBlockByHash();
        this.getBlockByAddress();
        this.getBlockbyHeight();
    }


    /**
     * Implement a POST Endpoint to add a request object, url: "/requestValidation"
     */
    postRequest() {
        this.app.post("/requestValidation", async(req, res) => {

            try{
                const address = req.body.address;
                let  message,requestTimeStamp,timeLeft;
                const TimeoutRequestsWindowTime = 5*60*1000;

                if(address == undefined || address === ''){
                    res.status(404).json({
                        success: false,
                        message: "Please check your address, which might be empty, undefined, or in a wrong format."
                      })
                }
                else
                {
                    
                    let inMemory = this.mempool.hasOwnProperty(address);
                    

                    if(inMemory){
                        //if this request exits in memory pool
                        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - this.mempool[address].requestTimeStamp;
                        timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
                        message = address +":" + this.mempool[address].requestTimeStamp + ":starRegistry";
                        requestTimeStamp =  this.mempool[address].requestTimeStamp;

                    }
                    else{
                        //add a new request in memory
                        requestTimeStamp = new Date().getTime().toString().slice(0,-3);
                        message = address +":" +  requestTimeStamp + ":starRegistry";
                        this.mempool[address] = {message, requestTimeStamp };
                        timeLeft = 300;

                        // setTimeout(function(){
                        //     delete this.mempool[address];
                        // },TimeoutRequestsWindowTime);                       

                    }              
                
                }
    
                res.json({
                    walletAddress: address,
                    requestTimeStamp: requestTimeStamp,
                    message: message,
                    validationWindow: timeLeft
                })



            }
            catch(error){
                res.status(404).json({
                    success: false,
                    message: `Validation request failed. ${error}`
                  })

            }
            
            
        });
    }

 /**
     * Implement a POST Endpoint to add a validRequest object, url: "/message-signature/validate"
*/
    validateRequest(){
        this.app.post("/message-signature/validate", async(req, res) => {
            try{

                const address = req.body.address;
                const signature = req.body.signature;
                let  message,requestTimeStamp,timeLeft,validresult;
                const TimeoutRequestsWindowTime = 5*60*1000;

                let inMemory = this.mempool.hasOwnProperty(address);
                
                if(inMemory){
                    //Verify your windowTime
                    requestTimeStamp = this.mempool[address].requestTimeStamp;
                    let timeElapse = (new Date().getTime().toString().slice(0,-3)) - requestTimeStamp;
                    timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
                    message = this.mempool[address].message;
                    //Verify the signature, always fail 
                    const bitcoinMessage = require('bitcoinjs-message'); 
                    let isValid = bitcoinMessage.verify(message, address, signature);
                    // console.log(isValid);


                    if(isValid){
                        validresult = {
                            registerStar : true,
                            status : {
                                address: address,
                                requestTimeStamp: requestTimeStamp,
                                message: message,
                                validationWindow: timeLeft,
                                messageSignature: true
                             }
                        };
                        this.mempoolValid.push(validresult);
                    }
                    else{
                        validresult = {
                             registerStar : false,
                             message: 'The message signature is verified to be false and it is invalid!',
                             messageSignature: false
                    }
                }
                res.send(validresult);
                }
                //if request in not in memory pool
                else{
                    res.status(404).json({
                        success: false,
                        message: `Please go to \requestValidation to get a message that you need to sign with your wallet.`
                      })

                }
            }
            catch(error){
                res.status(404).json({
                    success: false,
                    message: `Post Message-signature failed. ${error}`
                  })
            }
        });

    }

/**
 * Implement a POST Endpoint to add a newBlock object (a new star), url: "/block"
*/
async postBlock(){
        this.app.post("/block", async(req, res) => {
            try{
                let script = req.body;


                if(script == undefined || script === ''){
                    res.status(404).json({
                        success: false,
                        message: "Please check your request, which might be empty, undefined, or in a wrong format."
                      })
                }
                else{
                    let address = script.address;
                    let dec = script.star.dec;
                    let ra = script.star.ra;
                    let mag = script.star.mag;
                    let cen = script.star.cen;
                    let story = script.star.story;

                    // let isASCII_flag =  /^[\x00-\x7F]*$/.test(story);
                    let isASCII_flag =  isASCII(story);
                  
                    if(!isASCII_flag){
                        //throw  is often included in try region
                        throw "The story should only contain ascii characters";
                    }
                    else
                    {
                        console.log("All characters of story are ascii code!");
                    }
                    
                    if(story.length > 500){
                        throw "The story is too long!";
                    }

                    if(ra.length === 0||dec.length === 0){
                        throw "ra or dec is empty, please check the body again!";
                    }

                   

                   //Verify if the request validation exists and if it is valid.
                   let verifiedid = false;
                   this.mempoolValid.forEach(function(value){
                    if( address === value.status.address){
                        verifiedid = true;                       
                    }
                    else{
                        throw "This address is not verified yet, please make sure it is valid!";
                    }
                })
                    
                    if(verifiedid)
                    {
                        // story = hex2ascii(story);
                        story = Buffer(story).toString('hex');

                        let body = {
                            address: address,
                            star: {
                                  ra: ra,
                                  dec: dec,
                                  mag: mag,
                                  cen: cen,
                                  story: story
                                  }
                        }

                        const blockAux = new BlockClass.Block(body);
                        await blockchain.addBlock(blockAux);

                        //"storyDecoded" property is not being saved in the block
                        blockAux.body.star.storyDecoded = hex2ascii(body.star.story);


                        // return the most recently added block
                        res.status(201).send(blockAux);
                    }
                    else
                    {
                        res.star(404).json({
                            success: false,
                            message: 'Your address is not valid or expired. Please go to requestValidation to start the process'
                        })  
                    }

                }
            }
            catch(error)
            {
                res.status(404).json({
                    success: false,
                    message: `Post star failed. ${error}`
                })

            }
        })

    }

    /**
     * Implement a GET Endpoint to retrieve a block by hash, url: "/stars/hash:[HASH]"
     */
    getBlockByHash() {
        this.app.get("/stars/hash:HASH", async(req, res) => {
            // Add your code here
            try{
               let hash = req.params.HASH;
               hash = hash.substr(1);
               const BlockbyHash = await blockchain.getBlockHash(hash);

               if(BlockbyHash === ''){
                res.status(404).json({
                    success: false,
                    message: "Please check your hash, maybe the block with this hash is not stored in the database."
                  })
               }
               else{
                var obj = JSON.parse(BlockbyHash);

                    let data = obj.body;
                    let showblock = new BlockClass.Block(data);
                    showblock.hash = obj.hash;
                    showblock.height = obj.height;
                    showblock.time = obj.time;
                    showblock.previousBlockHash = obj.previousBlockHash;
                    if(showblock.height !== 0){
                        showblock.body.star.storyDecoded = hex2ascii(showblock.body.star.story);
                    }

                    res.send(showblock);

               }
            }
            catch(error){
                res.status(404).json({
                    success: false,
                    message: `Block is not found.${error}`
                  })

            }

        });
    }


    /**
     * Implement a GET Endpoint to retrieve a block by wallet address, url: "/stars/address:[ADDRESS]"
     */
    getBlockByAddress() {
        this.app.get("/stars/address:ADDRESS", async(req, res) => {
            // Add your code here
            try{
               let address = req.params.ADDRESS;
               address = address.substr(1);
               console.log("address:"+address);
               const BlockbyAddress= await blockchain.getBlockAddress(address);

               if(BlockbyAddress === ''){
                res.status(404).json({
                    success: false,
                    message: "Please check your address, maybe the block with this address is not stored in the database."
                  })
               }
               else{

                    res.send(BlockbyAddress);

               }
            }
            catch(error){
                res.status(404).json({
                    success: false,
                    message: `Block is not found.${error}`
                  })

            }

        });
    }

     /**
     * Implement a GET Endpoint to retrieve a block by wallet address, url: "/block/[HEIGHT]"
     */
    getBlockbyHeight(){
        this.app.get("/block/:index", async(req, res) => {
            // Add your code here
            try{
                let index = req.params.index;   
                
                const IndexOfBlock = await blockchain.getBlock(index);
                // let IndexOfBlock = this.blocks[index];
                if(IndexOfBlock)
                {
                    //make sure IndexBlock output in JSON format
                    var block = JSON.parse(IndexOfBlock);
                    if(block.height !==0){
                        block.body.star.storyDecoded = hex2ascii(block.body.star.story);
                    }                                   

                    res.send(block);
                    // res.send(IndexOfBlock);
                }
                else
                {
                    res.status(404).json({
                        success: false,
                        message: `Block ${req.params.index} is not found.`
                      })
                }
                

            }catch(error){
                res.status(404).json({
                    success: false,
                    message: `Block is not found.`
                  })
            }
            


        });
    }

    

    /**
     * Help method to inizialized Mock dataset, adds 10 test blocks to the blocks array
     */
    initializeMockData() {
        if(this.blocks.length === 0){
            for (let index = 0; index < 10; index++) {
                let blockAux = new BlockClass.Block(`Test Data #${index}`);
                blockAux.height = index;
                blockAux.hash = SHA256(JSON.stringify(blockAux)).toString();
                this.blocks.push(blockAux);
            }
        }

    }


}

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new ValidationController(app);}