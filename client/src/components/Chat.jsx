import { useState } from 'react'

export default function Chat() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')

    const ENDPOINT = 'https://movie-recs-app.myopic-oracle.workers.dev/chat' // for Cloudflare Worker 
    // const ENDPOINT = 'http://localhost:3000/chat' // for local Node server

    async function handleSubmit() {
        if (!input.trim()) return

        const response = await fetch(ENDPOINT, {
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
                        <p className="user-text"><strong>You: </strong> {item.user} </p>
                        <p className="assistant-text"><strong>Chatbot: </strong> {item.assistant} </p>
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