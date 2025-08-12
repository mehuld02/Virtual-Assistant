import React, { useContext, useEffect, useState, useRef } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [activated, setActivated] = useState(false);
  const [ham, setHam] = useState(false);
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const synth = window.speechSynthesis;

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
        console.log("Recognition requested to start");
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("start error:", error);
        }
      }
    }
  };

  const speak = (text) => {
    if (!activated) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";

    const setVoiceAndSpeak = () => {
      const voices = synth.getVoices();
      const hindiVoice = voices.find((v) => v.lang === "hi-IN" || v.lang === "hi_IN");
      if (hindiVoice) utterance.voice = hindiVoice;

      isSpeakingRef.current = true;
      utterance.onend = () => {
        setAiText("");
        isSpeakingRef.current = false;
        setTimeout(() => {
          startRecognition();
        }, 800);
      };

      synth.cancel();
      synth.speak(utterance);
    };

    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = () => setVoiceAndSpeak();
    } else {
      setVoiceAndSpeak();
    }
  };

  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    speak(response);

    const query = encodeURIComponent(userInput);
    if (type === "google-search") window.open(`https://www.google.com/search?q=${query}`, "_blank");
    if (type === "calculator-open") window.open(`https://www.google.com/search?q=calculator`, "_blank");
    if (type === "instagram-open") window.open(`https://www.instagram.com/`, "_blank");
    if (type === "facebook-open") window.open(`https://www.facebook.com/`, "_blank");
    if (type === "weather-show") window.open(`https://www.google.com/search?q=weather`, "_blank");
    if (type === "youtube-search" || type === "youtube_play") window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
  };

  useEffect(() => {
    console.log("Loaded history:", userData?.history); // ✅ Debug log

    if (!activated) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    let isMounted = true;

    const startTimeOut = setTimeout(() => {
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

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (isMounted && !isSpeakingRef.current) {
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
      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
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

   recognition.onresult = async (e) => {
  const transcript = e.results[e.results.length - 1][0].transcript.trim();
  if (transcript.toLowerCase().includes(userData.assistantName.toLowerCase())) {
    setAiText("");
    setUserText(transcript);
    recognition.stop();
    isRecognizingRef.current = false;
    setListening(false);

    const data = await getGeminiResponse(transcript);

    handleCommand(data);
    setAiText(data.response);
    setUserText("");

    // ✅ NEW: fetch full updated user with history
    try {
      const refreshedUser = await axios.get(`${serverUrl}/api/auth/getCurrentUser`, {
        withCredentials: true,
      });
      setUserData(refreshedUser.data);
    } catch (err) {
      console.log("Error refreshing user data:", err);
    }
  }
};

    const safeRecognition = () => {
      if (!isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          if (e.name !== "InvalidStateError") console.error(e);
        }
      }
    };

    const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}, what can I help you with?`);
    greeting.lang = "hi-IN";
    window.speechSynthesis.speak(greeting);

    const fallback = setInterval(safeRecognition, 10000);
    safeRecognition();

    return () => {
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
      clearInterval(fallback);
    };
  }, [activated]);

  

  return (
    <div
      className="w-full h-[100vh] bg-gradient-to-t from-[black] to-[#020236e4] flex justify-center items-center flex-col gap-[15px] overflow-hidden"
      onClick={() => !activated && setActivated(true)}
    >
      <CgMenuRight className=" lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]" onClick={() => setHam(true)} />
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col items-start transition-transform ${ham ? "translate-x-0" : "translate-x-full"}`}>
        <RxCross1 className="text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]" onClick={() => setHam(false)} />
        <button className="min-w-[140px] h-[50px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] cursor-pointer" onClick={handleLogOut}>
          Log Out
        </button>
        <button className="min-w-[140px] h-[50px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] cursor-pointer px-[20px] py-[10px] mb-5" onClick={() => navigate("/customize")}>
          Customize your Assistant
        </button>
        <div className="w-full h-[2px] bg-gray-400 top-[25px]"></div>
        <h1 className="text-white font-semibold text-[19px] mt-2 mb-2">History</h1>

        <div className="w-full h-[400px] overflow-y-auto flex flex-col gap-3 px-2">
  {Array.isArray(userData?.history) && userData.history.length > 0 ? (
    [...userData.history]
      .reverse()
      .map((his, i) => (
        <span key={i} className="text-gray-200 text-sm break-words">
          {his}
        </span>
      ))
  ) : (
    <span className="text-gray-400 text-sm italic">No history yet.</span>
  )}
</div>

      </div>

      <button className="min-w-[140px] h-[50px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full text-[19px] cursor-pointer" onClick={handleLogOut}>
        Log Out
      </button>
      <button className="min-w-[140px] h-[50px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[100px] right-[20px] bg-white rounded-full text-[19px] cursor-pointer px-[20px] py-[10px]" onClick={() => navigate("/customize")}>
        Customize your Assistant
      </button>

      <div className="w-[300px] h-[350px] flex items-center justify-center overflow-hidden rounded-[40px]">
        <img src={userData?.assistantImage} className="h-full object-cover rounded-3xl" alt="Assistant" />
      </div>
      <h1 className="text-white text-[18px] font-semibold">I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="User" className="w-[200px]" />}
      {aiText && <img src={aiImg} alt="AI" className="w-[200px]" />}
      <h1 className="text-white text-[18px] font-semibold text-wrap">{userText || aiText || null}</h1>

      {!activated && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer" onClick={() => setActivated(true)}>
          <div className="text-center text-white px-6">
            <h2 className="text-2xl font-bold mb-4">Click anywhere to activate your assistant</h2>
            <p className="text-lg opacity-80">Voice features require a user gesture.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
