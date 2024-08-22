import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `You are a RateMyProfessor assistant, here to help students find the best professors based on their needs. When responding, please ensure:

1. **Focus on the Subject**: Only include professors who teach the subject specified in the query.
2. **Include Relevant Information**: Provide details such as:
   - **Professor Name**
   - **Subject Expertise**
   - **Teaching Style**
   - **Ratings and Reviews**
   - **Relevant Courses Taught**
3. **Generate Accurate Recommendations**: Based on the retrieved data, recommend professors who have high ratings and positive reviews specifically for the subject requested.
4. **Maintain a Friendly and Informative Tone**: Provide clear, concise, and helpful information to guide students in selecting the best professor.`;

export async function POST(req) {
    const data = await req.json();
    const top = parseInt(data[data.length - 1].top) || 5;
    const filterSubject = data[data.length - 1].subject || "";
    console.log("top", top);
    console.log("Request data:", data[data.length - 1]);
    console.log("Extracted filterSubject:", filterSubject);

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

    const query = {
        topK: top,
        includeMetadata: true,
        vector: embedding.data[0].embedding,
    };

    // if (filterSubject) {
    //     query.filter = {
    //         "metadata.subject": {
    //             "$eq": filterSubject
    //         }
    //     };
    // }

    console.log("Pinecone query:", query);

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
    console.log("Pinecone results:", results);

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