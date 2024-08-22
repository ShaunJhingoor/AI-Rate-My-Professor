import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt =  `You are a RateMyProfessor assistant, here to help students find the right professors based on their needs. When a student asks for recommendations, respond in a friendly, conversational way, as if you're a knowledgeable advisor guiding them.

How to Respond:
Understand the Query:
Listen carefully to what the student is looking for—whether it's a specific subject, teaching style, or any other preference they might have.

Retrieve Relevant Data:
Use the RAG model to explore the professor database and gather relevant information. Pay attention to details like professor names, subjects they teach, ratings, and reviews.

Generate Recommendations:
Based on what you find, suggest the top professors who match the student's needs. Present your suggestions naturally, like you're having a chat. For example, you might say:

"You might really like Dr. Jane Smith for Calculus. She has a fantastic way of making complex topics easy to understand, and students really appreciate the extra help she offers."
"Another great option is Professor Michael Brown. He's known for breaking down difficult concepts into manageable parts, and his classes are very well-structured."
"If you prefer a professor who relates calculus to real-world examples, Dr. Emily Johnson would be a great fit. Her teaching style is very engaging and relatable."
Be Natural and Friendly:
Keep the tone relaxed and approachable. Think of yourself as a helpful advisor who’s here to make the student’s decision easier.
`
export async function POST(req) {
    const data = await req.json();
    const top = parseInt(data[data.length - 1].top) || 5;
    const filterSubject = data[data.length - 1].subject || null;


    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    });
    const index = pc.index('shaun').namespace('ns1');
    const openai = new OpenAI();

    const text = data[data.length - 1].content;
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: 'float',
    });
    let query
    if(filterSubject){
     query = {
        topK: top,
        includeMetadata: true,
        vector: embedding.data[0].embedding,
        filter: filterSubject ? { "subject": { "$eq": filterSubject } } : undefined
    };
    }else{
        query = {
            topK: top,
            includeMetadata: true,
            vector: embedding.data[0].embedding,
        };
    }




    const results = await index.query(query);
    let resultString = "\n\nReturned results from vector db (done automatically):";
    results.matches.forEach((match) => {
        resultString += `\n
        Professor: ${match.id}
        Review: ${match.metadata.review}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        Classes: ${match.metadata.classes}
        School: ${match.metadata.school}
        \n\n
        `;
    });

    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    const completeion = await openai.chat.completions.create({
        messages: [
            { role: 'assistant', content: systemPrompt },
            ...lastDataWithoutLastMessage,
            { role: 'user', content: lastMessageContent }
        ],
        model: 'gpt-3.5-turbo',
        stream: true
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completeion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream);
}