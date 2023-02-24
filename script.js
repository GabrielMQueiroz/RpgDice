let VD = 0
let cnts=0
let LD=[]
let cnt=0
let Dados=[30,2,4,6,10,12,20,100]
let td
let Dado=0
let reul=[]
//let previousDice
function Add(){
    rolls=Dado+1
    document.getElementById("DAD").value = rolls+"D"+Dados[cnts];
    Dado=rolls    
    console.log("O Dado atual "+Dado+"\n"+"Rolls "+rolls)

}
function Sub(){
    rolls=rolls-1
    Dado=Dado-1
    document.getElementById("DAD").value = rolls+"D"+Dados[cnts];
    console.log("O Dado atual "+ Dado +"\n"+"Rolls "+ rolls )
}
function roll(){
    if(Dado==0){
        rolls=1
    }
    for(Dado=0;Dado<rolls;Dado+=1){    
        VD=getRndInteger(1,Dados[cnts]);
        document.getElementById("Cock").value = VD;
        cnt+=1
        LD[cnt]=VD;
        if(LD[cnt-1]==NaN){
            LD[cnt-1]=0
        }
        document.getElementById("PN").value = LD[(cnt-1)];

        /*console.log(LD[cnt])   
        te=test()
        result=mean(te)
        console.log('A media foi '+ result)*/
        console.log(VD+"\n"+Dado)

    }
}
function dado(){    
    cnts+=1
    Dados[cnts]
    console.log(Dados[cnts])
    if(cnts>=(Dados.length-1)){
        cnts=0
    }
    document.getElementById("DAD").value = Dado+"D"+Dados[cnts];
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
