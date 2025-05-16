let web3;
let account;
// const lotteryAddress = "0xc197477f0A8De84A97FaAD99B737702689D0CB00";
// const diceAddress = "0xe67630aAed5e4126A0df0102866203C12d948bB5";
//TEST (use this)
const diceAddress = "0xccEca49A61061cEeA9BD6C3E26D05ce0aD178fDB";
const lotteryAddress = "0x5cddca822E720e114d891C2F56Ca59394686a5b0";
const accountSpan = $("#account");

let lotteryContract;
let diceContract;
let lotteryContractABI;
let diceContractABI;
let fullAddress = '';

function shortenAddress(address) {
  return address.slice(0, 6) + '...' + address.slice(-4);
}

// After wallet connection, e.g. in your wallet connect logic:
function displayWallet(address) {
  fullAddress = address;
  accountSpan.text(shortenAddress(fullAddress));
}


accountSpan.hover(
  function() { // mouseenter
    if(accountSpan.text() != "Not connected"){
      $(this).fadeOut(100, () => {
        $(this).text(fullAddress).fadeIn(500);
      });  
    }
  },
  function() { // mouseleave
    if(accountSpan.text() != "Not connected"){
      $(this).fadeOut(100, () => {
        $(this).text(shortenAddress(fullAddress)).fadeIn(500);
      });
    }
  }
);

async function loadContracts() {
  // Load ABI
  fetch('abi/lotteryTest.json')
    .then(response => response.json())
    .then(abi => {
      lotteryContractABI = abi;
    });

    // Load ABI
  // fetch('abi/dice.json')
  fetch('abi/diceTest.json')
    .then(response => response.json())
    .then(abi => {
      diceContractABI = abi;
    });
}

window.addEventListener("load", async () => {
  await loadContracts();
  $("#connectWallet").on("click", connectWallet);
});

async function connectWallet() {
  if (window.ethereum) {
    try {
      console.log("Requesting accounts...");
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Accounts:", accounts);
      account = accounts[0];

      web3 = new Web3(window.ethereum);
      // Create contract instances
      lotteryContract = new web3.eth.Contract(lotteryContractABI, lotteryAddress);
      diceContract = new web3.eth.Contract(diceContractABI, diceAddress);

      // diceContract.events.GamePlayed({ fromBlock: 'latest' })
      //   .on('data', event => {
      //     const { player, guess, result, win, payout } = event.returnValues;
      //     console.log(player, guess, result, win, payout);
      //     // Optionally, update your UI here
      //   })
      //   .on('error', error => {
      //     console.error("Event error:", error);
      //   });

      const ticketPriceWei = await lotteryContract.methods.ticketPrice().call();
      const ticketPriceEth = web3.utils.fromWei(ticketPriceWei, "ether");
      $("#ticketPrice").text(ticketPriceEth);
      // document.getElementById('account').textContent = account;
      displayWallet(account);
      await checkOwnerAndToggleButton();
      await loadLotteryInfo();
    } catch (error) {
      console.error("Error during connection:", error);
      alert("Error during connection: " + (error.message || error));
    }
  } else {
    alert("MetaMask not detected!");
  }
}


// 🎟️ Lottery Functions
// async function loadLotteryInfo() {
//   const participants = await lotteryContract.methods.getParticipants().call();
//   const potWei = await web3.eth.getBalance(lotteryAddress);
//   const potEth = web3.utils.fromWei(potWei, "ether");
//   const lastWinner = await lotteryContract.methods.lastWinner().call();

//   document.getElementById("participants").innerText = participants.length;
//   document.getElementById("pot").innerText = potEth;
//   document.getElementById("lastWinner").innerText = lastWinner;
// }

async function loadLotteryInfo() {
  const participants = await lotteryContract.methods.getParticipants().call();
  const potWei = await web3.eth.getBalance(lotteryAddress);
  const potEth = web3.utils.fromWei(potWei, "ether");
  const lastWinner = await lotteryContract.methods.lastWinner().call();

  document.getElementById("participants").innerText = participants.length;
  document.getElementById("pot").innerText = potEth;
  document.getElementById("lastWinner").innerText = lastWinner;

  // Progress bar logic
  const maxPot = 0.01; // Set your expected max pot in ETH
  let percent = Math.min((parseFloat(potEth) / maxPot) * 100, 100);
  let potBar = document.getElementById("lotteryPotBar");
  potBar.style.width = percent + "%";
  potBar.innerText = potEth + " ETH";
}


document.getElementById("enterLottery").onclick = async () => {
  if(!account){
    alert("Please connect your wallet!")  
  }
  else{
    const ticketPrice = await lotteryContract.methods.ticketPrice().call();
    await lotteryContract.methods.enter().send({ from: account, value: ticketPrice });
    alert("You entered the lottery!");
    await loadLotteryInfo();
  }
};

document.getElementById("pickWinner").onclick = async () => {
  if(!account){
    alert("Please connect your wallet!")  
  }
  else{
    await lotteryContract.methods.pickWinner().send({ from: account });
    alert("Winner picked!");
    await loadLotteryInfo();
  }
};

$("#startNewRound").on("click", async () => {
  if(!account){
    alert("Please connect your wallet!")  
  }
  else {
    await lotteryContract.methods.startNewRound().send({ from: account });
  }
})

