let VD = 0
let LD=[]
let cnt=0
let Dados=[2,4,6,10,12,20,30,100]
 
//let previousDice
function roll(){
    VD=getRndInteger(1,31);
    document.getElementById("Cock").value = VD;
    cnt+=1
    LD[cnt]=VD;
    document.getElementById("PN").value = LD[(cnt-1)];
    console.log(LD[cnt])   
    te=test()
    result=mean(te)
    console.log(result)
}
function dado(){
    var cnts=0
    cnts++
    Dados=vet[cnts]
    console.log(cnts)
}
//Qdad=dado()
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
  }
function mean(array){
    let Valor=0
    for(var i=0;i<array.length;i++){
        Valor=array[i]+Valor
    }
    md=Valor/array.length
    return md
}
function test(){
    t=[]
    for(var i=0;i<100;i++){
        t[i]=getRndInteger(1,31)
    }
    console.log(t)
    return t
}
