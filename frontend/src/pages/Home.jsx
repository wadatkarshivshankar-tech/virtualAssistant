import React, { useContext ,useEffect,useState,useRef} from 'react'
import UserContext, { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import userImg from "../assets/user.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";

const Home = () => {
  const {userData,setUserData,serverUrl,getGeminiResponse}=useContext(userDataContext)
  const navigate=useNavigate()
  const [listening,setListening]=useState(false)
  const isSpeakingRef=useRef(false)
  const recognitionRef=useRef(null)
  const isRecognizingRef=useRef(false)
  const [userText,setUserText]=useState("")
  const [aiText,setAiText]=useState("")
  const [ham,setHam]=useState(false)

  const isRequestingRef = useRef(false)
  const apiErrorRef = useRef(false)

  const synth=window.speechSynthesis



  const handleLogOut=async ()=>{
      try {
        const result=await axios.get(`${serverUrl}/api/auth/logout`,{withCredentials:true})
        setUserData(null)
        navigate("/signin")
      } catch (error) {
        setUserData(null)
        console.log(error)
      }
  }

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("Voices loaded:", voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const startAssistant = () => {
    const utterence = new SpeechSynthesisUtterance("Assistant started");
    window.speechSynthesis.speak(utterence); // 🔓 unlock speech
    startRecognition(); // 🎤 start mic
  };
  

  const startRecognition = () => {
    
      if (!isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognitionRef.current?.start();
          console.log("Recognition requested to start");
        } catch (error) {
          if (error.name !== "InvalidStateError") {
            console.error("Start error:", error);
          }
        }
      }
        
    }

  const speak=(text)=>{
    if (!text || text === "Gemini API failed") return;

    console.log("Speaking:", text)

    const utterence=new SpeechSynthesisUtterance(text)

    utterence.lang = 'hi-IN';
    const voices =window.speechSynthesis.getVoices()
    const hindiVoice = voices.find(v => v.lang === 'hi-IN');

    if (hindiVoice) {
      utterence.voice = hindiVoice;
      
    }else {
       utterence.lang = 'en-US';
    }


    isSpeakingRef.current=true

    utterence.onstart = () => {
      console.log("Speech started");
    };



    utterence.onend=()=>{
      setAiText("");
      isSpeakingRef.current = false;
      setTimeout(() => {
        startRecognition(); // Delay se race condition avoid hoti hai
      }, 800);
    }
    
    utterence.onerror = (e) => {
      console.error("Speech error:", e);
      isSpeakingRef.current = false;
    }

    synth.cancel();
    
    setTimeout(() => {
      synth.speak(utterence);
    }, 300);
    // synth.speak(utterence);
  }




  const handleCommand=(data)=>{
    const {type,userInput,response}=data

    if (type === "error" || !response) {
      console.log("Skipping error response");
      return;
    }

    speak(response);
    
    if (type === 'google-search') {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
     if (type === 'calculator-open') {
  
      window.open(`https://www.google.com/search?q=calculator`, '_blank');
    }
     if (type === "instagram-open") {
      window.open(`https://www.instagram.com/`, '_blank');
    }
    if (type ==="facebook-open") {
      window.open(`https://www.facebook.com/`, '_blank');
    }
     if (type ==="weather-show") {
      window.open(`https://www.google.com/search?q=weather`, '_blank');
    }

    if (type === 'youtube-search' || type === 'youtube-play') {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    }

  }

  // const speak=(text)=>{
  //   const utterence=new SpeechSynthesisUtterance(text)
  //   window.speechSynthesis.speak(utterence)

  // }

  useEffect(() => {
    const SpeechRecognition=window.SpeechRecognition || window.webkitSpeechRecognition

    const recognition=new SpeechRecognition()
    recognition.continuous=true
    recognition.lang='en-US'

    recognitionRef.current=recognition;

    let isMounted = true; 

    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start();
          console.log("Recognition requested to start");
        } catch (e) {
          if (e.name !== "InvalidStateError") {
            console.error(e);
          }
        }
      }
    }, 1000);

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    
    recognition.onend = () =>{
      // console.log("recognition ended");
      isRecognizingRef.current = false;
      setListening(false);

      if(!isSpeakingRef.current && !apiErrorRef.current  &&!isRequestingRef.current) {
       setTimeout(() => {
        if (isMounted) {
          try {
            recognition.start();
            console.log("Recognition restarted");
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);
          }
        }
      }, 1000);
      }

    };

    recognition.onerror = (event) => {
      console.warn("Recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);

      if (apiErrorRef.current) {
        console.log("API failed  not restarting");
        return;
      }

      

      if (event.error !== "aborted" && isMounted &&!isSpeakingRef.current) {
        setTimeout(() => {
        if (isMounted) {
          try {
            recognition.start();
            console.log("Recognition restarted after error");
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);

          }
        }
      }, 1000);
      }
    };

    recognition.onresult=async (e)=>{
      

      const transcript=e.results[e.results.length-1][0].transcript
      console.log(transcript)
      setAiText("");
      setUserText(transcript);
       
      recognition.stop();
      isRecognizingRef.current = false;
      setListening(false);

      const data=await getGeminiResponse(transcript)
      console.log(data)

      handleCommand(data)
      setAiText(data.response);
      setUserText("");

      

      if (!transcript.trim() || isRequestingRef.current) return;

      recognition.stop();
      isRecognizingRef.current = false;
      setListening(false); 
      
      isRequestingRef.current = true; 
      try{
        const data=await getGeminiResponse(transcript)
        console.log(data)
        
         if (data?.type === "error" || !data?.response) {
          apiErrorRef.current = true;
          console.log("API failed, stopping loop");
          return;
        } else {
          apiErrorRef.current = false;
        }

        handleCommand(data)

      }catch (err) {
        console.log(err)
        apiErrorRef.current = true;
      }
      
      isRequestingRef.current = false; 

      // const data=await getGeminiResponse(transcript)
      // console.log(data)
      

       
    }

     
    // const fallback=setInterval(()=>{
    //   if(!isSpeakingRef && !isRecognizingRef){
    //     startRecognition()
    //   }
    // })

    return ()=>{
      isMounted =false;
      clearTimeout(startTimeout)
      recognition.stop()
      setListening(false)
      isRecognizingRef.current=false
    };

    // recognition.start()
   
  }, [])
  



  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>
       <button onClick={startAssistant} className="min-w-[200px] h-[60px] bg-green-500 text-white rounded-full text-[18px] font-semibold cursor-pointer">
        Start Assistant
      </button>

      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(true)}/>
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham?"translate-x-0":"translate-x-full"} transition-transform`}>
        <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(false)}/>
        <button className='min-w-[150px] h-[60px]  text-black font-semibold   bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
        <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>
      
        <div className='w-full h-[2px] bg-gray-400'></div>
        <h1 className='text-white font-semibold text-[19px]'>History</h1>
      
        <div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
          {userData.history?.map((his)=>(
            <div className='text-gray-200 text-[18px] w-full h-[30px]  '>{his}</div>
          ))}
      
        </div>
      
      </div>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px]  bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>
      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
          <img src={userData?.assistantImage} alt="" className='h-full object-cover'/>
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
       {!aiText && <img src={userImg} alt="" className='w-[200px]'/>}
       {aiText && <img src={aiImg} alt="" className='w-[200px]'/>}

      <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText?userText:aiText?aiText:null}</h1>

    </div>
  )
}

export default Home

