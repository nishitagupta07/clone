const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");


let userMessage = null;
let isResponseGenerating = false;

//Api configuration
const API_KEY = "AIzaSyAnAnbZPrkChD4LlCBMfeGTQm0q_EQjzBI";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalstorageData = ()=>{
    const savedChats = localStorage.getItem("savedChats");
     const isLightMode = (localStorage.getItem("themeColor") === "light_mode"); 
    //apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
    // condition hai ? true: false?
      
    // Restore saved chats //
    chatList.innerHTML = savedChats|| ""; // agr saved chats hai toh varna blank//
    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); // scrool to the bottom
}
loadLocalstorageData();



// create a new mwssage element and return it 
const createMessageElement = (content , ...classes)=>{
          const div = document.createElement("div");//in html//
          div.classList.add("message", ...classes);//in css classlist //
          div.innerHTML= content;
          return div;
}

// show typing effect by displaying word one by one 
const showTypingEffect =(text, textElement, incomingMessageDiv) =>{
    const words = text.split(' ');
    let currentWordIndex = 0;
    
    const typingInterval = setInterval(()=>{
        
        //Append each word to the text element with a space
          textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
          incomingMessageDiv.querySelector(".icon").classList.add("hide");
          
          
          // if all words are displayed 
          if (currentWordIndex === words.length) {
             clearInterval(typingInterval);
             isResponseGenerating = false;
             incomingMessageDiv.querySelector(".icon").classList.remove("hide");
             localStorage.setItem("savedChats" , chatList.innerHTML);//save chat to the local storage 
             
          }
          chatList.scrollTo(0, chatList.scrollHeight); // scrool to the bottom
    },75);
}



// fetch response from the api based on user message 
const generateAPIResponse = async (incomingMessageDiv) => {   //async await used jab phela kam ho jab he dusra kam ho
      const textElement = incomingMessageDiv.querySelector(".text");// get text element 


    //send a POST request  to the API with user's message
   try {
      const response = await fetch(API_URL,{
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [{ text: userMessage }]
            }]
        })
      });

      const data = await response.json();
      if(!response.ok) throw new Error(data.error.message);
     
     
     
      // Get tha API response text and remove sterisks from it 
      const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,  '$1');
      showTypingEffect(apiResponse,textElement, incomingMessageDiv);
   } catch (error) {
    isResponseGenerating = false;
     textElement.innerText = error.message;
     textElement.classList.add("error");
   }finally{
    incomingMessageDiv.classList.remove("loading");
   }
}


//show a loading animation while waiting for the api response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                <img src="images/gemini.svg" alt="Gemini image" class="avatar">
                <p class="text"> </p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
            
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");

  chatList.appendChild(incomingMessageDiv);
  chatList.scrollTo(0, chatList.scrollHeight); // scrool to the bottom
  generateAPIResponse(incomingMessageDiv);
}
// copy message text to clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done" // show tick icon
    setTimeout(()=> copyIcon.innerText = "content_copy",1000); // Revert icon after one second 
}


// handling sending outgoing chat message
const handleOutgoingChat = () =>{
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return;// exit if there is no message
    
    isResponseGenerating = true;

    const html = `<div class="message-content">
                <img src="images/user.jpg" alt="User image" class="avatar">
                <p class="text"> </p>
                 </div>`;
            
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset();//clear input field
  chatList.scrollTo(0, chatList.scrollHeight); // scrool to the bottom
  document.body.classList.add("hide-header");// hide the header once chat start
  setTimeout(showLoadingAnimation, 500);// show loading animation after a delay

}


// set user message and handle outgoing chat when a suggestion is clicked 
suggestions.forEach( suggestion =>{
    suggestion.addEventListener("click",()=>{
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// toggle between light and dark theme 
toggleThemeButton.addEventListener("click", ()=> {
   const isLightMode = document.body.classList.toggle("light_mode"); 
   localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode" );
   toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode" ;
});

//delete all chat from local storage when delete button is clicked
deleteChatButton.addEventListener("click", ()=> {
  if (confirm("Are yoy sure you want to delete all messages ?")) {
    localStorage.removeItem("savedChats");
    loadLocalstorageData();
  }
});

//prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e)=>{
    e.preventDefault();

    handleOutgoingChat();
})
