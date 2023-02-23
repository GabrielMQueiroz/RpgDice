let VD = 0
let buffer ="0"
//let previousDice

const screen= document.querySelector('.screen');
function buttonClick(value){
    if(isNaN(value)){
        handleSymbol(value)
    }
    screen.innerText = buffer;
}
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}
function handleSymbol(symbol){
    switch(symbol){
        case  'Roll':
            VD=getRndInteger(1,30);//(Math.floor(Math.random() * 30)+1)
            buffer=parseStr((VD))
            alert(VD)
            break;
        case 'Type':
            alert('Esppiritum')
    }
}
/*function handleMath(symbol){
    if (buffer==='0'){
        return;
    }
    const intBuffer = parseInt(buffer);
    if(VD===0){
        VD = intBuffer;
    }else{
        flushOperation(intBuffer)
    }
}*/
function init(){
    document.querySelector('.Roll').addEventListener('click',function(event){
        buttonClick(event.target.innerText);        
    })
}

init();