let block = document.getElementById("block");
let hole = document.getElementById("hole");
let holeHeight = 150;
let choleHeight = holeHeight;
let character = document.getElementById("character");
let jumping = 0;
let counter = 0;
document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        jump();
    }
});
hole.addEventListener('animationiteration', () => {
    let random = -((Math.random()*300)+150);
    hole.style.top = random + "px";
    counter++;
    let newDuration = Math.max(2 - (counter * 0.1), 1);
    document.getElementById("block").style.animationDuration = newDuration + 's';
    document.getElementById("hole").style.animationDuration = newDuration + 's';
});
setInterval(function(){
    hole.style.height = (holeHeight - (counter * 5)) + "px"; // Set the CSS height property
    choleHeight = parseInt(hole.style.height); // Update choleHeight accordingly
    console.log(choleHeight);
    let characterTop = parseInt(window.getComputedStyle(character).getPropertyValue("top"));
    if(jumping===0){
        character.style.top = (characterTop+3)+"px";
    }
    let blockLeft = parseInt(window.getComputedStyle(block).getPropertyValue("left"));
    let holeTop = parseInt(window.getComputedStyle(hole).getPropertyValue("top"));
    let cTop = -(500-characterTop);
    if ((characterTop + character.offsetHeight > 500) || ((blockLeft < 20) && (blockLeft > -50) && ((cTop < holeTop + 12) || (cTop > holeTop + choleHeight - 30)))) {
        alert("Game over. Score: " + (counter - 1));
        window.location.href = 'index.html';
        character.style.top = 100 + "px";
        counter = 0;
    }
},10);

function jump(){
    jumping = 1;
    let jumpCount = 0;
    let jumpInterval = setInterval(function(){
        let characterTop = parseInt(window.getComputedStyle(character).getPropertyValue("top"));
        if((characterTop>6)&&(jumpCount<15)){
            character.style.top = (characterTop-5)+"px";
        }
        if(jumpCount>20){
            clearInterval(jumpInterval);
            jumping=0;
            jumpCount=0;
        }
        jumpCount++;
    },10);
}
