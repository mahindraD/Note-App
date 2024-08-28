import React,{useState} from 'react'
import Navbar from '../../components/Navbar/Navbar'
import { Link,useNavigate } from "react-router-dom";
import Passwordinput from '../../components/Input/Passwordinput';
import { validateEmail } from '../../utils/helper'; 
import axiosInstatnce from '../../utils/axiosInstance';
 
const Login = () => {

    const [email, setEmail ] = useState("");
    const [password,setPassword] = useState("");
    const [error,setError] = useState(null);

    const navigate = useNavigate();

    const handleLogin = async (e) =>{
        e.preventDefault();

        if( !validateEmail(email)) {
            setError("please enter a valid mail address");
            return;
        }

        if( !password){
            setError("plase enter the password");
            return ;
        }

        setError("");

        // Login API call
        try {
            const response = await axiosInstatnce.post("/login",{
                email:email,
                password:password,
            });

            // handle successfull login response
            if( response.data && response.data.accessToken){
                localStorage.setItem("token",response.data.accessToken);
                navigate("/dashboard");
            }
        }catch(error){
            // Handle login error
            if(error.response && error.response.data && error.response.data.message){
                setError(error.response.data.message);
            }
            else{
                setError("An unexpected error occured. Please try again later");
            }
        }
    }

    return (
        <>
            <Navbar />

            <div className='flex items-center justify-center mt-28'>
                <div className='w-96 border rounded bg-white px-7 py-10'>
                    <form onSubmit={handleLogin}>
                        
                        <h4 className='text-2xl mb-7'>Login</h4>

                        <input 
                            type="text" 
                            placeholder='email' 
                            className='input-box'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Passwordinput 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                        />

                        {error && <p className='text-red-500 text-xs pb-1'>{error}</p>}

                        <button type="submit" className='btn-primary'>
                            Login
                        </button>

                        <p className='text-sm text-center mt-4'>
                            Not register yet?{" "}
                            <Link to="/signup" className='font-medium text-primary underline'>
                                Create an Account
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Login;