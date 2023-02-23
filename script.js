let VD = 0
let buffer ="0"
//let previousDice
function roll(){
    VD=getRndInteger(1,30);
    document.getElementById("Cock").value = VD;
    //alert(VD)
}
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
  }
//const screen= document.querySelector('.screen');
function buttonClick(value){
    if(isNaN(value)){
        VD=roll
    }
    screen.innerText = buffer;
}