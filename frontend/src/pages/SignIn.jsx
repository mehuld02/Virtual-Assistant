import React,{useContext, useState} from 'react'
import backgroundImg from "../assets/authBg.png"
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from 'axios'

function SignIn() {
  const {serverUrl,userData,setUserData}=useContext(userDataContext)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState("")

  const handleSignIn=async (e)=> {
    e.preventDefault()
    setErr("")
    setLoading(true)
    try{
      let result=await axios.post(`${serverUrl}/api/auth/signin`,{
        email,password
      },{withCredentials:true})
      console.log(result);
      setUserData(result.data)
      setLoading(false)
      navigate("/")
    }catch(error){
      console.log(error);
      setUserData(null)
      setLoading(false)
      setErr(error.response.data.message);
    }
  }
  return (
    <>
    <div className='w-full h-[100vh] bg-cover flex justify-center items-center' style={{backgroundImage:`url(${backgroundImg})`}}>
        <form className='w-[40%] h-[500px] max-w-[500px] bg-[#00000062] backdrop-blur shadow-lg shadow-black flex flex-col items-center justify-center gap-[20px] px-[20px]' onSubmit={handleSignIn}>
            <h1 className='text-white text-[28px] font-semibold mb-[30px]'>Sign In to <span className='text-blue-400'>Virtual Assistant</span></h1>
            <input type='email' placeholder='Email' className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]' required onChange={(e) =>setEmail(e.target.value)} value={email}/>
            <div className='w-full h-[60px] border-2 border-white bg-transparent text-white rounded-full text-[18px] relative' >
            <input type={showPassword?"text":"password"} placeholder='password' className='w-full h-full rounded-full outline-none bg-transparent placeholder-gray-300 px-[20px] py-[10px]' required onChange={(e) =>setPassword(e.target.value)} value={password}/>
            {!showPassword && <IoMdEye className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-[white] cursor-pointer' onClick={()=>setShowPassword(true)} />}
            {showPassword && <IoMdEyeOff className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-[white] cursor-pointer' onClick={() => setShowPassword(false)}/>}
            </div>
            {err.length>0 && <p className='text-red-500 text-[17px]'>*{err}</p>}
            <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px]' disabled = {loading}>{loading?"Loading...":"Sign In"}</button>
            <p className='text-[white] text-[18px] cursor-pointer' onClick={() => navigate("/signup")}>Want to create a new account ? <span className='text-blue-400'>Sign Up</span></p>
            
        </form>
    </div>
    </>
  )
}

export default SignIn