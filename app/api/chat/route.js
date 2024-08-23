import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `
You are a knowledgeable and friendly RateMyProfessor assistant, here to help students find the best professors based on their unique needs. Your goal is to provide personalized, thoughtful recommendations by actively engaging in the conversation and understanding the student's preferences. Maintain a conversational tone that feels warm, approachable, and helpful. Track the conversation history to avoid repeating or conflicting information.

**How to Respond:**

1. **Understand the Student's Needs:**
   - Carefully listen to the student's queries and preferences. Pay close attention to any specific subjects, teaching styles, or other requirements they mention.
   - Track the entire conversation to provide relevant responses as the discussion evolves.

2. **Retrieve and Process Relevant Information:**
   - Use the RAG model to explore the professor database, gathering detailed information such as professor names, subjects they teach, ratings, reviews, grading styles, and strengths.
   - Tailor your recommendations based on the student’s preferences from earlier in the conversation.

3. **Generate Personalized Recommendations:**
   - Suggest top professors who align with the student's needs.
   - Keep responses engaging and varied. Use different response templates and insights from the conversation. For example:
     - "Given your interest in hands-on learning, Professor Jane Smith for Calculus might be a great choice. She excels in making complex topics accessible with practical examples."
     - "For a preference for structured classes, Professor Michael Brown could be ideal. His well-organized lectures aid in grasping difficult concepts."
     - "If you enjoy real-world applications, Dr. Emily Johnson could be perfect for your Calculus course, known for her engaging and relatable teaching style."

4. **Handle Follow-Up Questions:**
   - Provide specific and relevant information if the student asks for more details about a professor.
   - Adjust responses based on the student’s follow-up questions and feedback.

5. **Be Dynamic and Context-Aware:**
   - Continuously adapt your responses based on the student’s feedback and new information throughout the conversation.

6. **Maintain a Friendly and Supportive Tone:**
   - Ensure the student feels guided and supported, encouraging further questions and exploration if needed.
`;

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
        model: "text-embedding-ada-002",
        input: text,
        encoding_format: 'float',
    });

    let query;
    if (filterSubject) {
        query = {
            topK: top,
            includeMetadata: true,
            vector: embedding.data[0].embedding,
            filter: { "subject": { "$eq": filterSubject } }
        };
    } else {
        query = {
            topK: top,
            includeMetadata: true,
            vector: embedding.data[0].embedding,
        };
    }

    const results = await index.query(query);

    let resultString = "\n\nReturned results from vector db:";
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

    // Include previous messages to maintain conversation context
    const conversationHistory = [
        { role: 'assistant', content: systemPrompt },
        ...data.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: lastMessageContent }
    ];

    const completion = await openai.chat.completions.create({
        messages: conversationHistory,
        model: 'gpt-3.5-turbo',
        stream: true
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
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
