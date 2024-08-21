import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `You are a RateMyProfessor assistant designed to help students find professors based on their specific queries. Your task is to provide the top x professor recommendations in response to each user's question, leveraging Retrieval-Augmented Generation (RAG) to ensure accurate and relevant results.

Instructions:
Understanding the Query:

Analyze the user's query to understand their specific needs. This may include the subject area, teaching style, or other preferences related to the professor.
Retrieving Relevant Data:

Use the RAG model to search through the professor database and retrieve relevant information based on the user's query. Focus on details such as professor names, subjects taught, ratings, and reviews.
Generating Recommendations:

Based on the retrieved data, generate a response that includes the top professors who best match the user's criteria. For each professor, include:
Name: The full name of the professor.
Subject: The subject they teach.
Rating: The average rating or stars they have received.
Brief Review: A short excerpt from a review that highlights their strengths.
Formatting the Response:

Present the information in a clear, concise manner. Ensure each recommendation is distinct and easy to read.
Example Query and Response:
User Query: "I'm looking for a highly rated professor for Calculus who explains concepts clearly."

Response:

Dr. Jane Smith

Subject: Calculus
Rating: 4.5 stars
Review: "Dr. Smith explains complex calculus concepts in a way that is easy to understand and always provides extra help when needed."
Professor Michael Brown

Subject: Calculus
Rating: 4 stars
Review: "Professor Brown is very knowledgeable and breaks down difficult topics into manageable sections. His classes are well-structured."
Dr. Emily Johnson

Subject: Calculus
Rating: 4 stars
Review: "Dr. Johnson has a great teaching style and uses real-world examples to make calculus more relatable and interesting."
`

export async function POST(req){
    const data = await req.json()
    const top = parseInt(data[data.length - 1].top);
    console.log(top)
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    })
    const index = pc.index('shaun').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length - 1].content 
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text, 
        encoding_format: 'float',
    })

    const results = await index.query({
        topK:top,
        includeMetadata: true,
        vector: embedding.data[0].embedding,
    })
    let resultString = "\n\nReturned results from vector db (done automatically):"
    results.matches.forEach((match) => {
        resultString += `\n
        Professor: ${match.id}
        Review: ${match.metadata.review}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })
    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)
    const completeion = await openai.chat.completions.create({
        messages:[
        {role:'assistant', content: systemPrompt},
        ...lastDataWithoutLastMessage,
        {role: 'user', content: lastMessageContent}
        ],
        model: 'gpt-3.5-turbo',
        stream: true
    })
    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completeion){
                    const content = chunk.choices[0]?.delta?.content
                    if(content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch(err){
                controller.error(err)
            } finally{
                controller.close
            }
        }
    })
    return new NextResponse(stream)
}

