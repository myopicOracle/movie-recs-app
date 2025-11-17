import { useState } from 'react'

export default function Chat() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')

    async function handleSubmit() {
        if (!input.trim()) return

        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input })
        })
        const data = await response.json()

        setMessages([
            ...messages,
            {
                user: input,
                assistant: data.response
            }
        ])

        setInput('')
    }

    return (
        <div className="chat-container">
            <div className="assistant-response">
                {messages.map((item, index) => (
                    <div key={index}>
                        <p><strong>You: </strong> {item.user} </p>
                        <p><strong>Chatbot: </strong> {item.assistant} </p>
                    </div>
                ))}
            </div>
            <input 
                className="user-message"
                placeholder="What are you in the mood for?"
                value={input}
                onChange={(e) => {
                    setInput(e.target.value)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSubmit()
                    }
                }}
            />
        </div>
    )
}