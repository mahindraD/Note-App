import React, { useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import NoteCard from '../../components/Cards/NoteCard'
import { MdAdd } from "react-icons/md"
import AddEditNotes from './AddEditNotes'
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import axiosInstatnce from '../../utils/axiosInstance'
import { useEffect } from 'react'
import Toast from '../../components/ToastMessages/Toast'
import EmptyCard from '../../components/EmptyCard/EmptyCard'

const Home = () => {

    const [openAddEditModal,setOpenAddEditModel] = useState({
        isShown: false,
        type: "add",
        data: null,
    });

    const [ showToastMsg, setShowToastMsg ] = useState({
        isShown : false,
        message : "",
        type : "add",
    });


    const [ userInfo, setUserInfo ] = useState(null);
    const  [ allNotes,setAllNotes ] = useState([]);

    const [isSearch,setIsSearch] = useState(false);

    const navigate = useNavigate();

    const handleEdit = (noteDetails) => {
        setOpenAddEditModel({ isShown:true, data: noteDetails, type:"edit" });
    }

    const showToastMessage = (message,type) =>{
        setShowToastMsg({
            isShown: true,
            message:message,
            type:type,
        });
    }

    const handleCloseToast = () =>{
        setShowToastMsg({
            isShown: false,
            message: "",
        });
    }
   
    // get user infor
    const getUserInfo = async() =>{
        try{
            const response = await axiosInstatnce.get("/get-user");
            if(response.data && response.data.user){
                setUserInfo(response.data.user);
            }  
        }
        catch(error){
            if(error.response.status === 401){
                localStorage.clear();
                navigate("/login");
            }
        }
    }

    // get all notes
    const getAllNotes = async() => {
        try {
            const response = await axiosInstatnce.get("/get-all-notes");
            if(response.data && response.data.notes){
                setAllNotes(response.data.notes);
            }
        } catch(error){
            console.log("An unexpected error occured");
        }
    }

    // delete Note
    const deleteNote = async(data) => {
        try{
            const noteId = data._id;
            console.log(noteId);
            const response = await axiosInstatnce.delete("/delete-note/"+noteId)
            console.log(response.data);
            if( response.data && !response.data.error){
                showToastMessage("Note Deleted successfully","delete");
                getAllNotes();
            }
        } catch(error){
            if(error.response && error.response.data && error.response.data.message){
                setError(error.response.data.message);
            }
            else{
                console.log(error);
                console.log("an unexpected error occured");
            }
        }
    }

    // handlePin
    const handlePin  = async(data) => {
        try{
            const noteId = data._id;
            const pin = data.isPinned ? false : true ;
            console.log("pin==",pin);
            const response = await axiosInstatnce.put("/update-note-pinned/"+noteId,{
                "isPinned": pin
            });
            if(response.data && !response.data.error){
                if(data.isPinned==false){
                    showToastMessage("Note Pinned succssfully","update");
                }
                else{
                    showToastMessage("Note unpinned successully","delete");
                }
                getAllNotes();
            }
        } catch(error){
            if(error.response && error.response.data && error.response.data.message){
                setError(error.response.data.message);
            }
            else{
                console.log("an unexpected error occured");
            }
        }
    }

    // search for a note
    const onSearchNote = async(query) =>{
        console.log("on Search Note",query);
        try{
            const response = await axiosInstatnce.put("/search-notes",{
                params : { query },
            });

            console.log("responser=",response);

            if(response.data && response.data.notes){
                setIsSearch(true);
                setAllNotes(response.data.notes);
            }
        } catch(error){
            console.log("error=",error);
        } 
    }

    const handleClearSearch = () => {
        setIsSearch(false);
        getAllNotes();
    }

    useEffect(() => {
      getUserInfo();
      getAllNotes();
      return () => {}
    }, [])
    

    return (
        <>
            <Navbar userInfo={ userInfo } onSearchNote={onSearchNote} handleClearSearch={handleClearSearch}/>

            <div className='container mx-auto'>
                {
                    allNotes.length>0 ? (
                        <div className='grid grid-cols-3 gap-4 mt-8'>
                        { 
                            allNotes.map((item,idx)=>(
                            <NoteCard 
                                key={ item._id }
                                title={item.title}
                                date={item.createdOn}
                                content={item.content}
                                tags={item.tags}
                                isPinned={item.isPinned}
                                onEdit={()=>
                                    handleEdit(item)
                                }
                                onDelete={()=>{
                                    deleteNote(item)
                                }}
                                onPinNote={()=>{
                                    console.log("pin clicked");
                                    handlePin(item);
                                }}
                            />)) 
                        }
                    </div>    
                    ) : (<EmptyCard message={`Start Creating your first note! click 'Add' button to jot down your thoughts, ides, and reminders. Let's get started!`}/> )
                }
            </div>

            <button className='w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10' 
                onClick={()=>{
                    setOpenAddEditModel({isShown:true,type:"add",data:null});
                }}>
                <MdAdd className="text-{32px} text-white" />
            </button>

            <Modal 
                isOpen={openAddEditModal.isShown}
                onRequestClose={()=>{}}
                style={{
                    overlay:{
                        backgroundColor: "rgba(0,0,0,0.2)"
                    },
                }}
                contentLabel=""
                className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 overflow-scroll"
            >   
                <AddEditNotes 
                    type={openAddEditModal.type}
                    noteData={openAddEditModal.data}
                    onClose={()=>{
                        setOpenAddEditModel({ isShown:false,type:"add",data:null});
                    }}
                    getAllNotes={getAllNotes}
                    showToastMessage = { showToastMessage} 
                />
            </Modal>

            <Toast 
                isShown={showToastMsg.isShown}
                message={showToastMsg.message}
                type={showToastMsg.type}
                onClose={handleCloseToast}
            />
            
        </>
    )
}

export default Home