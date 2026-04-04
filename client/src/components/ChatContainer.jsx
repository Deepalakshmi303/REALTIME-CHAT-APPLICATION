import React, { useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { useContext } from 'react'
import { ChatContext } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'
const ChatContainer = () => {

    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, typingUsers, deleteIndividualMessage } = useContext(ChatContext)
    const { authUser, onlineUsers, socket } = useContext(AuthContext)

    const scrollEnd = useRef()

    const [input, setInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const typingTimeoutRef = useRef(null);
    const deleteMenuTimeoutRef = useRef(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);

    const handleMessageClick = (msgId) => {
        setSelectedMessageId(msgId === selectedMessageId ? null : msgId);
        if (deleteMenuTimeoutRef.current) clearTimeout(deleteMenuTimeoutRef.current);
        if (msgId !== selectedMessageId) {
            deleteMenuTimeoutRef.current = setTimeout(() => {
                setSelectedMessageId(null);
            }, 6000);
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (socket && selectedUser) {
            socket.emit("typing", selectedUser._id);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stopTyping", selectedUser._id);
            }, 2000);
        }
    };

    const handleEmojiClick = (emojiObj) => {
        setInput(prev => prev + emojiObj.emoji);
        setShowEmojiPicker(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = [];
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    await sendMessage({ audio: reader.result });
                };
            };
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            toast.error("Microphone access denied or unavailable");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    //handle sending a message
    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (input.trim() === "") return null;
        await sendMessage({ text: input.trim() });
        setInput("")
        if (socket && selectedUser) socket.emit("stopTyping", selectedUser._id);
    }

    // handle sending an image
    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Select an image file")
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image must be under 2MB");
            e.target.value = "";
            return;
        }
        const reader = new FileReader();

        reader.onloadend = async () => {
            await sendMessage({ image: reader.result })
            e.target.value = ""
        }
        reader.readAsDataURL(file)
    }

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id)
        }
    }, [selectedUser])

    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])


    return selectedUser ? (
        <div className='h-full overflow-scroll relative backdrop-blur-lg'>
            {/*---------header------------*/}
            <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
                <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
                <div className='flex-1 flex flex-col'>
                    <p className='text-lg text-white flex items-center gap-2'>
                        {selectedUser.fullName}
                        {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
                    </p>
                    {typingUsers?.includes(selectedUser._id) && <p className='text-xs text-green-400'>Typing...</p>}
                </div>
                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt=""
                    className='md:hidden max-w-7' />
                <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
            </div>
            {/*----------chat area---------*/}
            <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-4 pb-6 bg-black/40 shadow-inner custom-scrollbar relative'>
                {messages.map((msg, index) => (
                    <div key={index}
                        className={`flex items-end gap-2 relative ${msg.senderId === authUser._id ? "flex-row-reverse" : "flex-row"}`}>
                        <div className="relative cursor-pointer" onClick={() => handleMessageClick(msg._id)}>
                            {msg.image ? (
                                <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
                            ) : msg.audio ? (
                                <audio controls src={msg.audio} className='mb-8 max-w-[200px] md:max-w-[250px]'></audio>
                            ) : (
                                <p className={`p-3 max-w-[250px] md:text-sm font-normal rounded-xl mb-8 break-words shadow-sm
                            text-white ${msg.senderId === authUser._id ? 'bg-violet-500 rounded-br-none' :
                                        'bg-slate-700 rounded-bl-none'}`}>{msg.text}</p>
                            )}

                            <div className={`absolute top-0 ${msg.senderId === authUser._id ? 'left-[-120px]' : 'right-[-120px]'} ${selectedMessageId === msg._id ? 'flex' : 'hidden'} bg-gray-800 rounded shadow-md z-10 flex-col overflow-hidden`}>
                                <button onClick={(e) => { e.stopPropagation(); deleteIndividualMessage(msg._id, "me"); setSelectedMessageId(null); }} className="text-[11px] text-white hover:bg-gray-700 px-3 py-2 text-left whitespace-nowrap">Delete for me</button>
                                {msg.senderId === authUser._id && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteIndividualMessage(msg._id, "everyone"); setSelectedMessageId(null); }} className="text-[11px] text-red-500 hover:bg-gray-700 px-3 py-2 text-left whitespace-nowrap border-t border-gray-600">Delete for everyone</button>
                                )}
                            </div>
                        </div>
                        <div className='text-center text-xs'>
                            <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt=""
                                className='w-7 h-7 object-cover rounded-full mb-1' />
                            <p className='text-gray-400 text-[10px]'>{formatMessageTime(msg.createdAt)}</p>
                        </div>
                    </div>
                ))}
                <div ref={scrollEnd}></div>
            </div>
            {/*---------------bottom area ----------*/}
            <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-black/20'>
                <div className='relative'>
                    <span onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="cursor-pointer text-xl">😀</span>
                    {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-50">
                            <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
                        </div>
                    )}
                </div>
                <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
                    <input onChange={handleInputChange} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder="Send a message"
                        className='flex-1 text-sm p-3 border-none rounded-lg outline-none bg-transparent text-white placeholder-gray-400'/>
                    <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
                    <label htmlFor="image">
                        <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
                    </label>
                </div>
                {isRecording ? (
                    <span onClick={stopRecording} className='bg-red-500 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer animate-pulse'>⏹️</span>
                ) : (
                    <span onClick={startRecording} className='w-7 text-xl cursor-pointer text-center'>🎤</span>
                )}
                <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer ml-1' />
            </div>

        </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 
    bg-white/10 max-md:hidden'>
            <img src={assets.logo_icon} alt="" className='max-w-16' />
            <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
        </div>
    )
}

export default ChatContainer