$("#diceWithdraw").on("click", async () => {
  if(!account){
    alert("Please connect your wallet!");
    return;
  }
  // Prompt user for amount to withdraw (in ETH)
  const amountEth = prompt("Enter amount to withdraw (in ETH):");
  if (!amountEth) return;
  const amountWei = web3.utils.toWei(amountEth, "ether");
  try {
    await diceContract.methods.withdraw(amountWei).send({ from: account });
    alert("Withdrawal successful!");
  } catch (err) {
    alert("Error: " + err.message);
  }
});


// // 🎲 Dice Functions
// document.getElementById("rollDice").onclick = async () => {
//   const playerGuess = document.getElementById("guess").value;
//   const ans = Math.floor(Math.random() * 6) + 1; // 1 to 6
//   const betEth = document.getElementById("bet").value;
//   const betWei = web3.utils.toWei(betEth, "ether");
//   if(!account){
//     alert("Please connect your wallet!")  
//   }
//   else if (!playerGuess || playerGuess < 1 || playerGuess > 6){
//     $("#diceResult").text("Please enter a number from 1 to 6!");
//   }
//   else if (betEth < 0.001){
//     $("#diceResult").text("The minimum bet is 0.001 Eth!");
//   }
//   else {
//     console.log(ans);
  
//     try {
//       await diceContract.methods.clientRollDice(playerGuess, ans).send({
//         from: account,
//         value: betWei
//       });
//       document.getElementById("diceResult").innerText = "Transaction sent. Check events for result!";
//     } catch (err) {
//       console.error(err);
//       document.getElementById("diceResult").innerText = "Error: " + err.message;
//     }
//   }
// };

document.getElementById("rollDice").onclick = async () => {
  if(!account){
    alert("Please connect your wallet!");
    return;
  }
  $("#diceResult").text("");
  const playerGuess = document.getElementById("guess").value;
  const ans = Math.floor(Math.random() * 6) + 1; // 1 to 6
  const betEth = document.getElementById("bet").value;
  const betWei = web3.utils.toWei(betEth, "ether");

  // Start dice animation
  const diceDiv = document.getElementById("diceAnimation");
  diceDiv.classList.add("dice-rolling");
  let rollInterval = setInterval(() => {
    let tempFace = Math.floor(Math.random() * 6) + 1;
    diceDiv.textContent = getDiceEmoji(tempFace);
  }, 80);

  try {
    // Send transaction and wait for confirmation
    await diceContract.methods.clientRollDice(playerGuess, ans).send({
      from: account,
      value: betWei
    });

    // Stop animation and show the real result after confirmation
    clearInterval(rollInterval);
    diceDiv.classList.remove("dice-rolling");
    diceDiv.textContent = getDiceEmoji(ans);

    document.getElementById("diceResult").innerText = "Transaction confirmed! Dice rolled: " + ans;
  } catch (err) {
    clearInterval(rollInterval);
    diceDiv.classList.remove("dice-rolling");
    diceDiv.textContent = "🎲";
    console.error(err);
    document.getElementById("diceResult").innerText = "Error: " + err.message;
  }
};

// Helper function for dice emoji
function getDiceEmoji(num) {
  const diceEmojis = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return diceEmojis[num] || "🎲";
}


// document.getElementById("rollDice").onclick = async () => {
//   if(!account){
//     alert("Please connect your wallet!");
//     return;
//   }

//   const playerGuess = document.getElementById("guess").value;
//   const ans = Math.floor(Math.random() * 6) + 1; // 1 to 6
//   const betEth = document.getElementById("bet").value;
//   const betWei = web3.utils.toWei(betEth, "ether");

//   // Dice animation logic
//   const diceDiv = document.getElementById("diceAnimation");
//   diceDiv.classList.add("dice-rolling");

//   // Show random faces during animation
//   let rollInterval = setInterval(() => {
//     let tempFace = Math.floor(Math.random() * 6) + 1;
//     diceDiv.textContent = getDiceEmoji(tempFace);
//   }, 80);

//   // After animation, show the real result
//   setTimeout(async () => {
//     clearInterval(rollInterval);
//     diceDiv.classList.remove("dice-rolling");
//     diceDiv.textContent = getDiceEmoji(ans);

//     try {
//       await diceContract.methods.clientRollDice(playerGuess, ans).send({
//         from: account,
//         value: betWei
//       });
//       document.getElementById("diceResult").innerText = "Transaction sent. Check events for result!";
//     } catch (err) {
//       console.error(err);
//       document.getElementById("diceResult").innerText = "Error: " + err.message;
//     }
//   }, 1000); // 1 second animation
// };

// Helper to get dice emoji for numbers 1-6
function getDiceEmoji(num) {
  const diceEmojis = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return diceEmojis[num] || "🎲";
}


async function checkOwnerAndToggleButton() {
  const contractOwner = await lotteryContract.methods.owner().call();
  if (account.toLowerCase() !== contractOwner.toLowerCase()) {
    // Hide or disable the button
    document.getElementById("startNewRound").style.display = "none";
    // Or: document.getElementById("startNewRound").disabled = true;
  } else {
    document.getElementById("startNewRound").style.display = "inline-block";
    // Or: document.getElementById("startNewRound").disabled = false;
  }
}
